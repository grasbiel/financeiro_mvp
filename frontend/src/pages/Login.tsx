import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import {
  Alert, Box, Button, CircularProgress, Link,
  TextField, Typography,
} from '@mui/material'
import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { login } from '../api/api'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch {
      setError('Usuário ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'var(--bg-0)',
        px: 2,
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: '100%',
          maxWidth: 400,
          bgcolor: 'background.paper',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          p: 4,
          backdropFilter: 'blur(12px)',
          position: 'relative',
          '&::before': {
            content: '""', position: 'absolute', top: 0, left: 0, right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, var(--accent), transparent)',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
          },
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <AccountBalanceWalletIcon sx={{ color: 'var(--accent)', fontSize: 32 }} />
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
            Finance
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ color: 'var(--text-1)', mb: 3 }}>
          Entre para gerenciar suas finanças
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 'var(--radius-sm)' }}>{error}</Alert>}

        <TextField
          label="Usuário"
          value={username}
          onChange={e => setUsername(e.target.value)}
          fullWidth
          size="small"
          sx={{ mb: 2 }}
          autoComplete="username"
          autoFocus
        />
        <TextField
          label="Senha"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          fullWidth
          size="small"
          sx={{ mb: 3 }}
          autoComplete="current-password"
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{
            bgcolor: 'var(--accent)', '&:hover': { bgcolor: '#4a7bef' },
            fontWeight: 600, py: 1.2, mb: 2,
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Entrar'}
        </Button>

        <Typography variant="body2" textAlign="center" sx={{ color: 'var(--text-1)' }}>
          Não tem conta?{' '}
          <Link component={RouterLink} to="/signup" underline="hover" sx={{ color: 'var(--accent)', fontWeight: 500 }}>
            Criar conta
          </Link>
        </Typography>
      </Box>
    </Box>
  )
}
