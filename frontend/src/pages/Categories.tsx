import AddIcon from '@mui/icons-material/Add'
import ArchiveIcon from '@mui/icons-material/Archive'
import UnarchiveIcon from '@mui/icons-material/Unarchive'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion, AccordionDetails, AccordionSummary,
  Box, Chip, CircularProgress, IconButton, InputAdornment,
  List, ListItem, ListItemText, TextField, Tooltip, Typography, Button,
} from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'
import { archiveCategory, createCategory, getCategories, updateCategory } from '../api/api'
import { auroraTokens as t } from '../theme/aurora'
import type { Category } from '../types'

function CategoryRow({ cat, onChanged }: { cat: Category; onChanged: () => void }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(cat.name)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) ref.current?.select() }, [editing])

  const save = async () => {
    if (!name.trim() || name === cat.name) { setEditing(false); return }
    setSaving(true)
    try { await updateCategory(cat.id, { name: name.trim() }); onChanged() }
    finally { setSaving(false); setEditing(false) }
  }

  const toggleArchive = async () => {
    await archiveCategory(cat.id)
    onChanged()
  }

  const color = t.categoryColors[(cat.color_slot - 1) % 8]

  return (
    <ListItem
      sx={{
        borderRadius: 'var(--radius-sm)',
        mb: 0.5,
        border: '1px solid var(--border)',
        bgcolor: 'background.paper',
        '&:hover .row-actions': { opacity: 1 },
        opacity: cat.archived ? 0.55 : 1,
        transition: 'var(--transition-fast)',
      }}
      secondaryAction={
        <Box className="row-actions" sx={{ display: 'flex', gap: 0.5, opacity: 0, transition: 'var(--transition-fast)' }}>
          {!editing && (
            <>
              <Tooltip title="Renomear">
                <IconButton size="small" onClick={() => setEditing(true)}><EditIcon fontSize="small" /></IconButton>
              </Tooltip>
              <Tooltip title={cat.archived ? 'Desarquivar' : 'Arquivar'}>
                <IconButton size="small" onClick={toggleArchive}>
                  {cat.archived ? <UnarchiveIcon fontSize="small" /> : <ArchiveIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </>
          )}
          {editing && (
            <>
              <IconButton size="small" onClick={save} disabled={saving}><SaveIcon fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => { setEditing(false); setName(cat.name) }}><CloseIcon fontSize="small" /></IconButton>
            </>
          )}
        </Box>
      }
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, pr: 8 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
        {editing ? (
          <TextField
            inputRef={ref}
            size="small"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setEditing(false); setName(cat.name) } }}
            variant="standard"
            sx={{ flex: 1 }}
            autoFocus
          />
        ) : (
          <Typography variant="body2" fontWeight={500}>{cat.name}</Typography>
        )}
      </Box>
    </ListItem>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const newRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setCategories(await getCategories()) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (showNew) newRef.current?.focus() }, [showNew])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try { await createCategory(newName.trim()); setNewName(''); setShowNew(false); load() }
    finally { setCreating(false) }
  }

  const active = categories.filter(c => !c.archived)
  const archived = categories.filter(c => c.archived)

  return (
    <Box sx={{ p: 3, maxWidth: 600 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>Categorias</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />}
          onClick={() => setShowNew(v => !v)}
          sx={{ bgcolor: 'var(--accent)', '&:hover': { bgcolor: '#4a7bef' } }}>
          Nova categoria
        </Button>
      </Box>

      {/* Formulário de criação */}
      {showNew && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            inputRef={newRef}
            size="small"
            placeholder="Nome da categoria"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowNew(false) }}
            fullWidth
          />
          <Button variant="contained" size="small" onClick={handleCreate} disabled={creating || !newName.trim()}
            sx={{ bgcolor: 'var(--accent)', flexShrink: 0 }}>
            {creating ? '...' : 'Criar'}
          </Button>
          <IconButton size="small" onClick={() => setShowNew(false)}><CloseIcon /></IconButton>
        </Box>
      )}

      {/* Lista ativa */}
      {loading ? (
        <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>
      ) : active.length === 0 && !showNew ? (
        <Typography variant="body2" sx={{ color: 'var(--text-1)', py: 4, textAlign: 'center' }}>
          Nenhuma categoria ainda. Crie a primeira!
        </Typography>
      ) : (
        <List dense disablePadding>
          {active.map(cat => <CategoryRow key={cat.id} cat={cat} onChanged={load} />)}
        </List>
      )}

      {/* Categorias arquivadas */}
      {archived.length > 0 && (
        <Accordion elevation={0} sx={{ mt: 3, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm) !important', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2" sx={{ color: 'var(--text-1)', fontWeight: 500 }}>
              Arquivadas ({archived.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <List dense disablePadding>
              {archived.map(cat => <CategoryRow key={cat.id} cat={cat} onChanged={load} />)}
            </List>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  )
}
