import  {
   createContext, 
   useState, 
   useMemo, 
   ReactNode 
} from "react";

import { ThemeProvider as MuiThemeProvider, CssBaseline} from "@mui/material";
import {lightTheme, darkTheme} from '../theme'

export const ThemeToggleContext = createContext({
    toggleTheme: () => {},
})

interface AppThemeProviderProps {
    children: ReactNode;
}

export function AppThemeProvider({children}: AppThemeProviderProps) {
    const [themeName, setThemeName] = useState<'light' | 'dark'>('dark');

    const toggleTheme =() => {
        setThemeName((prevTheme) => (prevTheme === 'light' ? 'dark': 'light'));
    };

    const theme = useMemo(() => (themeName=== 'light' ? lightTheme: darkTheme), [themeName]);

    const themeToggleValue = useMemo(() => ({
        toggleTheme,
    }), [toggleTheme]);

    return(
        <ThemeToggleContext.Provider value={themeToggleValue}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeToggleContext.Provider>
    );
}