import express from 'express'
import 'dotenv/config'
import cors from 'cors';
import usuariosRouter from "./routes/usuarios.js";
import decisaoRoutes from './routes/decisao.js'

const app = express();
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json());

app.use("/api/usuarios", usuariosRouter);
app.use("/api/decisoes", decisaoRoutes)

app.listen(port, ()=>{console.log(`http://localhost:${port}`)});