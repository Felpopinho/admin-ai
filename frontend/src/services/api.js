import axios from 'axios';
import { auth } from "./firebase.js";

const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
});

// Middleware para incluir token automaticamente
api.interceptors.request.use(async config => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
