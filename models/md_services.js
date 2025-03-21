const mongoose = require('mongoose');

const tarifSchema = new mongoose.Schema({
    idcategorie: { type: mongoose.Schema.Types.ObjectId, ref: 'Categorie', required: true },
    prix: { type: Number, required: true }
});

const sousServiceSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    description: { type: String },
    tarifs: [tarifSchema] // Association des tarifs à chaque sous-service
});

const serviceSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    sousServices: [sousServiceSchema]
});

serviceSchema.methods.ajouterSousService = async function(nomSousService, description) {
    const existe = this.sousServices.some(ss => new RegExp(`^${ss.nom}$`, 'i').test(nomSousService));
    if (existe) {
        return { success: false, message: "Ce sous-service existe déjà." };
    }
    this.sousServices.push({ nom: nomSousService, description });
    await this.save();
    return { success: true, message: "Sous-service ajouté avec succès.", service: this };
};

serviceSchema.methods.ajouterTarif = async function(idSousService, categorieID, prix) {
    const sousService =  this.sousServices.find(ss => ss._id.toString() === idSousService);
    if (!sousService) {
        return { success: false, message: "Sous-service non trouvé." };
    }
    const tarifExiste = sousService.tarifs.some(t => t.idcategorie.toString() === categorieID );
    if (tarifExiste) {
        return { success: false, message: "Ce tarif existe déjà." };
    }

    sousService.tarifs.push({ idcategorie: categorieID, prix });
    await this.save();
    return { success: true, message: "Tarif ajouté avec succès.", service: this };
};


module.exports = mongoose.model('Service', serviceSchema, 'service');
