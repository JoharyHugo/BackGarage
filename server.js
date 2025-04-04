// import lib
const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors');
require('dotenv').config(); 

// import routes
const rt_utilisateur = require('./routes/rt_utilisateur');
const rt_voiture = require('./routes/rt_voiture');
const rt_rdv_client = require('./routes/rt_rdv_client');
const rt_rdv_admin = require('./routes/rt_rdv_admin');
const rt_service = require('./routes/rt_service');
const rt_tache_meca = require('./routes/rt_tache_meca');

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
app.use('/api', rt_utilisateur); 
app.use('/api/client', rt_voiture); 
app.use('/api/rdv', rt_rdv_client); 
app.use('/api/rdv/admin', rt_rdv_admin); 
app.use('/api/service', rt_service); 
app.use('/api/tache/mecanicien', rt_tache_meca); 

app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`))