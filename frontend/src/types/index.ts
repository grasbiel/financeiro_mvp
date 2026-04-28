export type TransactionKind = 'income' | 'expense'

export interface Category {
  id: number
  name: string
  archived: boolean
  color_slot: number
}

export interface Transaction {
  id: number
  kind: TransactionKind
  value: number
  date: string
  description: string | null
  category: number | null
  category_name?: string | null
  emotional_trigger: string | null
  created_at: string
  updated_at: string
}

export interface QuickAddPayload {
  kind: TransactionKind
  value: number
  category_name?: string
  date?: string
  description?: string
  emotional_trigger?: string
}

export interface DashboardData {
  year: number
  month: number
  total_income: number
  total_expense: number
  balance: number
  top_categories: {
    category_id: number | null
    category_name: string
    color_slot: number
    total: number
  }[]
  monthly_flow: {
    month: string
    income: number
    expense: number
  }[]
  recent_transactions: Transaction[]
}

export interface MonthlySummary {
  receitas: number
  despesas: number
  saldo: number
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
