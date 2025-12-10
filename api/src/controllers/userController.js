const UserModel = require('../models/userModel');
const bcrypt = require('bcryptjs'); // Se não tiver bcryptjs, instale: npm install bcryptjs jsonwebtoken
const jwt = require('jsonwebtoken');

const UserController = {
    // 1. Criar Usuário
    async create(req, res) {
        try {
            const user = await UserModel.create(req.body);
            return res.status(201).json(user);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },

    // 2. Login (A função que provavelmente estava faltando)
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await UserModel.findByEmail(email);
            
            if (!user) return res.status(400).json({ error: 'Usuário não encontrado' });

            // Comparação simples (em produção use bcrypt.compare)
            // Se você já usa bcrypt no model, ajuste aqui.
            if (user.password !== password) { 
                return res.status(401).json({ error: 'Senha incorreta' });
            }

            // Gera token simples para teste (ou use JWT se tiver configurado)
            const token = 'token-falso-de-teste-123'; 
            
            return res.json({ user, token });
        } catch (error) {
            return res.status(500).json({ error: 'Erro no login' });
        }
    },

    // 3. Listar todos
    async index(req, res) {
        try {
            const users = await UserModel.findAll();
            return res.json(users);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao listar usuários' });
        }
    },

    // 4. Atualizar
    async update(req, res) {
        try {
            const { id } = req.params;
            const updated = await UserModel.update(id, req.body);
            return res.json(updated);
        } catch (error) {
            return res.status(400).json({ error: 'Erro ao atualizar' });
        }
    },

    // 5. Pegar Horários (Schedule)
    async getSchedule(req, res) {
        try {
            const { id } = req.params;
            const schedule = await UserModel.getSchedule(id);
            return res.json(schedule);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar horários' });
        }
    },

    // 6. Atualizar Horários
    async updateSchedule(req, res) {
        try {
            const { id } = req.params;
            await UserModel.updateSchedule(id, req.body);
            return res.json({ message: 'Horários atualizados' });
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao salvar horários' });
        }
    }
};

module.exports = UserController;