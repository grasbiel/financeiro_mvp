import AddIcon from '@mui/icons-material/Add'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  InputAdornment,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { quickAdd } from '../api/api'
import type { Category, TransactionKind } from '../types'

interface QuickAddBarProps {
  categories: Category[]
  onSuccess: () => void
  focusRef?: React.RefObject<HTMLInputElement>
}

export default function QuickAddBar({ categories, onSuccess, focusRef }: QuickAddBarProps) {
  const [kind, setKind] = useState<TransactionKind>('expense')
  const [value, setValue] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [showDate, setShowDate] = useState(false)
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const valueRef = useRef<HTMLInputElement>(null)

  // expor ref para foco externo (atalho N)
  useEffect(() => {
    if (focusRef && 'current' in focusRef) {
      // @ts-ignore
      focusRef.current = valueRef.current
    }
  }, [focusRef])

  const activeCategories = categories.filter(c => !c.archived)

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    const num = parseFloat(value.replace(',', '.'))
    if (!value || isNaN(num) || num <= 0) {
      setError('Informe um valor válido')
      return
    }
    setLoading(true)
    try {
      await quickAdd({
        kind,
        value: num,
        category_name: categoryName || undefined,
        date: date || undefined,
      })
      setValue('')
      setCategoryName('')
      setDate('')
      setShowDate(false)
      onSuccess()
      valueRef.current?.focus()
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1,
        borderBottom: '1px solid var(--border)',
        bgcolor: 'background.paper',
        backdropFilter: 'blur(12px)',
        flexWrap: { xs: 'wrap', md: 'nowrap' },
      }}
    >
      {/* Toggle Entrada / Saída */}
      <ToggleButtonGroup
        value={kind}
        exclusive
        onChange={(_, v) => v && setKind(v)}
        size="small"
        sx={{ flexShrink: 0 }}
      >
        <ToggleButton
          value="income"
          sx={{
            '&.Mui-selected': { bgcolor: 'var(--positive)', color: '#fff',
              '&:hover': { bgcolor: 'var(--positive)' } },
            borderRadius: 'var(--radius-sm) !important',
            px: 1.5, fontSize: '0.75rem', fontWeight: 600,
          }}
        >
          + Entrada
        </ToggleButton>
        <ToggleButton
          value="expense"
          sx={{
            '&.Mui-selected': { bgcolor: 'var(--negative)', color: '#fff',
              '&:hover': { bgcolor: 'var(--negative)' } },
            borderRadius: 'var(--radius-sm) !important',
            px: 1.5, fontSize: '0.75rem', fontWeight: 600,
          }}
        >
          − Saída
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Valor */}
      <TextField
        inputRef={valueRef}
        size="small"
        placeholder="0,00"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        error={!!error}
        helperText={error}
        InputProps={{
          startAdornment: <InputAdornment position="start">R$</InputAdornment>,
          sx: { fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums' },
        }}
        sx={{ width: 140 }}
      />

      {/* Categoria */}
      <Autocomplete
        freeSolo
        options={activeCategories.map(c => c.name)}
        value={categoryName}
        onInputChange={(_, v) => setCategoryName(v)}
        size="small"
        sx={{ flex: 1, minWidth: 160 }}
        renderInput={params => (
          <TextField {...params} placeholder="Categoria (opcional)" />
        )}
      />

      {/* Data (colapsável) */}
      <Tooltip title="Definir data (padrão: hoje)">
        <Chip
          label={showDate ? (date || 'hoje') : 'hoje'}
          onClick={() => setShowDate(v => !v)}
          icon={<ExpandMoreIcon sx={{ fontSize: 14, transform: showDate ? 'rotate(180deg)' : 'none', transition: 'var(--transition-fast)' }} />}
          size="small"
          variant="outlined"
          sx={{ cursor: 'pointer', flexShrink: 0 }}
        />
      </Tooltip>

      <Collapse in={showDate} orientation="horizontal">
        <TextField
          type="date"
          size="small"
          value={date}
          onChange={e => setDate(e.target.value)}
          sx={{ width: 150 }}
          InputLabelProps={{ shrink: true }}
        />
      </Collapse>

      {/* Botão */}
      <Button
        type="submit"
        variant="contained"
        disabled={loading}
        startIcon={<AddIcon />}
        sx={{
          flexShrink: 0,
          bgcolor: 'var(--accent)',
          '&:hover': { bgcolor: '#4a7bef' },
          borderRadius: 'var(--radius-sm)',
          fontWeight: 600,
        }}
      >
        {loading ? '...' : 'Lançar'}
      </Button>
    </Box>
  )
}
