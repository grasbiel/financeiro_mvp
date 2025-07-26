import {useEffect, useState} from 'react'
import {Container, Typography} from '@mui/material'
import {
    PieChart, Pie, Cell, Tooltip, Legend
} from 'recharts'
import api from '../api/api'

interface EmotionData {
    emotional_trigger: string;
    total_expenses: number
}

const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#8BC34A', '#FF9800', '#9C27B0', '#607D8B'];

export default function EmotionReport() {
    const [data, setData] = useState<EmotionData[]>([]);

    useEffect(() => {
        api.get<EmotionData[]>('/reports/emotional-spending/')
            .then(res => setData(res.data))
            .catch(err => console.error(err))
    }, []);


    return (
        <Container>
            <Typography variant="h5" sx={{mt: 4, mb: 2}}>
                Despesas por Gatilho Emocional
            </Typography>
            {data.length > 0 && (
                <PieChart width={400} height={300}>
                    <Pie
                        data={data}
                        dataKey="total_expenses"
                        nameKey="emotional_trigger"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                    >
                        {data.map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `R$ ${value}`} />
                    <Legend />
                </PieChart>
            )} 
        </Container>
    )
}