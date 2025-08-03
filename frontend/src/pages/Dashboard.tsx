import React, {useEffect, useState} from 'react';
import {Typography, Box, CardContent, Card, FormControl, InputLabel, Select, SelectChangeEvent, MenuItem} from '@mui/material';
import Grid from '@mui/material/Grid'
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

import api from '../api/api'

interface ChartContainerProps {
    title: string
    children: React.ReactElement
}


const ChartContainer = ({ title, children }: ChartContainerProps) => (
    <Card sx={{ height: '100%' }}>
        <CardContent>
            <Typography variant="h6" component="div" gutterBottom>
                {title}
            </Typography>
            <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    {children}
                </ResponsiveContainer>
            </Box>
        </CardContent>
    </Card>
);


export default function DashBoard() {
    
    
    const [monthlyFlow, setMonthlyFlow]  = useState<any[]>([])
    const [categoryExpenses, setCategoryExpenses] = useState<any[]>([])
    const [emotionalExpenses, setEmotionalExpenses] = useState<any[]>([])

    const [year, setYear] = useState(new Date().getFullYear())
    const [month, setMonth]= useState(new Date().getMonth() +1)

    const availableYears = Array.from({length: 5}, (_, i) => new Date().getFullYear() -i)
    const months = [
        {value: 1, label: 'Janeiro'}, {value: 2, label: 'Fevereiro'},
        {value: 3 , label: 'Março'}, {value: 4, label: 'Abril'}, 
        {value: 5, label: 'Maio'}, {value: 6, label: 'Junho'},
        {value: 7, label: 'Julho'}, {value: 8, label: 'Agosto'},
        {value: 9, label: 'Setembro'}, {value: 10, label: 'Outubro'},
        {value: 11, label: 'Novembro'}, {value: 12, label: 'Dezembro'}
    ]


    useEffect(() => {
        const fetchDashboardData = async () => {
            try{
                 const params = { year, month };

                // Chamadas para a API com os filtros
                const monthlyFlowRes = await api.get('/reports/monthly-flow/', { params });
                setMonthlyFlow(monthlyFlowRes.data);

                // Assumindo que estas são as URLs corretas para os outros gráficos
                const categoryExpensesRes = await api.get('/reports/category-expenses/', { params });
                setCategoryExpenses(categoryExpensesRes.data);

                const emotionalExpensesRes = await api.get('/reports/emotional-expenses/', { params });
                setEmotionalExpenses(emotionalExpensesRes.data);

            } catch (error) {
                console.error("Erro ao buscar dados do dashboard:", error);
                // Opcional: Limpar os dados ou mostrar uma mensagem de erro na UI
                setMonthlyFlow([]);
                setCategoryExpenses([]);
                setEmotionalExpenses([]);
            }
        }

        fetchDashboardData()
        
    }, [year, month])
    

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            {/* CABEÇALHO COM TÍTULO E FILTROS */}
            <Grid container spacing={2} mb={3} alignItems="center">
                <Grid size={{xs:12}}>
                    <Typography variant="h5" component="h1">Dashboard</Typography>
                </Grid>
                <Grid>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel id="month-select-label">Mês</InputLabel>
                        <Select
                            labelId="month-select-label"
                            value={month}
                            label="Mês"
                            onChange={(e: SelectChangeEvent<number>) => setMonth(e.target.value as number)}
                        >
                            {months.map((m) => (
                                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                        <InputLabel id="year-select-label">Ano</InputLabel>
                        <Select
                            labelId="year-select-label"
                            value={year}
                            label="Ano"
                            onChange={(e: SelectChangeEvent<number>) => setYear(e.target.value as number)}
                        >
                            {availableYears.map((y) => (
                                <MenuItem key={y} value={y}>{y}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            {/* GRÁFICOS */}
            <Grid container spacing={3}>
                <Grid size={{xs:12}}>
                    <ChartContainer title='Fluxo de Caixa no Mês'>
                        <BarChart data={monthlyFlow} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                            <Legend />
                            <Bar dataKey="receita" fill="#2e7d32" name="Receita" />
                            <Bar dataKey="despesa" fill="#d32f2f" name="Despesa" />
                        </BarChart>
                    </ChartContainer>
                </Grid>
                <Grid size={{md:6}}>
                    <ChartContainer title='Top 5 Despesas por Categoria'>
                        <BarChart data={categoryExpenses} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="category_name" width={100} stroke="#FFFFFF" />
                            <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                            <Legend />
                            <Bar dataKey="total_spent" fill="#1976d2" name="Total Gasto" />
                        </BarChart>
                    </ChartContainer>
                </Grid>
                <Grid size={{ md:6}}>
                    <ChartContainer title='Top 5 Despesas por Gatilho Emocional'>
                         <BarChart data={emotionalExpenses} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="emotional_trigger" width={120} stroke="#FFFFFF" />
                            <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                            <Legend />
                            <Bar dataKey="total_spent" fill="#7b1fa2" name="Total Gasto" />
                        </BarChart>
                    </ChartContainer>
                </Grid>
            </Grid>
        </Box>
    );
}