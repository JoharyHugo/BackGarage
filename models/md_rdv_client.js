const mongoose = require('mongoose');

const RdvSchema = new mongoose.Schema({
    idclient: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
    idbloc: { type: mongoose.Schema.Types.ObjectId, ref: 'Bloc', required: true },
    idetat: { type: mongoose.Schema.Types.ObjectId, ref: 'Etat', required: true },
    daterdv: { type: Date, required: true },
    voitureIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Voiture', required: true }]
});

module.exports = mongoose.model('Rdv', RdvSchema, 'rdvclient');
