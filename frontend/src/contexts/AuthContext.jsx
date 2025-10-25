import { createContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import api from "../services/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUsuario(user);
      if (user) {
        try {
          // Busca perfil completo no backend
          const token = await user.getIdToken(); // pega o token do firebase
          const res = await api.get("/usuarios/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setPerfil(res.data);
        } catch (err) {
          console.error("Erro ao buscar perfil:", err);
          setPerfil(null);
        }
      } else {
        setPerfil(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ usuario, perfil }}>
      {children}
    </AuthContext.Provider>
  );
}
