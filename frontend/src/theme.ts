import {createTheme} from '@mui/material/styles';

export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
});

export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary:{
            main: '#9acaf9',
        },
        secondary:{
            main: '#f48fb1',
        },
        background:{
            default: '#242424',
            paper: '#1a1a1a',
        },
        text:{
            primary: 'rgba(255,255,255,0.87)',
        }
    },
});