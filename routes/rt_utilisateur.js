// import lib
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// import models
const Utilisateur = require('../models/md_utilisateur');
const Profil = require('../models/md_profil');
const UtilisateurToken = require('../models/md_token');

// import middleware
const protect = require('../middlewares/auth');

// inscription
const inscription = async (req, res, nomprofil) => {
    const { nom, email, motdepasse, phone, dateNaissance } = req.body;
    try {
        const profil = await Profil.getProfilByNom(nomprofil);
        if (!profil) {
            return res.status(400).json({ message: `Profil "${nomprofil}" introuvable` });
        }
        const userExist = await Utilisateur.findOne({ email, idprofil: profil.id });
        if (userExist) {
            return res.status(400).json({ message: 'Utilisateur déjà existant' });
        }
        const user = new Utilisateur({ nom, email, motdepasse, phone, dateNaissance, idprofil: profil.id });
        await user.save();
        res.status(201).json({ message: `Utilisateur "${nomprofil}" créé avec succès` });

    } catch (error) {
        console.error(`Erreur lors de l'inscription (${nomprofil}):`, error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Connexion        
const connection = async (req, res, nomprofil) => {
    const { email, motdepasse } = req.body;
    try {
        const profil = await Profil.getProfilByNom(nomprofil);
        if (!profil) {
            return res.status(400).json({ message: `Profil "${nomprofil}" introuvable` });
        }
        const user = await Utilisateur.findOne({ email, idprofil: profil.id });
        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
        const isMatch = await user.matchMotdepasse(motdepasse); // comparaison mdp
        if (!isMatch) return res.status(400).json({ message: 'Mot de passe incorrect' });
        await UtilisateurToken.verifierEtSupprimerTokens(user._id);
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: 86400 }
        );
        await UtilisateurToken.create({ idutilisateur: user._id, token });

        res.json({ message: 'Authentification réussie', token });

    } catch (error) {
        console.error(`Erreur lors de la connexion (${nomprofil}):`, error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Utilisateur connecté
const getUtilisateurConnecte = async (req, res) => {
    try {
        const utilisateur = await Utilisateur.findById(req.user.userId);
        if (!utilisateur) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.json({ utilisateur });
    } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur:", error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
  
// liste les profils
router.get('/listProfil', async (req, res) => {
  try {
  const profil = await Profil.find();
  res.json({ profil });
  } catch (error) {
  res.status(500).json({ message: error.message });
  }
 })

// Déconnexion
router.post('/deconnexion', protect, async (req, res) => {
    try {
        const userId = req.user.userId; 
        const result = await UtilisateurToken.deleteOne({ idutilisateur: userId });

        if (result.deletedCount === 0) {
            return res.status(400).json({ message: 'Aucun token trouvé pour cet utilisateur' });
        }
        res.json({ message: 'Déconnexion réussie' });
    } catch (error) {
        console.error("Erreur lors de la déconnexion:", error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Routes 
router.post('/client/inscription', (req, res) => inscription(req, res, 'Client'));
router.post('/client/login', (req, res) => connection(req, res, 'Client'));

router.post('/mecanicien/inscription', (req, res) => inscription(req, res, 'Mécanicien'));
router.post('/mecanicien/login', (req, res) => connection(req, res, 'Mécanicien'));

router.post('/manager/inscription', (req, res) => inscription(req, res, 'Manager'));
router.post('/manager/login', (req, res) => connection(req, res, 'Manager'));

router.get('/utilisateurConnecte', protect, getUtilisateurConnecte);

module.exports = router;
