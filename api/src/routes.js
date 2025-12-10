const { Router } = require('express');
const UserController = require('./controllers/userController');
const ServiceController = require('./controllers/serviceController');
const AppointmentController = require('./controllers/appointmentController');
const PaymentController = require('./controllers/paymentController'); 
const AuthMiddleware = require('./middlewares/auth'); // Se tiver middleware de auth

const routes = Router();

// --- ROTA DE TESTE (MUDADA PARA /status) ---
// Antes estava '/', e isso bloqueava o site. Agora não bloqueia mais.
routes.get('/status', (req, res) => {
    return res.json({ message: "API BarberFlow está Online!", timestamp: new Date() });
});

// --- USUÁRIOS ---
routes.post('/users', UserController.create);
routes.post('/login', UserController.login);
routes.get('/users', UserController.index); // Listar todos (Ideal proteger com Auth)
routes.get('/users/:id/schedule', UserController.getSchedule); // Pega horários do barbeiro
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
// Se você criou o PaymentController como te mandei antes
if (PaymentController) {
    routes.post('/payments/pix', PaymentController.gerarPix);
}

// --- NOTIFICAÇÕES (Se tiver implementado) ---
// routes.get('/notifications', ...);

module.exports = routes;