const mongoose = require('mongoose');

const BlocSchema = new mongoose.Schema({
    bloc: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Bloc', BlocSchema,'blocheure');
