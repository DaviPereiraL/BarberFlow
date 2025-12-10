const NotificationModel = require('../models/notificationModel');

const NotificationController = {
    async getNotifications(req, res) {
        try {
            const { barberId } = req.query;
            const notifications = await NotificationModel.findAll(barberId);
            return res.json(notifications);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao buscar notificações' });
        }
    },

    async markSeen(req, res) {
        try {
            const { id } = req.params;
            await NotificationModel.markAsSeen(id);
            return res.json({ message: 'Lida' });
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao atualizar' });
        }
    }
};

module.exports = NotificationController;