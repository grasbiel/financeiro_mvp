import {
  Box, Card, CardContent, CircularProgress,
  FormControl, InputLabel, MenuItem, Select, Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import { useEffect, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import api from '../api/api'
import { auroraTokens as t } from '../theme/aurora'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function Reports() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [catData, setCatData] = useState<any[]>([])
  const [emotionData, setEmotionData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = { year, month }
    Promise.all([
      api.get('/reports/category-expenses/', { params }),
      api.get('/reports/emotional-expenses/', { params }),
    ])
      .then(([cat, emo]) => { setCatData(cat.data); setEmotionData(emo.data) })
      .finally(() => setLoading(false))
  }, [year, month])

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Typography variant="h5" fontWeight={600}>Relatórios</Typography>
        <Select size="small" value={month} onChange={e => setMonth(Number(e.target.value))} sx={{ minWidth: 110 }}>
          {MONTHS.map((m, i) => <MenuItem key={i+1} value={i+1}>{m}</MenuItem>)}
        </Select>
        <Select size="small" value={year} onChange={e => setYear(Number(e.target.value))}>
          {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map(y => (
            <MenuItem key={y} value={y}>{y}</MenuItem>
          ))}
        </Select>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: '1px solid var(--border)', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="h6" mb={2}>Top categorias de despesa</Typography>
              {loading ? <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box> : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={catData} layout="vertical" margin={{ top: 4, right: 80, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="category_name" width={100}
                      tick={{ fontSize: 12, fill: 'var(--text-1)' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="total_spent" name="Total" radius={[0, 4, 4, 0]}>
                      {catData.map((_: any, i: number) => (
                        <Cell key={i} fill={t.categoryColors[i % t.categoryColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: '1px solid var(--border)', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="h6" mb={2}>Gastos por gatilho emocional</Typography>
              {loading ? <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box> : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={emotionData} layout="vertical" margin={{ top: 4, right: 80, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="emotional_trigger" width={140}
                      tick={{ fontSize: 11, fill: 'var(--text-1)' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="total_spent" name="Total" radius={[0, 4, 4, 0]}>
                      {emotionData.map((_: any, i: number) => (
                        <Cell key={i} fill={t.categoryColors[i % t.categoryColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
