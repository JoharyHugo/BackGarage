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

router.post('/ajouterRdv', protect, async (req, res) => {
    try {
      const {  idbloc, idetat, daterdv, voitureIds } = req.body;
      const voituresExistantes = await Voiture.find({ '_id': { $in: voitureIds }, 'idclient': req.user.userId });// Vérifier si les voitures existent et appartiennent bien au client connecté
      if (voituresExistantes.length !== voitureIds.length) {
        return res.status(400).json({ message: 'Une ou plusieurs voitures sélectionnées n\'existent pas ou ne vous appartiennent pas' });
      }
      const rdv = new Rdv({ idclient:req.user.userId, idbloc, idetat, daterdv, voitureIds });
      await rdv.save(); 
      res.json({ message: 'Rendez-vous ajouté avec succès', rdv });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du rendez-vous:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  module.exports = router;