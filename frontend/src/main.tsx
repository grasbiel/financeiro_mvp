import { createRoot } from 'react-dom/client'
import React from 'react'
import './index.css'
import App from './App.tsx'
import { AppThemeProvider } from './theme/ThemeProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppThemeProvider>
      <App />
    </AppThemeProvider>
  </React.StrictMode>,
)
