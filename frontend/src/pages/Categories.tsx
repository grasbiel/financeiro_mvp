import {
    Container, TextField, Button, List, ListItem, ListItemText
} from '@mui/material'
import { useEffect, useState } from 'react'
import api from '../api/api'

interface Category {id: number; name: string}

export default function Categories () {
    const [list, setList] = useState<Category[]>([])
    const [name, setName] = useState('')

    const fetchCats = () => {
        api.get<Category[]>('/categories/').then(res => setList(res.data))
    }

    useEffect(fetchCats, [])

    const handleAdd = async () => {
        if (!name.trim()) return
        await api.post('/categories/', {name})
        setName('')
        fetchCats()
    }

    return (
        <Container>
            <h2>Categorias</h2>

            <div style={{display: 'flex', gap: 8, marginBottom:16}}>
                <TextField
                    label = "Nova Categoria"
                    value = {name}
                    onChange={e => setName(e.target.value)}
                />
                <Button variant='contained'>Adicionar</Button>
            </div>

            <List>
                {list.map(c => (
                    <ListItem key={c.id}>
                        <ListItemText primary={c.name} />
                    </ListItem>
                ))}
            </List>
        </Container>
    );
}