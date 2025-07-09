import {
    createContext, useState, useEffect,
    useContext
} from 'react';
import {useNavigate} from 'react-router-dom';
import api from '../api/api';

export const AuthContext = createContext<any> (null);

export const useAuth = () => {
    return useContext(AuthContext)
}

export const AuthProvider= ({children} : any) => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)        

    useEffect(() => {
        const recoverUser = async() => {
            const token = localStorage.getItem('accessToken')
            if (token){
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`
                setUser({token})
            }
            setLoading(false)
        }
        recoverUser()
    }, [])
    
    const login = async (username: string, password: string) => {
        try{
            const response = await api.post("api/token/", {username, password})
            const {access, refresh} = response.data

            localStorage.setItem("accessToken", access)
            localStorage.setItem("refreshToken", refresh)
            
            api.defaults.headers.common['Authorization'] = `Bearer ${access}`
            setUser({username})
            navigate("/")

        } catch (error) {
            console.error("Erro no login:", error)
            alert("Falha no login. Verifique seu email e senha")
        }
    };
    const signup = async (data:any) => {
        try {
            await api.post("api/signup/", data)
            alert("Cadastro realizado com sucesso! Você já pode fazer o login")
            navigate("/login")
        } catch (error: any) {
            console.error("Erro no sigunp: ", error)
            const errorMessage = error.response?.data?.email?.[0] || "Erro ao realizar o cadastro. Tente novamente"
            alert(errorMessage)
        }
    }

    const logout = async () => {
        try{
            const refreshToken = localStorage.getItem("refreshToken");
            if(refreshToken) {
                await api.post('/api/token/blacklist/', {refresh: refreshToken})
            }
        } catch (e) {
            console.error("Logout failed", e)
        } finally {
            // Limpa todo o storage independemente do resultado da API
            api.defaults.headers.common['Authorization'] = null;
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            setUser(null);
        }
    };

    return(
        <AuthContext.Provider value = {{authenticated: !!user, user, loading, login, signup, logout}}>
             {children}
        </AuthContext.Provider>
    ) 
 }
 
