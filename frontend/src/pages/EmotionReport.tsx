import {
  Box, Card, CardContent, CircularProgress, Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import api from '../api/api'
import { auroraTokens as t } from '../theme/aurora'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function EmotionReport() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reports/emotional-expenses/')
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Box sx={{ p: 3, maxWidth: 800 }}>
      <Typography variant="h5" fontWeight={600} mb={3}>Relatório Emocional</Typography>
      <Card sx={{ border: '1px solid var(--border)', boxShadow: 'none' }}>
        <CardContent>
          <Typography variant="h6" mb={2}>Gastos por gatilho emocional</Typography>
          {loading ? (
            <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>
          ) : data.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'var(--text-1)', py: 4, textAlign: 'center' }}>
              Nenhum dado disponível
            </Typography>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 80, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="emotional_trigger" width={150}
                  tick={{ fontSize: 12, fill: 'var(--text-1)' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="total_spent" name="Total gasto" radius={[0, 4, 4, 0]}>
                  {data.map((_: any, i: number) => (
                    <Cell key={i} fill={t.categoryColors[i % t.categoryColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
