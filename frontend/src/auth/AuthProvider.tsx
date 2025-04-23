import {
    createContext, useContext, ReactNode, useState
} from 'react';
import {useNavigate} from 'react-router-dom';
import api from '../api/api';

interface User {username: String}
interface AuthCtxType {
    user: User | null;
    login: (u: string, p: string) => Promise<void>;
    logout: () => void;
}

const AuthCtx = createContext<AuthCtxType | null> (null);

export function AuthProvider({children}: {children: ReactNode}) {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null> (
        JSON.parse(localStorage.getItem('user') || 'null'),
    );

    const login = async (username: string, password: string) => {
        const { data} = await api.post('/login/', {username, password});
        localStorage.setItem('token', data.access);
        localStorage.setItem('user', JSON.stringify({username}));
        setUser({username});
        navigate('/');
    };
    
    const logout = () => {
        localStorage.clear();
        setUser(null);
        navigate('/login');
    };

    return <AuthCtx.Provider value = {{user, login, logout}}> {children}</AuthCtx.Provider>
 }
 
 export const useAuth = () => {
    const ctx = useContext(AuthCtx);
    if (!ctx) throw new Error('useAuth deve estar dentro do AuthProvider');
    return ctx;
 }