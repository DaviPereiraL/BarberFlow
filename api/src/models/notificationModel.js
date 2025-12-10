const pool = require('../config/db');

const NotificationModel = {
    async create({ barber_id, user_id, appointment_id, type, message }) {
        const query = `
            INSERT INTO notifications (barber_id, user_id, appointment_id, type, message)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const values = [barber_id, user_id, appointment_id, type, message];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async findAll(barberId) {

        let query = `
            SELECT n.*, u.name as cliente_nome 
            FROM notifications n
            LEFT JOIN users u ON n.user_id = u.id
        `;
        
        const values = [];
        
        if (barberId) {
            query += ` WHERE n.barber_id = $1 OR n.barber_id IS NULL`; // IS NULL = Aviso geral
            values.push(barberId);
        }
        
        query += ` ORDER BY n.created_at DESC LIMIT 20`; // Só as últimas 20

        const result = await pool.query(query, values);
        return result.rows;
    },

    async markAsSeen(id) {
        const query = `UPDATE notifications SET seen = true WHERE id = $1 RETURNING *`;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
};

module.exports = NotificationModel;