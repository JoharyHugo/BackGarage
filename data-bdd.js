- profil
- etat 
- marque
- categorie
- statut
- bloc heure
- pièce

ravmihary // meangarage
brkduvMyh7IFhBMJ // clustGARAGE
clustGARAGE


URI = mongodb+srv://meangarage:clustGARAGE@cluster-garage.xxvsp66.mongodb.net/?retryWrites=true&w=majority&appName=cluster-garage


// client/inscription
{
    "nom": "Alice Martin",
    "email": "alice.martin@mail.com",
    "motdepasse": "pwd123!",
    "phone": "0456789012",
    "dateNaissance": "1988-07-05T00:00:00Z"
}
// client/login
{
    "email": "alice.martin@mail.com",
    "motdepasse": "pwd123!"
}

// client/ajouterVoiture
{
    "nomvoiture": "BMW i3",
    "immatriculation": "1234ABC",
    "idmarque": "67eacfb1358af8bbe2b7123c", 
    "idcategorie": "67eacfb1358af8bbe2b71249"
}

// service/ajouterTarif
{
    "idService" : "67ead8f83272b761086e2cf4",
    "idSousService" : "67ead9123272b761086e2cfb",
    "categorieID" : "67eacfb1358af8bbe2b71249",
    "prix" : 20000
}
{
    "idService" : "67ead8f83272b761086e2cf4",
    "idSousService" : "67ead9323272b761086e2d00",
    "categorieID" : "67eacfb1358af8bbe2b71249",
    "prix" : 10000
}
{
    "idService" : "67ead8fc3272b761086e2cf7",
    "idSousService" : "67ead96deda6f5bd739cc431",
    "categorieID" : "67eacfb1358af8bbe2b71249",
    "prix" : 15000
}
{
    "idService" : "67ead8fc3272b761086e2cf7",
    "idSousService" : "67ead971eda6f5bd739cc436",
    "categorieID" : "67eacfb1358af8bbe2b71249",
    "prix" : 30000
}

// rdv/ajouterRdv
{
    "idbloc": "67eacfb1358af8bbe2b71257",
    "daterdv": "2025-04-02",
    "voitureIds": [
      "67ecb4862fc4b6019df432eb"
    ]
}

// rdv/admin/ajoutDevisRdvVoiture 
{
    "rdvId": "67ecb57ab61024c6c2ac7d0a",   
    "idService": "67ead8f83272b761086e2cf4", 
    "idCategorie": "67eacfb1358af8bbe2b71249", 
    "idVoiture": "67ecb4862fc4b6019df432eb",
    "devis": [
        {
            "idsousservice": "67ead9123272b761086e2cfb"
        }
    ]
}
{
    "rdvId": "67ecb57ab61024c6c2ac7d0a",   
    "idService": "67ead8fc3272b761086e2cf7", 
    "idCategorie": "67eacfb1358af8bbe2b71249", 
    "idVoiture": "67ecb4862fc4b6019df432eb",
    "devis": [
        {
            "idsousservice": "67ead96deda6f5bd739cc431"
        },
        {
            "idsousservice": "67ead971eda6f5bd739cc436"
        }
    ]
}

// rdv/admin/ajoutDevisRdvPiece
{
    "rdvId": "67ecb57ab61024c6c2ac7d0a",   
    "idService": "67ead8f83272b761086e2cf4", 
    "idSousService": "67ead9123272b761086e2cfb", 
    "idVoiture": "67ecb4862fc4b6019df432eb",
    "devis": [
        {
            "idpiece": "67ecb824929572fbf5b71236",
            "quantite" : 2 
        }
    ]
}
{
   "rdvId": "67ecb57ab61024c6c2ac7d0a",   
    "idService": "67ead8fc3272b761086e2cf7", 
    "idSousService": "67ead96deda6f5bd739cc431", 
    "idVoiture": "67ecb4862fc4b6019df432eb",
    "devis": [
        {
            "idpiece": "67ecb824929572fbf5b7123b",
            "quantite" : 2
        },
        {
            "idpiece": "67ecb824929572fbf5b7123e",
            "quantite" : 2
        }
    ]
}

{
    "rdvId": "67ecb57ab61024c6c2ac7d0a",   
     "idService": "67ead8fc3272b761086e2cf7", 
     "idSousService": "67ead971eda6f5bd739cc436", 
     "idVoiture": "67ecb4862fc4b6019df432eb",
     "devis": [
         {
             "idpiece": "67ecb9ce929572fbf5b71244",
             "quantite" : 1
         }
     ]
 }

// Mécanicien/inscription
{
    "nom": "Marc Leblanc",
    "email": "marc.leblanc@mail.com",
    "motdepasse": "pass123",
    "phone": "0322345678",
    "dateNaissance": "1990-03-15T00:00:00Z"
}
{
    "nom": "Thomas Leroy",
    "email": "thomas.leroy@mail.com",
    "motdepasse": "scr123",
    "phone": "0343456789",
    "dateNaissance": "1992-06-10T00:00:00Z"
}
{
    "nom": "Jacque Moreau",
    "email": "jac.moreau@mail.com",
    "motdepasse": "MoreauStrongPwd!",
    "phone": "0389012345",
    "dateNaissance": "1995-04-30T00:00:00Z"
}