import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import SaveIcon from '@mui/icons-material/Save'
import CloseIcon from '@mui/icons-material/Close'
import FilterListIcon from '@mui/icons-material/FilterList'
import {
  Box, Button, Chip, CircularProgress, Collapse, FormControl,
  IconButton, InputAdornment, InputLabel, MenuItem, Select,
  Snackbar, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography, Paper,
} from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  deleteTransaction, getCategories, getTransactions, updateTransaction,
} from '../api/api'
import type { Category, Transaction } from '../types'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const EMOTIONAL_TRIGGERS = [
  'Necessidade Básica', 'Planejamento/Objetivo', 'Prazer/Entretenimento',
  'Impulso Emocional', 'Pressão Social/Status', 'Conforto/Compulsão', 'Curiosidade/Exploração',
]

// ── Célula editável inline ───────────────────────────────────────────────
function EditableValueCell({ tx, onSaved }: { tx: Transaction; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(tx.value))
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  const save = async () => {
    const num = parseFloat(val.replace(',', '.'))
    if (!isNaN(num) && num > 0) await updateTransaction(tx.id, { value: num })
    setEditing(false)
    onSaved()
  }

  const color = tx.kind === 'income' ? 'var(--positive)' : 'var(--negative)'

  if (editing) {
    return (
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
        <TextField
          inputRef={ref}
          size="small"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
          sx={{ width: 120 }}
        />
        <IconButton size="small" onClick={save}><SaveIcon fontSize="small" /></IconButton>
        <IconButton size="small" onClick={() => setEditing(false)}><CloseIcon fontSize="small" /></IconButton>
      </Box>
    )
  }

  return (
    <Tooltip title="Clique para editar">
      <Typography
        className="tabular-nums"
        onClick={() => setEditing(true)}
        sx={{ cursor: 'pointer', fontWeight: 600, color, fontSize: '0.875rem',
          '&:hover': { textDecoration: 'underline' } }}
      >
        {tx.kind === 'income' ? '+' : '−'}{fmt(tx.value)}
      </Typography>
    </Tooltip>
  )
}

// ── Página ────────────────────────────────────────────────────────────────
export default function Transactions() {
  const now = new Date()
  const [txs, setTxs] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null)
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Filtros
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterKind, setFilterKind] = useState<string>('')
  const [filterEmotion, setFilterEmotion] = useState<string>('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0)
      const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`
      const [data, cats] = await Promise.all([
        getTransactions({
          start: firstDay, end: lastDayStr,
          ...(filterCategory ? { category: parseInt(filterCategory) } : {}),
          ...(filterKind ? { kind: filterKind } : {}),
          ...(filterEmotion ? { emotion: filterEmotion } : {}),
        }),
        getCategories(),
      ])
      setTxs(data.results)
      setCategories(cats)
    } finally { setLoading(false) }
  }, [year, month, filterCategory, filterKind, filterEmotion])

  useEffect(() => { load() }, [load])

  // Delete com undo
  const handleDeleteClick = (tx: Transaction) => {
    setPendingDelete(tx)
    setToastOpen(true)
    deleteTimer.current = setTimeout(async () => {
      await deleteTransaction(tx.id)
      load()
      setPendingDelete(null)
    }, 6000)
  }

  const handleUndo = () => {
    if (deleteTimer.current) clearTimeout(deleteTimer.current)
    setPendingDelete(null)
    setToastOpen(false)
  }

  const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight={600}>Transações</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Select size="small" value={month} onChange={e => setMonth(Number(e.target.value))} sx={{ minWidth: 110 }}>
            {MONTHS.map((m, i) => <MenuItem key={i+1} value={i+1}>{m}</MenuItem>)}
          </Select>
          <Select size="small" value={year} onChange={e => setYear(Number(e.target.value))}>
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map(y => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
          <Button variant="outlined" size="small" startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(v => !v)}>
            Filtros
          </Button>
        </Box>
      </Box>

      {/* Filtros extras */}
      <Collapse in={showFilters}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Tipo</InputLabel>
            <Select value={filterKind} label="Tipo" onChange={e => setFilterKind(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="income">Receita</MenuItem>
              <MenuItem value="expense">Despesa</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Categoria</InputLabel>
            <Select value={filterCategory} label="Categoria" onChange={e => setFilterCategory(e.target.value)}>
              <MenuItem value="">Todas</MenuItem>
              {categories.filter(c => !c.archived).map(c => (
                <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Gatilho emocional</InputLabel>
            <Select value={filterEmotion} label="Gatilho emocional" onChange={e => setFilterEmotion(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              {EMOTIONAL_TRIGGERS.map(et => <MenuItem key={et} value={et}>{et}</MenuItem>)}
            </Select>
          </FormControl>
          <Button size="small" onClick={() => { setFilterKind(''); setFilterCategory(''); setFilterEmotion('') }}>
            Limpar
          </Button>
        </Box>
      </Collapse>

      {/* Tabela */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 600, color: 'var(--text-1)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' } }}>
              <TableCell>Data</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Gatilho</TableCell>
              <TableCell align="right">Valor</TableCell>
              <TableCell width={48} />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Box sx={{ height: 20, bgcolor: 'var(--bg-2)', borderRadius: 1 }} /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : txs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'var(--text-1)' }}>
                  Nenhuma transação encontrada
                </TableCell>
              </TableRow>
            ) : txs.map(tx => (
              <TableRow
                key={tx.id}
                sx={{
                  opacity: pendingDelete?.id === tx.id ? 0.35 : 1,
                  transition: 'var(--transition-fast)',
                  '&:hover': { bgcolor: 'var(--bg-2)' },
                }}
              >
                <TableCell sx={{ fontSize: '0.8rem', color: 'var(--text-1)', whiteSpace: 'nowrap' }}>
                  {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell sx={{ maxWidth: 200 }}>
                  <Typography variant="body2" noWrap>{tx.description || '—'}</Typography>
                </TableCell>
                <TableCell>
                  {tx.category_name ? (
                    <Chip label={tx.category_name} size="small" sx={{ fontSize: '0.7rem' }} />
                  ) : <Typography variant="caption" sx={{ color: 'var(--text-1)' }}>—</Typography>}
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ color: 'var(--text-1)' }}>{tx.emotional_trigger || '—'}</Typography>
                </TableCell>
                <TableCell align="right">
                  <EditableValueCell tx={tx} onSaved={load} />
                </TableCell>
                <TableCell>
                  <Tooltip title="Excluir (com desfazer)">
                    <IconButton size="small" onClick={() => handleDeleteClick(tx)} sx={{ color: 'var(--text-1)', '&:hover': { color: 'var(--negative)' } }}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Toast de desfazer exclusão */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={6000}
        onClose={(_, reason) => { if (reason === 'timeout') setToastOpen(false) }}
        message={`"${pendingDelete?.description || pendingDelete?.category_name || 'Transação'}" será excluída`}
        action={
          <Button color="warning" size="small" onClick={handleUndo} sx={{ fontWeight: 700 }}>
            Desfazer
          </Button>
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
