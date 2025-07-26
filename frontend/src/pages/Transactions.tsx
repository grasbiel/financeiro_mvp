import {
    Container, 
    Table, 
    TableHead, 
    TableRow, 
    TableCell, 
    TableBody,
    Button,
    Stack,
    TextField,
    MenuItem,
    TablePagination

} from '@mui/material'

import { useEffect, useState} from 'react'
import api from '../api/api'

import AddTransactionDialog from '../components/AddTransactionDialog'
import AddIcon from '@mui/icons-material/Add'

interface Transaction {
    id: number;
    value: number;
    date: string;
    description: string | null;
    category: number | null;
    emotional_trigger: string;
}

interface Category {
    id: number;
    name: string;
}

const EMOTIONAL_TRIGGERS = [
    "Necessidade Básica",
    "Planejamento/Objetivo",
    "Prazer/Entretenimento",
    "Impulso Emocional",
    "Pressão Social/Status",
    "Conforto/Compulsão",
    "Curiosidade/Exploração"
];

export default function Transactions() {
    const [rows, setRows] = useState<Transaction[]>([]);
    const [cats, setCats] = useState<Category[]>([]);
    const [open, setOpen] = useState(false)


    // Filtros e paginação
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<number | ''> ('');
    const [emotionFilter, setEmotionFilter] = useState<string>('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [totalCount, setTotalCount] = useState(0);

    const fetchCats = () => {
        api.get('/categories/').then(res => {
            // --- DEPURAÇÃO ---
            if (res.data && Array.isArray(res.data.results)){
                setCats(res.data.results)
            } else if (Array.isArray(res.data)){
                setCats(res.data)
            }
        }).catch(error => {
            console.error("Erro ao Buscar categorias em Transactions:", error);
            setCats([]); // Garante que cats seja um array em caso de erro
        });
    };

    const fetchData = () => {
        const params: any = {
            page: page + 1,
            page_size: rowsPerPage,
        }

        if (start) params.start = start;
        if (end) params.end = end;
        if (categoryFilter) params.category = categoryFilter;
        if (emotionFilter) params.emotion = emotionFilter;
        
        api.get('/transactions/', {params}).then(res => {
            if (Array.isArray(res.data.results)) {
                setRows(res.data.results);
                setTotalCount(res.data.count)
            } else {
                console.error("A resposta da API não contém um Array de resultados")
            }
            
        }).catch(error => {
            console.error("Erro ao buscar transações:", error)
        });
    };  

    useEffect(() => {
        fetchCats();
    }, []);

    useEffect(() => {
        fetchData();
    }, [page, rowsPerPage]);


    const handleFilterSubmit = () => {
        setPage(0);
        fetchData();
    };

    return (
        <Container>
            <h2>Transações</h2>
            {/* Botão nova transação */}

            <Button
                sx={{mb: 2}}
                variant='contained'
                startIcon={< AddIcon/>}
                onClick={() => setOpen(true)}
            >
                Nova Transação
            </Button>

            {/* Filtros */}
            <Stack direction={{xs: 'column', md: 'row'}} spacing={2} mb={2}>
                <TextField 
                    label= "Data Início"
                    type='date'
                    value={start}
                    InputLabelProps={{shrink: true}}
                    onChange={e => setStart(e.target.value)}
                />

                <TextField
                    label= "Data fim"
                    type= "date"
                    value={end}
                    InputLabelProps={{shrink: true}}
                    onChange={e => setEnd(e.target.value)}
                />

                <TextField
                    select
                    label= "Categoria"
                    value = {categoryFilter}
                    onChange={e =>
                        setCategoryFilter(e.target.value === '' ? '' : Number(e.target.value))
                    }
                >
                    <MenuItem value="">
                    Todas
                    </MenuItem>

                    {cats.map(c => (
                        <MenuItem key={c.id} value={c.id}>
                            {c.name}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    label="Gatilho Emocional"
                    value={emotionFilter}
                    onChange={e => setEmotionFilter(e.target.value)}
                >
                    <MenuItem value="">
                        Todos
                    </MenuItem>

                    {EMOTIONAL_TRIGGERS.map( tr=> (
                        <MenuItem key={tr} value={tr}>
                            {tr}
                        </MenuItem>
                    ))}
                </TextField>
                <Button
                    variant='outlined'
                    onClick={handleFilterSubmit}
                >
                    Aplicar Filtros
                </Button>
            </Stack>
            {/* Tabela de Transações */}
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Data</TableCell>
                        <TableCell>Descrição</TableCell>
                        <TableCell align="right">Valor (R$)</TableCell>
                        <TableCell>Categoria</TableCell>
                        <TableCell>Gatilho Emocional</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map(r => (
                        <TableRow key={r.id}>
                            <TableCell>{r.date}</TableCell>
                            <TableCell>{r.description || '-'}</TableCell>
                            <TableCell align='right'>{r.value}</TableCell>
                            <TableCell>{r.category ?? '-'}</TableCell>
                            <TableCell>{r.emotional_trigger}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* PAGINAÇÃO */}
            <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={e => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
                }}
                rowsPerPageOptions={[10, 20, 50]}
            />

            <AddTransactionDialog
                open={open}
                onClose={() => setOpen(false)}
                onCreated={fetchData}
            />
        </Container>
    )
}