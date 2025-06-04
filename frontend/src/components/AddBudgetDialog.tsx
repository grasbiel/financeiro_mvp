import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Stack
} from '@mui/material'

import {useForm, Controller} from 'react-hook-form'
import api from '../api/api'

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: () => void
}

interface BudgetForm {
    amount_limit: number;
    month: number;
    year: number;
}

export default function AddBudgetDialog ({open, onClose, onCreated}: Props){
    const {control, handleSubmit, reset} = useForm<BudgetForm>({
        defaultValues: {amount_limit: 0, month: new Date().getMonth() + 1, year: new Date().getFullYear()},
    });
    
    const onSubmit = async (data: BudgetForm) => {
        await api.post('/budgets/', data);
        reset();
        onCreated();
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Novo Orçamento</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Stack spacing={2}>
                        <Controller
                            name='amount_limit'
                            control={control}
                            rules={{required: true}}
                            render={({field}) => <TextField {...field} label="Limite (R$)" type="number"/>}
                        />
                        <Controller
                            name='month'
                            control={control}
                            rules={{required: true, min:1, max: 12}}
                            render={({field}) => <TextField {...field} label="Mês (1-12)" type='number'/>}  
                        />

                        <Controller
                            name='year'
                            control={control}
                            rules={{required:true}}
                            render={({field}) => <TextField {...field} label="Ano" type='number' />}
                        />                        
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button type='submit' variant="contained">Salvar</Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}