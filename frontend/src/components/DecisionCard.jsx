import { Button, Card, CardContent, Typography, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Icon, MenuItem, Tooltip, Box } from "@mui/material";
import api from "../services/api";
import { auth } from "../services/firebase";
import { useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useSnackbar } from "../contexts/SnackbarContext";

export default function DecisionCard({ data, onAtualizar }) {
  const { usuario, perfil } = useContext(AuthContext);
  
  const { showSnackbar } = useSnackbar();
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState(data);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setEditando(false);
    setOpen(false);
  };

  const handleExcluir = async () => {
    if (!window.confirm("Tem certeza que deseja excluir esta decisão?")) return;
    try {
      const token = await auth.currentUser.getIdToken();
      await api.delete(`/decisoes/${data.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await onAtualizar();
      showSnackbar("Decisão excluída com sucesso!", "success");
      handleClose();
    } catch (err) {
      console.error("Erro ao excluir:", err);
      showSnackbar("Erro ao excluir decisão.", "error");
    }
  };

  // ✅ Salvar edição
  const handleSalvarEdicao = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      await api.patch(`/decisoes/${data.id}`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await onAtualizar();
      showSnackbar("Decisão atualizada com sucesso!", "success");
      setEditando(false);
      handleClose();
    } catch (err) {
      console.error("Erro ao editar:", err);
      showSnackbar("Erro ao atualizar decisão.", "error");
    }
  };

  const handleAnalisar = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser.getIdToken();
      const res = await api.post(`/decisoes/${data.id}/analisar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Resultado análise:", res.data.resultado);
      await onAtualizar();
      showSnackbar("Análise concluída com sucesso!", "success");
    } catch (err) {
      console.error("Erro ao analisar:", err);
      showSnackbar("Erro ao rodar análise.", "error");
    } finally {
      setLoading(false);
    }
  };
  
  const [openAprovacao, setOpenAprovacao] = useState(false);
  const [acaoAprovacao, setAcaoAprovacao] = useState("");
  const [justificativa, setJustificativa] = useState("");

  const handleAprovacao = (acao) => {
    setAcaoAprovacao(acao);
    setOpenAprovacao(true);
  }
  
  const handleAprovar = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      await api.patch(`/decisoes/${data.id}/aprovar`,  {
        userNivel: perfil.nivel,
        usuarioId: usuario.uid,
        usuarioNome: usuario.displayName || perfil.email,
        justificativa,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await onAtualizar();
      showSnackbar("Decisão aprovada com sucesso!", "success");
      setOpenAprovacao(false);
    } catch (err) {
      console.error("Erro ao aprovar:", err);
      showSnackbar("Erro ao aprovar decisão.", "error");
    }
  };

  const handleReprovar = async () => {
    try {
      const token = await usuario.getIdToken();
      await api.patch(`/decisoes/${data.id}/reprovar`, {
        userNivel: perfil.nivel,
        usuarioId: usuario.uid,
        usuarioNome: usuario.displayName || usuario.email,
        justificativa,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await onAtualizar();
      showSnackbar("Decisão reprovada com sucesso!", "success");
      setOpenAprovacao(false);
    } catch (error) {
      showSnackbar("Erro ao reprovar decisão.", "error");
      console.error("Erro ao reprovar decisão:", error);
    }
  };


  return (<>
      {/* CARD SIMPLES */}
      <Card className="mb-4 cursor-pointer hover:shadow-md transition">
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <div>
              <Typography variant="h6">{data.titulo}</Typography>
              <Typography variant="body2" color="textSecondary">
                Criado por: {data.criado_por_nome || "Desconhecido"}
              </Typography>
              <Typography variant="body1" className="mt-2">
                Status: {data.status}
              </Typography>
            </div>

            <Box>
              <Tooltip title="Ver / Editar">
                <IconButton size="large" color="primary" onClick={handleOpen}>
                  <Icon>visibility</Icon>
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* MODAL DETALHADO */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{data.titulo}</DialogTitle>
        <DialogContent dividers>
          {!editando ? (
            <>
              <Typography variant="subtitle2" color="textSecondary">
                Criado por: {data.criado_por_nome || "Desconhecido"}
              </Typography>
              <Typography variant="body1" className="mt-2">
                <strong>Área:</strong> {data.area}
              </Typography>
              <Typography variant="body1">
                <strong>Tipo:</strong> {data.tipo}
              </Typography>
              <Typography variant="body1" className="mt-2">
                <strong>Descrição:</strong> {data.descricao}
              </Typography>
              <Typography variant="body1" className="mt-2">
                <strong>Custos:</strong> {data.impacto_previsto?.custos}
              </Typography>
              <Typography variant="body1" className="mt-2">
                <strong>Lucros:</strong> {data.impacto_previsto?.lucro_estimado}
              </Typography>
              <Typography variant="body1" className="mt-2">
                <strong>Prazos:</strong> {data.impacto_previsto?.prazos}
              </Typography>
              <Typography variant="body1" className="mt-2">
                <strong>Produtividade:</strong> {data.impacto_previsto?.produtividade}
              </Typography>

              {data.resultado_analise && (
                <div className="mt-4 p-3 bg-gray-100 rounded">
                  <strong>Pontuação:</strong> {data.resultado_analise.pontuacao} <br />
                  <strong>Riscos:</strong> {data.resultado_analise.riscos?.join(", ")} <br />
                  <strong>Recomendação:</strong> {data.resultado_analise.recomendacao} <br />
                  <strong>Justificativa:</strong> {data.resultado_analise.justificativa}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <TextField
                fullWidth
                name="titulo"
                label="Título"
                value={form.titulo}
                onChange={handleChange}
                className="mb-3"
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                name="descricao"
                label="Descrição"
                value={form.descricao}
                onChange={handleChange}
                className="mb-3"
              />
              <TextField
                fullWidth
                name="area"
                label="Área"
                value={form.area}
                onChange={handleChange}
                className="mb-3"
              />
              <TextField
                select
                label="Tipo"
                name="tipo"
                fullWidth
                margin="dense"
                value={form.tipo || ""}
                onChange={handleChange}
              >
                <MenuItem value="financeira">Financeira</MenuItem>
                <MenuItem value="operacional">Operacional</MenuItem>
                <MenuItem value="pessoal">Pessoal</MenuItem>
                <MenuItem value="estratégica">Estratégica</MenuItem>
                <MenuItem value="marketing">Marketing</MenuItem>
                <MenuItem value="tecnologia">Tecnologia</MenuItem>
                <MenuItem value="juridica">Jurídica / Compliance</MenuItem>
                <MenuItem value="parcerias">Parcerias / Negócios</MenuItem>
                <MenuItem value="inovacao">Inovação / P&D</MenuItem>
                <MenuItem value="sustentabilidade">Sustentabilidade / ESG</MenuItem>
              </TextField>
              <TextField
                label="Custos"
                name="custos"
                type="number"
                fullWidth
                margin="dense"
                value={form.impacto_previsto?.custos || ""}
                onChange={handleChange}
              />
              <TextField
                label="Lucro Estimado"
                name="lucro_estimado"
                type="number"
                fullWidth
                margin="dense"
                value={form.impacto_previsto?.lucro_estimado || ""}
                onChange={handleChange}
              />
              <TextField
                label="Prazos"
                name="prazos"
                fullWidth
                margin="dense"
                value={form.impacto_previsto?.prazos || ""}
                onChange={handleChange}
              />
              <TextField
                label="Produtividade"
                name="produtividade"
                type="number"
                fullWidth
                margin="dense"
                value={form.impacto_previsto?.produtividade || ""}
                onChange={handleChange}
              />
            </div>
          )}
        </DialogContent>

        <DialogActions sx={{justifyContent: "space-between"}}>
          {!editando ? (
            <>
                <div className="flex gap-2">
                  <Tooltip title="Editar">
                    <IconButton onClick={() => setEditando(true)} color="primary">
                      <Icon>edit</Icon>
                    </IconButton>
                  </Tooltip>
                  {["gestor", "admin"].includes(perfil?.nivel) && (
                    <Tooltip title="Excluir">
                      <IconButton color="error" onClick={handleExcluir}>
                        <Icon>delete</Icon>
                      </IconButton>
                    </Tooltip>
                  )}
                </div>
              {data.status === "em análise" && (
                <Button
                  onClick={handleAnalisar}
                  disabled={loading}
                  variant="contained"
                >
                  {loading ? (
                    <>
                      <CircularProgress size={18} className="mr-2" /> Analisando...
                    </>
                  ) : (
                    "Analisar"
                  )}
                </Button>
              )}

              {["gestor", "admin"].includes(perfil?.nivel) &&
                data.status === "aguardando aprovação" && (<div className="flex gap-2">
                  <Button
                    onClick={() => handleAprovacao("Reprovar")}
                    color="error"
                    variant="contained"
                  >
                    Reprovar
                  </Button>
                  <Button
                    onClick={() => handleAprovacao("Aprovar")}
                    color="success"
                    variant="contained"
                  >
                    Aprovar
                  </Button>
                </div>)}
              <Button onClick={handleClose}>Fechar</Button>
            </>
          ) : (
            <>
              <Button onClick={handleSalvarEdicao} color="success">
                Salvar
              </Button>
              <Button onClick={() => setEditando(false)}>Cancelar</Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={openAprovacao} onClose={() => setOpenAprovacao(false)}>
        <div className="flex flex-col gap-2 p-4">
          <DialogTitle>{acaoAprovacao} Decisão</DialogTitle>
          <TextField fullWidth multiline rows={3} label="Justificativa (opcional)" value={justificativa} onChange={(e) => setJustificativa(e.target.value)}/>
          <DialogActions>
            <Button onClick={() => setOpenAprovacao(false)}>Cancelar</Button>
            <Button
              variant="contained"
              color={acaoAprovacao === "Aprovar" ? "success" : "error"}
              onClick={acaoAprovacao === "Aprovar" ? handleAprovar : handleReprovar}
            >
              Confirmar {acaoAprovacao}
            </Button>
          </DialogActions>
        </div>
      </Dialog>
    </>
  );
}
