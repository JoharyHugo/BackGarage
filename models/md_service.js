const mongoose = require('mongoose');
const SousService = require('./md_ss_service'); 
const Utilisateur = require('./md_utilisateur'); 

const serviceSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    sousServices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SousService' }],
    mecaniciens: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' }]
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
serviceSchema.methods.ajouterMecaniciens = async function(mecanicienIds) {
    if (!Array.isArray(mecanicienIds) || mecanicienIds.length === 0) return { success: false, message: "Aucun mécanicien fourni." };
    const mecaniciens = await Utilisateur.find({ '_id': { $in: mecanicienIds } });
    if (mecaniciens.length !== mecanicienIds.length) return { success: false, message: "Un ou plusieurs mécaniciens n'existent pas." };
    const mecaniciensExistant = this.mecaniciens.map(id => id.toString());
    const mecaniciensAajouter = mecanicienIds.filter(id => !mecaniciensExistant.includes(id.toString()));
    if (mecaniciensAajouter.length === 0) return { success: false, message: "Tous les mécaniciens sont déjà associés à ce service." };
    this.mecaniciens.push(...mecaniciensAajouter);
    await this.save();
    return { success: true, message: "Mécaniciens ajoutés avec succès.", service: this };
};

serviceSchema.statics.getServiceforMeca = async function(idUtilisateur) {
    const service = await this.findOne({ mecaniciens: idUtilisateur }); 
    if (!service) return { success: false, message: "Aucun service trouvé pour cet utilisateur." };
    return { success: true, service };
};

module.exports = mongoose.model('Service', serviceSchema, 'service');
