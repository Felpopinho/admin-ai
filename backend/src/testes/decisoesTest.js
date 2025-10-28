import { runDecisionAnalysis } from "../services/analiseAI.js";

async function testarDecisoes() {
  // Lista de decisões de teste
  const decisoes = [
    {
      id: "d1",
      titulo: "Comprar novos equipamentos",
      descricao: "Atualizar máquinas da linha de produção",
      area: "operacoes",
      tipo: "operacional",
      impacto_previsto: { custos: 20000, lucro_estimado: 5000, prazos: 30, produtividade: 10 }
    },
    {
      id: "d2",
      titulo: "Campanha de marketing online",
      descricao: "Aumentar presença digital",
      area: "marketing",
      tipo: "marketing",
      impacto_previsto: { custos: 5000, lucro_estimado: 15000, prazos: 15, produtividade: 0 }
    },
    {
      id: "d3",
      titulo: "Contratar novos funcionários",
      descricao: "Expandir equipe de vendas",
      area: "rh",
      tipo: "pessoal",
      impacto_previsto: { custos: 10000, lucro_estimado: 0, prazos: 60, produtividade: 5 }
    },
    {
      id: "d4",
      titulo: "Desenvolver produto inovador",
      descricao: "Investir em P&D para nova linha de produtos",
      area: "p&d",
      tipo: "inovacao",
      impacto_previsto: { custos: 50000, lucro_estimado: 20000, prazos: 90, produtividade: 15 }
    }
  ];

  for (const decisao of decisoes) {
    console.log(`\n=== Analisando decisão: ${decisao.titulo} ===`);
    const resultado = await runDecisionAnalysis(decisao, decisao.id);
    console.log("Resultado final:", resultado);
  }

  console.log("\nTeste finalizado! Todas as decisões foram processadas e adicionadas ao histórico.");
}

testarDecisoes();
