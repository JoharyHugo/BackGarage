const mongoose = require('mongoose');

const CategorieSchema = new mongoose.Schema({
    nomcategorie: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Categorie', CategorieSchema, 'categorie');
