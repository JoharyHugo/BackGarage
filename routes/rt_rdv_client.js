// import lib
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// import models
const Etat = require('../models/md_etat');
const Bloc = require('../models/md_bloc_heure_rdv');
const Rdv = require('../models/md_rdv_client');
const Voiture = require('../models/md_voiture_client');

// import middleware
const protect = require('../middlewares/auth');

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

router.post('/ajouterRdv', protect, async (req, res) => {
    try {
        const { idbloc, idetat, daterdv, voitureIds } = req.body;
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


router.get('/admin/listRdv', protect, async (req, res) => {
    try {
        const datetri = req.query.datetri ? new Date(req.query.datetri) : new Date();
        const startOfDay = new Date(datetri.setHours(0, 0, 0, 0)); // début jour à minuit
        const endOfDay = new Date(datetri.setHours(23, 59, 59, 999)); // fin jour à minuit -1
        const etatEnAttente = await Etat.findOne({ etat: 'en attente' });
        let rdvs = await Rdv.find({ idetat: etatEnAttente._id , daterdv: { $gte: startOfDay, $lte: endOfDay } })  // populate = jointure 
            .populate('idbloc') 
            .populate('idclient', 'nom idprofil') 
            .populate({
                path: 'voitureIds',
                select: 'immatriculation',
                populate: [
                    { path: 'idmarque', select: 'nommarque' },
                    { path: 'idcategorie', select: 'nomcategorie' }
                ]
            });
        rdvs = Rdv.TriRdvs(rdvs); // fonction tri
        res.status(200).json(rdvs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const checkRdv = async (req, res, check) => {
    try {
        const { rdvId } = req.body;
        const etat = await Etat.findOne({ etat: check });
        if (!etat) {
            return res.status(404).json({ message: "État non trouvé" });
        }
        const rdv = await Rdv.findByIdAndUpdate(rdvId, { idetat: etat._id });
        res.status(200).json({ message: "L'état du rendez-vous a été mis à jour avec succès.", rdv });
    } catch (error) {
        console.error(`Erreur lors de la connexion (${check}):`, error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

router.put('/presence', (req, res) => checkRdv(req, res, 'présence'));
router.put('/absence', (req, res) => checkRdv(req, res, 'absence'));

module.exports = router;