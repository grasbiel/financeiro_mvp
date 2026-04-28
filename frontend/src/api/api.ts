import axios from 'axios'
import type {
  Category,
  DashboardData,
  PaginatedResponse,
  QuickAddPayload,
  Transaction,
} from '../types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/'

const api = axios.create({ baseURL: BASE_URL })

// ── Request interceptor: injeta token ─────────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

// ── Response interceptor: refresh automático ─────────────────────────────
api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refreshToken')
      if (!refresh) {
        window.location.href = '/login'
        return Promise.reject(error)
      }
      try {
        const { data } = await axios.post(`${BASE_URL}token/refresh/`, { refresh })
        localStorage.setItem('accessToken', data.access)
        if (data.refresh) localStorage.setItem('refreshToken', data.refresh)
        api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`
        original.headers['Authorization'] = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────
export const login = async (username: string, password: string) => {
  const { data } = await api.post('/token/', { username, password })
  localStorage.setItem('accessToken', data.access)
  localStorage.setItem('refreshToken', data.refresh)
  return data
}

export const logout = async () => {
  const refresh = localStorage.getItem('refreshToken')
  if (refresh) await api.post('/token/blacklist/', { refresh }).catch(() => {})
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

export const signup = async (username: string, email: string, password: string) => {
  const { data } = await api.post('/users/', { username, email, password })
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────
export const getDashboard = async (year?: number, month?: number): Promise<DashboardData> => {
  const params: Record<string, number> = {}
  if (year !== undefined) params.year = year
  if (month !== undefined) params.month = month
  const { data } = await api.get<DashboardData>('/dashboard/', { params })
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// Transactions
// ─────────────────────────────────────────────────────────────────────────────
export interface TransactionFilters {
  start?: string
  end?: string
  category?: number
  kind?: string
  emotion?: string
  page?: number
}

export const getTransactions = async (filters?: TransactionFilters) => {
  const { data } = await api.get<PaginatedResponse<Transaction>>('/transactions/', {
    params: filters,
  })
  return data
}

export const createTransaction = async (payload: Partial<Transaction>) => {
  const { data } = await api.post<Transaction>('/transactions/', payload)
  return data
}

export const updateTransaction = async (id: number, payload: Partial<Transaction>) => {
  const { data } = await api.patch<Transaction>(`/transactions/${id}/`, payload)
  return data
}

export const deleteTransaction = async (id: number) => {
  await api.delete(`/transactions/${id}/`)
}

export const quickAdd = async (payload: QuickAddPayload) => {
  const { data } = await api.post<Transaction>('/transactions/quick-add/', payload)
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────────────────────
export const getCategories = async (): Promise<Category[]> => {
  const { data } = await api.get<PaginatedResponse<Category>>('/categories/')
  return data.results
}

export const createCategory = async (name: string, color_slot = 1): Promise<Category> => {
  const { data } = await api.post<Category>('/categories/', { name, color_slot })
  return data
}

export const updateCategory = async (id: number, payload: Partial<Category>) => {
  const { data } = await api.patch<Category>(`/categories/${id}/`, payload)
  return data
}

export const archiveCategory = async (id: number) => {
  const { data } = await api.patch<Category>(`/categories/${id}/archive/`)
  return data
}

export const deleteCategory = async (id: number) => {
  await api.delete(`/categories/${id}/`)
}
