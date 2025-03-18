const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(400).json({ message: 'Aucun token, accès refusé' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Vérifier le token
    req.user = decoded; // Stocker les informations de l'utilisateur dans la requête
    next();
  } catch (error) {
    res.status(400).json({ message: 'Token invalide' });
  }
};



module.exports = protect;
