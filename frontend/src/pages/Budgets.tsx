import { useEffect, useState } from 'react';
// src/pages/Budgets.tsx
import {
  Typography,
  Grid,
  Container,
  Paper,
  ListItem,
  List,
  ListItemText,
  Box,
  LinearProgress,
} from '@mui/material';
import api from '../api/api';



interface Budget {
  id: number;
  category_name: string;
  limit: number;
  start_date: string;
  end_date: string;
}

export function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const response = await api.get<Budget[]>('/budgets/')
        setBudgets(response.data)
      } catch (err) {
        setError("Não foi possível carregar os orçamentos. Tente novamente")
        console.error("Erro ao buscar os orçamentos: ", err)
      } finally {
        setLoading(false)
      }
    }

    fetchBudgets()
  }, []);

  if (loading) {
    return <Typography sx={{p:2}}>Carregando orçamentos...</Typography>
  }
  if (error) {
    return <Typography color='error' sx={{p:2}}>{error}</Typography>
  }

  return (
    <Container maxWidth="lg" sx={{mt: 4, mb:4}}>
      <Typography variant='h4' gutterBottom>
        Meus orçamentos
      </Typography>
      <Paper>
        {budgets.length > 0 ? (
          <List>
            {budgets.map((budget) =>(
              <ListItem key={budget.id} divider>
                <Grid container spacing={2} alignItems={"center"}>
                  <Grid sx={{xs:12, md:4}}>
                    <ListItemText
                      primary={budget.category_name}
                      secondary={`Limite: R$ ${Number(budget.limit).toFixed(2)}`}
                    />
                  </Grid>
                  <Grid sx={{xs:12, md:8}}>
                    <Box sx={{width:'100%'}}> 
                      <LinearProgress variant='determinate' value={0}/>
                      <Typography variant='body2' color='text.secondary' sx={{mt:1}}>
                        Gasto: R$ 0.00 de R$ {Number(budget.limit).toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </ListItem>
            ))}
          </List>
        ): (
          <Typography sx={{p:3, textAlign: 'center'}}>
            Você ainda não cadastrou nenhum orçamento
          </Typography>
        )}
      </Paper>
    </Container>
  );
}
