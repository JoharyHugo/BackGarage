const mongoose = require('mongoose');

const EtatSchema = new mongoose.Schema({
    etat: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Etat', EtatSchema,'etat');