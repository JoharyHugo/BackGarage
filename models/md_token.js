const mongoose = require('mongoose');

const UtilisteurTokenSchema = new mongoose.Schema({
  idutilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: '1m' } 
});

module.exports = mongoose.model('Utilisateurtoken', UtilisteurTokenSchema, 'utilisateurtoken');
