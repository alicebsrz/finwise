import axios from 'axios';

const api = axios.create({
  // O Vite injeta a variável de ambiente automaticamente
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

export default api;