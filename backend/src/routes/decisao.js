import express from "express";
import { db } from "../config/firebase.js";
import { verificarToken } from "../middleware/auth.js";
import { runDecisionAnalysis } from "../services/analiseAI.js";
import { treinarModelo, preverPontuacao } from '../ml/modelo.cjs';

const router = express.Router();

router.post("/", verificarToken, async (req, res) => {
  try {
    const {titulo, descricao, area, tipo, impacto_previsto, criado_por_nome} = req.body;
    const novaDecisao = {
      titulo, 
      descricao, 
      area, 
      tipo, 
      impacto_previsto, 
      criado_por_nome,
      status: "em análise",
      analisado_por: null,
      aprovado_por: null, 
      criado_por: req.uid, 
      criado_em: new Date()
    }

    const ref = await db.collection("decisoes").add(novaDecisao);
    res.status(201).send({ id: ref.id, ...novaDecisao });
  } catch (error) {
    res.status(500).send({ erro: error.message });
  }
});

// Analisar decisão
router.post("/:id/analisar", verificarToken, async (req, res) => {

  try {
    const { id } = req.params;
    const uid = req.uid;

    const doc = await db.collection("decisoes").doc(id).get();

    if (!doc.exists) return res.status(404).send({ erro: "Decisão não encontrada" });

    const decisao = doc.data();

    if (!["em análise"].includes(decisao.status)) {
      return res.status(400).json({ erro: `Decisão não está em estado válido para análise (status atual: ${decisao.status}).` });
    }

    let resultado;

    try {
      resultado = await runDecisionAnalysis(decisao);
      if (!resultado || !resultado.recomendacao || !resultado.pontuacao || !resultado.riscos || !resultado.justificativa) {
        throw new Error("Resultado da IA inválido");
      }
      try {
        const pontuacaoPrevista = await preverPontuacao(decisao); // usa ML.js
        resultado.pontuacaoPrevista = pontuacaoPrevista;
      } catch (mlErr) {
        console.error("Erro ao gerar pontuação ML:", mlErr.message);
        resultado.pontuacaoPrevista = null;
      }
    } catch (e) {
      console.error("Erro ao gerar análise da IA:", e);
      return res.status(500).json({ erro: "Falha ao executar análise da IA" });
    }

    await db.collection("decisoes").doc(id).update({
      resultado_analise: resultado,
      status: "aguardando aprovação",
      analisado_por: uid,
      analisado_em: new Date().toISOString(),
      atualizado_em: new Date()
    });

    await db.collection('historico_analises').add({
      area: decisao.area,
      tipo: decisao.tipo,
      custos: decisao.impacto_previsto.custos,
      lucro_estimado: decisao.impacto_previsto.lucro_estimado,
      prazos: decisao.impacto_previsto.prazos,
      produtividade: decisao.impacto_previsto.produtividade,
      pontuacao: resultado.pontuacao,
      recomendacao: resultado.recomendacao,
      justificativa: resultado.justificativa,
      criado_em: new Date().toISOString()
    });

    return res.json({ sucesso: true, resultado });
  } catch (error) {
    try {
      await db.collection("decisoes").doc(req.params.id).update({
        status: "em análise",
        atualizado_em: new Date().toISOString()
      });
    } catch (e) {}
    return res.status(500).json({ erro: "Erro ao executar análise." });
  }
});

router.patch("/:id/aprovar", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { userNivel, uid } = req;

    // 🔒 Permissão: apenas gestor ou admin
    if (!["gestor", "admin"].includes(userNivel)) {
      return res.status(403).send({ erro: "Acesso negado." });
    }

    const decisaoRef = db.collection("decisoes").doc(id);
    const doc = await decisaoRef.get();

    if (!doc.exists) {
      return res.status(404).send({ erro: "Decisão não encontrada." });
    }

    // Atualiza os campos de aprovação
    await decisaoRef.update({
      status: "aprovada",
      aprovada_por: uid,
      aprovada_em: new Date().toISOString(),
    });

    res.send({ sucesso: true, mensagem: "Decisão aprovada com sucesso!" });
  } catch (error) {
    console.error("Erro ao aprovar decisão:", error);
    res.status(500).send({ erro: error.message });
  }
});

// Listar decisões
router.get("/", verificarToken, async (req, res) => {
  try {
    let snapshot;

    if (req.userNivel === "analista") {
      // Analista vê apenas suas próprias decisões
      snapshot = await db.collection("decisoes")
        .where("criado_por", "==", req.uid)
        .get();
    } else {
      // Admin e Gestor veem todas
      snapshot = await db.collection("decisoes").get();
    }

    const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.send(dados);

  } catch (error) {
    res.status(500).send({ erro: error.message });
  }
});

router.get("/estatisticas", verificarToken, async (req, res) => {
  try {
    const userNivel = req.userNivel;
    const uid = req.uid;

    let query = db.collection("decisoes");
    if (userNivel === "analista") {
      query = query.where("criado_por", "==", uid);
    }

    const snapshot = await query.get();
    const stats = { pendente: 0, analisada: 0, aprovada: 0 };

    snapshot.forEach(doc => {
      const d = doc.data();
      let status = d.status;
      if(status === "em análise"){
        status = "pendente";
      } else if(status === "aguardando aprovação"){
        status = "analisada";
      } else{
        status = "aprovada";
      }

      if (d.status && stats[status] !== undefined) {
        stats[status]++;
      }
    });

    res.send(stats);
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).send({ erro: error.message });
  }
});

router.get("/ranking", verificarToken, async (req, res) => {
  try {
    if (req.userNivel === "analista") {
      return res.status(403).send({ erro: "Acesso negado" });
    }

    const snapshot = await db.collection("decisoes").get();
    const ranking = {};

    snapshot.forEach(doc => {
      const d = doc.data();
      const nome = d.criado_por_nome || "Desconhecido";
      ranking[nome] = (ranking[nome] || 0) + 1;
    });

    const rankingOrdenado = Object.entries(ranking)
      .map(([nome, qtd]) => ({ nome, qtd }))
      .sort((a, b) => b.qtd - a.qtd);

    res.send(rankingOrdenado);
  } catch (error) {
    console.error("Erro ao buscar ranking:", error);
    res.status(500).send({ erro: error.message });
  }
});


export default router;