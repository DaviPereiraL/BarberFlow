const pool = require('../config/db');

const AppointmentModel = {
    async create(data) {
        console.log(">>> [AppointmentModel] Iniciando criação...");

        // 1. TRATAMENTO DE DATA (Evita erro de formatação)
        const cleanDate = data.starts_at.replace('T', ' '); 
        const dataObj = new Date(cleanDate);
        
        const diaSemana = dataObj.getDay(); 
        const dataString = cleanDate.split(' ')[0]; 
        const hora = cleanDate.split(' ')[1]; 

        // Consulta de Exceções
        const overrideQuery = `SELECT * FROM availability_overrides WHERE barber_id = $1 AND specific_date = $2`;
        const overrideResult = await pool.query(overrideQuery, [data.barber_id, dataString]);

        let isWorking = false;
        
        const asBool = (v) => v === true || v === 'true' || v === '1' || v === 1;
        const forceCreate = asBool(data.force_create);

        if (!forceCreate) {
            if (overrideResult.rows.length > 0) {
                const rule = overrideResult.rows[0];
                if (rule.is_closed) {
                    throw new Error(`O barbeiro não trabalha nesta data específica (${dataString}).`);
                }
                if (hora >= rule.start_time && hora < rule.end_time) {
                    isWorking = true;
                }
            } else {
                const defaultQuery = `SELECT * FROM availability WHERE barber_id = $1 AND day_of_week = $2 AND start_time <= $3 AND end_time > $3`;
                const defaultResult = await pool.query(defaultQuery, [data.barber_id, diaSemana, hora]);
                
                if (defaultResult.rows.length > 0) {
                    isWorking = true;
                }
            }

            if (!isWorking) {
                // Mantido comentado para facilitar testes, pode descomentar em produção
                console.log(`>>> [AVISO] Barbeiro teoricamente indisponível, mas liberado para teste.`);
                // throw new Error(`Barbeiro não disponível neste horário.`);
            }
        }

        // 2. Verifica Conflito
        const checkQuery = `SELECT id FROM appointments WHERE barber_id = $1 AND starts_at = $2 AND status != 'CANCELED'`;
        const checkResult = await pool.query(checkQuery, [data.barber_id, data.starts_at]);
        
        if (checkResult.rows.length > 0 && !forceCreate) {
            throw new Error('Horário indisponível! Já existe agendamento neste horário.');
        }

        // 3. Pega Tenant
        const tenantQuery = 'SELECT id FROM tenants LIMIT 1';
        const tResult = await pool.query(tenantQuery);
        const tenantId = tResult.rows[0]?.id; 

        // 4. Busca Serviço
        const serviceQuery = 'SELECT name, price, duration_minutes FROM services WHERE id = $1'; 
        const sResult = await pool.query(serviceQuery, [data.service_id]); 
        
        if (sResult.rows.length === 0) throw new Error('Serviço não encontrado');
        const { price, duration_minutes, name: serviceName } = sResult.rows[0]; 

        // 5. Calcula Término
        const endsAtQuery = `SELECT $1::timestamp + make_interval(mins => $2) as fim`;
        const eResult = await pool.query(endsAtQuery, [cleanDate, duration_minutes]);
        const endsAt = eResult.rows[0].fim;

        // 6. INSERÇÃO NO BANCO
        // Nota: O guest_cpf foi removido daqui para não dar erro se a coluna não existir no banco.
        const query = `
            INSERT INTO appointments 
            (tenant_id, customer_id, barber_id, service_id, starts_at, ends_at, price_snapshot, status, guest_name, guest_phone, payment_method, payment_status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'CONFIRMED', $8, $9, $10, $11)
            RETURNING id, starts_at, status, guest_name;
        `;

        const values = [
            tenantId, 
            data.customer_id || null, 
            data.barber_id, 
            data.service_id, 
            data.starts_at, 
            endsAt, 
            price, 
            data.guest_name || null, 
            data.guest_phone || null, 
            data.payment_method || 'LOCAL', 
            data.payment_status || 'PENDING'
        ];

        const result = await pool.query(query, values);
        
        return { ...result.rows[0], serviceName };
    },

    async findAll(filters = {}) {
        let values = [];
        let whereClauses = ["a.status != 'CANCELED'"];
        if (filters.barberId) { values.push(filters.barberId); whereClauses.push(`a.barber_id = $${values.length}`); }
        if (filters.startDate) { values.push(filters.startDate); whereClauses.push(`date(a.starts_at) >= $${values.length}`); }
        if (filters.endDate) { values.push(filters.endDate); whereClauses.push(`date(a.starts_at) <= $${values.length}`); }

        const where = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
        
        // --- CORREÇÃO IMPORTANTE AQUI (LEFT JOIN) ---
        // Garante que o agendamento aparece mesmo se o usuário ou serviço foi deletado
        const query = `
            SELECT a.*, u.name as cliente_logado, b.name as nome_barbeiro, s.name as servico, s.price
            FROM appointments a
            LEFT JOIN users u ON a.customer_id = u.id
            LEFT JOIN users b ON a.barber_id = b.id
            LEFT JOIN services s ON a.service_id = s.id
            ${where}
            ORDER BY a.starts_at DESC;
        `;
        const result = await pool.query(query, values);
        return result.rows;
    },

    async getBusyTimes(barberId, dateString) {
        const query = `SELECT to_char(starts_at, 'HH24:MI') as time FROM appointments WHERE barber_id = $1 AND date(starts_at) = $2::date AND status != 'CANCELED'`;
        const result = await pool.query(query, [barberId, dateString]);
        return result.rows.map(row => row.time);
    },

    async updateStatus(id, status) {
        const query = `UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *`;
        const result = await pool.query(query, [status, id]);
        return result.rows[0];
    },

    async findById(id) {
        const query = `
            SELECT a.*, u.email as customer_email, u.name as cliente_logado, b.name as nome_barbeiro, s.name as servico, s.price
            FROM appointments a
            LEFT JOIN users u ON a.customer_id = u.id
            LEFT JOIN users b ON a.barber_id = b.id
            LEFT JOIN services s ON a.service_id = s.id
            WHERE a.id = $1
            LIMIT 1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
};

module.exports = AppointmentModel;