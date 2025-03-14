// import lib
const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors');
require('dotenv').config(); 
// import routes
const cl_utilisateurRoutes = require('./routes/rt_cl_utilisateur');
const mec_utilisateurRoutes = require('./routes/rt_mec_utilisateur');
const man_utilisateurRoutes = require('./routes/rt_man_utilisateur');

const app = express(); 
const PORT = process.env.PORT || 5000;
    
// Middleware 
app.use(cors());
app.use(express.json());

// Connexion  à MongoDB
mongoose.connect(process.env.MONGO_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
}).then(() => console.log("🚀 MongoDB connecté"))   
.catch(err => console.log("❌",err)); 

// Routes
app.use('/api/client', cl_utilisateurRoutes); 
app.use('/api/mecanicien', mec_utilisateurRoutes);
app.use('/api/manager', man_utilisateurRoutes); 


app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`))