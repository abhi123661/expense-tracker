import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/utils'
import type { Budget, Category } from '../lib/types'
import { Download, LogOut, Moon, Plus, Sun, Trash2, X } from 'lucide-react'
import { useToast } from '../components/Toast'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export function SettingsPage() {
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategoryId, setNewCategoryId] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchBudgets = () => {
    api.getBudgets().then((data) => {
      setBudgets(data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchBudgets() }, [])

  const handleOpenForm = async () => {
    if (categories.length === 0) {
      const cats = await api.getCategories()
      setCategories(cats)
    }
    setShowForm(true)
  }

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryId || !newAmount) return

    setSaving(true)
    try {
      await api.createBudget({
        category_id: newCategoryId,
        amount: parseFloat(newAmount),
        period: 'monthly',
      })
      toast('Budget created!')
      setShowForm(false)
      setNewCategoryId('')
      setNewAmount('')
      fetchBudgets()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create budget', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = () => {
    window.open(api.getExportUrl(), '_blank')
  }

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Remove this budget?')) return
    try {
      await api.deleteBudget(id)
      setBudgets((prev) => prev.filter((b) => b.id !== id))
      toast('Budget removed')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete', 'error')
    }
  }

  const getBudgetColor = (percentage: number) => {
    if (percentage >= 90) return 'var(--destructive)'
    if (percentage >= 70) return 'var(--warning)'
    return 'var(--success)'
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Theme */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--muted-foreground)] mb-2">Appearance</h2>
        <div className="flex bg-[var(--muted)] rounded-xl p-1 gap-1">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-colors ${
              theme === 'light' ? 'bg-[var(--background)] shadow-sm' : 'text-[var(--muted-foreground)]'
            }`}
          >
            <Sun size={16} /> Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-colors ${
              theme === 'dark' ? 'bg-[var(--background)] shadow-sm' : 'text-[var(--muted-foreground)]'
            }`}
          >
            <Moon size={16} /> Dark
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
              theme === 'system' ? 'bg-[var(--background)] shadow-sm' : 'text-[var(--muted-foreground)]'
            }`}
          >
            Auto
          </button>
        </div>
      </div>

      {/* Export */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--muted-foreground)] mb-2">Export</h2>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 w-full p-4 bg-[var(--muted)] rounded-xl hover:opacity-80 transition-opacity"
        >
          <Download size={20} />
          <span className="font-medium">Download Expenses as CSV</span>
        </button>
      </div>

      {/* Budgets */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-semibold text-[var(--muted-foreground)]">Budgets</h2>
          {!showForm && (
            <button
              onClick={handleOpenForm}
              className="flex items-center gap-1 text-xs font-medium text-[var(--primary)]"
            >
              <Plus size={14} /> Add
            </button>
          )}
        </div>

        {/* Add Budget Form */}
        {showForm && (
          <form onSubmit={handleCreateBudget} className="bg-[var(--muted)] p-4 rounded-xl mb-3 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">New Budget</span>
              <button type="button" onClick={() => setShowForm(false)} className="text-[var(--muted-foreground)]">
                <X size={16} />
              </button>
            </div>
            <select
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
              className="w-full p-3 border border-[var(--border)] rounded-xl bg-[var(--background)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="">Select category</option>
              {categories
                .filter((c) => !budgets.some((b) => b.category_id === c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
            </select>
            <input
              type="number"
              inputMode="decimal"
              placeholder="Monthly limit (₹)"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="w-full p-3 border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--primary)]"
            />
            <button
              type="submit"
              disabled={saving || !newCategoryId || !newAmount}
              className="w-full py-3 bg-[var(--primary)] text-white font-semibold rounded-xl disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Budget'}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-[var(--muted-foreground)]">Loading...</p>
        ) : budgets.length === 0 && !showForm ? (
          <p className="text-sm text-[var(--muted-foreground)] bg-[var(--muted)] p-4 rounded-xl">
            No budgets set. Tap "Add" above to create one.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {budgets.map((budget) => (
              <div key={budget.id} className="bg-[var(--muted)] p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span>{budget.category_icon}</span>
                    <span className="font-medium text-sm">{budget.category_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                    </span>
                    <button
                      onClick={() => handleDeleteBudget(budget.id)}
                      className="text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(budget.percentage, 100)}%`,
                      backgroundColor: getBudgetColor(budget.percentage),
                    }}
                  />
                </div>
                <p className="text-xs mt-1 font-medium" style={{ color: getBudgetColor(budget.percentage) }}>
                  {Math.round(budget.percentage)}% used
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Categories */}
      <CategoryCreator />

      {/* Account */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--muted-foreground)] mb-2">Account</h2>
        {user && (
          <p className="text-sm text-[var(--muted-foreground)] mb-2">
            Signed in as <span className="font-medium text-[var(--foreground)]">{user.email}</span>
          </p>
        )}
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="flex items-center gap-2 w-full p-4 bg-[var(--muted)] rounded-xl hover:opacity-80 transition-opacity text-[var(--destructive)]"
        >
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  )
}

const PALETTE = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']

function CategoryCreator() {
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [color, setColor] = useState(PALETTE[0])
  const [saving, setSaving] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    try {
      await api.createCategory({ name: name.trim(), icon: icon || '📁', color })
      toast('Category created!')
      setShowForm(false)
      setName('')
      setIcon('')
      setColor(PALETTE[0])
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create category', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-semibold text-[var(--muted-foreground)]">Custom Categories</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-xs font-medium text-[var(--primary)]"
          >
            <Plus size={14} /> New
          </button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleCreate} className="bg-[var(--muted)] p-4 rounded-xl flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">New Category</span>
            <button type="button" onClick={() => setShowForm(false)} className="text-[var(--muted-foreground)]">
              <X size={16} />
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Emoji"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-16 p-2.5 text-center text-lg border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:border-[var(--primary)]"
              maxLength={2}
            />
            <input
              type="text"
              placeholder="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          {/* Color picker */}
          <div className="flex gap-2 flex-wrap">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-[var(--primary)]' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full py-3 bg-[var(--primary)] text-white font-semibold rounded-xl disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Category'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)] bg-[var(--muted)] p-4 rounded-xl">
          Create custom categories with your own emoji and color.
        </p>
      )}
    </div>
  )
}
