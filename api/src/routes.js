const { Router } = require('express');
const UserController = require('./controllers/userController');
const ServiceController = require('./controllers/serviceController');
const AppointmentController = require('./controllers/appointmentController');
const PaymentController = require('./controllers/paymentController'); 

// REMOVI A LINHA DO AUTH MIDDLEWARE QUE ESTAVA DANDO ERRO

const routes = Router();

// --- STATUS DA API ---
routes.get('/status', (req, res) => {
    return res.json({ message: "API BarberFlow está Online!", timestamp: new Date() });
});

// --- USUÁRIOS ---
routes.post('/users', UserController.create);
routes.post('/login', UserController.login);
routes.get('/users', UserController.index);
routes.get('/users/:id/schedule', UserController.getSchedule);
routes.put('/users/:id', UserController.update);
routes.put('/users/:id/schedule', UserController.updateSchedule);

// --- SERVIÇOS ---
routes.post('/services', ServiceController.create);
routes.get('/services', ServiceController.index);
routes.delete('/services/:id', ServiceController.delete);

// --- AGENDAMENTOS ---
routes.post('/appointments', AppointmentController.criar);
routes.get('/appointments', AppointmentController.listar);
routes.get('/appointments/availability', AppointmentController.checkAvailability);
routes.put('/appointments/:id/status', AppointmentController.updateStatus);

// --- PAGAMENTOS (PIX) ---
routes.post('/payments/pix', PaymentController.gerarPix);

module.exports = routes;