import { createTheme } from '@mui/material/styles'
import { auroraTokens as t } from './theme/aurora'

const shared = {
  typography: {
    fontFamily: t.fontFamily.base,
    h1: { fontSize: t.fontSize['3xl'], fontWeight: 600, letterSpacing: '-0.01em' },
    h2: { fontSize: t.fontSize['2xl'], fontWeight: 600, letterSpacing: '-0.01em' },
    h3: { fontSize: t.fontSize.xl, fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontSize: t.fontSize.lg, fontWeight: 600 },
    h5: { fontSize: t.fontSize.md, fontWeight: 600 },
    h6: { fontSize: t.fontSize.sm, fontWeight: 600 },
    body1: { fontSize: t.fontSize.md },
    body2: { fontSize: t.fontSize.sm },
    caption: { fontSize: t.fontSize.xs },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: t.radius.sm,
          textTransform: 'none' as const,
          fontWeight: 500,
          transition: t.transition.fast,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: t.radius.md,
          boxShadow: t.shadow.card,
          backgroundImage: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: t.radius.sm },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: t.radius.pill },
      },
    },
  },
}

const l = t.colors.light
const d = t.colors.dark

export const lightTheme = createTheme({
  ...shared,
  palette: {
    mode: 'light',
    background: { default: l.bg0, paper: l.bg1 },
    primary: { main: l.accent },
    success: { main: l.positive },
    error: { main: l.negative },
    warning: { main: l.warning },
    text: { primary: l.text0, secondary: l.text1 },
    divider: l.border,
  },
})

export const darkTheme = createTheme({
  ...shared,
  palette: {
    mode: 'dark',
    background: { default: d.bg0, paper: d.bg1 },
    primary: { main: d.accent },
    success: { main: d.positive },
    error: { main: d.negative },
    warning: { main: d.warning },
    text: { primary: d.text0, secondary: d.text1 },
    divider: d.border,
  },
})
