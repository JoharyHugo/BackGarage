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
const Tache =  require('../models/md_tache_meca');

// import fonction route 

// import middleware
const protect = require('../middlewares/auth');

// API Vérification étaVoiture pour un rdv et une voiture
router.get('/avancement/:rdvId/:idVoiture', protect, async (req, res) => {
    try {
        const { rdvId, idVoiture } = req.params;
        const rdv = new Rdv();
        const statut =  await Statut.findOne({ statut: 'terminé' });
        const ssvcount = await rdv.getEtatVoiture(rdvId, idVoiture);
        return res.json({ etatVoiture: ssvcount });
    } catch (error) {
        console.error('Erreur lors de la récupération des sous-services en attente:', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
});

// liste rdv par état pour le client
const getListRdvByEtat = async (req, res, etat) => {
    try {
        const etatq = await Etat.findOne({ etat });
        if (!etatq) return res.status(404).json({ message: 'État non trouvé' });

        let rdvs = await Rdv.find({ 
            idetat: etatq._id, 
            idclient: req.user.userId 
        })
        .populate('idbloc', 'bloc') 
        .populate('idclient', 'nom') 
        .populate({
            path: 'voitureIds.voiture',
            select: 'immatriculation idmarque idcategorie',
            populate: [
                { path: 'idmarque', select: 'nommarque' }, 
                { path: 'idcategorie', select: 'nomcategorie' }
            ]
        })
        .select('-voitureIds.devis')
        .sort({ daterdv: -1, 'idbloc.ordre': -1 });

        const rdvsWithEtat = [];
        for (const rdv of rdvs) {
            const rdvObj = rdv.toObject(); 
            for (const voitureEntry of rdvObj.voitureIds) {
                const etatvoiture = await new Rdv().getEtatVoiture(rdv._id, voitureEntry.voiture._id);
                voitureEntry.etatvoiture = etatvoiture;
            }
            rdvsWithEtat.push(rdvObj);
        }
        res.status(200).json(rdvsWithEtat);
    } catch (error) {
        console.error(`Erreur lors de la récupération des RDVs (${etat}):`, error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

//  Seulement sous service concernant cette voiture
const getListSsServiceByVoiture = async (req, res, etat, idvoiture) => { 
    try {
        const etatq = await Etat.findOne({ etat });
        if (!etatq) return res.status(404).json({ message: 'État non trouvé' });

        const statutRefuse = await Statut.findOne({ statut: 'refusé' });
        if (!statutRefuse) return res.status(404).json({ message: 'Statut "refusé" introuvable' });

        let rdvsDocs = await Rdv.find({ 
            idetat: etatq._id, 
            idclient: req.user.userId,
            'voitureIds.voiture': idvoiture 
        })
        .populate({
            path: 'voitureIds.voiture',
            select: 'immatriculation'
        })
        .populate({ path: 'voitureIds.devis.idservice', model: 'Service', select: 'nom' })
        .populate({ path: 'voitureIds.devis.devisSsService.idsousservice', model: 'SousService', select: 'nom' })
        .populate({ path: 'voitureIds.devis.devisSsService.idstatut', model: 'Statut', select: 'statut' })
        .sort({ daterdv: -1, 'idbloc.ordre': -1 });

        const rdvs = await Promise.all(rdvsDocs.map(async rdvDoc => {
            const rdv = rdvDoc.toObject(); 
            await Promise.all(rdv.voitureIds.map(async voiture => {
                if (voiture && voiture.voiture) {
                    const etatvoiture = await new Rdv().getEtatVoiture(rdv._id, voiture.voiture._id);
                    voiture.etatvoiture = etatvoiture;
                }
                voiture.devis = voiture.devis.map(devis => {
                    devis.devisSsService = devis.devisSsService.filter(ssService => {
                        return ssService.idstatut && ssService.idstatut._id.toString() !== statutRefuse._id.toString();
                    });
                    return devis;
                });
            }));
            return rdv;
        }));

        res.status(200).json(rdvs);
    } catch (error) {
        console.error(`Erreur lors de la récupération des RDVs (${etat}):`, error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Devis final à utiliser pour le tableau d'avancement
router.get('/listRdv/final', protect, (req, res) => getListRdvByEtat(req, res, 'devis final'));

router.get('/rdvs/:idvoiture', protect, (req, res) => {
    const etat = "devis final";
    const {  idvoiture } = req.params; 
    getListSsServiceByVoiture(req, res, etat, idvoiture); 
});

module.exports = router;


