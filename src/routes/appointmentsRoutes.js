const express = require("express");
const router = express.Router();

const {
    createAppointments,
    getAppointments,
    getAvailableTimes,
    deleteAppointments
} = require("../services/appointmentsServices")

router.post("/appointments", createAppointments)

router.get("/appointments", getAppointments)

router.get("/appointments/available", getAvailableTimes)

router.delete("/appointments/:id", deleteAppointments)

module.exports = router;