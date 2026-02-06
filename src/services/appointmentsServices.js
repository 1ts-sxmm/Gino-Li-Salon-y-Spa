const createAppointments = async (req, res) => {
    return res.status(200).json({ msg: "createAppointments OK", body: req.body });
};

const getAppointments = async (req, res) => {
    return res.status(200).json({ msg: "getAppointments OK"});
};

const getAvailableTimes = async (req, res) => {
    return res.status(200).json({ msg: "getAvaibleTimes OK"});
};

const deleteAppointments = async (req, res) => {
    return res.status(200).json({ msg: "deleteAppointments OK" });
};

module.exports = {
    createAppointments,
    getAppointments,
    getAvailableTimes,
    deleteAppointments
};