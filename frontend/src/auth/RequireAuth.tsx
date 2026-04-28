import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export default function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return null  // Aguarda recuperação do token
  return user ? <Outlet /> : <Navigate to="/login" replace />
}
