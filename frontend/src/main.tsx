import { createRoot } from 'react-dom/client'
import React from 'react'
import './index.css'
import App from './App.tsx'
import { AppThemeProvider } from './theme/ThemeProvider.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* O BrowserRouter deve envolver o APP e os Providers que usam rotas*/}
    <BrowserRouter>
      <AppThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </AppThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
