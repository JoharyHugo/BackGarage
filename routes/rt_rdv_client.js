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

module.exports = router;