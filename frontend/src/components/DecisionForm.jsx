import { useState, useContext } from "react";
import api from "../services/api";
import { Button, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { AuthContext } from "../contexts/AuthContext";
import { useSnackbar } from "../contexts/SnackbarContext";

export default function DecisionForm({ onCreated }) {

    const { usuario } = useContext(AuthContext);

    const { showSnackbar } = useSnackbar();

    const [form, setForm] = useState({
        titulo: "",
        descricao: "",
        area: "",
        tipo: "",
        custos: "",
        lucro_estimado: "",
        prazos: "",
        produtividade: ""
    });

    const handleChange = e => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async e => {
        e.preventDefault();

        const data = {
            titulo: form.titulo,
            descricao: form.descricao,
            area: form.area,
            tipo: form.tipo,
            impacto_previsto: {
              custos: Number(form.custos),
              lucro_estimado: Number(form.lucro_estimado),
              prazos: form.prazos,
              produtividade: Number(form.produtividade)
            },
            criado_por_nome: usuario?.displayName || usuario?.email,
            criado_por_id: usuario?.uid
        };

        try {
            await api.post("/decisoes", data);
            onCreated();
            setForm({
                titulo: "",
                descricao: "",
                area: "",
                tipo: "",
                custos: "",
                lucro_estimado: "",
                prazos: "",
                produtividade: ""
            });
            showSnackbar("Decisão criada com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao criar decisão:", error);
            showSnackbar("Erro ao criar decisão", "error");
        }
    };

    return (<>
    
        <form
          className="flex-1 bg-white rounded-2xl p-6 md:p-8 shadow-lg space-y-6"
          onSubmit={handleSubmit}
        >
          <h2 className="text-2xl font-semibold text-gray-800">Nova Decisão</h2>

          {/* Título e Descrição */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              name="titulo"
              label="Título"
              placeholder="Título da decisão"
              onChange={handleChange}
              value={form.titulo}
              required
              fullWidth
              variant="outlined"
            />
            <TextField
              name="descricao"
              label="Descrição"
              placeholder="Descrição detalhada"
              onChange={handleChange}
              value={form.descricao}
              required
              fullWidth
              variant="outlined"
            />
          </div>

          {/* Área e Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField name="area" value={form.area} onChange={handleChange} required labelId="area-label" label="Área" select fullWidth>
              <MenuItem value="financeiro">Financeiro</MenuItem>
              <MenuItem value="operacoes">Operações / Produção</MenuItem>
              <MenuItem value="rh">Recursos Humanos</MenuItem>
              <MenuItem value="marketing">Marketing e Vendas</MenuItem>
              <MenuItem value="ti">Tecnologia da Informação (TI)</MenuItem>
              <MenuItem value="juridico">Jurídico / Compliance</MenuItem>
              <MenuItem value="p&d">Pesquisa e Desenvolvimento (P&D)</MenuItem>
              <MenuItem value="sustentabilidade">Sustentabilidade / ESG</MenuItem>
              <MenuItem value="compras">Compras / Suprimentos</MenuItem>
              <MenuItem value="atendimento">Atendimento ao Cliente / Suporte</MenuItem>
              <MenuItem value="qualidade">Qualidade</MenuItem>
              <MenuItem value="riscos">Riscos / Segurança</MenuItem>
              <MenuItem value="parcerias">Parcerias / Negócios</MenuItem>
            </TextField>
            <TextField select fullWidth labelId="tipo-label" label="Tipo de decisão" name="tipo" onChange={handleChange} value={form.tipo} required>
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

          {/* Impactos previstos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              type="number"
              name="custos"
              label="Custos previstos"
              placeholder="Ex: 5000"
              onChange={handleChange}
              value={form.custos}
              fullWidth
              variant="outlined"
            />
            <TextField
              type="number"
              name="lucro_estimado"
              label="Lucro estimado"
              placeholder="Ex: 12000"
              onChange={handleChange}
              value={form.lucro_estimado}
              fullWidth
              variant="outlined"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              name="prazos"
              label="Impacto em prazos"
              placeholder="Ex: +2 dias"
              onChange={handleChange}
              value={form.prazos}
              fullWidth
              variant="outlined"
            />
            <TextField
              type="number"
              step="0.1"
              name="produtividade"
              label="Produtividade"
              placeholder="Número onde 1.0 é igual à produtividade atual. Ex: 1.2 = 20% mais produtivo"
              onChange={handleChange}
              value={form.produtividade}
              fullWidth
              variant="outlined"
            />
          </div>

          {/* Botão */}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            className="w-full md:w-auto"
          >
            Registrar Decisão
          </Button>
        </form>

    </>);
}