// import lib
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// import models
const Etat = require('../models/md_etat');
const Rdv = require('../models/md_rdv_client');
const Voiture = require('../models/md_voiture_client');
const Service = require('../models/md_service');
const SousService = require('../models/md_ss_service');
const Categorie = require('../models/md_categorie_vehicule');
const Statut = require('../models/md_statut');
const Piece = require('../models/md_piece');
const Tache =  require('../models/md_tache_meca');

// import fonction route 
const { checkSousService } = require('./rt_rdv_client');

// import middleware
const protect = require('../middlewares/auth');

// charge la liste des sous services en attente par voiture pour le mécaniciens
router.get('/sousservices/enattente', protect, async (req, res) => {
    try {
        const serviceResult = await Service.getServiceforMeca(req.user.userId);
        const serviceID = serviceResult.service._id;
        const statutEnAttente = await Statut.findOne({ statut: 'en attente' });
        const statutDevisFinal = await Etat.findOne({ etat: 'devis final' });

        const rdvs = await Rdv.find({
            idetat: statutDevisFinal._id,
            'voitureIds.devis': {
                $elemMatch: {
                    idservice: serviceID,
                    'devisSsService.idstatut': statutEnAttente._id
                }
            }
        })
        .populate({ path: 'voitureIds.voiture', select: 'immatriculation' })
        .populate({ path: 'voitureIds.devis.idservice', model: 'Service', select: 'nom' })
        .populate({ path: 'voitureIds.devis.devisSsService.idsousservice', model: 'SousService', select: 'nom tarif' })
        .populate({ path: 'voitureIds.devis.devisSsService.idstatut', model: 'Statut', select: 'statut' });
        const voitureSousServices = rdvs.flatMap(rdv => 
            rdv.voitureIds.flatMap(voiture => {
                const filteredDevis = voiture.devis
                    .filter(devis => devis.idservice.equals(serviceID))
                    .map(devis => {
                        const filteredSousServices = devis.devisSsService
                            .filter(sousservice => sousservice.idstatut.equals(statutEnAttente._id));
                        return filteredSousServices.length > 0 ? {
                            voiture: voiture.voiture,
                            devis: [{ idservice: devis.idservice, devisSsService: filteredSousServices }],
                            rdvclientId: rdv._id 
                        } : null;
                    })
                    .filter(devis => devis !== null);
                return filteredDevis.length > 0 ? filteredDevis : null;
            })
        ).filter(voiture => voiture !== null);
        return res.json(voitureSousServices);
    } catch (error) {
        console.error('Erreur lors de la récupération des sous-services en attente:', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
});

// affecte la tâche a le mécanicien dans un autre table et le change de statut
router.post('/sousservices/encours', protect, async (req, res) => {
    try {
        const { rdvId, idVoiture, idSousService } = req.body;  
        const statut = await Statut.findOne({ statut: "en cours" });
        const nouvelleTache = new Tache({
            idMecanicien: req.user.userId,
            idRdv: rdvId,
            idVoiture: idVoiture,
            idSousService: idSousService,
            idstatut: statut._id
        });
        const tacheEnregistree = await nouvelleTache.save();
        const checkResult = await Rdv.checkSousServiceA(rdvId, idVoiture, idSousService, 'en cours');
        res.status(201).json(tacheEnregistree);
    } catch (error) {
        console.error('Erreur lors de la création de la tâche:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// liste des tâches en cours pour un mécanicien 
router.get('/taches/encours', protect, async (req, res) => {
    try {
        const statutEnCours = await Statut.findOne({ statut: 'en cours' });
        if (!statutEnCours) return res.status(404).json({ message: 'Statut "en cours" non trouvé' });
        const taches = await Tache.find({
            idMecanicien: req.user.userId,
            idstatut: statutEnCours._id
        })
        .populate()
        .populate('idVoiture','immatriculation') 
        .populate('idSousService', 'nom')
        .populate('idstatut'); 

        res.status(200).json(taches);
    } catch (error) {
        console.error('Erreur lors de la récupération des tâches:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});


// change le statut du service en terminé
router.put('/sousservices/termine', protect, async (req, res) => {
    try {
        const { rdvId, idVoiture, idSousService } = req.body;  
        const statutTermine = await Statut.findOne({ statut: 'terminé' });
        const tache = await Tache.findOne({
            idRdv:  rdvId,
            idVoiture: idVoiture,
            idSousService: idSousService,
        });
        // console.log('-----------------',tache);
        tache.idstatut = statutTermine._id;
        await tache.save();
        const testUpdtRdv = await new Rdv().getVoituresByRdvId(rdvId);
        const checkResult = await Rdv.checkSousServiceA(rdvId, idVoiture, idSousService, 'terminé');
        res.status(200).json({ message: 'Sous service mise à jour terminé' });
    } catch (error) {
        console.error('Erreur lors de la création de la tâche:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// route pour modifier tâche si prix par mécaniciens 
router.put('/devis/termine', (req, res) => checkSousService(req, res, 'terminé'));

module.exports = router;


