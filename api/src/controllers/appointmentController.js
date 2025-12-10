const AppointmentModel = require('../models/appointmentModel');
const EmailService = require('../services/emailService');
const UserModel = require('../models/userModel');

const AppointmentController = {
    async criar(req, res) {
        console.log(">>> [AppointmentController] Recebendo pedido de agendamento:", req.body); // LOG NOVO

        try {
            // Agora desestruturamos o guest_cpf também
            const { service_id, barber_id, starts_at, customer_id, guest_name, guest_phone, guest_email, payment_method, status, guest_cpf } = req.body;

            // Validação detalhada (Para você saber QUAL campo falta)
            if (!service_id) return res.status(400).json({ error: 'Falta o ID do Serviço (service_id).' });
            if (!barber_id) return res.status(400).json({ error: 'Falta o ID do Barbeiro (barber_id).' });
            if (!starts_at) return res.status(400).json({ error: 'Falta o Horário (starts_at).' });

            const now = new Date();
            const startDate = new Date(starts_at);
            if (startDate < now) {
                return res.status(400).json({ error: 'Não é permitido agendar para o passado.' });
            }

            if (!customer_id && (!guest_name || !guest_phone)) {
                return res.status(400).json({ error: 'Identificação obrigatória (Nome e Telefone).' });
            }
            
            // Criação no Banco
            // Se o seu AppointmentModel não aceita campos extras, filtraremos aqui
            const payload = {
                service_id, 
                barber_id, 
                starts_at, 
                customer_id, 
                guest_name, 
                guest_phone, 
                guest_email, 
                payment_method, 
                status,
                guest_cpf // Adicionamos o CPF aqui para salvar se o Model aceitar
            };

            const agendamento = await AppointmentModel.create(payload);
            
            // Envio de E-mail (Opcional)
            if (guest_email) {
                const dataObj = new Date(starts_at);
                const dataFormatada = dataObj.toLocaleDateString('pt-BR');
                const horaFormatada = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const nomeCliente = guest_name || 'Cliente';
                
                EmailService.sendConfirmation(guest_email, nomeCliente, dataFormatada, horaFormatada, agendamento.serviceName || 'Serviço')
                    .catch(err => console.error("Falha ao enviar email:", err));
            }

            return res.status(201).json({ message: 'Agendado com sucesso!', data: agendamento });

        } catch (error) {
            console.error(">>> ERRO AO CRIAR AGENDAMENTO:", error);
            return res.status(500).json({ error: error.message || 'Erro interno ao salvar agendamento.' });
        }
    },

    async listar(req, res) {
        try {
            const lista = await AppointmentModel.findAll();
            return res.json(lista);
        } catch (error) { return res.status(500).json({ error: 'Erro ao buscar agenda' }); }
    },

    async checkAvailability(req, res) {
        try {
            const { barberId, date } = req.query;
            if (!barberId || !date) return res.status(400).json({ error: 'Dados faltando para checar disponibilidade.' });
            const busyTimes = await AppointmentModel.getBusyTimes(barberId, date);
            return res.json(busyTimes);
        } catch (error) { return res.status(500).json({ error: 'Erro ao checar horários' }); }
    },

    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!['CANCELED', 'COMPLETED', 'CONFIRMED'].includes(status)) {
                return res.status(400).json({ error: 'Status inválido' });
            }
            const updated = await AppointmentModel.updateStatus(id, status);
            
            if (status === 'CANCELED') {
                try {
                    const appt = await AppointmentModel.findById(id);
                    if (appt) {
                        const toEmail = appt.guest_email || appt.customer_email || null;
                        const name = appt.guest_name || appt.cliente_logado || 'Cliente';
                        if (toEmail) {
                            const dateObj = new Date(appt.starts_at);
                            const dateFormatted = dateObj.toLocaleDateString('pt-BR');
                            const timeFormatted = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
                            EmailService.sendCancellation(toEmail, name, dateFormatted, timeFormatted, appt.servico || 'Serviço')
                                .catch(err => console.error('Erro enviando email de cancelamento:', err));
                        }
                    }
                } catch (e) {
                    console.error('Erro ao buscar agendamento para notificação de cancelamento:', e.message);
                }
            }
            return res.json(updated);
        } catch (error) { return res.status(500).json({ error: 'Erro ao atualizar' }); }
    }
};

module.exports = AppointmentController;