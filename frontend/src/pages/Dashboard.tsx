import {useEffect, useState} from 'react';
import {Typography, Container, Paper, Box, CircularProgress, Alert} from '@mui/material';
import Grid from '@mui/material/Grid'
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

import api from '../api/api'

import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import { JSX } from '@emotion/react/jsx-runtime';


interface SummaryData {
    receitas: number
    despesas: number
    saldo: number
}

interface CategoryData {
    category__name: string
    total_spent: number
}

interface EmotionData {
    emotional_trigger: string
    total_spent: number
}

interface MonthlyFlowData {
    day: string
    receita: string
    despesa: number
}

const SummaryCard = ({title, value, color, icon }: {title: string; value:string; color: string; icon: JSX.Element}) => (
    <Paper
        elevation={3}
        sx={{p:2, display: 'flex', flexDirection: 'column', height:'100%'}} 
    >
        <Box
            sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}
        >
            <Typography color="textSecondary">{title}</Typography>
            <Box
                sx={{color, opacity: 0.6}}
            >
                {icon}
            </Box>
        </Box>
        <Typography
            component="p"
            variant='h4'
            sx={{color, fontWeight: 'bold',mt:2}}
        >
            {value}
        </Typography>
    </Paper>
);

const ChartContainer = ({ children, title }: { children: React.ReactElement; title: string }) => (
    <Paper elevation={3} sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" component="h2" gutterBottom>{title}</Typography>
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </Paper>
);

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', {style:'currency', currency: 'BRL'})
const formatCurrencyTick = (tick: any) => tick.toLocaleString('pt-BR', {style:'currency', currency: 'BRL', minimumFractionDigits: 0})


export default function DashBoard() {
    
    const [summary, setSummary] = useState<SummaryData | null > (null)
    const [categoryData, setCategoryData] = useState<CategoryData[]>([])
    const [emotionData, setEmotionData] = useState<EmotionData[]>([])
    const [monthlyFlow, setMonthlyFlow]  = useState<MonthlyFlowData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState< string | null>(null)


    useEffect(() => {
        const fetchAllDashboardData = async () => {
            try{
                const [summaryRes, categoryRes, emotionRes, monthlyFlowRes] = await Promise.all([
                    api.get<SummaryData>('/monthly-summary/'),
                    api.get<CategoryData[]>('/reports/category-spending/'),
                    api.get<EmotionData[]>('/reports/emotional-spending/'),
                    api.get<MonthlyFlowData[]>('/reports/monthly-flow/')

                ]);

                setSummary(summaryRes.data)
                setMonthlyFlow(monthlyFlowRes.data)

                const processAndSort = (data: any[], valueKey: string) =>
                    data.map(item=> ({...item,[valueKey]: Number(item[valueKey])}))
                    .sort((a,b) => b[valueKey] - a[valueKey])
                    .slice(0,5)

                setCategoryData(processAndSort(categoryRes.data,'total_spent'));
                setEmotionData(processAndSort(emotionRes.data, 'total_spent'));
            } catch (error) {
                setError("Não foi possível carregar os dados do dashboard.")
                console.error("Erro ao buscar resumo mensal:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchAllDashboardData()
        
    }, [])
    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    if (error) return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;


    return (
        <Container
            component="main"
            maxWidth="xl"
            sx={{flexGrow:1, p:3, mt:4}}
        >
            <Typography
                variant='h4'
                component='h1'
                gutterBottom
                sx={{mb:4}}
            >
                Dashboard de Inteligência Financeira

            </Typography>
            <Grid container spacing={3} sx={{mb:4}}>
                <Grid size={{xs:12, md:4}}><SummaryCard title='Receitas do mês' value={formatCurrency(summary?.receitas ?? 0)} color='success.main' icon={<TrendingUpIcon />} /></Grid>
                <Grid size={{xs:12, md:4}}><SummaryCard title='Despesas do mês' value={formatCurrency(summary?.despesas ?? 0)} color='error.main' icon={<TrendingDownIcon />} /></Grid>
                <Grid size={{xs:12, md:4}}><SummaryCard title='Saldo atual' value={formatCurrency(summary?.saldo ?? 0)} color={(summary?.saldo ?? 0) < 0 ? 'error.main' : 'primary.main'} icon={<AccountBalanceWalletIcon />} /></Grid>

            </Grid>
            <Grid container spacing={3}>
                <Grid size={{xs:12}}>
                    <ChartContainer title='Fluxo de Caixa no Mês Atual'>
                        <BarChart data={monthlyFlow} margin={{top:5, right:20, left: 30, bottom:5}}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="day" />
                            <YAxis tickFormatter={formatCurrencyTick}/>
                            <Tooltip formatter={(value: number) => formatCurrency(value)}/>
                            <Legend />
                            <Bar dataKey="receita" fill="#2e7d32" name="Receita" />
                            <Bar dataKey="despesa" fill="#d32f2f" name="Despesa" />
                        </BarChart>
                    </ChartContainer>
                </Grid>
                <Grid size={{xs:12, lg:6}}>
                    <ChartContainer title='Top 5 Despesas por Categoria'>
                        <BarChart data={categoryData} layout='vertical' margin={{top:5, right:30, left:30, bottom:5 }}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis type='number' tickFormatter={formatCurrencyTick} />
                            <YAxis type='category' dataKey="category__name" width={120} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Bar dataKey="total_spent" fill="#1976d2" name="Total Gasto" />
                        </BarChart>
                    </ChartContainer>
                </Grid>
                <Grid size={{xs:12, lg:6}}>
                    <ChartContainer title="Top 5 Despesas por Gatilho Emocional">
                         <BarChart data={emotionData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tickFormatter={formatCurrencyTick} />
                            <YAxis type="category" dataKey="emotional_trigger" width={140} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Bar dataKey="total_spent" fill="#6a1b9a" name="Total Gasto" />
                        </BarChart>
                    </ChartContainer>
                </Grid>


            </Grid>
        </Container>
    );
}