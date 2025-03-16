const mongoose = require('mongoose');

const ProfilSchema = new mongoose.Schema({
  nomprofil: { type: String, required: true, unique: true }
});

ProfilSchema.statics.getProfilByNom = async function(nomprofil) {
  try {
    const profil = await this.findOne({ nomprofil });
    if (profil) {
      return { id: profil._id, nomprofil: profil.nomprofil };
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    return null;
  }
};

module.exports = mongoose.model('Profil', ProfilSchema,'profil');
