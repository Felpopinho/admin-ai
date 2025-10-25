export function authorize(niveis = []) {
  return (req, res, next) => {
    const userNivel = req.userNivel; // vamos popular no middleware de token
    if (!niveis.includes(userNivel)) {
      return res.status(403).json({ erro: "Acesso negado" });
    }
    next();
  };
}