const mongoose = require('mongoose');

const tarifSchema = new mongoose.Schema({
    idcategorie: { type: mongoose.Schema.Types.ObjectId, ref: 'Categorie', required: true },
    prix: { type: Number, required: true }
});

const sousServiceSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    description: { type: String },
    tarifs: [tarifSchema]
});

module.exports = mongoose.model('SousService', sousServiceSchema, 'sousservice');
