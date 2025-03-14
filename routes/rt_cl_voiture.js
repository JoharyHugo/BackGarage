// import lib
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// import models
const Marque = require('../models/md_marque');
const Categorie = require('../models/md_categorie_vehicule');
const Voiture = require('../models/md_voiture_client');

// ajouter Marque
router.post('/ajouterMarque', async (req, res) => {
    try {
      const marque = new Marque(req.body);
      await marque.save(); 
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
});

// ajouter Catégorie
router.post('/ajouterCategorie', async (req, res) => {
  try {
    const categorie = new Categorie(req.body);
    await categorie.save(); 
  } catch (error) {
    console.error('Erreur lors de l\'ajout:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ajouter voiture
router.post('/ajouterVoiture', async (req, res) => {
  try {
    const { nomvoiture, immatriculation, idmarque, idcategorie } = req.body;
    const existingVoiture = await Voiture.findOne({ immatriculation });
    if (existingVoiture) {
        return res.status(400).json({ message: "Ce véhicule existe déjà." });
    }

    const voiture = new Voiture({ nomvoiture, immatriculation, idmarque, idcategorie });
    await voiture.save(); 
    res.json({ message: 'Véhicule Ajouté'});
  } catch (error) {
    console.error('Erreur lors de l\'ajout:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;