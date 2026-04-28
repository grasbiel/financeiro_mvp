import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import CategoryIcon from '@mui/icons-material/Category'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ListAltIcon from '@mui/icons-material/ListAlt'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import LogoutIcon from '@mui/icons-material/Logout'
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { getCategories, logout } from '../api/api'
import type { Category } from '../types'
import QuickAddBar from './QuickAddBar'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

const SIDEBAR_WIDTH = 64

interface LayoutProps {
  onToggleTheme: () => void
  isDark: boolean
}

const NAV_ITEMS = [
  { label: 'Painel', icon: <DashboardIcon />, path: '/' },
  { label: 'Transações', icon: <ListAltIcon />, path: '/transactions' },
  { label: 'Categorias', icon: <CategoryIcon />, path: '/categories' },
]

export default function Layout({ onToggleTheme, isDark }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [categories, setCategories] = useState<Category[]>([])
  const quickAddRef = useRef<HTMLInputElement>(null)

  const fetchCategories = useCallback(async () => {
    try { setCategories(await getCategories()) } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  useKeyboardShortcuts({
    n: () => quickAddRef.current?.focus(),
    'g+d': () => navigate('/'),
    'g+t': () => navigate('/transactions'),
    'g+c': () => navigate('/categories'),
  })

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Drawer
        variant="permanent"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 2,
            overflow: 'hidden',
          },
        }}
      >
        {/* Logo */}
        <AccountBalanceWalletIcon sx={{ color: 'var(--accent)', mb: 3, fontSize: 28 }} />

        {/* Nav */}
        <List dense sx={{ width: '100%', px: 0.5, flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path
            return (
              <Tooltip key={item.path} title={item.label} placement="right">
                <ListItemButton
                  selected={active}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 'var(--radius-sm)',
                    justifyContent: 'center',
                    mb: 0.5,
                    py: 1.2,
                    '&.Mui-selected': {
                      bgcolor: 'var(--accent-soft)',
                      '& .MuiListItemIcon-root': { color: 'var(--accent)' },
                    },
                    '&:hover': { bgcolor: 'var(--bg-2)' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, color: active ? 'var(--accent)' : 'var(--text-1)', transition: 'var(--transition-fast)' }}>
                    {item.icon}
                  </ListItemIcon>
                </ListItemButton>
              </Tooltip>
            )
          })}
        </List>

        {/* Bottom actions */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Tooltip title={isDark ? 'Modo claro' : 'Modo escuro'} placement="right">
            <IconButton onClick={onToggleTheme} size="small" sx={{ color: 'var(--text-1)' }}>
              {isDark ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Sair" placement="right">
            <IconButton onClick={handleLogout} size="small" sx={{ color: 'var(--text-1)' }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Drawer>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Quick Add bar */}
        <QuickAddBar
          categories={categories}
          onSuccess={fetchCategories}
          focusRef={quickAddRef}
        />

        {/* Page content */}
        <Box sx={{ flex: 1, overflow: 'auto', bgcolor: 'var(--bg-0)' }}>
          <Outlet context={{ refreshCategories: fetchCategories }} />
        </Box>
      </Box>
    </Box>
  )
}
