const mongoose = require('mongoose');

const UtilisteurTokenSchema = new mongoose.Schema({
  idutilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // 24 heures (1 jour)
});

UtilisteurTokenSchema.statics.verifierEtSupprimerTokens = async function(idutilisateur) {
  try {
    const tokensExistants = await this.find({ idutilisateur });
    if (tokensExistants.length > 0) {
      await this.deleteMany({ idutilisateur });
      return true; 
    }
    return false; 
  } catch (error) {
    console.error('Erreur lors de la vérification et de la suppression des tokens :', error);
    throw error; 
  }
};

// Export du modèle
module.exports = mongoose.model('Utilisateurtoken', UtilisteurTokenSchema, 'utilisateurtoken');
