const pool = require('../config/db');

const ServiceModel = {
    async findAll() {
        const query = 'SELECT id, name, price, duration_minutes, description FROM services WHERE active = true';
        const result = await pool.query(query);
        return result.rows;
    },

    async create(service) {
        const tenantQuery = 'SELECT id FROM tenants LIMIT 1';
        const tenantResult = await pool.query(tenantQuery);
        const tenantIdReal = tenantResult.rows[0].id;

        const query = `
            INSERT INTO services (tenant_id, name, description, price, duration_minutes)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, price;
        `;
        
        const values = [tenantIdReal, service.name, service.description, service.price, service.duration];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async update(id, data) {
        const query = `
            UPDATE services 
            SET name = COALESCE($1, name),
                description = COALESCE($2, description),
                price = COALESCE($3, price),
                duration_minutes = COALESCE($4, duration_minutes)
            WHERE id = $5
            RETURNING *;
        `;
        const values = [data.name, data.description, data.price, data.duration, id];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async delete(id) {
        await pool.query('DELETE FROM services WHERE id = $1', [id]);
        return { message: 'Serviço deletado' };
    }
};

module.exports = ServiceModel;