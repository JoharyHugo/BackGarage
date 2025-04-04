const mongoose = require('mongoose');

const devisMatérielSchema = new mongoose.Schema({
    idpiece: { type: mongoose.Schema.Types.ObjectId, ref: 'Piece', required: true },
    prix: { type: Number, required: true }, 
    quantite: { type: Number, required: true } 
});

const devisSousServiceSchema = new mongoose.Schema({
    idsousservice: { type: mongoose.Schema.Types.ObjectId, ref: 'SousService',required: true },
    idstatut: { type: mongoose.Schema.Types.ObjectId, ref: 'Statut', required: true },
    tarif: { type: Number, required: true }, 
    total: { type: Number, required: true }, 
    devisMatériel: [devisMatérielSchema] 
});

const devisServiceSchema = new mongoose.Schema({
    idservice: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    devisSsService: [devisSousServiceSchema]
});

const voitureRdvSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    voiture: { type: mongoose.Schema.Types.ObjectId, ref: 'Voiture', required: true },
    devis: [devisServiceSchema]
});

const RdvSchema = new mongoose.Schema({
    idclient: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
    idbloc: { type: mongoose.Schema.Types.ObjectId, ref: 'Bloc', required: true },
    idetat: { type: mongoose.Schema.Types.ObjectId, ref: 'Etat', required: true },
    daterdv: { type: Date, required: true },
    voitureIds: [voitureRdvSchema]
});

RdvSchema.statics.TriRdvsC = function(rdvs) {
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
        const blocdispo = await mongoose.model('Bloc').find({ _id: { $nin: blocreserve } }).sort({ ordre: 1 }); // Tri pas ordre ,  $nin : not In
        return blocdispo;
    } catch (error) {
        console.error("Erreur lors de la récupération des blocs disponibles :", error);
        return [];
    }
};

module.exports = mongoose.model('Rdv', RdvSchema, 'rdvclient');
