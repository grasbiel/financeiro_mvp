import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL

if (!baseURL && import.meta.env.DEV){
    console.error(
        'A variável de ambiente VITE_API_URL não está definida' +
        'Crie um arquivo .env.local e defina VITE_API_URL=http://localhost:8000/api'
    )
}
const api = axios.create({
    baseURL: baseURL,
});

api.interceptors.request.use(cfg => {
    const token = localStorage.getItem('accessToken');
    if (token && cfg.headers) cfg.headers.Authorization = `Bearer ${token}`;

    return cfg;
});

export default api;