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
import DOMPurify from "dompurify";

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

    const formatarMarkdownBasico = (texto) => {
        if (!texto) return "";
        const html = texto
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // **texto** → <strong>texto</strong>
            .replace(/\n/g, "<br />"); // quebra de linha opcional
        return DOMPurify.sanitize(html);
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <div className="flex items-center justify-between flex-wrap max-[430px]:justify-center">
                        <div className="flex items-end gap-x-4 flex-wrap max-[430px]:justify-center">
                            <p className="text-2xl font-bold text-nowrap">{data.titulo}</p>
                            <Typography sx={{ textWrap: "nowrap" }} variant="subtitle2" color="textSecondary">
                                Criada por: {data.historico?.[0]?.por_nome || "Desconhecido"}
                            </Typography>
                        </div>
                        <Chip
                            label={data.status?.toUpperCase()}
                            color={getStatusColor(data.status)}
                            variant="filled"
                        />
                    </div>
                </DialogTitle>

                <DialogContent dividers className="bg-gray-50">
                    {!editando ? (
                        <div>
                            <div className="grid grid-cols-8 gap-2 max-[820px]:grid-cols-2 max-[500px]:grid-cols-1">
                                <div className="flex flex-col gap-1 col-span-2 max-[820px]:col-span-1">
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
                                    <Divider orientation="vertical" sx={{ marginRight: "10px" }} />
                                    <div className="w-1/1 flex-1">
                                        <div className="flex items-center text-xl gap-x-1">
                                            <Icon>description</Icon>
                                            <p>Descrição</p>
                                        </div>
                                        <Typography variant="body2" className="text-gray-700 mb-2">
                                            {data.descricao}
                                        </Typography>
                                    </div>
                                    <Divider orientation="vertical" sx={{ marginLeft: "10px" }} />
                                </div>
                                <div className="col-span-2 max-[820px]:col-span-1 max-[820px]:justify-items-end max-[500px]:justify-items-center">
                                    <div className="flex items-center text-xl gap-x-1">
                                        <Icon>history</Icon>
                                        <p>Histórico</p>
                                    </div>
                                    <List dense>
                                        {data.historico?.map((h, i) => (<div className="max-[820px]:grid justify-items-end max-[500px]:justify-items-center">

                                            <ListItem key={i}>
                                                <ListItemText
                                                    primary={`${h.acao.toUpperCase()} por ${h.por_nome}`}
                                                    secondary={new Date(h.em).toLocaleString()}
                                                />
                                            </ListItem>
                                        </div>))}
                                    </List>
                                </div>
                            </div>
                            <div>
                                <Box className="p-3 bg-white rounded-xl shadow-sm h-full">


                                    <Divider sx={{ margin: "1vh 0" }} />

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
                                                <div className="text-xl flex items-center gap-x-2">
                                                    <Icon>equalizer</Icon>
                                                    <strong>Justificativa</strong>
                                                </div>
                                                <Typography variant="body2" className="text-gray-700 mt-1">
                                                    {data.resultado_analise.justificativa}
                                                </Typography>
                                            </div>
                                            <div>
                                                <div className="text-xl flex items-center gap-x-2">
                                                    <Icon>warning_amber</Icon>
                                                    <strong>Riscos:</strong>
                                                </div>
                                                <List dense>
                                                    {data.resultado_analise.riscos?.map((r, i) => (
                                                        <ListItem key={i}>
                                                            <ListItemText primary={<span dangerouslySetInnerHTML={{ __html: formatarMarkdownBasico(r) }} />} />
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

                <DialogActions>
                    <div className="w-[100%]">
                        {!editando ? (
                            <div className="w-1/1 grid grid-cols-3 gap-2 items-center max-[500px]:grid-cols-2 max-[500px]:justify-content-center">
                                <div className="flex gap-2 w-auto">
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

                                <div className="flex justify-center gap-2 max-[500px]:col-span-2 max-[500px]:row-start-1">
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
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button variant="outlined" onClick={onClose}>Fechar</Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Button onClick={handleSalvarEdicao} color="success">
                                    Salvar
                                </Button>
                                <Button onClick={() => setEditando(false)}>Cancelar</Button>
                            </>
                        )}
                    </div>
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
