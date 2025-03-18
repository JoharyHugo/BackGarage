const mongoose = require('mongoose');

const RdvSchema = new mongoose.Schema({
    idclient: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
    idbloc: { type: mongoose.Schema.Types.ObjectId, ref: 'Bloc', required: true },
    idetat: { type: mongoose.Schema.Types.ObjectId, ref: 'Etat', required: true },
    daterdv: { type: Date, required: true },
    voitureIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Voiture', required: true }]
});

RdvSchema.statics.TriRdvs = function(rdvs) {
    return rdvs.sort((a, b) => {
        if (new Date(a.daterdv).getTime() !== new Date(b.daterdv).getTime()) {
            return new Date(a.daterdv) - new Date(b.daterdv); // Tri par date
        }
        return a.idbloc.ordre - b.idbloc.ordre; // Tri par horaire
    });
};

module.exports = mongoose.model('Rdv', RdvSchema, 'rdvclient');
