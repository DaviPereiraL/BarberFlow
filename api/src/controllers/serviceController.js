const ServiceModel = require('../models/serviceModel'); // Certifique-se que o Model existe

const ServiceController = {
    async create(req, res) {
        try {
            const service = await ServiceModel.create(req.body);
            return res.status(201).json(service);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },

    async index(req, res) {
        try {
            const services = await ServiceModel.findAll();
            return res.json(services);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar serviços' });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            await ServiceModel.delete(id);
            return res.status(204).send();
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao deletar serviço' });
        }
    }
};

module.exports = ServiceController;