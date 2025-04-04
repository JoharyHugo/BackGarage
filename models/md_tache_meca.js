const mongoose = require('mongoose');

const TacheSchema = new mongoose.Schema({
    idMecanicien: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
    idRdv: { type: mongoose.Schema.Types.ObjectId, ref: 'Rdv', required: true },
    idVoiture: { type: mongoose.Schema.Types.ObjectId, ref: 'Voiture', required: true },
    idSousService: { type: mongoose.Schema.Types.ObjectId, ref: 'SousService', required: true },
    idstatut: { type: mongoose.Schema.Types.ObjectId, ref: 'Statut', required: true }
});

module.exports = mongoose.model('Tache', TacheSchema, 'tachemecanicien');

