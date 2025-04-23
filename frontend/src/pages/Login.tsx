import {
    Container, TextField, Button, Box,
} from '@mui/material'

import {useState} from 'react'
import {useAuth} from '../auth/AuthProvider'

export default function Login() {
    const {login} = useAuth()
    const [form, setForm] = useState({username:'', password:''})

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(form.username, form.password)
        } catch {
            alert('Credenciais inválidas');
        }
    }

    return (
        <Container maxWidth="xs">
            <h2>Entrar</h2>
            <Box component="form" onSubmit={handleSubmit} sx={{display: 'flex', flexDirection: 'column', gap: 2 }} >
                <TextField 
                    label = "Usuário"
                    value= {form.username}
                    onChange={e => setForm({...form, username: e.target.value})}
                />

                <TextField
                    label= "Senha"
                    type= "password"
                    value = {form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                />
                <Button variant='contained' type='submit'>Entrar</Button>
            </Box> 
        </Container>
    )
};