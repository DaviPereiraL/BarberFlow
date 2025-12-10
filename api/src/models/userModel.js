const pool = require('../config/db');

const UserModel = {

    async findAll() {
        const query = 'SELECT id, name, email, role, avatar_url, bio FROM users';
        const result = await pool.query(query);
        return result.rows;
    },

    async login(email, password) {
        const query = `
            SELECT id, name, email, role, tenant_id 
            FROM users 
            WHERE email = $1 
            AND password_hash = crypt($2, password_hash);
        `;
        const result = await pool.query(query, [email, password]);
        return result.rows[0];
    },

    async findById(id) {
        const query = `SELECT id, name, role FROM users WHERE id = $1 LIMIT 1`;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    },

    async findByIdWithEmail(id) {
        const query = `SELECT id, name, email FROM users WHERE id = $1 LIMIT 1`;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    },
    
    async update(id, data) {
        const query = `
            UPDATE users 
            SET name = COALESCE($1, name), 
                avatar_url = COALESCE($2, avatar_url),
                bio = COALESCE($3, bio)
            WHERE id = $4
            RETURNING id, name, email, role, avatar_url, bio;
        `;
        const result = await pool.query(query, [data.name, data.avatarUrl, data.bio, id]);
        return result.rows[0];
    },

    async create(user) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const tenantQuery = 'SELECT id FROM tenants LIMIT 1';
            const tResult = await client.query(tenantQuery);
            const tenantId = tResult.rows[0].id;

            const insertUserQuery = `
                INSERT INTO users (tenant_id, name, email, phone, role, password_hash)
                VALUES ($1, $2, $3, $4, $5, crypt($6, gen_salt('bf')))
                RETURNING id, name, email, role;
            `;
            const userValues = [tenantId, user.name, user.email, user.phone, user.role || 'CLIENT', user.password];
            const userResult = await client.query(insertUserQuery, userValues);
            const newUser = userResult.rows[0];

            if (newUser.role === 'BARBER') {
                
                const ownerScheduleQuery = `
                    SELECT day_of_week, start_time, end_time 
                    FROM availability 
                    WHERE barber_id IN (SELECT id FROM users WHERE role = 'OWNER' LIMIT 1)
                `;
                const ownerSchedule = await client.query(ownerScheduleQuery);

                let scheduleToCopy = ownerSchedule.rows;

                if (scheduleToCopy.length === 0) {
                    scheduleToCopy = [
                        { day_of_week: 1, start_time: '09:00', end_time: '18:00' },
                        { day_of_week: 2, start_time: '09:00', end_time: '18:00' },
                        { day_of_week: 3, start_time: '09:00', end_time: '18:00' },
                        { day_of_week: 4, start_time: '09:00', end_time: '18:00' },
                        { day_of_week: 5, start_time: '09:00', end_time: '18:00' },
                        { day_of_week: 6, start_time: '09:00', end_time: '14:00' }
                    ];
                }

                for (const item of scheduleToCopy) {
                    await client.query(
                        `INSERT INTO availability (barber_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4)`,
                        [newUser.id, item.day_of_week, item.start_time, item.end_time]
                    );
                }
            }

            await client.query('COMMIT');
            return newUser;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    async getAvailability(barberId) {
        const query = `SELECT day_of_week, start_time, end_time FROM availability WHERE barber_id = $1`;
        const result = await pool.query(query, [barberId]);
        return result.rows;
    },

    async getAvailabilityOverrides(barberId) {
        const query = `SELECT id, specific_date, is_closed, start_time, end_time FROM availability_overrides WHERE barber_id = $1 ORDER BY specific_date DESC`;
        const result = await pool.query(query, [barberId]);
        return result.rows;
    },

    async createAvailabilityOverride(barberId, override) {
        const query = `INSERT INTO availability_overrides (barber_id, specific_date, is_closed, start_time, end_time) VALUES ($1, $2, $3, $4, $5) RETURNING id, specific_date, is_closed, start_time, end_time`;
        const values = [barberId, override.specific_date, override.is_closed || false, override.start_time || null, override.end_time || null];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async deleteAvailabilityOverride(overrideId) {
        const query = `DELETE FROM availability_overrides WHERE id = $1`;
        await pool.query(query, [overrideId]);
        return { message: 'Exceção removida' };
    },

    async updateAvailability(barberId, schedule) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM availability WHERE barber_id = $1', [barberId]);

            for (const item of schedule) {
                const query = `INSERT INTO availability (barber_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4)`;
                await client.query(query, [barberId, item.day, item.start, item.end]);
            }
            await client.query('COMMIT');
            return { message: 'Horários atualizados!' };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
};

module.exports = UserModel;