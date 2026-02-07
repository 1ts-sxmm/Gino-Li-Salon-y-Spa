// Lógica del API

const pool = require("../config/db");

// Crear citas
const createAppointments = async (req, res) => {
    try {
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

        const sql = "SELECT duration FROM services WHERE id = ?";
        const [rows] = await pool.query(sql, [serviceId]);

        if (rows.length === 0) {
            return res.status(404).json({ msg: "Servicio no existe" });
        }

        const duration = rows[0].duration;

        const sql2 = "SELECT ADDTIME(?, SEC_TO_TIME(? * 60)) AS end_time";

        const [rows2] = await pool.query(sql2, [start_time, duration]);

        if (!rows2 || rows2.length === 0 || !rows2[0].end_time) {
            return res.status(500).json({ msg: "No se pudo calcular end_time" });
        }

        const end_time = rows2[0].end_time;

        // 1) Buscar si ya hay una cita que se cruce (mismo empleado + misma fecha)
        const conflictSql = `
            SELECT id
            FROM appointments
            WHERE employee_id = ?
                AND appointment_date = ?
                AND status = 'scheduled'
                AND (? < end_time AND ? > start_time)
            LIMIT 1
        `;

        const [conflicts] = await pool.query(conflictSql, [
            employeeId,
            appointment_date,
            start_time,
            end_time
        ]);

        // 2) Si hay algo, significa "está ocupado"
        if (conflicts.length > 0) {
            return res.status(409).json({
                msg: "Ese empleado ya tiene una cita en ese horario (cruce)"
            });
        }

        const insertSql = `
            INSERT INTO appointments
            (client_name, service_id, employee_id, appointment_date, start_time, end_time, duration)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query(insertSql, [
            client_name,
            serviceId,
            employeeId,
            appointment_date,
            start_time,
            end_time,
            duration
        ]);

        return res.status(201).json({
            msg: "Cita creada ✅",
            id: result.insertId,
            client_name,
            service_id: serviceId,
            employee_id: employeeId,
            appointment_date,
            start_time,
            end_time,
            duration
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Error interno del servidor" });
    }
};

// Vista del día
const getAppointments = async (req, res) => {
    try {
        const { date } = req.query

        if(!date) {
            return res.status(400).json({ msg: "Debes enviar ?date=YYYY-MM-DD" })
        }

        const sql = `
            SELECT *
            FROM appointments
            WHERE appointment_date = ?
                AND status = 'scheduled'
            ORDER BY start_time
        `;

        const [rows] = await pool.query(sql, [date]);

        return res.status(200).json(rows);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Error interno del servidor" })
    }
};

// Horas disponibles
const getAvailableTimes = async (req, res) => {
    try {
        const {date, employee_id, service_id } = req.query;

        if(!date || !employee_id || !service_id) {
            return res.status(400).json({msg: "Debe enviar date, employee_id y/o service_id"});
        }

        const employeeId = Number(employee_id);
        const serviceId = Number(service_id)

        if(!Number.isInteger(employeeId) || !Number.isInteger(serviceId)) {
            return res.status(400).json({msg: "employee_id y service_id deben ser números"})
        }

        const sql = `SELECT duration
            FROM services
            WHERE id = ?;
        `;

        const [rows] = await pool.query(sql, [serviceId])

        if(rows.length === 0) {
            return res.status(404).json({msg: "Servicio no existe"})
        }

        const duration = rows[0].duration;

        const sqlAppointments = `
            SELECT start_time, end_time
            FROM appointments
            WHERE employee_id = ?
            AND appointment_date = ?
            AND status = 'scheduled'
            ORDER BY start_time;
        `;

        const [appointments] = await pool.query(sqlAppointments, [employeeId, date]);

        return res.status(200).json({
            duration,
            appointments
        });

    } catch(error) {
        console.error(error);
        return res.status(500).json({msg: "Error interno del servidor"})
    }
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