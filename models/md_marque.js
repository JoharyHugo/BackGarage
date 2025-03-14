const mongoose = require('mongoose');

const MarqueSchema = new mongoose.Schema({
    nommarque: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Marque', MarqueSchema,'marque');
