// Importação do React e React Router
import {useContext} from 'react'
import {Link} from 'react-router-dom'

// Importação do Material UI
import {AppBar, Toolbar, Button, Typography, IconButton, useTheme} from '@mui/material'

// Importação de Ícones(forma correta)
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Brightness4Icon from '@mui/icons-material/Brightness4';

// Importações da sua aplicação (Autenticação e Tema)
import {useAuth} from '../auth/AuthProvider'
import { ThemeToggleContext } from '../theme/ThemeProvider';


export default function Navbar() {
    const {user, logout} = useAuth();
    const {toggleTheme} = useContext(ThemeToggleContext);

    const theme = useTheme();
  
     
    
    return (
        <AppBar position='static'>
            <Toolbar> 
                <Typography variant='h6' component="div" sx={{flexGrow:1}}>FinanceApp</Typography>
                {user && (
                    <>
                        <Button color='inherit' component={Link} to='/'>Dashboard</Button>
                        <Button color='inherit' component={Link} to='/transactions'>Transações</Button>
                        <Button color='inherit' component={Link} to='/categories'>Categorias</Button>
                        <Button color='inherit' component={Link} to='/budgets'>Orçamentos</Button>
                        <Button color='inherit' component={Link} to='/reports'>Relatórios</Button>
                        <Button color='inherit' component={Link} to='/emotion-report'>Emoções</Button>
                        <Button color='inherit' onClick={logout} sx={{marginLeft:'auto'}}>Sair</Button>
                    </>
                )}

                {/* Botão de Tema */}
                <IconButton sx={{ml: 1}} onClick={toggleTheme} color='inherit'>
                    {theme.palette.mode==="dark" ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
            </Toolbar>
        </AppBar>
    );
}