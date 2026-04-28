/**
 * Design System Aurora
 * Paleta, tipografia e tokens para o Finance MVP.
 */

export const auroraTokens = {
  // ── Paleta ────────────────────────────────────────────────────────────────
  colors: {
    light: {
      bg0: '#F7F8FB',
      bg1: '#FFFFFF',
      bg2: '#EEF1F6',
      text0: '#0B1220',
      text1: '#4A5568',
      accent: '#5B8CFF',
      accentSoft: '#E5EDFF',
      positive: '#2BB673',
      negative: '#E5484D',
      warning: '#E0A100',
      border: '#E5E9F0',
    },
    dark: {
      bg0: '#0B0F14',
      bg1: '#10151C',
      bg2: '#161D26',
      text0: '#E6EDF6',
      text1: '#9AA6B2',
      accent: '#7AA2FF',
      accentSoft: '#1B2A4A',
      positive: '#3DD598',
      negative: '#FF6B6B',
      warning: '#F5C451',
      border: '#1F2733',
    },
  },
  // ── Tipografia ────────────────────────────────────────────────────────────
  fontFamily: {
    base: '"Inter", "Geist", system-ui, sans-serif',
    mono: '"JetBrains Mono", "Fira Mono", monospace',
  },
  fontSize: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    md: '1rem',      // 16px
    lg: '1.25rem',   // 20px
    xl: '1.5rem',    // 24px
    '2xl': '2rem',   // 32px
    '3xl': '3rem',   // 48px
  },
  // ── Forma ─────────────────────────────────────────────────────────────────
  radius: {
    sm: '8px',
    md: '12px',
    pill: '999px',
  },
  // ── Espaçamento (múltiplos de 8px) ────────────────────────────────────────
  space: {
    1: '8px',
    2: '16px',
    3: '24px',
    4: '32px',
    5: '40px',
    6: '48px',
  },
  // ── Sombras ───────────────────────────────────────────────────────────────
  shadow: {
    card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    focus: '0 0 0 2px #5B8CFF',
  },
  // ── Animação ──────────────────────────────────────────────────────────────
  transition: {
    fast: '150ms cubic-bezier(0.2,0.8,0.2,1)',
    counter: '400ms cubic-bezier(0.2,0.8,0.2,1)',
  },
  // ── Slots de cor para categorias (8 cores derivadas do accent) ────────────
  categoryColors: [
    '#5B8CFF', // slot 1 — accent
    '#2BB673', // slot 2 — positive
    '#E0A100', // slot 3 — warning
    '#A78BFA', // slot 4 — lavender
    '#38BDF8', // slot 5 — sky
    '#FB7185', // slot 6 — rose
    '#34D399', // slot 7 — emerald
    '#F97316', // slot 8 — orange
  ],
} as const

export type AuroraTokens = typeof auroraTokens
