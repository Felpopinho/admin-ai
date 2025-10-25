import React, { useEffect, useState, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../contexts/AuthContext.jsx";
import DecisionCard from "./DecisionCard";

export default function DecisionList() {
  const [decisoes, setDecisoes] = useState([]);
  const { usuario } = useContext(AuthContext);

  const carregarDecisoes = async () => {
    if (!usuario) {
      console.log("Usuário não logado ainda");
      return;
    }
    try {
      const token = await usuario.getIdToken();
      const res = await api.get("/decisoes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDecisoes(res.data);
    } catch (error) {
      console.error("Erro ao carregar decisões:", error);
    }
  };

  useEffect(() => {
    carregarDecisoes();
  }, [usuario]);

  return (
    <div className="flex-1 bg-white rounded-[12px] p-[20px] shadow-2xs">
      <h2>Decisões Cadastradas</h2>
      {decisoes.map((d) => (
        <DecisionCard
          key={d.id}
          data={d}
          onAtualizar={carregarDecisoes} // apenas recarrega, não reanalisa
        />
      ))}
    </div>
  );
}
