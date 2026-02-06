// Lógica del API

// Crear citas
const createAppointments = async (req, res) => {
    return res.status(200).json({ msg: "createAppointments OK", body: req.body });
};

// Agarrar citas
const getAppointments = async (req, res) => {
    return res.status(200).json({ msg: "getAppointments OK"});
};

// Agarrar tiempo disponible
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