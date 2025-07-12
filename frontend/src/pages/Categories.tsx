import {
    Container, 
    List, 
    ListItem, 
    ListItemText,
    IconButton,
    Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import api from '../api/api'
import CategoryDialog from '../components/CategoryDialog'

interface Category {
    id: number; 
    name: string}

export default function Categories () {
    const [cats, setCats] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selected, setSelected] = useState<Category | null>(null);

    const fetchCategories = async () => {
        try{
            const response = await api.get<Category[]>('/categories/');
            setCats(response.data);
        } catch (err) {
            setError("Não foi possível carregar as categorias. Tente novamente")
            console.error("Erro ao buscar as categorias: ", err)
        } finally {
            setLoading(false)
        }

    }
    useEffect(() =>{
        fetchCategories()
    }, [])

    if (loading) {
        return <Typography sx={{p:2}}>Carregando categorias...</Typography>
    }

    if (error) {
        return <Typography color='error' sx={{p:2}}>{error}</Typography>
    }

    
    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja deletar esta categoria?')){
            try {
                await api.delete(`/categories/${id}/`)
                fetchCategories()
            } catch(error) {
                console.error('Erro ao deletar categoria', error)
                alert('Não foi possível deletar a categoria')
            }
        }
    };

    return (
        <Container>
            <h2>Categorias</h2>

            <IconButton
                color='primary'
                onClick={() =>{
                    setSelected(null);
                    setDialogOpen(true);
                }}
            >
                <AddIcon />
            </IconButton>

            <List>
                {cats.map((c) => (
                    <ListItem 
                        key={c.id}
                        secondaryAction={
                            <>
                                <IconButton
                                    onClick={() =>{
                                        setSelected(c);
                                        setDialogOpen(true);
                                    }}
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    onClick={() => handleDelete(c.id)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </>
                        }
                    >
                        <ListItemText primary={c.name} />
                    </ListItem>
                ))}
            </List>

            <CategoryDialog 
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSaved={fetchCategories}
                initial={selected}
            />
        </Container>
    );
}