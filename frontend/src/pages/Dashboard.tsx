import {useEffect, useState} from 'react';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

import api from '../api/api'
import { Box, CircularProgress } from '@mui/material';

interface Summary {
    receitas: number
    despesas: number
    saldo: number
}

export default function DashBoard() {
    const [summary, setSummary] = useState<Summary | null > (null)
    const [loading, setLoading] = useState(true)


    useEffect(() => {
        const fetchSummary = async () => {
            try{
                const response = await api.get('api/reports/monthly_summary/')
                setSummary(response.data)
            } catch (error) {
                console.error("Erro ao buscar o resumo mensal: " , error)
            } finally {
                setLoading(false)
            }
        }

        fetchSummary()
        
    }, [])

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Container>
            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
                Visão Geral (Mês Atual)
            </Typography>
            {summary ? (
                // O Grid "container" envolve os Grids filhos
                <Grid container spacing={3}>
                    {/* CORREÇÃO: A propriedade 'item' foi removida. 
                      As propriedades de breakpoint (xs, md) são aplicadas diretamente.
                    */}
                    <Grid size={{xs:12, md:4}}>
                        <Card>
                            <CardContent>
                                <Typography variant='h6'>Receitas</Typography>
                                <Typography variant='h4' color='green' sx={{ fontWeight: 'bold' }}>
                                    {summary.receitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </Typography>
                            </CardContent>
                        </Card>                        
                    </Grid>
                    
                    <Grid size={{xs:12, md:4}}>
                        <Card>
                            <CardContent>
                                <Typography variant='h6'>Despesas</Typography>
                                <Typography variant='h4' color='red' sx={{ fontWeight: 'bold' }}>
                                    {summary.despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{xs:12, md:4}}>
                        <Card>
                            <CardContent>
                                <Typography variant='h6'>Saldo</Typography>
                                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                                    {summary.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid> 
                </Grid>
            ) : (
                <Typography>
                    Não foi possível carregar os dados do resumo. Verifique sua conexão ou tente novamente mais tarde.
                </Typography>
            )}
        </Container>
    );
}