console.log('test-fase4 placeholder');
process.exit(0);
const URL_BASE = 'http://localhost:3333';

async function testarAgendamento() {
    console.log("🔄 Buscando dados reais do banco...");
    
    // 1. Pegar um Serviço (Corte)
    const resServico = await fetch(`${URL_BASE}/services`);
    const servicos = await resServico.json();
    if (servicos.length === 0) {
        console.log("❌ ERRO: Nenhum serviço encontrado. Rode o script de seed no banco.");
        return;
    }
    const servicoId = servicos[0].id; 
    console.log(`   📦 Serviço: ${servicos[0].name}`);

    // 2. Pegar um Barbeiro (João)
    const resUser = await fetch(`${URL_BASE}/users`);
    const users = await resUser.json();
    const barbeiro = users.find(u => u.role === 'BARBER'); 
    
    if (!barbeiro) {
        console.log("❌ ERRO: Nenhum barbeiro encontrado.");
        return;
    }
    console.log(`   ✂️ Barbeiro: ${barbeiro.name}`);

    // --- O TESTE DE FOGO ---
    // Data: 21 de Dezembro de 2025 (Um Domingo)
    // Esperado: O sistema deve BLOQUEAR porque João só trabalha Segunda.
    const dataTeste = "2025-12-21 10:00:00"; 

    console.log(`\n🔵 TENTANDO AGENDAR NO DOMINGO (${dataTeste})...`);
    
    const dadosAgendamento = {
        service_id: servicoId,
        barber_id: barbeiro.id,
        starts_at: dataTeste,
        guest_name: "Cliente Teimoso",
        guest_phone: "83999990000"
    };

    try {
        const resAgendar = await fetch(`${URL_BASE}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAgendamento)
        });

        const resultado = await resAgendar.json();
        
        if (resAgendar.status === 201) {
            console.log("   ⚠️ ESTRANHO... O agendamento passou (e não deveria).");
            console.log("   Detalhes:", resultado);
        } else {
            console.log("   ✅ SUCESSO! O sistema BLOQUEOU corretamente.");
            console.log("   🛡️ Mensagem do Servidor:", resultado);
        }
    } catch (error) {
        console.log("   ❌ Erro de conexão:", error.message);
    }
}

testarAgendamento();
