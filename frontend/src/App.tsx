import { Route, Routes } from 'react-router-dom'
import RequireAuth from './auth/RequireAuth'
import { useThemeToggle } from './theme/ThemeProvider'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import CategoriesPage from './pages/Categories'
import Reports from './pages/Reports'
import EmotionReport from './pages/EmotionReport'

export default function App() {
  const { toggleTheme, isDark } = useThemeToggle()

  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Rotas protegidas — dentro do Layout */}
      <Route element={<RequireAuth />}>
        <Route element={<Layout onToggleTheme={toggleTheme} isDark={isDark} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/emotion-report" element={<EmotionReport />} />
        </Route>
      </Route>
    </Routes>
  )
}
