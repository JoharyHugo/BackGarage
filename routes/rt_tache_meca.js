// import lib
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// import models
const Etat = require('../models/md_etat');
const Bloc = require('../models/md_bloc_heure_rdv');
const Rdv = require('../models/md_rdv_client');
const Voiture = require('../models/md_voiture_client');
const Service = require('../models/md_service');
const SousService = require('../models/md_ss_service');
const Categorie = require('../models/md_categorie_vehicule');
const Statut = require('../models/md_statut');
const Piece = require('../models/md_piece');

// import middleware
const protect = require('../middlewares/auth');

router.get('/sousservices/enattente', protect, async (req, res) => {
    try {
        const serviceResult = await Service.getServiceforMeca(req.user.userId);
        const serviceT = serviceResult.service._id;
        const statutEnAttente = await Statut.findOne({ statut: 'en attente' });
        const statutDevisFinal = await Etat.findOne({ etat: 'devis final' });
        const serviceID = serviceT.toString();

        // Récupérer les rendez-vous avec l'état 'devis final' et filtrer par idservice
        const rdvs = await Rdv.find({
            'idetat': statutDevisFinal._id,
            'voitureIds.devis.idservice': serviceID
        })
        .populate({
            path: 'voitureIds.voiture',
            select: 'model' // Sélectionner les champs pertinents de la voiture
        })
        .populate({
            path: 'voitureIds.devis.devisSsService.idstatut',
            model: 'Statut',  // Nom du modèle de statut
            select: 'statut'  // Sélectionner uniquement le champ 'statut'
        })
        .populate({
            path: 'voitureIds.devis.devisSsService.idsousservice',
            model: 'SousService', // Nom du modèle de sous-service
            select: 'nom tarif'  // Sélectionner les champs pertinents pour le sous-service
        });

        // Organiser les résultats par voiture et filtrer les sous-services
        const voitureSousServices = rdvs.map(rdv => {
            return rdv.voitureIds.map(voiture => {
                // Filtrer les devis par serviceID
                const filteredDevis = voiture.devis.filter(devis => {
                    if (devis.idservice.toString() === serviceID) {
                        const filteredSousServices = devis.devisSsService.filter(sousservice => {
                            return sousservice.idstatut && sousservice.idstatut._id.toString() === statutEnAttente._id.toString();
                            console.log("-------", sousservice.idstatut._id.toString());
                            console.log("-------", statutEnAttente._id.toString());
                        });                          
                        if (filteredSousServices.length > 0) {
                            // Ajouter les sous-services en attente pour chaque voiture
                            return {
                                voiture: voiture.voiture,
                                devis: [{
                                    idservice: devis.idservice,
                                    devisSsService: filteredSousServices
                                }]
                            };
                        }
                    }
                    return false;
                });

                return filteredDevis.length > 0 ? filteredDevis : null;
            }).filter(voiture => voiture !== null);
        }).flat(); // Flatten pour éviter une structure trop imbriquée

        return res.json(voitureSousServices);
    } catch (error) {
        console.error('Erreur lors de la récupération des sous-services en attente:', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
});


module.exports = router;


