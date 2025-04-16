// import lib
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// import models
const Piece = require('../models/md_piece');

// import middleware
const protect = require('../middlewares/auth');

// liste des pièces
router.get('/listPiece', async (req, res) => {
  try {
  const piece = await Piece.find();
  res.json({ piece });
  } catch (error) {
  res.status(500).json({ message: error.message });
  }
 })

module.exports = router;
