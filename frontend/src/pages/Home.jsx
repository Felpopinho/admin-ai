import React, { useContext } from "react";
import DecisionForm from "../components/DecisionForm";
import DecisionList from "../components/DecisionList";
import { AuthContext } from "../contexts/AuthContext";
import { Button, Divider } from "@mui/material";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase.js";
import { useNavigate } from "react-router-dom";
import Dashboard from "./Dashboard.jsx";

export default function Home() {
  const [atualizar, setAtualizar] = React.useState(false);
  const { usuario, perfil } = useContext(AuthContext);
  const navigate = useNavigate();
  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex flex-col gap-[20px]">

      <div className="flex justify-between items-center p-4 pb-0">
        <h1 className="font-bold text-2xl">ADMIN.AI</h1>
        <p>Olá, {usuario?.displayName || usuario?.email}</p>
        <div>
          <p className="capitalize">{perfil?.nivel}</p>
          {perfil?.nivel === "gestor" ? <Button variant="outlined" onClick={() => navigate('/dashboard')}>Dashboard</Button> : ""}
         </div>
        <Button variant="outlined" onClick={handleLogout}>Sair</Button>
      </div>
      <Divider />
      <DecisionForm onCreated={() => setAtualizar(!atualizar)} />
      <DecisionList key={atualizar}/>
    </div>
  );
}
