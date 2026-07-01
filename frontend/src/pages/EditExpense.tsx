import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { CategoryPicker } from '../components/CategoryPicker'

export function EditExpense() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api.getExpense(id).then((expense) => {
      setAmount(String(expense.amount))
      setNote(expense.note || '')
      setCategoryId(expense.category_id)
      setDate(expense.date.split('T')[0])
      setFetching(false)
    }).catch(() => {
      setError('Failed to load expense')
      setFetching(false)
    })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!amount || parseFloat(amount) <= 0) {
      setError('Enter a valid amount')
      return
    }
    if (!categoryId) {
      setError('Select a category')
      return
    }

    setLoading(true)
    try {
      await api.updateExpense(id!, {
        amount: parseFloat(amount),
        category_id: categoryId,
        date,
        note: note || undefined,
      })
      navigate('/history')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update expense')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Edit Expense</h1>
        <p className="text-[var(--muted-foreground)]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Edit Expense</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Amount */}
        <div>
          <label className="text-sm font-medium text-[var(--muted-foreground)] mb-1 block">
            Amount (₹)
          </label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full text-4xl font-bold p-3 border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-indigo-100"
            autoFocus
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium text-[var(--muted-foreground)] mb-2 block">
            Category
          </label>
          <CategoryPicker selected={categoryId} onSelect={setCategoryId} />
        </div>

        {/* Date */}
        <div>
          <label className="text-sm font-medium text-[var(--muted-foreground)] mb-1 block">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        {/* Note */}
        <div>
          <label className="text-sm font-medium text-[var(--muted-foreground)] mb-1 block">
            Note (optional)
          </label>
          <input
            type="text"
            placeholder="What was this for?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-3 border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-[var(--destructive)] bg-[var(--muted)] p-3 rounded-xl">
            {error}
          </p>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/history')}
            className="flex-1 py-4 border border-[var(--border)] font-semibold rounded-xl hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-4 bg-[var(--primary)] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
