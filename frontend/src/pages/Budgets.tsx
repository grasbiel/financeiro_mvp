// src/pages/Budgets.tsx
import {
  Container,
  Card,
  CardContent,
  IconButton,
  Box,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useEffect, useState } from 'react';
import api from '../api/api';
import AddBudgetDialog from '../components/AddBudgetDialog';

interface Budget {
  id: number;
  amount_limit: number;
  month: number;
  year: number;
}

export default function Budgets() {
  const [list, setList] = useState<Budget[]>([]);
  const [open, setOpen] = useState(false);

  const fetchBudgets = () => {
    api
      .get<Budget[]>('/budgets/')
      .then((r) => {
        setList(r.data);
      })
      .catch((err) => {
        console.error('Erro ao buscar orçamentos:', err);
      });
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  return (
    <Container>
      <h2>Orçamentos</h2>
      <IconButton onClick={() => setOpen(true)} color="primary">
        <AddIcon />
      </IconButton>

      {/* Usando Box + CSS Grid em vez de Grid */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          // Em telas pequenas: 1 coluna; em md+: 3 colunas:
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(3, 1fr)',
          },
          mt: 2, // margin-top
        }}
      >
        {list.map((b) => (
          <Card key={b.id}>
            <CardContent>
              <strong>
                {b.month}/{b.year}
              </strong>
              <br />
              Limite: R$ {b.amount_limit}
            </CardContent>
          </Card>
        ))}
      </Box>

      <AddBudgetDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreated={fetchBudgets}
      />
    </Container>
  );
}
