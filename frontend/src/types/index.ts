export interface Transaction {
    id: number
    value: number
    date: string
    description: string | null
    category: number | null
    category_name?: string
    emotional_trigger: string
}

export interface Category {
    id: number
    name: string
}