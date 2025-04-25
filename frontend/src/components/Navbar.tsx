import {AppBar, Toolbar, Button} from '@mui/material'
import {Link} from 'react-router-dom'
import {useAuth} from '../auth/AuthProvider'

export default function Navbar() {
    const {user, logout} = useAuth();

    return (
        <AppBar position='static'>
            <Toolbar sx={{gap: 2}}> 
                {user && (
                    <>
                        <Button color='inherit' component={Link} to='/'>Dashboard</Button>
                        <Button color='inherit' component={Link} to='/transactions'>Transações</Button>
                        <Button color='inherit' component={Link} to='/categories'>Categorias</Button>
                        <Button color='inherit' component={Link} to='/budgets'>Orçamentos</Button>
                        <Button color='inherit' component={Link} to='/reports'>Relatórios</Button>
                        <Button color='inherit' onClick={logout} sx={{marginLeft:'auto'}}>Sair</Button>
                    </>
                )}
            </Toolbar>
        </AppBar>
    );
}