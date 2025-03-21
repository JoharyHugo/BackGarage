const mongoose = require('mongoose');

const voitureRdvSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() }, // Génération automatique d'un ID
    voiture: { type: mongoose.Schema.Types.ObjectId, ref: 'Voiture', required: true }
});

const RdvSchema = new mongoose.Schema({
    idclient: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
    idbloc: { type: mongoose.Schema.Types.ObjectId, ref: 'Bloc', required: true },
    idetat: { type: mongoose.Schema.Types.ObjectId, ref: 'Etat', required: true },
    daterdv: { type: Date, required: true },
    voitureIds: [voitureRdvSchema]
});

RdvSchema.statics.TriRdvs = function(rdvs) {
    return rdvs.sort((a, b) => {
        if (new Date(a.daterdv).getTime() !== new Date(b.daterdv).getTime()) {
            return new Date(a.daterdv) - new Date(b.daterdv); // Tri par date
        }
        return a.idbloc.ordre - b.idbloc.ordre; // Tri par horaire
    });
};

RdvSchema.statics.listBlocDispo = async function (date) {
    try {
        const dt1 = new Date(date);
        const startOfDay = new Date(dt1.setHours(0, 0, 0, 0));
        const endOfDay = new Date(dt1.setHours(23, 59, 59, 999));

        const blocreserve = await this.find({ daterdv: { $gte: startOfDay, $lte: endOfDay } }).distinct('idbloc'); // prend idbloc seulement
        // console.log("Blocs réservés pour", date, ":", blocreserve);
        const blocdispo = await mongoose.model('Bloc').find({ _id: { $nin: blocreserve } }).sort({ ordre: 1 }); // Tri pas ordre
        return blocdispo;
    } catch (error) {
        console.error("Erreur lors de la récupération des blocs disponibles :", error);
        return [];
    }
};

module.exports = mongoose.model('Rdv', RdvSchema, 'rdvclient');
