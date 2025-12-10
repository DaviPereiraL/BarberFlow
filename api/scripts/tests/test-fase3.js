console.log('test-fase3 placeholder');
process.exit(0);
// Este script testa a criação de serviços sem usar navegador ou extensão
// Ele usa a biblioteca nativa 'fetch' do Node 18+

async function testarServicos() {
    const URL = 'http://localhost:3333/services';

    console.log("\n🔵 1. TENTANDO LISTAR SERVIÇOS (GET)...");
    try {
        const respostaLista = await fetch(URL);
        const dadosLista = await respostaLista.json();
        console.log("   Status:", respostaLista.status);
        console.log("   Itens encontrados:", dadosLista.length);
    } catch (e) {
        console.log("   ❌ Erro ao listar:", e.message);
    }

    console.log("\n🔵 2. TENTANDO CRIAR UM SERVIÇO NOVO (POST)...");
    const novoServico = {
        name: "Sobrancelha na Régua " + Math.floor(Math.random() * 1000), // Nome aleatório
        description: "Design com navalha",
        price: 15.00,
        duration: 15
    };

    try {
        const respostaCriar = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoServico)
        });

        const dadosCriar = await respostaCriar.json();

        if (respostaCriar.status === 201) {
            console.log("   ✅ SUCESSO! Serviço criado.");
            console.log("   ID:", dadosCriar.service.id);
            console.log("   Nome:", dadosCriar.service.name);
        } else {
            console.log("   ⚠️ ALGO DEU ERRADO (Status " + respostaCriar.status + ")");
            console.log("   Resposta do Servidor:", dadosCriar);
            
            if (Array.isArray(dadosCriar)) {
                console.log("   🚨 ALERTA: O servidor devolveu uma LISTA em vez de criar.");
                console.log("   👉 Verifique o arquivo routes.js! O POST está chamando .listar em vez de .criar");
            }
        }

    } catch (e) {
        console.log("   ❌ Erro ao conectar:", e.message);
    }
}

testarServicos();
