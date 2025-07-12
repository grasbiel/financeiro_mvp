import {useEffect, useState} from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

import api from '../api/api'
import { Paper } from '@mui/material';

interface SummaryData {
    receitas: number
    despesas: number
    saldo: number
}

export default function DashBoard() {
    const [summaryData, setSummary] = useState<SummaryData | null > (null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState< string | null>(null)


    useEffect(() => {
        const fetchSummary = async () => {
            try{
                const response = await api.get<SummaryData>('/monthly-summary/')
                setSummary(response.data)
            } catch (error) {
                setError("Não foi possível carregar os dados do dashboard.")
                console.error("Erro ao buscar resumo mensal:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchSummary()
        
    }, [])

    if (loading) {
        return <Typography color='error'>{error}</Typography>;
    }

    return (
        <Container maxWidth="lg" sx={{mt:4, mb:4}}>
            <Typography variant="h4" component="h1" gutterBottom>
                Dashboard Mensal
            </Typography>
                <Grid container spacing={3}>
                    {/* CORREÇÃO: A propriedade 'item' foi removida. 
                      As propriedades de breakpoint (xs, md) são aplicadas diretamente.
                    */}
                    <Grid size={{xs:12, md:4}}>
                        <Paper sx={{p:2, display: 'flex', flexDirection: 'column', height: 140}}>
                            <Typography component={"h2"} variant='h6' color='primary' gutterBottom>
                                Receitas
                            </Typography>
                            <Typography component={"p"} variant='h4' sx={{color: 'green'}}>
                                {summaryData ? `R$ ${summaryData.receitas.toFixed(2)}`: 'R$ 0.00'}
                            </Typography>
                        </Paper>                     
                    </Grid>
                    
                    <Grid size={{xs:12, md:4}}>
                        <Paper sx={{p:2, display: 'flex', flexDirection: 'column', height: 140}}>
                            <Typography component={'h2'} variant='h6' color='primary' gutterBottom>
                                Despesas
                            </Typography>
                            <Typography component={'p'} variant='h4' sx={{color: 'red'}} >
                                {summaryData ? `R$ ${summaryData.despesas.toFixed(2)}` : 'R$ 0.00'}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid size={{xs:12, md:4}}>
                        <Paper sx={{p:2, display:'flex', flexDirection: 'column', height:140}}>
                            <Typography component={'h2'} variant='h6' color='primary' gutterBottom>
                                Saldo
                            </Typography>
                            <Typography component={"p"} variant='h4' sx={{color: summaryData && summaryData.saldo < 0 ? 'red': 'blue'}}>
                                {summaryData ? `R$ ${summaryData.saldo.toFixed(2)}` : 'R$ 0.00'}
                            </Typography>
                        </Paper>
                    </Grid> 
                </Grid>
        </Container>
    );
}