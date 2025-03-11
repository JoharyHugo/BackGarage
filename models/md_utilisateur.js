const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UtilisateurSchema = new mongoose.Schema({
  idprofil: { type: mongoose.Schema.Types.ObjectId, ref: 'Profil', required: true },
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  motdepasse: { type: String, required: true },
  phone: { type: String, required: true },
  dateInscription: { type: Date, default: Date.now }, 
  dateNaissance: { type: Date, required: true }
});

UtilisateurSchema.pre('save', async function(next) {
  if (!this.isModified('motdepasse')) {
    return next(); //modification ou non du mdp
  }
// Hachage
  const salt = await bcrypt.genSalt(10);
  this.motdepasse = await bcrypt.hash(this.motdepasse, salt);
  next();
});

UtilisateurSchema.methods.matchMotdepasse = async function(enteredMotdepasse) {
  return await bcrypt.compare(enteredMotdepasse, this.motdepasse);
};

module.exports = mongoose.model('Utilisateur', UtilisateurSchema,'utilisateur');
