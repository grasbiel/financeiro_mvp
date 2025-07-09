import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    Link as MuiLink,
    Alert,
    Grid,
} from '@mui/material'

import {useState} from 'react'
import {useNavigate, Link as RouterLink, Navigate} from 'react-router-dom'
import {useForm, Controller} from 'react-hook-form'
import api from '../api/api'
import { useAuth } from '../auth/AuthProvider'

export default function Signup() {
    const {user}= useAuth()
    const navigate = useNavigate();
    const [serverError, setServerError] = useState<string | null>(null)

    const {
        control,
        handleSubmit,
        watch,
        formState: {errors}
    } = useForm({
        defaultValues: {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
        }
    });

    if (user) {
        return <Navigate to="/" replace />
    }
    const password = watch('password');
    const onSubmit= async(data: any) => {
        setServerError(null);

        try {
            await api.post('signup/', {
                username: data.username,
                email: data.email,
                password: data.password
            });

            // Redireciona para o login após o sucesso
            navigate('/login')

        } catch(error:any) {
            //Captura erros do servidor (ex: usuário já existe)
            const errorMsg= error.response?.data?.username?.[0] || 'Ocorreu um erro no cadastro.';
            setServerError(errorMsg)
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh'
            }}
        >

        <Container maxWidth="xs">
            <Box 
                sx={{
                    mt:8, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    gap: 2

                }}
            >
                <Typography component='h1' variant='h5'>
                    Cadastrar
                </Typography>
                
                {serverError && <Alert severity='error' sx={{width:'100%'}}>{serverError}</Alert>}
                
                <Box component='form' onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%', mt: 1}}>
                    
                        <Controller
                            name="username" 
                            control={control}
                            rules={{required: 'O nome do usuário é obrigatório'}}
                            render={({field}) => (
                                <TextField {...field} label='Usuário' fullWidth error={!!errors.username} 
                                    helperText={errors.username?.message}
                                />
                            )}
                        />
                        <Controller 
                            name='email'
                            control={control}
                            rules={{required: 'Email é obrigatório', pattern:{value:/^\S+@\S+$/i, message:'Email inválido'}}}
                            render={({field}) =>(
                                <TextField {...field} label="Email" type='email' fullWidth 
                                    error={!!errors.email} helperText={errors.email?.message}
                                />
                            )}
                        />

                        <Controller
                            name='password'
                            control={control}
                            rules={{required : 'Senha é obrigatória', minLength:{value:6, message:'A senha deve ter no mínimo 6 caracteres'}}}
                            render={({field}) =>(
                                <TextField {...field} label="Senha" type='password' fullWidth
                                    error={!!errors.password} helperText={errors.password?.message}
                                />
                            )}
                        />

                        <Controller
                            name="confirmPassword"
                            control={control}
                            rules={{
                                required:'Confirmação de senha é obrigatória',
                                validate: (value) => value === password || 'As senhas não coincidem'
                            }}
                            render={({field}) =>(
                                <TextField {...field} label="Confirmar senha" type='password' fullWidth 
                                    error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message}
                                />
                            )}
                        />
                    
                    <Button type='submit' fullWidth variant='contained' sx={{mt:3, mb:2}}>
                        Cadastrar
                    </Button>
                    <Grid container justifyContent="flex-end">
                        <MuiLink component={RouterLink} to="/login" variant='body2'>
                            Já tem uma conta? Entre
                        </MuiLink>
                    </Grid>
                    
                </Box>
            </Box>
        </Container>

        </Box>
    );
}