import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    Link as MuiLink,
    Stack,
    Alert,
} from '@mui/material'

import {useForm, Controller} from 'react-hook-form'
import {useNavigate, Link} from 'react-router-dom'
import {useState} from 'react'
import api from '../api/api'


interface SignupFormData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export default function Signup() {
    const navigate = useNavigate();
    const [serverError, setServerError] = useState<string | null>(null)

    const {
        control,
        handleSubmit,
        watch,
        formState: {errors}
    } = useForm<SignupFormData>({
        defaultValues: {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
        }
    });

    const onSubmit= async(data: SignupFormData) => {
        setServerError(null);

        try {
            await api.post('/signup/', {
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

    const password = watch('password')

    return (
        <Container maxWidth="xs">
            <Box sx={{mt:8, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <Typography component='h1' variant='h5'>
                    Cadastrar
                </Typography>
                <Box component='form' onSubmit={handleSubmit(onSubmit)} sx={{mt: 3}}>
                    {serverError && <Alert severity='error'>{serverError}</Alert>}
                    <Stack spacing={2}>
                        <Controller
                            name="username" 
                            control={control}
                            rules={{required: 'Usuário é obrigatório'}}
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
                            render={({...field}) =>(
                                <TextField {...field} label="Confirmar senha" type='password' fullWidth 
                                    error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message}
                                />
                            )}
                        />
                    </Stack>
                    <Button type='submit' fullWidth variant='contained' sx={{mt:3, mb:2}}>
                        Cadastrar
                    </Button>
                    <MuiLink component={Link} to="/login" variant='body2'>
                        Já tem uma conta? Entre
                    </MuiLink>
                </Box>
            </Box>
        </Container>
    );
}