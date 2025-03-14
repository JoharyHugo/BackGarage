// import lib
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// import models
const Utilisateur = require('../models/md_utilisateur');
const Profil = require('../models/md_profil');
const UtilisateurToken = require('../models/md_token'); 

// inscription
router.post('/inscription', async (req, res) => {
    const { nom, email, motdepasse, phone, dateNaissance } = req.body;
    try {
      const profil = await Profil.getProfilByNom('Client'); 
      const userExist = await Utilisateur.findOne({ email });
      if (userExist) {
        return res.status(400).json({ message: 'Utilisateur déjà existant' });
      } else {
        const user = new Utilisateur({ nom, email, motdepasse, phone, dateNaissance, idprofil:profil.id});
        await user.save();
        res.status(201).json({ message: 'Utilisateur créé avec succès' });
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Connexion - utilisateur 
router.post('/login', async (req, res) => {
  const {  email, motdepasse } = req.body;
  try {
    const profil = await Profil.getProfilByNom('Client'); 
    const user = await Utilisateur.findOne({ email, idprofil: profil.id });
    if (!user) {
      return res.status(200).json({ message: 'Utilisateur non trouvé' });
    }
    const isMatch = await user.matchMotdepasse(motdepasse);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe incorrect' });
    }
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } 
    );
    await UtilisateurToken.create({ idutilisateur: user._id, token });
    
    res.json({ message: 'Authentification réussie', token });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


module.exports = router;