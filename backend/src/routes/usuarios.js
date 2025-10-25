import express from "express";
import { db } from "../config/firebase.js";
import { verificarToken } from "../middleware/auth.js";

const router = express.Router();

// Criação do usuário no Firestore
router.post("/", verificarToken, async (req, res) => {
  try {
    const { nome, cargo, nivel, email } = req.body;

    const novoUsuario = {
      nome,
      cargo,
      nivel,
      email,
      uid: req.uid,
      criado_em: new Date().toISOString(),
      role: "usuario" // padrão
    };

    await db.collection("usuarios").doc(req.uid).set(novoUsuario);
    res.status(201).json(novoUsuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao registrar usuário" });
  }
});

router.get("/me", verificarToken, async (req, res) => {
  try {
    const doc = await db.collection("usuarios").doc(req.uid).get();
    if (!doc.exists) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    res.json(doc.data()); // retorna nome, cargo, role, email...
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar usuário" });
  }
});

export default router;