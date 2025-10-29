import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    Divider,
    Chip,
    List,
    ListItem,
    ListItemText,
    Button,
    CircularProgress,
    IconButton,
    Tooltip,
    TextField,
    Icon,
    MenuItem,
    Grid,
    LinearProgress,
    ListItemIcon,
    WarningAmberIcon
} from "@mui/material";
import { useContext, useState, useEffect } from "react";
import api from "../services/api";
import { auth } from "../services/firebase";
import { useSnackbar } from "../contexts/SnackbarContext";
import { AuthContext } from "../contexts/AuthContext";

export default function DecisionDialog({ open, onClose, data, onAtualizar }) {
    const { usuario, perfil } = useContext(AuthContext);
    const { showSnackbar } = useSnackbar();

    const [loading, setLoading] = useState(false);
    const [editando, setEditando] = useState(false);
    const [form, setForm] = useState(data || {});
    const [openAprovacao, setOpenAprovacao] = useState(false);
    const [acaoAprovacao, setAcaoAprovacao] = useState("");
    const [justificativa, setJustificativa] = useState("");

    // Atualiza o form quando o "data" mudar
    useEffect(() => {
        if (data) setForm(data);
    }, [data]);

    if (!data) return null;

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
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
            onClose();
        } catch (err) {
            console.error("Erro ao excluir:", err);
            showSnackbar("Erro ao excluir decisão.", "error");
        }
    };

    const handleSalvarEdicao = async () => {
        try {
            const token = await auth.currentUser.getIdToken();
            await api.patch(`/decisoes/${data.id}`, form, {
                headers: { Authorization: `Bearer ${token}` },
            });
            await onAtualizar();
            showSnackbar("Decisão atualizada com sucesso!", "success");
            setEditando(false);
            onClose();
        } catch (err) {
            console.error("Erro ao editar:", err);
            showSnackbar("Erro ao atualizar decisão.", "error");
        }
    };

    const handleAnalisar = async () => {
        try {
            setLoading(true);
            const token = await auth.currentUser.getIdToken();
            const res = await api.post(
                `/decisoes/${data.id}/analisar`,
                { username: usuario.displayName || usuario.email },
                { headers: { Authorization: `Bearer ${token}` } }
            );
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

    const handleAprovacao = (acao) => {
        setAcaoAprovacao(acao);
        setOpenAprovacao(true);
    };

    const handleAprovar = async () => {
        try {
            const token = await auth.currentUser.getIdToken();
            await api.patch(
                `/decisoes/${data.id}/aprovar`,
                {
                    userNivel: perfil.nivel,
                    usuarioId: usuario.uid,
                    usuarioNome: usuario.displayName || perfil.email,
                    justificativa,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
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
            const token = await auth.currentUser.getIdToken();
            await api.patch(
                `/decisoes/${data.id}/reprovar`,
                {
                    userNivel: perfil.nivel,
                    usuarioId: usuario.uid,
                    usuarioNome: usuario.displayName || usuario.email,
                    justificativa,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await onAtualizar();
            showSnackbar("Decisão reprovada com sucesso!", "success");
            setOpenAprovacao(false);
        } catch (error) {
            showSnackbar("Erro ao reprovar decisão.", "error");
            console.error("Erro ao reprovar decisão:", error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "aguardando análise":
                return "warning";
            case "aguardando aprovação":
                return "info";
            case "finalizada":
                return "success";
            case "aprovada":
                return "sucess";
            case "reprovada":
                return "error";
            case "analisada":
                return "warning"
            case "criada":
                return "info"
            default:
                return "default";
        }
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">{data.titulo}</Typography>
                        <Chip
                            label={data.status?.toUpperCase()}
                            color={getStatusColor(data.status)}
                            variant="filled"
                        />
                    </Box>
                </DialogTitle>

                <DialogContent dividers className="bg-gray-50">
                    {!editando ? (
                        <div>
                            <div className="grid grid-cols-8 gap-2 max-[820px]:grid-cols-2 max-[500px]:grid-cols-1">
                                <div className="flex flex-col gap-1 col-span-2 max-[820px]:col-span-1">
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Criado por: {data.historico?.[0]?.por_nome || "Desconhecido"}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>Área:</strong> {data.area}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>Tipo:</strong> {data.tipo}
                                    </Typography>
                                    <Typography variant="h6" className="mt-2">
                                        Impacto Previsto
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Custos:</strong> {data.impacto_previsto?.custos || "-"}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Lucro Estimado:</strong>{" "}
                                        {data.impacto_previsto?.lucro_estimado || "-"}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Prazos:</strong> {data.impacto_previsto?.prazos || "-"}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Produtividade:</strong>{" "}
                                        {data.impacto_previsto?.produtividade || "-"}
                                    </Typography>
                                </div>
                                <div className=" col-span-4 flex justify-between max-[820px]:col-span-2 max-[820px]:row-start-2 max-[500px]:col-span-1 max-[500px]:row-start-2">
                                    <Divider orientation="vertical" sx={{marginRight:"10px"}}/>
                                    <div className="w-1/1 flex-1">
                                        <Typography variant="h6" gutterBottom>
                                            🧾 Descrição
                                        </Typography>
                                        <Typography variant="body2" className="text-gray-700 mb-2">
                                            {data.descricao}
                                        </Typography>
                                    </div>
                                    <Divider orientation="vertical" sx={{marginLeft:"10px"}}/>
                                </div>
                                <div className="col-span-2 max-[820px]:col-span-1 max-[820px]:justify-items-end max-[500px]:justify-items-center">
                                    <Typography variant="h6" gutterBottom>
                                        🕓 Histórico
                                    </Typography>
                                    <List dense>
                                        {data.historico?.map((h, i) => (<div className="max-[820px]:grid justify-items-end max-[500px]:justify-items-center">
                                            <Chip
                                                label={h.acao}
                                                color={getStatusColor(h.acao)}
                                                size="small"
                                            />
                                            <ListItem key={i}>
                                                <ListItemText
                                                    primary={`por ${h.por_nome}`}
                                                    secondary={new Date(h.em).toLocaleString()}
                                                />
                                            </ListItem>
                                        </div>))}
                                    </List>
                                </div>
                            </div>
                            <div>
                                <Box className="p-3 bg-white rounded-xl shadow-sm h-full">
                                    

                                    <Divider sx={{margin: "1vh 0"}} />

                                    {data.resultado_analise ? (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-center max-[530px]:flex-col">
                                                <Typography variant="h6" >
                                                    Resultado da Análise
                                                </Typography>
                                                <Typography variant="body3">
                                                    <strong>Recomendação:</strong>{" "}
                                                    <span className="font-semibold text-blue-600">
                                                        {data.resultado_analise.recomendacao}
                                                    </span>
                                                </Typography>
                                            </div>

                                            <div>
                                                <Typography variant="body2" gutterBottom>
                                                    <strong>Pontuação:</strong> {data.resultado_analise.pontuacao}/100
                                                </Typography>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={data.resultado_analise.pontuacao}
                                                    className="mb-3 rounded"
                                                    color={data.resultado_analise.pontuacao > 70 ? "sucess" : data.resultado_analise.pontuacao > 40 ? "warning" : "error"}
                                                />
                                            </div>
                                            <div>
                                                <Typography variant="body3" className="mt-2">
                                                    <strong>Justificativa:</strong>
                                                </Typography>
                                                <Typography variant="body2" className="text-gray-700 mt-1">
                                                    {data.resultado_analise.justificativa}
                                                </Typography>
                                            </div>
                                            <div>
                                                <Typography variant="body3" className="mt-3">
                                                    <strong>Riscos:</strong>
                                                </Typography>
                                                <List dense>
                                                    {data.resultado_analise.riscos?.map((r, i) => (
                                                        <ListItem key={i}>
                                                            <ListItemIcon>
                                                                <Icon>warning_amber</Icon>
                                                            </ListItemIcon>
                                                            <ListItemText primary={r} />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </div>

                                        </div>
                                    ) : (
                                        <Box className="p-4 bg-gray-200 text-gray-500 rounded-lg text-center">
                                            Nenhuma análise gerada ainda.
                                        </Box>
                                    )}
                                </Box>
                            </div>
                        </div>

                    ) : (
                        // === Modo de Edição ===
                        <div className="flex flex-col gap-4">
                            <TextField
                                fullWidth
                                name="titulo"
                                label="Título"
                                value={form.titulo}
                                onChange={handleChange}
                            />
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                name="descricao"
                                label="Descrição"
                                value={form.descricao}
                                onChange={handleChange}
                            />
                            <TextField
                                fullWidth
                                name="area"
                                label="Área"
                                value={form.area}
                                onChange={handleChange}
                            />
                            <TextField
                                select
                                label="Tipo"
                                name="tipo"
                                fullWidth
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
                        </div>
                    )}
                </DialogContent>

                <DialogActions sx={{ justifyContent: "space-between", p: 2 }}>
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

                            <div className="flex gap-2">
                                {data.status === "aguardando análise" && (
                                    <Button
                                        onClick={handleAnalisar}
                                        disabled={loading}
                                        variant="contained"
                                        color="primary"
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
                                    data.status === "aguardando aprovação" && (
                                        <>
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
                                        </>
                                    )}
                                <Button onClick={onClose}>Fechar</Button>
                            </div>
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

            {/* Dialog de Aprovação */}
            <Dialog open={openAprovacao} onClose={() => setOpenAprovacao(false)}>
                <div className="flex flex-col gap-2 p-4">
                    <DialogTitle>{acaoAprovacao} Decisão</DialogTitle>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Justificativa (opcional)"
                        value={justificativa}
                        onChange={(e) => setJustificativa(e.target.value)}
                    />
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
