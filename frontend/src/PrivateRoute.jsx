import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./contexts/AuthContext";

export default function PrivateRoute({ children }) {
  const { usuario } = useContext(AuthContext);
  return usuario ? children : <Navigate to="/login" />;
}
