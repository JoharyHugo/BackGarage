const mongoose = require('mongoose');
const SousService = require('./md_ss_service'); // Assurez-vous que le chemin est correct

const serviceSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    sousServices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SousService' }]
});

serviceSchema.methods.ajouterSousService = async function(nomSousService, description) {
    const existe = await SousService.findOne({ nom: { $regex: new RegExp(`^${nomSousService}$`, 'i') } });
    if (existe) {
        return { success: false, message: "Ce sous-service existe déjà." };
    }
    const sousService = new SousService({ nom: nomSousService, description });
    await sousService.save();
    this.sousServices.push(sousService._id);
    await this.save();
    return { success: true, message: "Sous-service ajouté avec succès.", service: this };
};

serviceSchema.methods.ajouterTarif = async function(idSousService, categorieID, prix) {
  const sousServiceId = this.sousServices.find(ss => ss.toString() === idSousService.toString());
  if (!sousServiceId) return { success: false, message: "Sous-service non trouvé." };
  const sousService = await SousService.findById(sousServiceId);
  if (!sousService)  return { success: false, message: "Sous-service non trouvé." };
  const tarifExiste = sousService.tarifs.some(t => t.idcategorie.toString() === categorieID);
  if (tarifExiste)return { success: false, message: "Ce tarif existe déjà." };

  sousService.tarifs.push({ idcategorie: categorieID, prix });
  await sousService.save();
  return { success: true, message: "Tarif ajouté avec succès.", service: this };
};



module.exports = mongoose.model('Service', serviceSchema, 'service');
