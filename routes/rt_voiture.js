// import lib
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// import models
const Marque = require('../models/md_marque');
const Categorie = require('../models/md_categorie_vehicule');
const Voiture = require('../models/md_voiture_client');
const Bloc = require('../models/md_bloc_heure_rdv');

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

// liste Marque
router.get('/listMarque', protect, async (req, res) => {
  try {
  const marque = await Marque.find();
  res.json({ marque });
  } catch (error) {
  res.status(500).json({ message: error.message });
  }
 })

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

// liste des catégories
router.get('/listCategorie', protect, async (req, res) => {
  try {
  const categorie = await Categorie.find();
  res.json({ categorie });
  } catch (error) {
  res.status(500).json({ message: error.message });
  }
 })

// ajouter voiture pour un client
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
router.get('/listVoiturebyclient', protect, async (req, res) => {
  try {
  const voitures = await Voiture.find({ idclient: req.user.userId })
  .populate('idmarque') //JOIN "Marque"
  .populate('idcategorie'); // JOIN "Categorie"
  //console.log("ID =====",req.user.userId );
  if (voitures.length === 0) {
    return res.status(400).json({ message: 'Aucune voiture trouvée pour cet utilisateur.' });
  }
  res.json({ voitures });
  } catch (error) {
  res.status(500).json({ message: error.message });
  }
 })

module.exports = router;