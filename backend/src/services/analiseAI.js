import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { initializeApp } from "firebase/app";
import { db } from "../config/firebase.js";
import { areas, tipos, treinarModelo, preverPontuacao } from "../ml/modelo.cjs";

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

// Função principal de análise com aprendizado contínuo
export async function runDecisionAnalysis(decisao) {

  // 2️⃣ Obtém pontuação prevista pelo ML
  let resultadoML = { pontuacao: null, recomendacao: null, justificativa: null };
  try {
    // 1️⃣ Atualiza o modelo ML com o histórico mais recente
    const modelo = await treinarModelo();
    if (!modelo || !modelo.predict) throw new Error('Modelo ML inválido');
    const pontuacaoPrevista = await preverPontuacao(decisao, modelo);
    resultadoML.pontuacao = Math.round(pontuacaoPrevista);
    resultadoML.recomendacao = pontuacaoPrevista >= 70 ? "Aprovar" : pontuacaoPrevista >= 40 ? "Revisar" : "Rejeitar";
    resultadoML.justificativa = `Pontuação prevista pelo modelo ML: ${resultadoML.pontuacao}`;
  } catch (mlErr) {
    console.error("Erro ao gerar pontuação ML:", mlErr.message);
    resultadoML = {
      pontuacao: 50,
      recomendacao: "Revisar",
      justificativa: "Erro no cálculo da ML"
    };
  }

  const areaIndex = areas[decisao.area] ?? -1;
  const tipoIndex = tipos[decisao.tipo] ?? -1;

  // 3️⃣ Gera análise da IA baseada no prompt + sugestão do ML
  const prompt = `Analise a decisão abaixo e retorne um JSON com os seguintes campos:
{
  "pontuacao": número de 0 a 100 representando a eficiência da decisão,
  "riscos": lista de riscos principais,
  "recomendacao": "Aprovar", "Revisar" ou "Rejeitar",
  "justificativa": texto curto explicando o motivo da recomendação
}
Informações estruturadas:
- Área (índice): ${areaIndex} (${decisao.area})
- Tipo (índice): ${tipoIndex} (${decisao.tipo})
- Custos previstos: ${decisao.impacto_previsto?.custos || "não informado"}
- Lucro estimado: ${decisao.impacto_previsto?.lucro_estimado || "não informado"}
- Prazos: ${decisao.impacto_previsto?.prazos || "não informado"}
- Produtividade: ${decisao.impacto_previsto?.produtividade || "não informado"}
- Título: ${decisao.titulo}
- Descrição: ${decisao.descricao || "Sem descrição"}

Sugestão do modelo Machine Learning:
- Recomendação: ${resultadoML.recomendacao}
- Pontuação: ${resultadoML.pontuacao}
- Justificativa: ${resultadoML.justificativa}
`;

  const result = await model.generateContent(prompt);
  const resposta = result.response;
  const text = resposta.text();
  console.log(text);

  let parsed;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (e) {
    console.error("Erro ao interpretar resposta da IA:", e);
  }

  // 4️⃣ Cria objeto final combinando IA + ML
  const resultadoFinal = parsed
    ? { ...parsed, pontuacaoPrevistaML: resultadoML.pontuacao }
    : {
        pontuacao: 50,
        riscos: ["Não identificado"],
        recomendacao: "Revisar",
        justificativa: resposta,
        pontuacaoPrevistaML: resultadoML.pontuacao,
      };

  // 5️⃣ Atualiza histórico de análises para aprendizado contínuo
  try {
    await db.collection('historico_analises').add({
      area: decisao.area,
      tipo: decisao.tipo,
      custos: decisao.impacto_previsto?.custos || null,
      lucro_estimado: decisao.impacto_previsto?.lucro_estimado || null,
      prazos: decisao.impacto_previsto?.prazos || null,
      produtividade: decisao.impacto_previsto?.produtividade || null,
      pontuacao: resultadoFinal.pontuacao,
      recomendacao: resultadoFinal.recomendacao,
      justificativa: resultadoFinal.justificativa,
      criado_em: new Date().toISOString()
    });
  } catch (e) {
    console.error("Erro ao salvar histórico ML:", e);
  }

  return resultadoFinal;
}
