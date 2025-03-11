// import lib
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
// import models
const Utilisateur = require('../models/md_utilisateur');

// inscription
router.post('/inscription', async (req, res) => {
    const { nom, email, motdepasse, phone, dateNaissance } = req.body;
    try {
      const userExist = await Utilisateur.findOne({ email });
      if (userExist) {
        return res.status(400).json({ message: 'Utilisateur déjà existant' });
      } else {
        const user = new Utilisateur({ nom, email, motdepasse, phone, dateNaissance, idprofil:"67cf3ee809a7752fcbb71239"});
        await user.save();
        res.status(201).json({ message: 'Utilisateur créé avec succès' });
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  
module.exports = router;