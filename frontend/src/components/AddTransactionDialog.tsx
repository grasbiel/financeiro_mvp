import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, MenuItem, Stack,
} from '@mui/material'

import {useForm, Controller} from 'react-hook-form'
import { useEffect, useState} from 'react'
import api from '../api/api'
import { Category } from '@mui/icons-material'

interface Props {
    open: boolean
    onClose: () => void
    onCreated: () => void
}

interface Category {
    id: number; 
    name: string}

interface FormData{
    value: number;
    date: string;
    description?: string;
    category?: number | null;
    emotional_trigger: string;
}

const EMOTIONAL_TRIGGERS = [
    "Necessidade Básica",
    "Planejamento/Objetivo",
    "Prazer/Entretenimento",
    "Impulso Emocional",
    "Pressão Social/Status",
    "Conforto/Compulsão",
    "Curiosidade/Exploração"
]

export default function AddTransactionDialog({open, onClose, onCreated}: Props) {
    const {control, handleSubmit, reset} = useForm<FormData>({
        defaultValues: {
            value: 0, 
            date:'', 
            description: '', 
            category: null,
            emotional_trigger: 'Necessidade Básica'
        },
    });

    const [cats, setCats] = useState<Category[]>([])

    useEffect(() => {
        if (open) {
            api.get<Category[]>('/categories/').then(res => setCats(res.data))
        }
    }, [open])

    const onSubmit = async (data: FormData) => {
        const payload = {
            value: data.value,
            date: data.date,
            description: data.description || null,
            category: data.category ?? null,
            emotional_trigger: data.emotional_trigger,
        };

        await api.post('/transactions/', payload);
        reset();
        onCreated();
        onClose();
    }

    return (
        <Dialog open={open} onClose = {onClose} fullWidth maxWidth="sm">
            <DialogTitle>Nova Transação</DialogTitle>

            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Stack spacing={2}>

                        <Controller
                            name="value"
                            control = {control}
                            rules={{required: true}}
                            render={({field, fieldState}) => (
                                <TextField 
                                    {...field} 
                                    label= "Valor (R$)" 
                                    type= "number"
                                    error= {!!fieldState.error}
                                    helperText = {fieldState.error?.message}    
                                    />
                            )}
                        />

                        <Controller 
                            name="date"
                            control={control}
                            rules={{required: true}}
                            render = {({field, fieldState}) => (
                                <TextField 
                                    {...field} 
                                    label = "Data" 
                                    type = "date"
                                    slotProps={{inputLabel: {shrink: true}}}
                                    error={!!fieldState.error}
                                    helperText={fieldState.error? 'Data obrigatória' :''}
                                />
                                    
                            )}
                        />

                        <Controller 
                            name= "description"
                            control = {control}
                            rules={{}}
                            render = {({field}) => (
                                <TextField {... field } 
                                    label = "Descrição"
                                    type="text"
                                    fullWidth
                                />

                            )}
                        />

                        <Controller 
                            name= "category"
                            control={control}
                            rules={{}}
                            render = {({field}) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Categoria (opcional)"
                                    value={field.value ?? ''}
                                    onChange= {e => {
                                        const v= e.target.value;
                                        field.onChange(v === '' ? null : Number(v));
                                    }}
                                >
                                    <MenuItem value="">--</MenuItem>
                                    {cats.map(c => (
                                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />

                        <Controller
                            name='emotional_trigger'
                            control={control}
                            rules={{required: true}}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Gatilho Emocional"
                                    fullWidth
                                >
                                    {EMOTIONAL_TRIGGERS.map(tr => (
                                        <MenuItem key={tr} value={tr}>{tr}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Stack>
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant='contained'>Salvar</Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}