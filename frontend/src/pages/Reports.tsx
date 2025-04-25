import {useEffect, useState} from 'react'
import {Container} from '@mui/material'
import {
    PieChart, Pie, Cell, Tooltip, Legend
} from 'recharts'
import api from '../api/api'

interface ReportItem {category: string; total_expenses: number}

const COLORS = ['#0077fe', '#00c49f','#ffbb28', '#84fec2','#d65db1']

export default function Reports() {
    const [data, setData] = useState<ReportItem[]>([])

    useEffect(() => {
        api
            .get<ReportItem[]>('/reports/expenses_by_category/')
            .then(res => setData(res.data))
    }, [])

    return (
        <Container>
            <h2>Relatório: Despesas por Categoria</h2>
            {data.length > 0 && (
                <PieChart width={400} height={300}>
                    <Pie
                        data={data}
                        dataKey="total_expenses"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                    >
                        {data.map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `R$ ${v}`} />
                    <Legend />
                </PieChart>
            )} 
        </Container>
    );
}