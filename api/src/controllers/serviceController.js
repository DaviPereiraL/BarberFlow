const ServiceModel = require('../models/serviceModel');

const ServiceController = {
    async listar(req, res) {
        try {
            const services = await ServiceModel.findAll();
            return res.json(services);
        } catch (error) { return res.status(500).json({ error: 'Erro ao buscar serviços' }); }
    },

    async criar(req, res) {
        try {
            const { name, description, price, duration } = req.body;
            if (!name || !price || !duration) return res.status(400).json({ error: 'Dados incompletos' });
            const service = await ServiceModel.create({ name, description, price, duration });
            return res.status(201).json({ message: 'Serviço criado!', service });
        } catch (error) { return res.status(500).json({ error: 'Erro ao criar serviço' }); }
    },

    async atualizar(req, res) {
        try {
            const { id } = req.params;
            const updated = await ServiceModel.update(id, req.body);
            return res.json(updated);
        } catch (error) { return res.status(500).json({ error: 'Erro ao atualizar' }); }
    },

    async deletar(req, res) {
        try {
            await ServiceModel.delete(req.params.id);
            return res.json({ message: 'Deletado com sucesso' });
        } catch (error) { return res.status(500).json({ error: 'Erro ao deletar' }); }
    }
};

module.exports = ServiceController;