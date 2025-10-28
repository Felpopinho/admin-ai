import React, { useEffect, useState, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../contexts/AuthContext.jsx";
import DecisionCard from "./DecisionCard";
import { ButtonGroup, Icon, Button } from "@mui/material";

export default function DecisionList({ onUpdate, decisoesProp }) {
  const { usuario } = useContext(AuthContext);
  const [colunas, setColunas] = useState(0); // 0 = auto
  const [tamanhoTela, setTamanhoTela] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setTamanhoTela(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const colunasAtuais =
    colunas || (tamanhoTela >= 1280 ? 4 : tamanhoTela >= 1024 ? 3 : tamanhoTela >= 768 ? 2 : 1);

  // Mapa de classes Tailwind fixas
  const colunasClasses = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };
  const gridClass = `grid gap-4 ${colunasClasses[colunasAtuais] || "grid-cols-1"}`;

  return (
    <div className="flex-1 bg-white rounded-[12px] p-[20px] shadow-2xs">
      <div className="mb-4 flex items-center gap-2 justify-between">
        <h2 className="text-2xl font-semibold text-gray-800">Decisões cadastradas</h2>
        <ButtonGroup variant={colunas === 0 ? "contained" : "text"} size="small">
          <Button onClick={() => setColunas(0)}><Icon>grid_view</Icon></Button>
          {Array.from(Object.keys(colunasClasses)).map((num) => (
            <Button variant={colunas === Number(num) ? "contained" : "text"} key={num} value={num} onClick={() => setColunas(Number(num))}>
              {num}
            </Button>
          ))}
        </ButtonGroup>
      </div>

      <div className={gridClass}>
        {decisoesProp.map((d) => (
          <DecisionCard key={d.id} data={d} onAtualizar={onUpdate} decisoesProp={decisoesProp} />
        ))}
      </div>
    </div>
  );
}
