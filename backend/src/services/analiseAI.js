import { spawn } from "child_process";
import { db } from "../config/firebase.js";
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

export async function runDecisionAnalysis(decisao, id) {
  let resultadoML;

  const snapshot = await db.collection('historico_analises').get();
  const historico = [];
  snapshot.forEach(doc => historico.push(doc.data()));

  try {
    resultadoML = await new Promise((resolve, reject) => {
      const python = spawn("python", ["./ml/modelo.py"]);

      const input = JSON.stringify({ decisao, historico });
      python.stdin.write(input);
      python.stdin.end();
      let data = "";
      
      python.stdout.on("data", chunk => {
        data += chunk.toString();
      });

      python.stderr.on("data", err => {
        console.error("Erro Python:", err.toString());
      });

      python.on("close", () => {
        if (!data) return reject("Python não retornou dados");
        try {
          const resultado = JSON.parse(data);
          resolve(resultado);
        } catch (e) {
          reject("Erro ao processar saída do Python: " + e.message);
        }
      });
    });
  } catch (e) {
    console.error("Erro ao gerar pontuação ML:", e);
    resultadoML = {
      pontuacao: 50,
      recomendacao: "Revisar",
      justificativa: "Erro ao calcular ML"
    };
  }

  // 2️⃣ Gera análise da IA baseada no prompt + sugestão do ML
  const areaIndex = decisao.area; // opcional: mapear índice se quiser
  const tipoIndex = decisao.tipo;

  const prompt = `Você é um assistente inteligente, especializado em analisar decisões empresariais. Avalie a decisão abaixo considerando:

- Área e tipo da decisão
- Custos, lucro estimado, prazos e produtividade
- Histórico de decisões anteriores (se houver)
- Sugestão do modelo de Machine Learning fornecida

Sua análise deve gerar um **JSON estruturado** com os seguintes campos:

{
  "pontuacao": número de 0 a 100 representando a eficiência da decisão,
  "riscos": lista de riscos principais e alertas sobre possíveis problemas,
  "recomendacao": "Aprovar", "Revisar" ou "Rejeitar",
  "pontuacaoPrevistaML": número fornecido pelo ML,
  "justificativa": texto explicando de forma clara o motivo da recomendação
}

### INFORMAÇÕES DA DECISÃO
- Área: ${decisao.area}
- Tipo: ${decisao.tipo}
- Custos previstos: ${decisao.impacto_previsto?.custos || "não informado"}
- Lucro estimado: ${decisao.impacto_previsto?.lucro_estimado || "não informado"}
- Prazos: ${decisao.impacto_previsto?.prazos || "não informado"}
- Produtividade: ${decisao.impacto_previsto?.produtividade || "não informado"} (Numero decimal onde 1 é a produtividade atual, logo 1.2 seria equivalente a 20% de aumento)
- Título: ${decisao.titulo}
- Descrição: ${decisao.descricao || "Sem descrição"}

### HISTÓRICO (analise o histórico das decisões para futuras ocorrências)
${historico.length > 0 ? JSON.stringify(historico) : "Sem histórico disponível"}

### SUGESTÃO DO MODELO ML (Não cite que esses dados são de ML, apenas use na análise)
- Recomendação: ${resultadoML.recomendacao}
- Pontuação: ${resultadoML.pontuacao}
- Justificativa: ${resultadoML.justificativa}

### REGRAS
1. Transforme valores textuais em números sempre que possível (ex: "30 dias" → 30). (Mas não use apenas o numero nos textos mostrados ao usuário)
2. Baseie a análise no histórico para alertar sobre padrões que deram errado antes.
3. Avalie múltiplos critérios: financeiro, risco, produtividade, impacto estratégico.
4. Gere alertas detalhados sobre inconsistências, riscos e possíveis falhas.
5. Forneça justificativa completa e clara.
6. Saída **somente em JSON**, sem textos extras ou explicações fora do JSON.
`;

  let parsed;
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (e) {
    console.error("Erro ao interpretar resposta da IA:", e);
  }

  // 3️⃣ Combina IA + ML
  const resultadoFinal = parsed
    ? { ...parsed, pontuacaoPrevistaML: resultadoML.pontuacao }
    : {
        pontuacao: resultadoML.pontuacao,
        riscos: ["Não identificado"],
        recomendacao: resultadoML.recomendacao,
        justificativa: resultadoML.justificativa,
        pontuacaoPrevistaML: resultadoML.pontuacao
      };
  console.log(resultadoFinal)
  return resultadoFinal;
}