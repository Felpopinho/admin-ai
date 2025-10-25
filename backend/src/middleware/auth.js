import { firebaseApp, db } from "../config/firebase.js";

export async function verificarToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ erro: "Token não fornecido" });

    const decoded = await firebaseApp.auth().verifyIdToken(token);
    req.uid = decoded.uid;

    const doc = await db.collection("usuarios").doc(req.uid).get();
    req.userNivel = doc.exists ? doc.data().nivel : "analista"; // default

    next();
  } catch (error) {
    console.error("Erro ao verificar token:", error);
    res.status(403).json({ erro: "Token inválido" });
  }
}