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
            start_time,
            duration_override
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

        console.log("duration_override recibido:", duration_override);

        let duration = rows[0].duration; 

        if (duration_override !== undefined && duration_override !== null && duration_override !== "") {
            const d = Number(duration_override);

            if (!Number.isInteger(d)) {
                return res.status(400).json({ msg: "duration_override debe ser un número entero (minutos)" });
            }

            if (d < 5 || d > 300) {
                return res.status(400).json({ msg: "duration_override fuera de rango (5 a 300 min)" });
            }

            duration = d;
        }

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
        const { date, employee_id } = req.query;

        if(!date) {
            return res.status(400).json({ msg: "Debes enviar ?date=YYYY-MM-DD" });
        }

        let sql = `
            SELECT
                a.id,
                a.client_name,
                a.appointment_date,
                a.start_time,
                a.end_time,
                a.duration,
                a.status,
                s.name AS service_name,
                e.name AS employee_name
            FROM appointments a
            JOIN services s ON s.id = a.service_id
            JOIN employees e ON e.id = a.employee_id
            WHERE a.appointment_date = ?
                AND a.status = 'scheduled'
            `

        const params = [date];

        if(employee_id) {
            sql += ` AND a.employee_id = ?`
            params.push(Number(employee_id));
        };

        sql += ` ORDER BY a.start_time;`

        const [rows] = await pool.query(sql, params);

        return res.status(200).json(rows);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Error interno del servidor" })
    }
};

// Horas disponibles
const getAvailableTimes = async (req, res) => {
    try {
        const { date, employee_id, service_id } = req.query;

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
            ORDER BY start_time
        ;`

        const [appointments] = await pool.query(sqlAppointments, [employeeId, date]);

        const STEP_MIN = 15;

        const OPEN = "09:00:00"
        const CLOSE = "20:30:00"

        const toMinutes = (time) => {
            const [h, m] = time.split(":").map(Number);
            return h * 60 + m;
        };

        const toTime = (minutes) => {
            const h = String(Math.floor(minutes / 60)).padStart(2, "0");
            const m = String(minutes % 60).padStart(2, "0");
            return `${h}:${m}:00`;
        };

        const openMin = toMinutes(OPEN);
        const closeMin = toMinutes(CLOSE);

        const busy = appointments.map(a => ({
            start: toMinutes(a.start_time),
            end: toMinutes(a.end_time)
        }));

        const available = [];

        for (
            let slotStart = openMin;
            slotStart + duration <= closeMin;
            slotStart += STEP_MIN
        ) {
            const slotEnd = slotStart + duration;

            const conflict = busy.some(b => slotStart < b.end && slotEnd > b.start)

            if (!conflict) { 
                available.push(toTime(slotStart)); 
            }
        }

        return res.status(200).json({
            duration,
            available
        });

    } catch(error) {
        console.error(error);
        return res.status(500).json({msg: "Error interno del servidor"});
    }
};

// Eliminar citas
const deleteAppointments = async (req, res) => {
    try {
        const { id } = req.params;

        const Id = Number(id);

        if(!Number.isInteger(Id)) {
            return res.status(400).json({msg: "Id debe ser número"})
        }

        const sql = `SELECT id 
            FROM appointments 
            WHERE id = ?
        ;`

        const [rows] = await pool.query(sql, [Id])

        if(rows.length === 0) {
            return res.status(404).json({msg: "Id no existe"});
        }

        const sqlDelete = `UPDATE appointments
            SET status = 'cancelled'
            WHERE id = ?
            AND status = 'scheduled'
            ;`

        const [result] = await pool.query(sqlDelete, [Id]);

        if(result.affectedRows === 0) {
            return res.status(400).json({ msg: "La cita ya estaba cancelada o no puede cancelarse", id: Id });
        }

        return res.status(200).json({ msg: "Cita cancelada correctamente ✅", id: Id });

    } catch(error) {
        console.error(error);
        return res.status(500).json({msg: "Error interno del servidor"});
    }
};

// Completar citas
const completeAppointment = async (req, res) => {
    try {
        const { id } = req.params

        const Id = Number(id)

        if (!Number.isInteger(Id)) {
            return res.status(400).json({msg: "Id debe ser un número"});
        }

        const sql = `
            SELECT id
            FROM appointments
            WHERE id = ?
        ;`

        const [rows] = await pool.query(sql, [Id]);

        if (rows.length === 0) {
            return res.status(404).json({msg: "Id no existe"});
        }

        const sqlUpdate = `
            UPDATE appointments
            SET status = 'completed'
            WHERE id = ?
            AND status = 'scheduled'
        ;`

        const [result] = await pool.query(sqlUpdate, [Id]) 

        if (result.affectedRows === 0) {
            return res.status(400).json({msg: "La cita no puede completarse porque no está en estado 'scheduled'", id: Id})
        };

        return res.status(200).json({msg: "La cita se completó correctamente", id: Id})

    } catch(error) {
        console.error(error);
        return res.status(500).json({msg: "Error interno del servidor"});
    }
};

// Ver empleados
const getEmployees = async (req, res) => {
    try {
        const sql = `
            SELECT id, name
            FROM employees
            ORDER BY name
        ;`

        const [rows] = await pool.query(sql);

        return res.status(200).json(rows)
        
    } catch(error) {
        console.error(error);
        return res.status(500).json({msg: "Error interno del servidor"});
    }
};

// Ver servicios
const getServices = async (req, res) => {
    try {
        const sql = `
            SELECT id, name, duration, price
            FROM services
            ORDER BY name
        ;`

        const [rows] = await pool.query(sql);

        return res.status(200).json(rows)
        
    } catch(error) {
        console.error(error);
        return res.status(500).json({msg: "Error interno del servidor"});
    }
};

// Exportar variables
module.exports = {
    createAppointments,
    getAppointments,
    getAvailableTimes,
    deleteAppointments,
    completeAppointment,
    getEmployees,
    getServices
};