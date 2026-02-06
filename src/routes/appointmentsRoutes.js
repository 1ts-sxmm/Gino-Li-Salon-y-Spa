// Rutas del API

const express = require("express");
const router = express.Router();

// Importar variables de appointmentServices.js
const {
    createAppointments,
    getAppointments,
    getAvailableTimes,
    deleteAppointments
} = require("../services/appointmentsServices")

// Crear citas
router.post("/appointments", createAppointments)

// Agarrar citas
router.get("/appointments", getAppointments)

// Agarrar tiempo disponible
router.get("/appointments/available", getAvailableTimes)

// Eliminar citas
router.delete("/appointments/:id", deleteAppointments)

// Exportar variable
module.exports = router;