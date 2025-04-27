import {
    Container, TextField, Button, Card, CardContent
} from '@mui/material'

import Grid from '@mui/material/Grid';
import { useEffect, useState } from 'react'
import api from '../api/api'

interface Budget {
    id: number
    amount_limit: number
    month: number
    year: number
    category: number | null
}

export default function Budgets() {
    const [list, setList] = useState<Budget[]>([])
    const [form, setForm] = useState({amount_limit: '', month: '', year: ''})

    const fetchBudgets = () => {
        api.get<Budget[]>('/budgets/').then(res => setList(res.data))
    }

    useEffect(fetchBudgets, [])

    const handleAdd = async () => {
        const { amount_limit, month, year} = form
        if (!amount_limit || !month || !year) return
        await api.post('/budgets/', {
            amount_limit: parseFloat(amount_limit),
            month: parseInt(month, 10),
            year: parseInt(year, 10)
        });
        setForm({amount_limit: '', month: '', year: ''});
        fetchBudgets()
    }

    return (
        <Container>
            <h2>Orçamentos</h2>
            {/*Formulário simples */}
            <Grid container spacing={2} mb={2}>
                <Grid sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    <TextField
                        label= "Limite (R$)"
                        value= {form.amount_limit}
                        onChange={e => setForm({...form, amount_limit: e.target.value})}
                        fullWidth
                    />
                </Grid>
                <Grid size={{xs: 6, md:12}}>
                    <TextField 
                        label= "Mês"
                        value= {form.month}
                        onChange={e => setForm({...form, month: e.target.value})}
                        fullWidth
                    />                
                </Grid>

                <Grid  size={{xs:6, md:12}}>
                    <TextField 
                        label= "Ano"
                        value={form.year}
                        onChange={e => setForm({...form, year: e.target.value})}
                    />
                </Grid>

                <Grid size= {{xs:6, md:12}}>
                    <Button variant='contained' fullWidth sx={{height: '100%'}} onClick={handleAdd}>
                        Adicionar
                    </Button>
                </Grid>
            </Grid>
            
            <Grid container spacing={2}>
                {list.map(b => (
                    <Grid  size= {{xs:12, md:4}} key={b.id}>
                        <Card>
                            <CardContent>
                                <strong>{b.month}/{b.year}</strong> <br />
                                Limite&nbsp;R$ {b.amount_limit}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>    
        </Container>
    );
}