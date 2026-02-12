// Rutas del API

const express = require("express");
const router = express.Router();

// Importar variables de appointmentServices.js
const {
    createAppointments,
    getAppointments,
    getAvailableTimes,
    deleteAppointments,
    completeAppointment
} = require("../services/appointmentsServices");

// Crear citas
router.post("/appointments", createAppointments);

// Vista del día
router.get("/appointments", getAppointments);

// Horas disponibles
router.get("/appointments/available", getAvailableTimes);

// Eliminar citas
router.delete("/appointments/:id", deleteAppointments);

// Completar citas
router.patch("/appointments/:id/complete", completeAppointment);

// Ver empleados
router.get("/employees", getEmployees);

// Ver servicios
router.get("/services", getServices);

// Exportar variable
module.exports = router;