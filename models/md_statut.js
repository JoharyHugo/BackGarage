const mongoose = require('mongoose');

const StatutSchema = new mongoose.Schema({
    statut: { type: String, required: true, unique: true },
    valeur: { type: Number, required: true }, 
});

module.exports = mongoose.model('Statut', StatutSchema,'statut');