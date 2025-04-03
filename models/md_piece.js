const mongoose = require('mongoose');

const PieceSchema = new mongoose.Schema({
    nompiece: { type: String, required: true, unique: true },
    prix: { type: Number, required: true }
});

module.exports = mongoose.model('Piece', PieceSchema,'piece');
