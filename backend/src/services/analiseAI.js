import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID,
  measurementId: process.env.MEASUREMENT_ID
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