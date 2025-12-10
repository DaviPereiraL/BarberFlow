const express = require('express');
const UserController = require('./controllers/userController');
const ServiceController = require('./controllers/serviceController');
const AppointmentController = require('./controllers/appointmentController');
const NotificationController = require('./controllers/notificationController');
// IMPORTANTE: Certifica-te que criaste o ficheiro paymentController.js na pasta controllers!
const PaymentController = require('./controllers/paymentController'); 

const router = express.Router();

router.get('/', (req, res) => res.json({ message: 'API BarberFlow Online!' }));

// --- USUÁRIOS ---
router.get('/users', UserController.listarTodos);
router.post('/users', UserController.criarUsuario);
router.post('/login', UserController.fazerLogin);
router.put('/users/:id', UserController.editarUsuario);
router.get('/users/:id/availability', UserController.buscarHorarios);
router.put('/users/:id/availability', UserController.atualizarHorarios);
router.get('/users/:id/availability/overrides', UserController.getOverrides);
router.post('/users/:id/availability/overrides', UserController.createOverride);
router.delete('/users/:id/availability/overrides/:overrideId', UserController.deleteOverride);

// --- SERVIÇOS ---
router.get('/services', ServiceController.listar);
router.post('/services', ServiceController.criar);
router.put('/services/:id', ServiceController.atualizar);
router.delete('/services/:id', ServiceController.deletar);

// --- AGENDAMENTOS ---
router.get('/appointments', AppointmentController.listar);
router.post('/appointments', AppointmentController.criar);
router.get('/availability', AppointmentController.checkAvailability);
router.patch('/appointments/:id', AppointmentController.updateStatus);

// --- NOTIFICAÇÕES ---
router.get('/notifications', NotificationController.getNotifications);
router.patch('/notifications/:id/seen', NotificationController.markSeen);

// --- PAGAMENTOS (NOVO) ---
router.post('/payments/pix', PaymentController.gerarPix);

module.exports = router;