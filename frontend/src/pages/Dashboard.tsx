import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CloseIcon from '@mui/icons-material/Close'
import {
  Box, Card, CardContent, Chip, CircularProgress,
  IconButton, InputAdornment, Skeleton,
  TextField, Tooltip, Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid,
  ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts'
import { getDashboard, updateTransaction } from '../api/api'
import { auroraTokens as t } from '../theme/aurora'
import type { DashboardData, Transaction } from '../types'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

// ── Helpers ───────────────���───────────────────────────────────────────────
const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTH_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

// ── KPI Card ──────────────���──────────────────────────────��────────────────
interface KpiCardProps { label: string; value: number; color: string; loading: boolean }

function KpiCard({ label, value, color, loading }: KpiCardProps) {
  return (
    <Card
      sx={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        boxShadow: 'none',
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""', position: 'absolute', top: 0, left: 0, right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${color}, transparent)`,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="caption" sx={{ color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          {label}
        </Typography>
        {loading ? (
          <Skeleton variant="text" width={140} height={56} />
        ) : (
          <Typography
            className="tabular-nums"
            sx={{ fontSize: t.fontSize['2xl'], fontWeight: 700, color, mt: 0.5, lineHeight: 1.1 }}
          >
            {fmt(value)}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

// ── Inline edit for recent transactions ──────────────────────────────────
function EditableRow({ tx, onSaved }: { tx: Transaction; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(tx.value))
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const save = async () => {
    const num = parseFloat(val.replace(',', '.'))
    if (isNaN(num) || num <= 0) { setEditing(false); return }
    setLoading(true)
    try { await updateTransaction(tx.id, { value: num }); onSaved() }
    finally { setLoading(false); setEditing(false) }
  }

  const isIncome = tx.kind === 'income'
  const color = isIncome ? 'var(--positive)' : 'var(--negative)'

  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'center', gap: 1.5, py: 1,
        borderBottom: '1px solid var(--border)',
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
          {tx.description || tx.category_name || (isIncome ? 'Receita' : 'Despesa')}
        </Typography>
        <Typography variant="caption" sx={{ color: 'var(--text-1)' }}>
          {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
          {tx.category_name && ` · ${tx.category_name}`}
        </Typography>
      </Box>

      {editing ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TextField
            inputRef={inputRef}
            size="small"
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
            InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
            sx={{ width: 120 }}
          />
          <IconButton size="small" onClick={save} disabled={loading}><SaveIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => setEditing(false)}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography className="tabular-nums" sx={{ fontWeight: 600, color, fontSize: t.fontSize.sm }}>
            {isIncome ? '+' : '−'}{fmt(tx.value)}
          </Typography>
          <Tooltip title="Editar valor">
            <IconButton size="small" onClick={() => setEditing(true)} sx={{ opacity: 0, transition: 'var(--transition-fast)', '.parent:hover &': { opacity: 1 } }}>
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  )
}

// ── Tooltip customizado para gráficos ─────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', p: 1.5, fontSize: 12 }}>
      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>{label}</Typography>
      {payload.map((p: any) => (
        <Typography key={p.dataKey} variant="caption" sx={{ color: p.color, display: 'block' }}>
          {p.name}: {fmt(p.value)}
        </Typography>
      ))}
    </Box>
  )
}

// ── Página principal ──────────────────────────────────────────────────────
export default function Dashboard() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await getDashboard(year, month)) }
    finally { setLoading(false) }
  }, [year, month])

  useEffect(() => { load() }, [load])

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1)
  }

  useKeyboardShortcuts({ '[': prevMonth, ']': nextMonth })

  // Formatar dados do fluxo mensal
  const flowData = (data?.monthly_flow || []).map(r => ({
    month: MONTHS[parseInt(r.month.split('-')[1]) - 1],
    Receitas: Number(r.income),
    Despesas: Number(r.expense),
  }))

  // Formatar top categorias (barras horizontais)
  const catData = (data?.top_categories || []).map(r => ({
    name: r.category_name,
    total: Number(r.total),
    color: t.categoryColors[(r.color_slot - 1) % 8],
  }))

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* ── Cabeçalho com seletor de mês ─────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton size="small" onClick={prevMonth} title="Mês anterior [">
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 600, minWidth: 200, textAlign: 'center' }}>
          {MONTH_FULL[month - 1]} {year}
        </Typography>
        <IconButton size="small" onClick={nextMonth} title="Próximo mês ]">
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
        <Chip label="Hoje" size="small" variant="outlined" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1) }} sx={{ ml: 1 }} />
      </Box>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <KpiCard label="Entradas" value={Number(data?.total_income ?? 0)} color="var(--positive)" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <KpiCard label="Saídas" value={Number(data?.total_expense ?? 0)} color="var(--negative)" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <KpiCard label="Saldo" value={Number(data?.balance ?? 0)}
            color={Number(data?.balance ?? 0) >= 0 ? 'var(--positive)' : 'var(--negative)'}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ── Gráficos + Transações recentes ──────────��──────────────────── */}
      <Grid container spacing={3}>
        {/* Fluxo mensal — últimos 6 meses */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ border: '1px solid var(--border)', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="h6" mb={2}>Fluxo dos últimos 6 meses</Typography>
              {loading ? <Skeleton variant="rectangular" height={240} /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={flowData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--positive)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--positive)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--negative)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--negative)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-1)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-1)' }} axisLine={false} tickLine={false}
                      tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                    <RTooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="Receitas" stroke="var(--positive)" strokeWidth={2} fill="url(#gradIncome)" />
                    <Area type="monotone" dataKey="Despesas" stroke="var(--negative)" strokeWidth={2} fill="url(#gradExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top 5 categorias — barras horizontais */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ border: '1px solid var(--border)', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" mb={2}>Top categorias</Typography>
              {loading ? <Skeleton variant="rectangular" height={240} /> : catData.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'var(--text-1)', mt: 4, textAlign: 'center' }}>
                  Nenhuma despesa este mês
                </Typography>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={catData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12, fill: 'var(--text-1)' }} axisLine={false} tickLine={false} />
                    <RTooltip content={<ChartTooltip />} formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="total" name="Total" radius={[0, 4, 4, 0]}
                      fill="var(--accent)"
                      label={{ position: 'right', formatter: (v: number) => fmt(v), fontSize: 11, fill: 'var(--text-1)' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Últimas transações com edição inline */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ border: '1px solid var(--border)', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="h6" mb={1}>Últimas transações</Typography>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="text" height={48} />)
              ) : !data?.recent_transactions?.length ? (
                <Typography variant="body2" sx={{ color: 'var(--text-1)', py: 2, textAlign: 'center' }}>
                  Nenhuma transação ainda. Use o Quick Add acima (atalho <kbd>N</kbd>).
                </Typography>
              ) : (
                <Box className="parent">
                  {data.recent_transactions.map(tx => (
                    <EditableRow key={tx.id} tx={tx} onSaved={load} />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
