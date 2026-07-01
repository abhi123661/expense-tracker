import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { CategoryPicker } from '../components/CategoryPicker'
import { useToast } from '../components/Toast'

export function AddExpense() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      await api.createExpense({
        amount: parseFloat(amount),
        category_id: categoryId,
        date,
        note: note || undefined,
      })
      toast('Expense added!')
      navigate('/history')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Add Expense</h1>

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

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[var(--primary)] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Adding...' : 'Add Expense'}
        </button>
      </form>
    </div>
  )
}
