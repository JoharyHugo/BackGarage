// import lib
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// import models
const Service = require('../models/md_services');
const Categorie = require('../models/md_categorie_vehicule');


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

// liste des souservices pour un services
router.get('/listSsServbyService', protect, async (req, res) => {
    try {
        const { idService } = req.body;
        const services = await Service.findById(idService).select('nom sousServices.nom sousServices.description sousServices._id'); 
        res.json(services);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// liste des tarif par sous-service et catégorie
router.get('/listTarif', protect, async (req, res) => {
    try {
        const { idService, idSousService } = req.body;
        const service = await Service.findById(idService).select('sousServices');
        const sousService = service.sousServices.id(idSousService);
        if (!sousService) {
            return res.status(404).json({ message: "Sous-service non trouvé." });
        }
        await Service.populate(sousService, {
            path: 'tarifs.idcategorie',
            model: 'Categorie'
        });
        const tarifsAvecCategorie = sousService.tarifs.map(tarif => ({
            prix: tarif.prix,
            idcategorie: tarif.idcategorie._id, 
            nomcategorie: tarif.idcategorie.nomcategorie 
        }));
        res.json(tarifsAvecCategorie);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});




// ajout Sous-service
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

module.exports = router;