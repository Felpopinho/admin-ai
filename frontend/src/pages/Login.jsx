import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase.js";
import { useNavigate } from "react-router-dom";
import { Button, TextField } from "@mui/material";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, senha);
      const token = await user.getIdToken();

      // Salva o token no localStorage (mantém sessão ativa)
      localStorage.setItem("token", token);

      navigate("/"); // Redireciona para o painel principal
    } catch (error) {
      console.error(error);
      setErro("E-mail ou senha incorretos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-2xl shadow-md w-96 space-y-3"
      >
        <h2 className="text-2xl font-semibold text-center">Entrar</h2>

        <TextField
          type="email"
          label="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded p-2"
          required
        />
        <TextField
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full border rounded p-2"
          required
        />

        {erro && <p className="text-red-500 text-sm">{erro}</p>}

        <Button
          variant="contained"
          type="submit"
          disabled={loading}
          fullWidth
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>

        <p className="text-sm text-center mt-2">
          Não tem uma conta?{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            Criar agora
          </a>
        </p>
      </form>
    </div>
  );
}
