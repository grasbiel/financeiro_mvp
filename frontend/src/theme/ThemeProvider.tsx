import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material'
import { darkTheme, lightTheme } from '../theme'

interface ThemeCtx { toggleTheme: () => void; isDark: boolean }
export const ThemeToggleContext = createContext<ThemeCtx>({ toggleTheme: () => {}, isDark: true })
export const useThemeToggle = () => useContext(ThemeToggleContext)

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('dark')
  const toggleTheme = () => setMode(m => (m === 'light' ? 'dark' : 'light'))
  const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode])

  // Sync CSS var data-theme on html element
  document.documentElement.setAttribute('data-theme', mode)

  return (
    <ThemeToggleContext.Provider value={{ toggleTheme, isDark: mode === 'dark' }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeToggleContext.Provider>
  )
}
