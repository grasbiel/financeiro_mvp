import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, MenuItem, Stack,
    ToggleButtonGroup, ToggleButton
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
    emotional_trigger?: string;
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
    const [transactionType, setTransactionType]= useState<'expense' | 'income'>('expense');

    useEffect(() => {
        if (open) {
            reset({
                value: 0,
                date: '',
                description:'',
                category: null,
                emotional_trigger: 'Necessidade Básica'
            });

            setTransactionType('expense')

            // busca as categorias
            api.get('categories/').then(res => {
                if (res.data && Array.isArray(res.data.results)) {
                    setCats(res.data.results)
                } else if (Array.isArray(res.data)){
                    setCats(res.data)
                }
            }).catch(error => {
                console.error("Erro ao buscar categorias no diálogo:", error)
                setCats([])
            })
        }
    }, [open,reset])
    
    const handleTypeChange = (event: React.MouseEvent<HTMLElement>, newType:'income' | 'expense' | null) => {
        if (newType !== null) {
            setTransactionType(newType)
        }
    }

    const onSubmit = async (data: FormData) => {
        const finalValue = transactionType === 'expense' ? -Math.abs(data.value) : Math.abs(data.value)
        const payload = {
            value: finalValue,
            date: data.date,
            description: data.description || null,
            category: data.category ?? null,
            emotional_trigger: transactionType === 'expense' ? data.emotional_trigger : null,
        };

        try {
            await api.post('transactions/', payload);
            onCreated()
            onClose()
        } catch (error: any) {
            console.error("Erro ao criar transação: ", error)

            const errorMessage = error.response?.data?.detail ||
                                error.response?.data?.category ||
                                "Ocorreu um erro ao salvar. Verifique os dados ou o orçamento "
            alert(errorMessage)
        }
        
    }

    return (
        <Dialog open={open} onClose = {onClose} fullWidth maxWidth="sm">
            <DialogTitle>Nova Transação</DialogTitle>

            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Stack spacing={2} sx={{mt: 1}}>

                        {/* Seletor de tipo */}
                        <ToggleButtonGroup
                            value={transactionType}
                            exclusive
                            onChange={handleTypeChange}
                            aria-label='tipo de transação'
                            fullWidth
                        >
                            <ToggleButton value="expense" aria-label='despesa' color='error'>
                                Despesa
                            </ToggleButton>

                            <ToggleButton value="income" aria-label="receita" color="success">
                                Receita
                            </ToggleButton>
                            
                        </ToggleButtonGroup>

                        <Controller
                            name="value"
                            control = {control}
                            rules={{required: "Valor é obrigatório", min:{value: 0.01, message: "O valor deve ser maior que zero"}}}
                            render={({field, fieldState}) => (
                                <TextField 
                                    {...field} 
                                    label= "Valor (R$)" 
                                    type= "number"
                                    onChange={(e) => field.onChange(Math.abs(parseFloat(e.target.value)))}
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
                                    <MenuItem value="">-- Nenhuma --</MenuItem>
                                    {cats.map(c => (
                                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                        {transactionType === 'expense' &&(
                            <Controller
                            name='emotional_trigger'
                            control={control}
                            rules={{required: transactionType === 'expense'}}
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
                        )}
                        
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