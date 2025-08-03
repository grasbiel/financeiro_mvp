import axios from 'axios'
import { Transaction } from '../types';


const baseURL = import.meta.env.REACT_APP_API_URL || "https://financeiro-mvp.onrender.com/api/";

const api = axios.create(
    {
        baseURL: baseURL
    }
)

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken')
        if(token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async(error) => {
        const originalRequest= error.config

        if (error.response.status == 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    console.error("Refresh token não encontrado. Faça login novamente")
                    window.location.href="/login";
                    return Promise.reject(error)
                }
                const response= await axios.post(`${baseURL}token/refresh/`,{
                    refresh: refreshToken
                });

                if (response.status == 200) {
                    const { access, refresh} = response.data;

                    localStorage.setItem('accessToken', access)

                    if (refresh) {
                        localStorage.setItem('refreshToken', refresh);
                    }

                    api.defaults.headers.common['Authorization'] = `Bearer ${access}`;

                    originalRequest.headers['Authorization'] = `Bearer ${access}`;

                    return api(originalRequest)
                }
            } catch (refreshError) {
                console.error("Sessão expirada. Não foi possível atualizar o token", refreshError)
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                window.location.href='/login'
                return Promise.reject(refreshError)
            }
        }
        return Promise.reject(error)
    }
 )

export default api;


export const getTransactions = async () =>{
    const response = await api.get<{results: Transaction[]}>('/transactions/');
    return response.data.results
}

export const deleteTransaction = async (id: number): Promise<void>=>{
    await api.delete(`/transactions/${id}/`)
}

