const { MercadoPagoConfig, Payment } = require('mercadopago');
require('dotenv').config();

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

const PaymentController = {
    async gerarPix(req, res) {
        console.log(">>> [PaymentController] Iniciando Pix...");
        console.log(">>> [PaymentController] Body:", req.body);

        try {
            const { transaction_amount, description, payer_email, payer_first_name, payer_cpf } = req.body;

            if (!transaction_amount || Number(transaction_amount) <= 0) {
                throw new Error("O valor da transação deve ser maior que zero.");
            }

            const payment = new Payment(client);

            const cpfFinal = payer_cpf || '19119119100';

            const emailSeguro = (payer_email && payer_email.includes('@')) 
                ? payer_email 
                : 'cliente_visitante@barberflow.com';

            const body = {
                transaction_amount: Number(transaction_amount),
                description: description || 'Serviço BarberFlow',
                payment_method_id: 'pix',
                payer: {
                    email: emailSeguro,
                    first_name: payer_first_name || 'Cliente',
                    last_name: 'Visitante',
                    identification: {
                        type: 'CPF',
                        number: cpfFinal.replace(/\D/g, '') // Garante só números
                    }
                },
                notification_url: 'https://seu-site.com/webhook'
            };

            const requestOptions = { idempotencyKey: `pix_${Date.now()}` };

            console.log(">>> Enviando para Mercado Pago com CPF:", body.payer.identification.number);

            const result = await payment.create({ body, requestOptions });

            return res.status(200).json({
                id: result.id,
                status: result.status,
                qr_code: result.point_of_interaction.transaction_data.qr_code,
                qr_code_base64: result.point_of_interaction.transaction_data.qr_code_base64,
                ticket_url: result.point_of_interaction.transaction_data.ticket_url
            });

        } catch (error) {
            console.error(">>> ERRO PIX:", error);
            
            let errorMessage = error.message || 'Erro desconhecido';
            if (error.cause && Array.isArray(error.cause)) {
                errorMessage = error.cause[0]?.description || errorMessage;
            }

            return res.status(400).json({ error: errorMessage });
        }
    }
};

module.exports = PaymentController;