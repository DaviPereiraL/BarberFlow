const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

// 1. Banco de Dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// 2. App Express
const app = express();
app.use(express.json());
app.use(cors());

console.log("🛠️ MODO DE DEPURAÇÃO INICIADO NA PORTA 3344");

// 3. Rota ESPECIAL de Cadastro (POST)
app.post('/teste-criar', async (req, res) => {
    console.log(">> CHEGOU UMA REQUISIÇÃO POST!");
    console.log(">> Dados recebidos:", req.body);

    try {
        const { name, email, phone, password } = req.body;

        // ID fixo da barbearia (do seu banco)
        const tenantId = '11111111-1111-1111-1111-111111111111';

        const query = `
            INSERT INTO users (tenant_id, name, email, phone, role, password_hash)
            VALUES ($1, $2, $3, $4, 'CLIENT', crypt($5, gen_salt('bf')))
            RETURNING id, name, email;
        `;

        const values = [tenantId, name, email, phone, password];
        const result = await pool.query(query, values);

        console.log(">> SUCESSO! Usuário criado:", result.rows[0]);
        
        return res.status(201).json({
            message: "CRIADO COM SUCESSO NO DEBUG!",
            user: result.rows[0]
        });

    } catch (error) {
        console.error(">> ERRO:", error.message);
        return res.status(500).json({ erro: error.message });
    }
});

// 4. Rodar na porta 3344 (Diferente da oficial)
app.listen(3344, () => {
    console.log("🚨 Servidor de Debug rodando em: http://localhost:3344");
});