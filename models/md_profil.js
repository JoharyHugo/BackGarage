const mongoose = require('mongoose');

const ProfilSchema = new mongoose.Schema({
  nomprofil: { type: String, required: true, unique: true }
});


module.exports = mongoose.model('Profil', ProfilSchema,'profil');
