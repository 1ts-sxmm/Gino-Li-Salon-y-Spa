const express = require('express');
require('dotenv').config();
const path = require('path');
const appointmentsRoutes = require ("./routes/appointmentsRoutes")
const pool = require("./config/db");

const app = express();

// Middleware
app.use(express.json());
app.use("/api", appointmentsRoutes)
// Servir contenido estático
app.use(express.static(path.join(__dirname, '..', 'public')));

// Puerto del servidor
const PORT = process.env.PORT || 3000;

async function testDB() {
    try {
        const [rows] = await pool.query("SELECT 1");
        console.log("✅ MySQL conectado");
    } catch (err) {
        console.error("❌ Error conectando a MySQL:", err);
    }
}

testDB();

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Ejemplo de aplicación escuchada en el puerto http://localhost:3000/`)
}); 