console.log('test-future-sunday placeholder');
process.exit(0);
const URL_BASE = 'http://localhost:3333';

(async function testarAgendamento() {
    console.log("🔄 Buscando dados reais do banco...");
    const resServico = await fetch(`${URL_BASE}/services`);
    const servicos = await resServico.json();
    const servicoId = servicos[0].id;
    const resUser = await fetch(`${URL_BASE}/users`);
    const users = await resUser.json();
    const barbeiro = users.find(u => u.role === 'BARBER');

    const dataTeste = "2030-01-06 10:00:00"; // Domingo? Let's calculate: 2030-01-06 is a Sunday

    console.log(`\n🔵 TENTANDO AGENDAR NO DOMINGO (${dataTeste})...`);
    const dadosAgendamento = {
        service_id: servicoId,
        barber_id: barbeiro.id,
        starts_at: dataTeste,
        guest_name: "Cliente Teste",
        guest_phone: "83999990000"
    };

    try {
        const resAgendar = await fetch(`${URL_BASE}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAgendamento)
        });

        const resultado = await resAgendar.json();
        console.log('Status:', resAgendar.status);
        console.log('Resultado:', resultado);

    } catch (error) { console.log('Erro de conexão:', error.message); }
})();
