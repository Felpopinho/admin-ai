import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import api from "../services/api";
import {
  Card, CardContent, Typography, Button, MenuItem, Select, FormControl, InputLabel
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

export default function DashboardAvancado() {
  const { usuario, perfil } = useContext(AuthContext);
  const [stats, setStats] = useState({});
  const [ranking, setRanking] = useState([]);
  const [filtroTempo, setFiltroTempo] = useState("todas");
  const [mostrarMinhas, setMostrarMinhas] = useState(false);

  const carregarDecisoes = async () => {
    if (!usuario) return;

    try {
        const token = await usuario.getIdToken();

        const query = filtroTempo !== "todas" ? `?periodo=${filtroTempo}` : "";

        // 🔹 Carrega estatísticas e ranking já filtrados pelo backend
        const [resStats, resRanking] = await Promise.all([
          api.get(`/decisoes/estatisticas${query}`, { headers: { Authorization: `Bearer ${token}` } }),
          perfil.nivel !== "analista"
            ? api.get(`/decisoes/ranking${query}`, { headers: { Authorization: `Bearer ${token}` } })
            : Promise.resolve({ data: [] }),
        ]);
        console.log(resStats.data, resRanking.data);
        setStats(resStats.data);
        setRanking(resRanking.data);
        } catch (err) {
          console.error("Erro ao carregar decisões:", err);
        }
  };

  useEffect(() => {
    carregarDecisoes();
  }, [usuario, filtroTempo]);

  const dataGrafico = [
    { name: "Pendente", quantidade: stats.pendente || 0 },
    { name: "Analisada", quantidade: stats.analisada || 0 },
    { name: "Aprovada", quantidade: stats.aprovada || 0 },
  ];

  return (
    <div className="p-6 flex flex-col gap-6">
      <Typography variant="h4" className="font-semibold">
        Dashboard ADMIN.AI
      </Typography>
      <Typography variant="subtitle1">
        Olá, {perfil?.nome || usuario?.email}! 👋
      </Typography>

      {/* 🔧 Filtros */}
      <div className="flex gap-4 items-center">
        <FormControl size="small" className="min-w-[160px]">
          <InputLabel>Período</InputLabel>
          <Select
            value={filtroTempo}
            label="Período"
            onChange={(e) => setFiltroTempo(e.target.value)}
          >
            <MenuItem value="todas">Todas as decisões</MenuItem>
            <MenuItem value="semana">Últimos 7 dias</MenuItem>
            <MenuItem value="mes">Último mês</MenuItem>
          </Select>
        </FormControl>

        {perfil?.nivel === "analista" && (
          <Button
            variant="contained"
            color={mostrarMinhas ? "primary" : "inherit"}
            onClick={() => setMostrarMinhas(!mostrarMinhas)}
          >
            {mostrarMinhas ? "Ver todas" : "Ver minhas decisões"}
          </Button>
        )}
      </div>

      {/* 📊 Cards de status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent><Typography variant="h6">Pendentes</Typography>
          <Typography variant="h4">{stats.pendente || 0}</Typography>
        </CardContent></Card>

        <Card><CardContent><Typography variant="h6">Analisadas</Typography>
          <Typography variant="h4">{stats.analisada || 0}</Typography>
        </CardContent></Card>

        <Card><CardContent><Typography variant="h6">Aprovadas</Typography>
          <Typography variant="h4">{stats.aprovada || 0}</Typography>
        </CardContent></Card>
      </div>

      {/* 📈 Gráfico */}
      <Card className="p-4">
        <CardContent>
          <Typography variant="h6" className="mb-2">Gráfico de Decisões</Typography>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={dataGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 🏆 Ranking */}
      {perfil?.nivel !== "analista" && (
        <Card className="p-4">
          <CardContent>
            <Typography variant="h6" className="mb-3">Ranking de Analistas</Typography>
            <div className="space-y-2">
              {ranking.map((r, i) => (
                <div key={r.nome} className="flex justify-between">
                  <Typography>{i + 1}. {r.nome}</Typography>
                  <Typography className="font-semibold">{r.qtd} decisões</Typography>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
