const { MercadoPagoConfig, Payment } = require('mercadopago');
require('dotenv').config();

// Configura se tiver token, senão deixa null (evita crash se faltar variável)
const client = process.env.MP_ACCESS_TOKEN ? new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN }) : null;

const PaymentController = {
    async gerarPix(req, res) {
        try {
            if (!client) throw new Error("Token do Mercado Pago não configurado no .env");

            const { transaction_amount, description, payer_email, payer_first_name, payer_cpf } = req.body;

            const payment = new Payment(client);
            
            // CPF Genérico de Teste para evitar erro de validação
            const cpfFinal = payer_cpf ? payer_cpf.replace(/\D/g, '') : '19119119100';

            const body = {
                transaction_amount: Number(transaction_amount),
                description: description || 'Serviço BarberFlow',
                payment_method_id: 'pix',
                payer: {
                    email: payer_email || 'test@test.com',
                    first_name: payer_first_name || 'Cliente',
                    identification: { type: 'CPF', number: cpfFinal }
                }
            };

            const result = await payment.create({ body });
            
            return res.json({
                id: result.id,
                qr_code: result.point_of_interaction.transaction_data.qr_code,
                qr_code_base64: result.point_of_interaction.transaction_data.qr_code_base64
            });

        } catch (error) {
            console.error(error);
            return res.status(400).json({ error: error.message || 'Erro ao gerar PIX' });
        }
    }
};

module.exports = PaymentController;