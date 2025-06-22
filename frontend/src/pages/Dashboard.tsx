import {useEffect, useState} from 'react';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

import api from '../api/api'

interface Summary {
    receitas: number
    despesas: number
    saldo: number
}

export default function DashBoard() {
    const [summary, setSummary] = useState<Summary | null > (null)

    useEffect(() => {
        api.get<Summary>('/transactions/summary/').then(res => setSummary(res.data))
    }, [])

    return (
        <Container>
            <h2>Visão Geral (mês atual)</h2>
            {summary && (
                <Grid container spacing={2}> {/*Grid container */}
                    <Grid size={{ xs:12, md:4}}>
                            <Card>
                                <CardContent>
                                    <Typography variant='h6'>Receitas</Typography>
                                    <Typography variant='h4' color='green'>
                                        R$ {summary.receitas.toFixed(2)}
                                    </Typography>
                                </CardContent>
                            </Card>                        
                    </Grid>
                    <Grid size={{xs:12, md:4}}> {/*Grid Despesas*/}
                        <Card>
                            <CardContent>
                                <Typography variant='h6'>Despesas</Typography>
                                <Typography variant='h4' color='red'>
                                    R$ {summary.despesas.toFixed(2)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid> {/* Fim Grid Despesas */}
                    <Grid size={{xs:12, md:4}}> {/* Grid Saldo */}
                        <Card>
                            <CardContent>
                                <Typography variant='h6'>Saldo</Typography>
                                <Typography variant='h4'>
                                    R$ {summary.saldo.toFixed(2)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid> 
                </Grid>
            )}
        </Container>
    );
}