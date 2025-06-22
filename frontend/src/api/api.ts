import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL

const api = axios.create({
    baseURL: baseURL
});

api.interceptors.request.use(cfg => {
    const token = localStorage.getItem('token');
    if (token && cfg.headers) cfg.headers.Authorization = `Bearer ${token}`;

    return cfg;
});

export default api;