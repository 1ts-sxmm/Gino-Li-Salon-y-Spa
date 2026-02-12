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
    const [db] = await pool.query("SELECT DATABASE() AS db");
    const [tbl] = await pool.query("SHOW TABLES LIKE 'appointments'");
    const [cols] = await pool.query("SHOW COLUMNS FROM appointments LIKE 'price_final'");

    console.log("✅ MySQL conectado");
    console.log("DB actual:", db[0].db);
    console.log("¿Existe appointments?:", tbl.length > 0);
  } catch (err) {
    console.error("❌ Error conectando a MySQL:", err);
  }
}

testDB();

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Ejemplo de aplicación escuchada en el puerto http://localhost:3000/`)
}); 