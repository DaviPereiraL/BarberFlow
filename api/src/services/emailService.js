const nodemailer = require('nodemailer');

const EmailService = {
    async sendConfirmation(toEmail, name, date, time, serviceName) {
        
        console.log("🔌 [Email] Iniciando configuração do transporte...");

        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        try {
            console.log("⏳ [Email] Testando senha e conexão com o Gmail...");
            await transporter.verify();
            console.log("✅ [Email] SUCESSO! O Gmail aceitou sua senha.");
        } catch (error) {
            console.error("❌ [Email] FALHA DE AUTENTICAÇÃO!");
            console.error("👉 Motivo:", error.message);
            console.error("👉 Dica: Verifique se a 'Senha de App' está correta e sem espaços.");
            return false;
        }

        try {
            console.log(`📨 [Email] Enviando mensagem para: ${toEmail}...`);
            
            const info = await transporter.sendMail({
                from: `"BarberFlow" <${process.env.EMAIL_USER || 'no-reply@barberflow.local'}>`,
                to: toEmail,
                subject: "✅ Agendamento Confirmado - BarberFlow",
                html: `
                    <div style="font-family: sans-serif; color: #333; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #f97316;">Olá, ${name}!</h2>
                        <p>O seu horário foi reservado com sucesso.</p>
                        <hr style="border: 0; border-top: 1px solid #eee;">
                        <p><strong>✂️ Serviço:</strong> ${serviceName}</p>
                        <p><strong>📅 Data:</strong> ${date}</p>
                        <p><strong>⏰ Horário:</strong> ${time}</p>
                        <hr style="border: 0; border-top: 1px solid #eee;">
                        <p style="font-size: 12px; color: #777;">BarberFlow - O seu estilo em dia.</p>
                    </div>
                `,
            });

            console.log("🚀 [Email] E-mail enviado! ID:", info.messageId);
            return true;

        } catch (error) {
            console.error("❌ [Email] Erro durante o envio:", error);
            return false;
        }
    }
    ,
        async sendCancellation(toEmail, name, date, time, serviceName) {
            console.log("🔌 [Email] Preparando envio de cancelamento...");
            const transporter = nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE || 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            try {
                await transporter.verify();
            } catch (e) {
                console.error('❌ [Email] Falha de autenticação para envio de cancelamento:', e.message);
                return false;
            }

            try {
                const info = await transporter.sendMail({
                    from: `"BarberFlow" <${process.env.EMAIL_USER || 'no-reply@barberflow.local'}>`,
                    to: toEmail,
                    subject: "✖️ Agendamento Cancelado - BarberFlow",
                    html: `
                        <div style="font-family: sans-serif; color: #333; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                            <h2 style="color: #ef4444;">Olá, ${name}.</h2>
                            <p>O seu agendamento foi cancelado.</p>
                            <hr style="border: 0; border-top: 1px solid #eee;">
                            <p><strong>✂️ Serviço:</strong> ${serviceName}</p>
                            <p><strong>📅 Data:</strong> ${date}</p>
                            <p><strong>⏰ Horário:</strong> ${time}</p>
                            <hr style="border: 0; border-top: 1px solid #eee;">
                            <p style="font-size: 12px; color: #777;">Se precisar, reagende pelo app.</p>
                        </div>
                    `
                });
                console.log('🚀 [Email] Cancelamento enviado! ID:', info.messageId);
                return true;
            } catch (err) {
                console.error('❌ [Email] Erro ao enviar cancelamento:', err);
                return false;
            }
        }
};

module.exports = EmailService;