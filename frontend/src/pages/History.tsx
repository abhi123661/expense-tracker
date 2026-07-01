import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatCurrency, formatDate } from '../lib/utils'
import type { Expense } from '../lib/types'
import { Pencil, Trash2 } from 'lucide-react'
import { useToast } from '../components/Toast'

export function History() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const data = await api.getExpenses({ limit: '50' })
      setExpenses(data.expenses)
      setTotal(data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchExpenses() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    try {
      await api.deleteExpense(id)
      setExpenses((prev) => prev.filter((e) => e.id !== id))
      setTotal((prev) => prev - 1)
      toast('Expense deleted')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete', 'error')
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">History</h1>
        <p className="text-[var(--muted-foreground)]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">History</h1>
        <span className="text-sm text-[var(--muted-foreground)]">{total} expenses</span>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted-foreground)]">
          <p className="text-lg">No expenses yet</p>
          <p className="text-sm mt-1">Tap "Add" to record your first expense</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center gap-3 p-3 bg-[var(--muted)] rounded-xl"
            >
              {/* Category icon */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                style={{ backgroundColor: expense.category_color + '20' }}
              >
                {expense.category_icon}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="font-medium truncate">
                    {expense.note || expense.category_name}
                  </p>
                  <p className="font-bold text-sm ml-2 whitespace-nowrap">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {expense.category_name} • {formatDate(expense.date)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={() => navigate(`/edit/${expense.id}`)}
                className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDelete(expense.id)}
                className="p-2 text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
