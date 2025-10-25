import { useState } from "react";
import { TextField, Button, FormControl, Select, InputLabel, MenuItem } from "@mui/material";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../services/firebase.js";
import api from "../services/api.js";

export default function Register() {
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [nivel, setNivel] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      // Cria o usuário no Firebase Auth
      const { user } = await createUserWithEmailAndPassword(auth, email, senha);
      await updateProfile(user, { displayName: nome });

      // Obtém token para enviar ao backend
      const token = await user.getIdToken();

      // Salva informações complementares no backend (Firestore)
      await api.post(
        "/usuarios",
        { nome, cargo, nivel, email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Conta criada com sucesso!");
      
    } catch (error) {
      console.error(error);
      setErro("Erro ao criar conta: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleRegister} className="bg-white p-6 rounded-2xl shadow-md w-96 space-y-3">
        <h2 className="text-xl font-semibold text-center">Criar Conta</h2>
        <TextField
          type="text"
          label="Nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border rounded p-2"
          required
        />
        <TextField
          type="text"
          label="Cargo (ex: Gestor, Analista)"
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
          className="w-full border rounded p-2"
          required
        />
        <FormControl fullWidth>
          <InputLabel>Nivel</InputLabel>
          <Select
            label="Nivel"
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
          >
            <MenuItem value="gestor">Gestor</MenuItem>
            <MenuItem value="analista">Analista</MenuItem>
          </Select>
        </FormControl>
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
          label="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full border rounded p-2"
          required
        />

        {erro && <p className="text-red-500 text-sm">{erro}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          {loading ? "Criando..." : "Registrar"}
        </Button>
      </form>
    </div>
  );
}