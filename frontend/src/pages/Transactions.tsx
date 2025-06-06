import {
    Container, Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material'

import { useEffect, useState} from 'react'
import api from '../api/api'

interface Transaction {
    id: number,
    value: number,
    date: string,
    description: string | null,
    category: number | null,
    emotional_trigger: string
}

export default function Transactions() {
    const [rows, setRows] = useState<Transaction[]>([])

    useEffect(() => {
        api.get<Transaction[]>('/transactions/').then(res => setRows(res.data))

    }, [])

    return (
        <Container>
            <h2>Transações</h2>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Data</TableCell>
                        <TableCell>Descrição</TableCell>
                        <TableCell align="right">Valor (R$)</TableCell>
                        <TableCell>Categoria</TableCell>
                        <TableCell>Gatilho Emocional</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map(r => (
                        <TableRow key={r.id}>
                            <TableCell>{r.date}</TableCell>
                            <TableCell>{r.description || '-'}</TableCell>
                            <TableCell align='right'>{r.value}</TableCell>
                            <TableCell>{r.category ?? '-'}</TableCell>
                            <TableCell>{r.emotional_trigger}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Container>
    )
}