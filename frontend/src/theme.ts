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
        background: {
            default: '#ffffff',
            paper: '#f5f5f5',
        },
        text:{
            primary: 'rgba(0,0,0,0.87)'
        }
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