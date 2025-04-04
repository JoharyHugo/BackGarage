// import lib
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// import models
const Etat = require('../models/md_etat');
const Bloc = require('../models/md_bloc_heure_rdv');
const Rdv = require('../models/md_rdv_client');
const Voiture = require('../models/md_voiture_client');
const Service = require('../models/md_service');
const SousService = require('../models/md_ss_service');
const Categorie = require('../models/md_categorie_vehicule');
const Statut = require('../models/md_statut');
const Piece = require('../models/md_piece');

// import route
const { checkRdv } = require('./rt_rdv_admin');

// import middleware
const protect = require('../middlewares/auth');

// liste de tous les blocs heures
router.get('/listBlocHeure', protect, async (req, res) => {
  try {
      const blocs = await Bloc.find().sort({ ordre: 1 }); // Trie ascendant
      res.json(blocs);
  } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error });
  }
});

// liste blocheure dispo
router.get('/listBlocDispo/:date', protect, async (req, res) => {
    try {
        const  date  = req.params.date;
        if (!date) {
            return res.status(400).json({ message: "Veuillez fournir une date valide." });
        }
        const blocsDisponibles = await Rdv.listBlocDispo(date);
        res.json(blocsDisponibles);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
});

// ajout RDV
router.post('/ajouterRdv', protect, async (req, res) => {
    try {
        const { idbloc, daterdv, voitureIds } = req.body;
        const etatEnAttente = await Etat.findOne({ etat: 'en attente' });
        const voituresExistantes = await Voiture.find({ '_id': { $in: voitureIds }, 'idclient': req.user.userId });
        if (voituresExistantes.length !== voitureIds.length) {
            return res.status(400).json({ message: 'Une ou plusieurs voitures sélectionnées n\'existent pas ou ne vous appartiennent pas' });
        }
        const formattedVoitures = voituresExistantes.map(v => ({ voiture: v._id }));
        const rdv = new Rdv({ idclient: req.user.userId, idbloc, idetat: etatEnAttente._id, daterdv, voitureIds: formattedVoitures});        await rdv.save();
        res.json({ message: 'Rendez-vous ajouté avec succès', rdv });
    } catch (error) {
        console.error('Erreur lors de l\'ajout du rendez-vous:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// liste Rdv avec devis en attente de confirmation
const getListRdvByEtat = async (req, res, etat) => {
    try {
        const etatq = await Etat.findOne({ etat });
        let rdvs = await Rdv.find({ idetat: etatq._id, idclient: req.user.userId})
        .populate('idbloc') 
        .populate('idclient', 'nom idprofil') 
        .populate({
            path: 'voitureIds.voiture',
            select: 'immatriculation idmarque idcategorie',
            populate: [{ path: 'idmarque', select: 'nommarque' }, 
                       { path: 'idcategorie', select: 'nomcategorie' }]
        })
        .populate({ path: 'voitureIds.devis.idservice', model: 'Service',  select: 'nom'})
        .populate({ path: 'voitureIds.devis.devisSsService.idsousservice', model: 'SousService', select: 'nom'})
        .populate({ path: 'voitureIds.devis.devisSsService.idstatut', model: 'Statut',  select: 'statut' })
            .sort({ daterdv: -1, 'idbloc.ordre': -1 }) ;
        res.status(200).json(rdvs);
    } catch (error) {
        console.error(`Erreur lors de la récupération des RDVs (${etat}):`, error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// liste Rdv avec devis {OK pour le client => s'engage à payer }
const getListRdvFinalByEtat = async (req, res, etat) => {
    try {
        const etatq = await Etat.findOne({ etat });
        let rdvs = await Rdv.find({ idetat: etatq._id, idclient: req.user.userId })
            .populate('idbloc')
            .populate('idclient', 'nom idprofil')
            .populate('idetat')
            .populate({
                path: 'voitureIds.voiture',
                select: 'immatriculation idmarque idcategorie',
                populate: [
                    { path: 'idmarque', select: 'nommarque' },
                    { path: 'idcategorie', select: 'nomcategorie' }
                ]
            })
            .populate({ path: 'voitureIds.devis.idservice', model: 'Service', select: 'nom' })
            .populate({ path: 'voitureIds.devis.devisSsService.idsousservice', model: 'SousService', select: 'nom' })
            .populate({ path: 'voitureIds.devis.devisSsService.idstatut', model: 'Statut', select: 'statut' })
            .sort({ daterdv: -1, 'idbloc.ordre': -1 });

        // Filtrage pour enlever les devis avec un statut "refusé"
        rdvs = rdvs.map(rdv => {
            rdv.voitureIds = rdv.voitureIds.map(voiture => {
                voiture.devis = voiture.devis.map(devis => {
                    devis.devisSsService = devis.devisSsService.filter(ssService => ssService.idstatut.statut !== "refusé");
                    return devis;
                }).filter(devis => devis.devisSsService.length > 0); // Supprimer les devis vides
                return voiture;
            }).filter(voiture => voiture.devis.length > 0); // Supprimer les voitures sans devis valides
            return rdv;
        }).filter(rdv => rdv.voitureIds.length > 0); // Supprimer les RDVs sans voiture avec devis valides

        res.status(200).json(rdvs);
    } catch (error) {
        console.error(`Erreur lors de la récupération des RDVs (${etat}):`, error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Route pour liste rdv du client
router.get('/listRdv/confirmation', protect, (req, res) => getListRdvByEtat(req, res, 'en confirmation'));

router.get('/listRdv/final', protect, (req, res) => getListRdvFinalByEtat(req, res, 'devis final'));
router.get('/listRdv/termine', protect, (req, res) => getListRdvFinalByEtat(req, res, 'terminé'));

// liste devis SERVICE & sous service pour tel voiture pour tel rdv
router.post('/detailsDevisSousService', protect, async (req, res) => {
    try {
        const { rdvId, idVoiture } = req.body; 
        const rdv = await Rdv.findById(rdvId)
            .populate({ path: 'voitureIds.voiture', model: 'Voiture'})
            .populate({ path: 'voitureIds.devis.idservice', model: 'Service'})
            .populate({ path: 'voitureIds.devis.devisSsService.idsousservice', model: 'SousService'})
            .populate({ path: 'voitureIds.devis.devisSsService.idstatut', model: 'Statut' });

        if (!rdv)  return res.status(404).json({ message: "Rendez-vous non trouvé." });
        const voitureRdv = rdv.voitureIds.find(voiture => voiture.voiture._id.toString() === idVoiture);
        if (!voitureRdv) return res.status(404).json({ message: "Voiture non trouvée dans ce rendez-vous." });
        const devisDetails = voitureRdv.devis.reduce((acc, devis) => {
            const serviceName = devis.idservice.nom;
            if (!acc[serviceName]) {
                acc[serviceName] = [];
            }
            devis.devisSsService.forEach(ss => {
                acc[serviceName].push({
                    nomSousService: ss.idsousservice.nom,
                    tarif: ss.tarif,
                    total: ss.total,
                    statut: ss.idstatut
                });
            });
            return acc;
        }, {});

        const result = Object.entries(devisDetails).map(([serviceName, sousServices]) => ({
            nomService: serviceName,
            sousServices
        }));
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// modification statut d'un sous service
const checkSousService = async (req, res, check) => {
    try {
      const { rdvId, idVoiture, idSousService } = req.body;  
      const statutObj = await Statut.findOne({ statut: check });
      const rdv = await Rdv.findById(rdvId).populate('voitureIds.voiture').exec();
  
      const voiture = rdv.voitureIds.find(v => v.voiture._id.toString() === idVoiture);
      if (!voiture)  return res.status(404).json({ message: "Voiture non trouvée dans ce rendez-vous." });
      let sousServiceTrouvé = false;
      voiture.devis.forEach(devis => {
        devis.devisSsService.forEach(ss => {
            if (ss.idsousservice.toString() === idSousService) {
            ss.idstatut = statutObj._id; // Mettre à jour avec le nouvel ID du statut
            sousServiceTrouvé = true;
          }
        });
      });
  
      if (!sousServiceTrouvé) {
        console.log("⚠️ Sous-service non trouvé:", idSousService);
        return res.status(404).json({ message: "Sous-service non trouvé." });
      }
  
      // Sauvegarder les modifications dans la base
      await rdv.save();
  
      return res.status(200).json({ message: 'Statut du sous-service mis à jour avec succès.' });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut du sous-service:", error);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
  };

router.put('/devis/refuse', (req, res) => checkSousService(req, res, 'refusé'));

// Route pour RDV  devis final
router.put('/final', (req, res) => checkRdv(req, res, 'devis final'));


module.exports = router;