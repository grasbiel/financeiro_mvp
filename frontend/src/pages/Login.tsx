import {
    Container, 
    TextField, 
    Button, 
    Box,
    Typography,
    Grid,
    Link as MuiLink, // Renomeando o Link do Mui para evitar conflito
    Alert
} from '@mui/material'

import {useState} from 'react'
import {useAuth} from '../auth/AuthProvider'
import {Link as RouterLink} from 'react-router-dom';
import {useForm, Controller} from 'react-hook-form';


export default function Login() {
    const {login} = useAuth()
    const [error, setError] = useState<string | null>(null)

    const{
        control, 
        handleSubmit,
        formState: {errors},
    } = useForm({
        defaultValues:{
            username:'',
            password: '',
        },
    });


    // A função de submit recebe os dados do react-hook-form
    const onSubmit = async (data: any) => {
        setError(null);
        try{
            await login(data.username, data.password);
        } catch {
            setError('Credenciais inválidas. Por favor, tente novamente')
        }
    };

    return (
        // Box principal para centralizar o conteúdo na tela inteira
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
            }}
        >

            <Container maxWidth="xs">
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    <Typography component="h1" variant="h5">
                        Entrar
                    </Typography>

                    {error && <Alert severity='error' sx={{width: '100%'}}>{error}</Alert>}

                    <Box
                        component="form"
                        onSubmit={handleSubmit(onSubmit)}
                        sx={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap:2,
                        }}
                    >
                        <Controller
                            name='username'
                            control={control}
                            rules={{required: 'O nome de usuário é obrigatório'}}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Usuário"
                                    fullWidth
                                    error={!!errors.username}
                                    helperText={errors.username?.message}
                                />
                            )}  
                        />

                        <Controller
                            name="password"
                            control={control}
                            rules={{required: 'A senha é obrigatória'}}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Senha"
                                    type="password"
                                    fullWidth
                                    error={!!errors.password?.message}
                                />
                            )}  
                        />

                        <Button
                            variant='contained' type='submit' fullWidth
                        >
                            Entrar
                        </Button>

                        <Grid container justifyContent={'flex-end'}>
                            <Grid>
                                <MuiLink component={RouterLink} to="/signup" variant='body2'>
                                    Não tem uma conta? Cadastre-se
                                </MuiLink>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            </Container>

        </Box>
    )
};