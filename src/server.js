const express = require('express');
require('dotenv').config();
const path = require('path')

const app = express();

// Middleware
app.use(express.json());
// Servir contenido estático
app.use(express.static(path.join(__dirname, '..', 'public')));

// Puerto del servidor
const PORT = process.env.PORT || 3000;

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Ejemplo de aplicación escuchada en el puerto http://localhost:3000/`)
});