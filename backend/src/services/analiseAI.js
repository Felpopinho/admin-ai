import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDNITA081TuIkFvHsd_zsH0aOPtzO8BUGk",
  authDomain: "admin-ai-fd783.firebaseapp.com",
  projectId: "admin-ai-fd783",
  storageBucket: "admin-ai-fd783.firebasestorage.app",
  messagingSenderId: "338940027519",
  appId: "1:338940027519:web:b012705e0fd8e49f54954a",
  measurementId: "G-D1PZR10YB2"
};

const firebaseApp = initializeApp(firebaseConfig);

const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });

export async function runDecisionAnalysis(decisao) {
  const prompt = `Analise a decisão abaixo e retorne um JSON com os seguintes campos:
    {
      "pontuacao": número de 0 a 100 representando a eficiência da decisão,
      "riscos": lista de riscos principais,
      "recomendacao": "Aprovar", "Revisar" ou "Rejeitar",
      "justificativa": texto curto explicando o motivo da recomendação
    }
    Area da decisão: "${decisao.area}"
    Tipo de decisão: "${decisao.tipo}"
    Lista de impactos previstos:
        - "${decisao.impacto_previsto?.custos || "Sem custos"}"
        - "${decisao.impacto_previsto?.lucro_estimado || "Sem lucro estimado"}"
        - "${decisao.impacto_previsto?.prazos || "Sem prazos"}"
        - "${decisao.impacto_previsto?.produtividade || "Sem produtividade"}"
    Título: "${decisao.titulo}"
    Descrição: "${decisao.descricao || "Sem descrição"}"
  `;

  const result = await model.generateContent(prompt);
  const resposta = result.response;
  const text = resposta.text()
  console.log(text)

  try {
    // Extrai JSON retornado pela IA
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    return (
      parsed || {
        pontuacao: 50,
        riscos: ["Não identificado"],
        recomendacao: "Revisar",
        justificativa: resposta,
      }
    );
  } catch (e) {
    console.error("Erro ao interpretar resposta da IA:", e);
    return {
      pontuacao: 50,
      riscos: ["Erro de interpretação"],
      recomendacao: "Revisar",
      justificativa: resposta,
    };
  }
}