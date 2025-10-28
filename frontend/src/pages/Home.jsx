import React, { useContext, useState, useEffect } from "react";
import DecisionForm from "../components/DecisionForm";
import DecisionList from "../components/DecisionList";
import { AuthContext } from "../contexts/AuthContext";
import { Button, Divider, Avatar, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, Menu, MenuItem, Icon, LinearProgress } from "@mui/material";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase.js";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";

export default function Home() {

  const [decisoes, setDecisoes] = useState([]);

  // 🔹 Busca todas as decisões do usuário
  const carregarDecisoes = async () => {
    if (!usuario) return;
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

  const [atualizar, setAtualizar] = useState(false);
  const { usuario, perfil } = useContext(AuthContext);
  const navigate = useNavigate();

  const [openPerfil, setOpenPerfil] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleExcluirConta = () => {
    alert("Excluir conta não implementado ainda");
  };

  const handleEditarPerfil = () => {
    navigate("/editar-perfil");
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

// Estatísticas
  const [stats, setStats] = useState({
    total: 0,
    aprovadas: 0,
    aguardando: 0,
    reprovadas: 0,
  });

// Atualiza automaticamente sempre que a lista de decisões muda
  useEffect(() => {
    if (!decisoes || decisoes.length === 0) {
      setStats({ total: 0, aprovadas: 0, aguardando: 0, reprovadas: 0 });
      return;
    }

    setStats({ 
      total: decisoes.length,
      aprovadas: decisoes.filter((d) => d.status === "aprovada").length,
      aguardando: decisoes.filter((d) => d.status === "aguardando aprovação").length,
      reprovadas: decisoes.filter((d) => d.status === "reprovada").length
    });
  }, [decisoes]);

  const pct = (val) => (stats.total ? Math.round((val / stats.total) * 100) : 0);

  useEffect(() => {
    carregarDecisoes();
  }, [usuario, atualizar]);

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center p-4 gap-2 bg-gray-50 rounded shadow-sm relative">
        <h1 className="font-bold text-3xl text-blue-600">ADMIN.AI</h1>

        <div className="flex flex-col text-2xl md:flex-row md:items-center gap-2">
          <p className="text-gray-700">Olá, <span className="font-medium">{usuario?.displayName || usuario?.email}</span></p>
          <p className="capitalize text-gray-500">{perfil?.nivel}</p>
        </div>

        <div className="flex items-center gap-4">
          {perfil?.nivel === "gestor" && (
            <Button variant="contained" color="primary" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
          )}
        </div>
          {/* Avatar que abre dialog */}
              <div className="max-[600px]:absolute right-5 top-5">
                <Avatar onClick={handleMenuOpen} onClose={handleMenuClose}>
                  {usuario?.displayName ? usuario.displayName[0].toUpperCase() : usuario?.email?.[0].toUpperCase()}
                </Avatar>
              </div>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem disabled>
                  {usuario?.displayName || usuario?.email}
                </MenuItem>
                <MenuItem disabled>
                  Nível: {perfil?.nivel || "Não informado"}
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { setOpenPerfil(true); handleMenuClose(); }}>
                  Ver Perfil Detalhado
                </MenuItem>
                <Button fullWidth color="error" onClick={handleLogout}>Sair</Button>
              </Menu>
      </div>

      <Divider />

      {/* Dialog detalhado do perfil */}
      <Dialog open={openPerfil} onClose={() => setOpenPerfil(false)} fullWidth maxWidth="sm">
        <div className="p-3">

          <div className="flex justify-between pr-2 pl-2">
            <DialogTitle>Perfil do Usuário</DialogTitle>
            <IconButton fullWidth onClick={() => setOpenPerfil(false)}><Icon>close</Icon></IconButton>
          </div>
          <DialogContent dividers>
            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
              <div className="flex justify-between w-full flex-wrap gap-2 max-[600px]:justify-center">
                <Avatar
                  sx={{ width: 200, height: 200}}
                  src={usuario?.photoURL || ""}
                >
                  {usuario?.displayName
                    ? usuario.displayName[0].toUpperCase()
                    : usuario?.email?.[0].toUpperCase()}
                </Avatar>
                <div className="w-1/2 flex flex-col justify-center gap-2 max-[600px]:w-full text-center">
                  <h1 className="text-3xl">{usuario?.displayName || "Não informado"}</h1>
                  <Typography variant="body2" color="text.secondary">
                    {usuario?.email}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Cargo:</strong> {perfil?.cargo || "Não informado"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Nível:</strong> {perfil?.nivel || "Não informado"}
                  </Typography>
                </div>
              </div>

              <Divider sx={{ width: "100%", my: 2 }} />

              {/* Estatísticas */}
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                Estatísticas de Decisões
              </Typography>

              <Box display="flex" flexDirection="column" gap={2} width="100%" mt={1}>
                {/* Aprovadas */}
                <Box>
                  <Box display="flex" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Icon color="success" >check_circle</Icon>
                      <Typography variant="body2">Aprovadas</Typography>
                    </Box>
                    <Typography variant="body2">{pct(stats.aprovadas)}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={pct(stats.aprovadas)}
                    sx={{ height: 8, borderRadius: 5, mt: 0.5 }}
                    color="success"
                  />
                </Box>

                {/* Revisar */}
                <Box>
                  <Box display="flex" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Icon color="warning">replay</Icon>
                      <Typography variant="body2">Aguardando aprovação</Typography>
                    </Box>
                    <Typography variant="body2">{pct(stats.aguardando)}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={pct(stats.aguardando)}
                    sx={{ height: 8, borderRadius: 5, mt: 0.5 }}
                    color="warning"
                  />
                </Box>

                {/* Rejeitadas */}
                <Box>
                  <Box display="flex" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Icon color="error">error</Icon>
                      <Typography variant="body2">Reprovadas</Typography>
                    </Box>
                    <Typography variant="body2">{pct(stats.reprovadas)}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={pct(stats.reprovadas)}
                    sx={{ height: 8, borderRadius: 5, mt: 0.5 }}
                    color="error"
                  />
                </Box>

                {/* Total */}
                <Box mt={2} display="flex" justifyContent="center" gap={1} alignItems="center">
                  <Icon color="error">assement</Icon>
                  <Typography variant="body2" color="text.secondary">
                    Total de decisões: <strong>{stats.total}</strong>
                  </Typography>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions className="flex gap-2 p-4">
            <Button variant="outlined" fullWidth onClick={handleEditarPerfil}>Editar Perfil</Button>
            <Button variant="contained" color="error" fullWidth onClick={handleExcluirConta}>Excluir Conta</Button>
          </DialogActions>
        </div>
      </Dialog>

      {/* Formulário e lista de decisões */}
      <DecisionForm onCreated={() => setAtualizar(!atualizar)} />
      <DecisionList key={atualizar} onUpdate={() => setAtualizar(!atualizar)} decisoesProp={decisoes} />
    </div>
  );
}
