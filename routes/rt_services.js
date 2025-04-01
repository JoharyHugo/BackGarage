// import lib
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// import models
const Marque = require('../models/md_marque');
const Categorie = require('../models/md_categorie_vehicule');
const Voiture = require('../models/md_voiture_client');
const Bloc = require('../models/md_bloc_heure_rdv');
const Service = require('../models/md_service');
const SousService = require('../models/md_ss_service');

// import middleware
const protect = require('../middlewares/auth');

// ajout service 
router.post('/ajouterService', protect, async (req, res) => {
    try {
        const { nom } = req.body;
        const existe = await Service.findOne({ nom: { $regex: new RegExp(`^${nom}$`, "i") } }); // MAJ ou min
        if (existe) {
            return res.status(400).json({ message: "Ce service existe déjà." });
        }
        const service = new Service({ nom, sousServices: [] });
        await service.save();
        res.json({ message: 'Service Ajouté' });
    } catch (err) {
        return { success: false, message: err.message };
    }
});

// liste de tous les services
router.get('/listService', protect, async (req, res) => {
    try {
        const services = await Service.find().select('_id nom'); ;
        res.json(services);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ajout sous service// ajout Sous-service
router.post("/ajouterSousService", protect, async (req, res) => {
    const { idService, nomSousService, description } = req.body;
    try {
        const service = await Service.findById(idService);
        const result = await service.ajouterSousService(nomSousService, description);
        res.status(result.success ? 200 : 400).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ajout Tarif catégorie pour les sous - services
router.post('/ajouterTarif', protect, async (req, res) => {
    const { idService, idSousService, categorieID, prix } = req.body;
    try {
        const service = await Service.findById(idService);
        const result = await service.ajouterTarif(idSousService, categorieID, prix);
        res.status(result.success ? 200 : 400).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// liste de tous les services
router.get('/listService', protect, async (req, res) => {
    try {
        const services = await Service.find().select('_id nom'); ;
        res.json(services);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// liste des sous-services pour un services
router.get('/listSsServbyService', protect, async (req, res) => {
    try {
        const { idService } = req.body;
        const service = await Service.findById(idService)
            .populate({
                path: 'sousServices', 
                populate: {
                    path: 'tarifs.idcategorie', 
                    model: 'Categorie' 
                }
            });
        res.json(service);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// liste des tarif par sous-service et catégorie
router.get('/listTarifbySsService', protect, async (req, res) => {
    try {
        const { idService, idSousService } = req.body; 
        const service = await Service.findById(idService).populate('sousServices');
        const sousService = service.sousServices.find(ss => ss._id.toString() === idSousService);
        await SousService.populate(sousService, { path: 'tarifs.idcategorie' });
        const tarifsAvecCategorie = sousService.tarifs.map(tarif => ({
            prix: tarif.prix,
            idcategorie: tarif.idcategorie._id,
            nomcategorie: tarif.idcategorie.nomcategorie
        }));
        res.json(tarifsAvecCategorie);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Liste des sous-services par service et catégorie
router.get('/listSsServCateg', protect, async (req, res) => {
    try {
        const { serviceId, categorieId } = req.body; 
        const service = await Service.findById(serviceId)
            .populate({
                path: 'sousServices',
                populate: {
                    path: 'tarifs.idcategorie',
                    model: 'Categorie'
                }
            });

        const sousServicesFiltres = service.sousServices
            .map(sousService => {
                const tarifsFiltres = sousService.tarifs
                    .filter(tarif => tarif.idcategorie && tarif.idcategorie._id.toString() === categorieId)
                    .map(tarif => ({ prix: tarif.prix, idcategorie: tarif.idcategorie._id, nomcategorie: tarif.idcategorie.nomcategorie}));

                if (tarifsFiltres.length > 0) {
                    return {
                        _id: sousService._id,
                        nom: sousService.nom,
                        description: sousService.description,
                        tarifs: tarifsFiltres
                    };
                }
                return null;
            })
            .filter(sousService => sousService !== null);
        res.json({ service: service.nom, sousServices: sousServicesFiltres });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur interne." });
    }
});



module.exports = router;