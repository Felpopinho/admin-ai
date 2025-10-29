import { Button, Card, CardContent, Typography, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Icon, MenuItem, Tooltip, Box } from "@mui/material";
import { useContext, useState } from "react";
import DecisionDialog from "./DecisionDialog";

export default function DecisionCard({ data, onAtualizar }) {

  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
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
    <DecisionDialog open={open} onClose={handleClose} data={data} onAtualizar={onAtualizar} />
  </>
  );
}
