import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button
} from '@mui/material'

import {useForm, Controller} from 'react-hook-form'
import api from '../api/api'

interface Props {
    open: boolean,
    onClose: ()=> void;
    onSaved: () => void;
    initial?: {id: number; name: string} | null;
}

export default function CategoryDialog({
    open, onClose, onSaved, initial,
}: Props) {
    const {control, handleSubmit, reset} = useForm<{name: string}>({
        defaultValues: {name: initial?.name ?? ''},
    });

    const onSubmit = async ({name} : {name: string}) => {
        if (initial) {
            await api.put(`categories/${initial.id}/`, {name});
        } else {
            await api.post('categories/', {name});
        }

        reset();
        onSaved();
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
        >
            <DialogTitle>
                {initial ? 'Editar' : 'Nova'} categoria
            </DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Controller
                        name='name'
                        control={control}
                        rules={{required: 'Informe o nome'}}
                        render={({field, fieldState }) => (
                            <TextField
                                {...field}
                                label="Nome"
                                autoFocus
                                error={!!fieldState.error}
                                helperText= {fieldState.error?.message}
                            />
                        )}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant="contained">Salvar</Button>
                </DialogActions>
            </form>
        </Dialog>
    );  
}