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

// aide pour chgt état
const checkRdv = async (req, res, check) => {
    try {
        const { rdvId } = req.body;
        const etat = await Etat.findOne({ etat: check });
        if (!etat) {
            return res.status(404).json({ message: "État non trouvé" });
        }
        // console.log("YOOOOOOOOOOOOOO" ,etat.etat);
        const rdv = await Rdv.findByIdAndUpdate(rdvId, { idetat: etat._id }, { new: true }); // retourne avec modification
        res.status(200).json({ message: "L'état du rendez-vous a été mis à jour avec succès.", rdv });
    } catch (error) {
        console.error(`Erreur lors de la connexion (${check}):`, error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// liste rdv en attente par date sélectionné sinon aujourd'hui
router.get('/listRdvDate/:datetri?', protect, async (req, res) => {
    try {
        const { datetri } = req.params;
        const dateT = datetri ? new Date(datetri) : new Date();

        const startOfDay = new Date(dateT.setHours(0, 0, 0, 0)); 
        const endOfDay = new Date(dateT.setHours(23, 59, 59, 999)); 
        const etatEnAttente = await Etat.findOne({ etat: 'en attente' });
        // console.log(etatEnAttente._id);
        let rdvs = await Rdv.find({ idetat: etatEnAttente._id , daterdv: { $gte: startOfDay, $lte: endOfDay } })  // populate = jointure 
            .populate('idbloc') 
            .populate('idclient', 'nom idprofil') 
            .populate({
                path: 'voitureIds.voiture',
                select: 'immatriculation  idmarque idcategorie',
                populate: [
                    { path: 'idmarque', select: 'nommarque' }, 
                    { path: 'idcategorie', select: 'nomcategorie' }
                ]
            });
        rdvs = Rdv.TriRdvsC(rdvs); // fonction tri
        res.status(200).json(rdvs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// liste de voiture pour tel RDV
router.get('/listVoituresRdv', protect, async (req, res) => {
    try {
        const { rdvId } = req.body; 
        const rdv = await Rdv.findById(rdvId)
            .populate({
                path: 'voitureIds.voiture',
                select: 'immatriculation idmarque idcategorie _id',
                populate: [
                    { path: 'idmarque', select: 'nommarque' },
                    { path: 'idcategorie', select: 'nomcategorie' }
                ]
            });
        if (!rdv) {
            return res.status(404).json({ message: "Rendez-vous non trouvé." });
        }
        const voitures = rdv.voitureIds.map(voiture => ({_id: voiture._id,  voiture: voiture.voiture }));
        res.status(200).json({ voitures });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// A titre d'historique
const getListRdvByEtat = async (req, res, etat) => {
    try {
        const etatq = await Etat.findOne({ etat });
        let rdvs = await Rdv.find({ idetat: etatq._id})
            .populate('idbloc') 
            .populate('idclient', 'nom idprofil') 
            .populate({
                path: 'voitureIds.voiture',
                select: 'immatriculation idmarque idcategorie',
                populate: [
                    { path: 'idmarque', select: 'nommarque' }, 
                    { path: 'idcategorie', select: 'nomcategorie' }
                ]
            })
            .sort({ daterdv: -1, 'idbloc.ordre': -1 }) ;
        res.status(200).json(rdvs);
    } catch (error) {
        console.error(`Erreur lors de la récupération des RDVs (${etat}):`, error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// route de présence ou absence
router.put('/presence', (req, res) => checkRdv(req, res, 'présence'));
router.put('/absence', (req, res) => checkRdv(req, res, 'absence'));
router.put('/encoursdevis', (req, res) => checkRdv(req, res, 'en cours de devis'));

// route d'historique
router.get('/listRdv/enattente', protect, (req, res) => getListRdvByEtat(req, res, 'en attente'));
router.get('/listRdv/presence', protect, (req, res) => getListRdvByEtat(req, res, 'présence'));
router.get('/listRdv/absence', protect, (req, res) => getListRdvByEtat(req, res, 'absence'));
router.get('/listRdv/termine', protect, (req, res) => getListRdvByEtat(req, res, 'terminé'));
router.get('/listRdv/encoursdevis', protect, (req, res) => getListRdvByEtat(req, res, 'en cours de devis'));

// ajout devis sous service pour une voiture à un RDV
router.post('/ajoutDevisRdvVoiture', protect, async (req, res) => {
    try {
        const { rdvId, idService, idCategorie, devis, idVoiture } = req.body;
        const rdv = await Rdv.findById(rdvId).exec();
        if (!rdv)  return res.status(404).json({ message: "Rendez-vous non trouvé." });
        const service = await Service.findById(idService).exec();
        if (!service)   return res.status(404).json({ message: "Service non trouvé." });
       
        const voitureRdv = rdv.voitureIds.find(voiture => voiture.voiture.toString() === idVoiture); // Trouver la voiture associée au rendez-vous
        const devisSousServices = await Promise.all(devis.map(async (devisData) => {
            const { idsousservice } = devisData;
            const sousService = await SousService.findById(idsousservice).exec();
            const tarif = sousService.tarifs.find(t => t.idcategorie.toString() === idCategorie);
            const statut = await Statut.findOne({ statut: "en attente" }).exec();
            return {
                idsousservice: sousService._id,
                idstatut: statut._id,
                tarif: tarif.prix,
                devisMatériel: []
            };
        }));
        const devisService = { idservice: service._id, devisSsService: devisSousServices };
        voitureRdv.devis.push(devisService);
        await rdv.save();
        res.status(200).json({ message: "Devis ajouté avec succès au rendez-vous.", rdv });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// liste devis SERVICE & sous service pour tel voiture pour tel rdv
router.post('/detailsDevisSousService', protect, async (req, res) => {
    try {
        const { rdvId, idVoiture } = req.body; 
        const rdv = await Rdv.findById(rdvId)
            .populate({ path: 'voitureIds.voiture', model: 'Voiture'
            })
            .populate({ path: 'voitureIds.devis.idservice', model: 'Service'
            })
            .populate({ path: 'voitureIds.devis.devisSsService.idsousservice', model: 'SousService'
            });

        if (!rdv)  return res.status(404).json({ message: "Rendez-vous non trouvé." });
        const voitureRdv = rdv.voitureIds.find(voiture => voiture.voiture._id.toString() === idVoiture);
        if (!voitureRdv) return res.status(404).json({ message: "Voiture non trouvée dans ce rendez-vous." });
        const devisDetails = voitureRdv.devis.reduce((acc, devis) => {
            const serviceName = devis.idservice.nom;
            if (!acc[serviceName]) {
                acc[serviceName] = [];
            }
            devis.devisSsService.forEach(ss => {
                acc[serviceName].push({
                    nomSousService: ss.idsousservice.nom,
                    tarif: ss.tarif
                });
            });
            return acc;
        }, {});

        const result = Object.entries(devisDetails).map(([serviceName, sousServices]) => ({
            nomService: serviceName,
            sousServices
        })); // Formater la réponse

        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

//  ajout devis pièces
router.post('/ajoutDevisRdvPiece', protect, async (req, res) => {
    try {
        const { rdvId, idService, idSousService, idVoiture, devis } = req.body;

        // Vérifier que les données requises sont présentes
        if (!rdvId || !idService || !idSousService || !idVoiture || !Array.isArray(devis)) {
            return res.status(400).json({ message: 'Données manquantes ou invalides.' });
        }

        // Trouver le rendez-vous
        const rdv = await Rdv.findById(rdvId);
        if (!rdv) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
        }

        // Trouver la voiture associée au rendez-vous
        const voitureRdv = rdv.voitureIds.find(voiture => voiture.voiture.toString() === idVoiture);
        if (!voitureRdv) {
            return res.status(404).json({ message: 'Voiture non trouvée dans ce rendez-vous.' });
        }

        // Trouver ou créer le devis pour le service spécifié
        let devisService = voitureRdv.devis.find(devis => devis.idservice.toString() === idService);
        if (!devisService) {
            devisService = { idservice: idService, devisSsService: [] };
            voitureRdv.devis.push(devisService);
        }

        // Trouver ou créer le sous-service dans le devis
        let devisSousService = devisService.devisSsService.find(ss => ss.idsousservice.toString() === idSousService);
        if (!devisSousService) {
            devisSousService = { idsousservice: idSousService, idstatut: 'statut_id_par_defaut', tarif: 0, devisMatériel: [] };
            devisService.devisSsService.push(devisSousService);
        }

        // Ajouter les pièces au devis
        for (const item of devis) {
            const { idpiece, quantite } = item;
            if (!idpiece || !quantite) {
                return res.status(400).json({ message: 'ID de pièce ou quantité manquants.' });
            }

            // Vérifier si la pièce existe et obtenir son prix
            const piece = await Piece.findById(idpiece);
            if (!piece) {
                return res.status(404).json({ message: `Pièce avec ID ${idpiece} non trouvée.` });
            }

            // Ajouter la pièce au devis
            devisSousService.devisMatériel.push({
                idpiece: piece._id,
                prix: piece.prix,
                quantite: quantite
            });

            // Mettre à jour le tarif total du sous-service
            devisSousService.tarif += piece.prix * quantite;
        }

        // Sauvegarder les modifications
        await rdv.save();

        res.status(201).json({ message: 'Devis ajouté avec succès.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});




module.exports = router;