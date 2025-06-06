import {
    Conatiner,
    Box,
    TextField,
    Button,
    Typography,
    Link as MuiLink,
    Stack,
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
    })
}