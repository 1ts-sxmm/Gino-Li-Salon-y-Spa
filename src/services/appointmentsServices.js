// Lógica del API

const pool = require("../config/db")

const {
    client_name,
    service_id,
    employee_id,
    appointment_date,
    start_time
} = req.body;

if (!client_name || !service_id || !employee_id || !appointment_date || !start_time) {
  return res.status(400).json({ msg: "Faltan datos obligatorios" });
}

const serviceId = Number(service_id);
const employeeId = Number(employee_id);

if (!Number.isInteger(serviceId) || !Number.isInteger(employeeId)) {
  return res.status(400).json({ msg: "service_id y employee_id deben ser números" });
}

// Crear citas
const createAppointments = async (req, res) => {
    return res.status(200).json({ msg: "createAppointments OK", body: req.body });
};

// Vista del día
const getAppointments = async (req, res) => {
    return res.status(200).json({ msg: "getAppointments OK"});
};

// Horas disponibles
const getAvailableTimes = async (req, res) => {
    return res.status(200).json({ msg: "getAvaibleTimes OK"});
};

// Eliminar citas
const deleteAppointments = async (req, res) => {
    return res.status(200).json({ msg: "deleteAppointments OK" });
};

// Exportar variables
module.exports = {
    createAppointments,
    getAppointments,
    getAvailableTimes,
    deleteAppointments
};