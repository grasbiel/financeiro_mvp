import {
    createContext, useState, useEffect
} from 'react';
import {useNavigate} from 'react-router-dom';
import api from '../api/api';

export const AuthContext = createContext<any> (null);

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
    
    const login = async (email: string, password: string) => {
        try{
            const response = await api.post("api/token/", {email, password})
            const {access, refresh} = response.data

            localStorage.setItem("accessToken", access)
            localStorage.setItem("refreshToken", refresh)
            
            api.defaults.headers.common['Authorization'] = `Bearer ${access}`
            setUser({email})
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

    const logout = () => {
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        api.defaults.headers.common['Authorization'] = ''
        setUser(null)
        navigate("/login")
    };

    return(
        <AuthContext.Provider value = {{authenticated: !!user, user, loading, login, signup, logout}}>
             {children}
        </AuthContext.Provider>
    ) 
 }
 
