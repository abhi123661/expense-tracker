export interface Category {
  id: string
  name: string
  icon: string
  color: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  amount: number
  currency: string
  note: string | null
  category_id: string
  date: string
  created_at: string
  updated_at: string
  category_name: string
  category_icon: string
  category_color: string
}

export interface ExpenseCreate {
  amount: number
  currency?: string
  note?: string
  category_id: string
  date: string
}

export interface Budget {
  id: string
  category_id: string
  amount: number
  currency: string
  period: string
  created_at: string
  updated_at: string
  category_name: string
  category_icon: string
  category_color: string
  spent: number
  percentage: number
}

export interface RecurringExpense {
  id: string
  amount: number
  currency: string
  note: string | null
  category_id: string
  frequency: string
  next_date: string
  active: boolean
  created_at: string
  updated_at: string
  category_name: string
  category_icon: string
  category_color: string
}

export interface Summary {
  period: string
  start_date: string
  end_date: string
  summary: {
    total_spent: number
    avg_expense: number
    total_count: number
  }
  categories: CategorySummary[]
  daily: DailySpending[]
}

export interface CategorySummary {
  category_id: string
  category_name: string
  category_icon: string
  category_color: string
  total_spent: number
  expense_count: number
}

export interface DailySpending {
  date: string
  total_spent: number
}

export interface ExpenseListResponse {
  expenses: Expense[]
  total: number
  page: number
  limit: number
}
