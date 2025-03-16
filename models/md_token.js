const mongoose = require('mongoose');

const UtilisteurTokenSchema = new mongoose.Schema({
  idutilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // 24 heures (1 jour)
});

// Export du modèle
module.exports = mongoose.model('Utilisateurtoken', UtilisteurTokenSchema, 'utilisateurtoken');
