// import lib
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// import models
const Marque = require('../models/md_marque');
const Categorie = require('../models/md_categorie_vehicule');
const Voiture = require('../models/md_voiture_client');

// import middleware
const protect = require('../middlewares/auth');

// ajouter Marque
router.post('/ajouterMarque', protect, async (req, res) => {
    try {
      const marque = new Marque(req.body);
      await marque.save(); 
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
});

// ajouter Catégorie
router.post('/ajouterCategorie', protect, async (req, res) => {
  try {
    const categorie = new Categorie(req.body);
    await categorie.save(); 
  } catch (error) {
    console.error('Erreur lors de l\'ajout:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ajouter voiture
router.post('/ajouterVoiture', protect, async (req, res) => {
  try {
    const { idmarque, idcategorie, nomvoiture, immatriculation } = req.body;
    const existingVoiture = await Voiture.findOne({ immatriculation });
    if (existingVoiture) {
        return res.status(400).json({ message: "Ce véhicule existe déjà." });
    }
    const voiture = new Voiture({idclient: req.user.userId, idmarque, idcategorie, nomvoiture, immatriculation });
    await voiture.save(); 
    res.json({ message: 'Véhicule Ajouté' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// lister les voitures pour un client
router.get('/listVoiturebyclient', async (req, res) => {
  try {
  const voitures = await Voiture.find({ idclient: req.user.userId });
  if (voitures.length === 0) {
    return res.status(400).json({ message: 'Aucune voiture trouvée pour cet utilisateur.' });
  }
  res.json({ voiture });
  } catch (error) {
  res.status(500).json({ message: error.message });
  }
 })

module.exports = router;