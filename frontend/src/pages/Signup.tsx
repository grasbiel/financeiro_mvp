import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import {
  Alert, Box, Button, CircularProgress, Link,
  TextField, Typography,
} from '@mui/material'
import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { signup, login } from '../api/api'

export default function Signup() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('A senha deve ter pelo menos 8 caracteres.'); return }
    setLoading(true)
    try {
      await signup(username, email, password)
      await login(username, password)
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao criar conta. Tente outro usuário.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: 'var(--bg-0)', px: 2,
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: '100%', maxWidth: 400,
          bgcolor: 'background.paper',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          p: 4,
          position: 'relative',
          '&::before': {
            content: '""', position: 'absolute', top: 0, left: 0, right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, var(--accent), transparent)',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <AccountBalanceWalletIcon sx={{ color: 'var(--accent)', fontSize: 32 }} />
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>Finance</Typography>
        </Box>

        <Typography variant="body2" sx={{ color: 'var(--text-1)', mb: 3 }}>
          Crie sua conta gratuita
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 'var(--radius-sm)' }}>{error}</Alert>}

        <TextField label="Usuário" value={username} onChange={e => setUsername(e.target.value)}
          fullWidth size="small" sx={{ mb: 2 }} autoFocus />
        <TextField label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)}
          fullWidth size="small" sx={{ mb: 2 }} />
        <TextField label="Senha (mín. 8 caracteres)" type="password" value={password}
          onChange={e => setPassword(e.target.value)} fullWidth size="small" sx={{ mb: 3 }} />

        <Button type="submit" variant="contained" fullWidth disabled={loading}
          sx={{ bgcolor: 'var(--accent)', '&:hover': { bgcolor: '#4a7bef' }, fontWeight: 600, py: 1.2, mb: 2 }}>
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Criar conta'}
        </Button>

        <Typography variant="body2" textAlign="center" sx={{ color: 'var(--text-1)' }}>
          Já tem conta?{' '}
          <Link component={RouterLink} to="/login" underline="hover" sx={{ color: 'var(--accent)', fontWeight: 500 }}>
            Entrar
          </Link>
        </Typography>
      </Box>
    </Box>
  )
}
