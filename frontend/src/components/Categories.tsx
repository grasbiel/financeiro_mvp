import { 
    Container, IconButton, List, ListItem, ListItemText,
} from '@mui/material'

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useEffect, useState } from 'react';
import api from '../api/api';
import CategoryDialog from '../components/CategoryDialog'

interface Category {
    id: number;
    name: string
}

export default function Categories(){
    const [cats, setCats] = useState<Category[]>([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selected, setSelected] = useState<Category | null>(null)

    const fetchCats = () => {
        api.get<Category[]>('categories/').then((r) => {
            setCats(r.data);
        })
    } 

    useEffect(fetchCats, [])

    const handleDelete = async (id: number) => {
        if (confirm('Excluir categoria?')) {
            await api.delete(`categories/${id}/`);
            fetchCats();
        }
    };

    return (
        <Container>
            <h2>Categorias</h2>
            <IconButton
                color='primary'
                onClick={() => {setSelected(null); setDialogOpen(true);}}
            >
                <AddIcon />
            </IconButton>

            <List>
                {cats.map(c => (
                    <ListItem key={c.id}
                        secondaryAction= {
                            <>
                                <IconButton onClick={() => {setSelected(c); setDialogOpen(true);}}>
                                    <EditIcon />
                                </IconButton>
                                <IconButton onClick={() => handleDelete(c.id)}>
                                    <DeleteIcon />
                                </IconButton>
                            </>
                        }>
                            <ListItemText primary={c.name} />
                    </ListItem>
                ))}
            </List>

            <CategoryDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSaved={fetchCats}
                initial={selected}
            />
        </Container>
    )
}

