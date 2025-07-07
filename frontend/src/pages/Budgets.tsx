// src/pages/Budgets.tsx
import {
  Card,
  CardContent,
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
} from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../api/api';
import { useForm,Controller } from 'react-hook-form';

interface Category {
  id:number,
  name: string
}
interface Budget {
  id: number;
  category: Category;
  amount: number;
  start_date: string;
  end_date: string;
}

interface FormData {
  category: number;
  amount: number;
  start_date: string;
  end_date: string;
}


export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const {control, handleSubmit, reset} = useForm<FormData>()

  const fetchData = async () => {
    try {
      setLoading(true)

      const [budgetsResponse, categoriesResponse] = await Promise.all([
        api.get('api/budgets/'),
        api.get('api/categories/')
      ]);
      setBudgets(budgetsResponse.data)
      setCategories(categoriesResponse.data)
    } catch (error) {
      console.error("Erro ao buscar dados de orçamentos:" , error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave= async (data: FormData) => {
    try{
      await api.post('api/budgets/', data);
      alert("Orçamento salvo com sucesso")
      reset();
      fetchData();
    } catch (error: any) {
      console.error("Erro ao salvar orçamento:", error)
      alert(error.response?.data?.detail || "Não foi possível salvar o orçamento.")
    }
    if (loading) {
      return <Box sx={{display: 'flex', justifyContent: 'center', mt:4}}><CircularProgress /></Box>
    }

  }

  return (
    <Box>
            <Typography variant="h4" gutterBottom>Orçamentos</Typography>
            <Card sx={{ padding: 2, marginBottom: 3 }}>
                <Typography variant="h6" gutterBottom>Criar Novo Orçamento</Typography>
                <form onSubmit={handleSubmit(handleSave)}>
                    <Grid container spacing={2}>
                        <Grid size={{xs:12, sm:6}}>
                            <Controller
                                name="category"
                                control={control}
                                rules={{ required: "Selecione uma categoria" }}
                                render={({ field }) => (
                                    <TextField {...field} select label="Categoria" fullWidth>
                                        {categories.map((cat) => (
                                            <MenuItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>
                        <Grid size={{xs:12, sm:6}}>
                            <Controller
                                name="amount"
                                control={control}
                                rules={{ required: "O valor é obrigatório" }}
                                render={({ field }) => <TextField {...field} label="Valor do Orçamento" type="number" fullWidth />}
                            />
                        </Grid>
                        <Grid size={{xs:12, sm:6}}>
                            <Controller
                                name="start_date"
                                control={control}
                                rules={{ required: "A data de início é obrigatória" }}
                                render={({ field }) => <TextField {...field} label="Data de Início" type="date" InputLabelProps={{ shrink: true }} fullWidth />}
                            />
                        </Grid>
                        <Grid size={{xs:12, sm:6}}>
                            <Controller
                                name="end_date"
                                control={control}
                                rules={{ required: "A data de fim é obrigatória" }}
                                render={({ field }) => <TextField {...field} label="Data de Fim" type="date" InputLabelProps={{ shrink: true }} fullWidth />}
                            />
                        </Grid>
                        <Grid size={{xs:12}}>
                            <Button type="submit" variant="contained">Salvar</Button>
                        </Grid>
                    </Grid>
                </form>
            </Card>

            <Typography variant="h5" gutterBottom>Orçamentos Criados</Typography>
            {budgets.length > 0 ? (
                budgets.map((budget) => (
                    <Card key={budget.id} sx={{ marginBottom: 2 }}>
                        <CardContent>
                            <Typography variant="h6">{budget.category.name}</Typography>
                            <Typography>
                                Valor: {Number(budget.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </Typography>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <Typography>Nenhum orçamento cadastrado.</Typography>
            )}
        </Box>
  );
}
