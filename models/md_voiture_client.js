const mongoose = require('mongoose');

const VoitureSchema = new mongoose.Schema({
    idclient: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
    idmarque: { type: mongoose.Schema.Types.ObjectId, ref: 'Marque', required: true },
    idcategorie: { type: mongoose.Schema.Types.ObjectId, ref: 'Categorie', required: true },
    nomvoiture: { type: String, required: true },
    immatriculation: { type: String, required: true, unique: true }    
});

module.exports = mongoose.model('Voiture', VoitureSchema, 'voitureclient');
