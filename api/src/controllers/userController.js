const UserModel = require('../models/userModel');
const jwt = require('jsonwebtoken');

const UserController = {
    async listarTodos(req, res) {
        try {
            const users = await UserModel.findAll();
            return res.json(users);
        } catch (error) { return res.status(500).json({ error: 'Erro no servidor' }); }
    },

    async criarUsuario(req, res) {
        try {
            const { name, email, phone, password, role } = req.body; 

            if (!name || !email || !password) return res.status(400).json({ error: 'Dados incompletos' });
            if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres.' });
            const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
            if (!emailRegex.test(email)) return res.status(400).json({ error: 'Email inválido.' });
            if (phone && !/^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/.test(phone)) return res.status(400).json({ error: 'Telefone inválido.' });

            const novoUsuario = await UserModel.create({ name, email, phone, password, role });

            const token = jwt.sign(
                { id: novoUsuario.id, role: novoUsuario.role },
                process.env.JWT_SECRET || 'segredo',
                { expiresIn: '30d' }
            );

            return res.status(201).json({ message: 'Usuário criado!', token: token, user: novoUsuario });
        } catch (error) {
            if (error.code === '23505') return res.status(400).json({ error: 'Email já existe.' });
            return res.status(500).json({ error: 'Erro ao criar' });
        }
    },

    async fazerLogin(req, res) {
        try {
            const { email, password } = req.body;
            const usuario = await UserModel.login(email, password);
            if (!usuario) return res.status(401).json({ error: 'Email ou senha incorretos' });

            const token = jwt.sign(
                { id: usuario.id, role: usuario.role },
                process.env.JWT_SECRET || 'segredo-padrao',
                { expiresIn: '30d' }
            );

            return res.json({
                message: 'Login realizado!',
                token: token,
                user: { id: usuario.id, name: usuario.name, email: usuario.email, role: usuario.role }
            });
        } catch (error) { return res.status(500).json({ error: 'Erro no login' }); }
    },
    
    async editarUsuario(req, res) {
        try {
            const { id } = req.params;
            const { name, avatarUrl, bio } = req.body;
            const atualizado = await UserModel.update(id, { name, avatarUrl, bio });
            return res.json({ message: 'Perfil atualizado!', user: atualizado });
        } catch (error) { return res.status(500).json({ error: 'Erro ao atualizar perfil' }); }
    },
 
    async buscarHorarios(req, res) {
        try {
            const { id } = req.params;
            const horarios = await UserModel.getAvailability(id);
            return res.json(horarios);
        } catch (error) { return res.status(500).json({ error: 'Erro ao buscar horários' }); }
    },

    async atualizarHorarios(req, res) {
        try {
            const { id } = req.params;
            const { schedule } = req.body; 
            await UserModel.updateAvailability(id, schedule);
            return res.json({ message: 'Agenda atualizada!' });
        } catch (error) { return res.status(500).json({ error: 'Erro ao salvar horários' }); }
    },

    async getOverrides(req, res) {
        try {
            const { id } = req.params;
            const overrides = await UserModel.getAvailabilityOverrides(id);
            return res.json(overrides);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao buscar exceções' });
        }
    },

    async createOverride(req, res) {
        try {
            const { id } = req.params;
            const { specific_date, is_closed, start_time, end_time } = req.body;
            const result = await UserModel.createAvailabilityOverride(id, { specific_date, is_closed, start_time, end_time });
            return res.status(201).json(result);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao criar exceção' });
        }
    },

    async deleteOverride(req, res) {
        try {
            const { overrideId } = req.params;
            await UserModel.deleteAvailabilityOverride(overrideId);
            return res.json({ message: 'Exceção removida' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao remover exceção' });
        }
    }
};

module.exports = UserController;