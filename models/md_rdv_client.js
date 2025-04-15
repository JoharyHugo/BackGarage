const mongoose = require('mongoose');
const Statut = require('../models/md_statut');
const Etat = require('../models/md_etat');

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

// insert tâche mécanicien , change statut en cours 
RdvSchema.statics.checkSousServiceA = async function (rdvId, idVoiture, idSousService, check) {
    try {
        const statutObj = await mongoose.model('Statut').findOne({ statut: check });
        const rdv = await this.findById(rdvId).populate('voitureIds.voiture').exec();
  
        const voiture = rdv.voitureIds.find(v => v.voiture._id.toString() === idVoiture);
        if (!voiture) {
            return { success: false, message: "Voiture non trouvée dans ce rendez-vous." };
        }
        let sousServiceTrouvé = false;
        voiture.devis.forEach(devis => {
            devis.devisSsService.forEach(ss => {
                if (ss.idsousservice.toString() === idSousService) {
                    ss.idstatut = statutObj._id;
                    sousServiceTrouvé = true;
                }
            });
        });
        if (!sousServiceTrouvé) {
            return { success: false, message: "Sous-service non trouvé." };
        }
        await rdv.save();
        return { success: true, message: 'Statut du sous-service mis à jour avec succès.' };
    } catch (error) {
        console.error("Erreur lors de la mise à jour du statut du sous-service:", error);
        return { success: false, message: 'Erreur serveur' };
    }
};

// compter le nombre de sous service par voiture
RdvSchema.methods.calculerNombreSousServicesParVoiture = async function(rdvId, idVoiture) {
    const rdv = await this.constructor.findById(rdvId).populate({
        path: 'voitureIds.devis.devisSsService.idstatut', 
        model: 'Statut'
    }); 
    if (!rdv) throw new Error('Rendez-vous non trouvé');
    const voiture = rdv.voitureIds.find(voiture => voiture.voiture.toString() === idVoiture.toString());
    if (!voiture) throw new Error('Voiture non trouvée pour ce rendez-vous');

    let sousServiceCount = 0;
    if (voiture.devis && Array.isArray(voiture.devis)) {
        for (let devisService of voiture.devis) {
            if (devisService.devisSsService && Array.isArray(devisService.devisSsService)) {
                for (let devisSousService of devisService.devisSsService) {
                    if (devisSousService.idstatut && devisSousService.idstatut.statut !== 'refusé') {
                        sousServiceCount++;
                    }
                }
            }
        }
    }
    return sousServiceCount;
};

// somme valeur statut des sous service par voiture pour avoir état 
RdvSchema.methods.calculerSommeValeurStatutParVoiture = async function(rdvId, idVoiture) {
    const rdv = await this.constructor.findById(rdvId).populate({
        path: 'voitureIds.devis.devisSsService.idstatut', 
        model: 'Statut'
    }); 
    if (!rdv) throw new Error('Rendez-vous non trouvé');
    const voiture = rdv.voitureIds.find(voiture => voiture.voiture.toString() === idVoiture.toString());
    if (!voiture) throw new Error('Voiture non trouvée pour ce rendez-vous');

    let sousServiceCount = 0;
    if (voiture.devis && Array.isArray(voiture.devis)) {
        for (let devisService of voiture.devis) {
            if (devisService.devisSsService && Array.isArray(devisService.devisSsService)) {
                for (let devisSousService of devisService.devisSsService) {
                    // console.log("lalalalalalLALALA  +++++  ",devisSousService.idstatut.valeur)
                    if (devisSousService.idstatut && devisSousService.idstatut.statut !== 'refusé') {
                        sousServiceCount +=devisSousService.idstatut.valeur;
                    }
                }
            }
        }
    }
    return sousServiceCount;
};

// afficher état voiture pour le tableau d'avancement 
RdvSchema.methods.getEtatVoiture = async function(rdvId, idVoiture) {
    const statutTermine = await Statut.findOne({ statut: 'terminé' });
    if (!statutTermine) throw new Error("Statut 'terminé' introuvable");

    const totalSousServices = await this.calculerNombreSousServicesParVoiture(rdvId, idVoiture);
    const sommeValeur = await this.calculerSommeValeurStatutParVoiture(rdvId, idVoiture);

    const totalFait = totalSousServices * statutTermine.valeur;
    // console.log("Nombre total SS:", totalSousServices);
    // console.log("Somme actuelle valeur statuts:", sommeValeur);
    // console.log("Total requis pour être terminé:", totalFait);

    if (sommeValeur === 0) return "en attente";
    if (sommeValeur > 0 && sommeValeur < totalFait) return "en cours";
    if (sommeValeur === totalFait) return "terminé";
    return "inconnu"; 
};

// fonction pour changer etat RDV si on fait mise à jours  d'un statut en terminé d'un sous service
RdvSchema.methods.getVoituresByRdvId = async function(rdvId) {
    try {
        const rdv = await this.model('Rdv').findById(rdvId)
            .populate({
                path: 'voitureIds.voiture',
                select: 'nomvoiture immatriculation idmarque idcategorie _id',
                populate: [
                    { path: 'idmarque', select: 'nommarque' },
                    { path: 'idcategorie', select: 'nomcategorie' }
                ]
            });
        const statutTermine = await Statut.findOne({ statut: 'terminé' });
        if (!statutTermine) throw new Error("Statut 'terminé' introuvable.");

        const etatsVoitures = await Promise.all(rdv.voitureIds.map(async (voitureRdv) => {
            const etatVoiture = await this.getEtatVoiture(rdvId, voitureRdv.voiture._id);
            return etatVoiture;
        }));

        const toutesVoituresTerminees = etatsVoitures.every(etat => etat === "terminé"); // vérifier pour tous les voitures de ce rdv si étatvoiture == terminé
        if (toutesVoituresTerminees) {
            const etatTermine = await Etat.findOne({ etat: 'terminé' });
            if (!etatTermine)  throw new Error("Etat 'terminé' introuvable.");

            rdv.idetat = etatTermine._id;
            await rdv.save();
            console.log("État du RDV mis à jour en 'terminé'.");
        }
        const voitures = rdv.voitureIds.map(voiture => ({
            _id: voiture._id,
            voiture: voiture.voiture
        }));
        return "ok cela marche";
    } catch (error) {
        throw new Error("Erreur lors de la récupération des voitures : " + error.message);
    }
};



module.exports = mongoose.model('Rdv', RdvSchema, 'rdvclient');
