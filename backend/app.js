const express = require('express');
const mongoose = require('mongoose');
const booksRoutes = require('./routes/book');
const userRoutes = require('./routes/user');
const path = require('path');
require('dotenv').config(); // Charger les variables d'environnement à partir du fichier .env

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, // Utiliser la variable d'environnement pour l'URI MongoDB
    { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch((error) => console.log('Connexion à MongoDB échouée !', error));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use('/api/books', booksRoutes);
app.use('/api/auth', userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;