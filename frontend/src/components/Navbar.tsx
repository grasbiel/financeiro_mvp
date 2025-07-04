import {AppBar, Toolbar, Button, Typography, Box, IconButton} from '@mui/material'
import {Link, useNavigate} from 'react-router-dom'
import {useAuth} from '../auth/AuthProvider'
import {useContext} from 'react'
import { ThemeToggleContext } from '../theme/ThemeProvider';
import { Brightness7 } from '@mui/icons-material/Brightness7';
import { Brightness4  } from '@mui/icons-material/Brightness4';
import {Icon} from '@mui/material/'



export default function Navbar() {
    const auth = useAuth();
    const navigate = useNavigate();

    const theme = useTheme();
    const {toggleTheme} = useContext(ThemeToggleContext);
     
    const {user, logout} = useAuth();

    return (
        <AppBar position='static'>
            <Toolbar sx={{gap: 2}}> 
                <Typography variant='h6' component="div" sx={{flexGrow:1}}>FinanceApp</Typography>
                {auth.user && (
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
                <Box sx={{display: 'flex', alignItems:'center', marginLeft: 'auto'}}>
                    <IconButton sx={{ml: 1}} onClick={toggleTheme} color='inherit'>
                        {theme.palette.mode==="dark" ? <Brightness7Icon /> : <Brightness4Icon />}
                        
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
}