const mongoose = require('mongoose');

const BlocSchema = new mongoose.Schema({
    bloc: { type: String, required: true, unique: true },
    ordre: { type: Number, required: true } // Utilisation d'un entier au lieu d'une date
});

module.exports = mongoose.model('Bloc', BlocSchema, 'blocheure');
