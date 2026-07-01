import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatCurrency, formatDate } from '../lib/utils'
import type { Category, Expense } from '../lib/types'
import { Filter, Pencil, Trash2, X } from 'lucide-react'
import { useToast } from '../components/Toast'

const PAGE_SIZE = 20

export function History() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // Filters — draft state (what the user is typing, no fetch triggered)
  const [showFilters, setShowFilters] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [categories, setCategories] = useState<Category[]>([])

  // Applied state — fetch only fires when these change (via Apply button or instant fields)
  const [appliedSearch, setAppliedSearch] = useState('')
  const [appliedMin, setAppliedMin] = useState('')
  const [appliedMax, setAppliedMax] = useState('')

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null)

  const activeFilterCount = [appliedSearch, categoryId, dateFrom, dateTo, appliedMin, appliedMax].filter(Boolean).length

  const buildParams = useCallback((p: number) => {
    const params: Record<string, string> = { page: String(p), limit: String(PAGE_SIZE) }
    if (appliedSearch) params.search = appliedSearch
    if (categoryId) params.category_id = categoryId
    if (dateFrom) params.from = dateFrom
    if (dateTo) params.to = dateTo
    if (appliedMin) params.min_amount = appliedMin
    if (appliedMax) params.max_amount = appliedMax
    return params
  }, [appliedSearch, categoryId, dateFrom, dateTo, appliedMin, appliedMax])

  const fetchExpenses = useCallback(async (p: number, append = false) => {
    if (p === 1) setLoading(true)
    else setLoadingMore(true)

    try {
      const data = await api.getExpenses(buildParams(p))
      const items = data.expenses || []
      if (append) {
        setExpenses((prev) => [...prev, ...items])
      } else {
        setExpenses(items)
      }
      setTotal(data.total)
      setHasMore(append ? expenses.length + items.length < data.total : items.length < data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [buildParams])

  // Fetch on initial load and whenever applied filters or instant filters change
  useEffect(() => {
    setPage(1)
    setHasMore(true)
    fetchExpenses(1)
  }, [appliedSearch, categoryId, dateFrom, dateTo, appliedMin, appliedMax])

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          const nextPage = page + 1
          setPage(nextPage)
          fetchExpenses(nextPage, true)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, page, fetchExpenses])

  // Load categories for filter dropdown
  useEffect(() => {
    if (showFilters && categories.length === 0) {
      api.getCategories().then(setCategories).catch(() => {})
    }
  }, [showFilters])

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

  const applyFilters = () => {
    setAppliedSearch(search)
    setAppliedMin(minAmount)
    setAppliedMax(maxAmount)
  }

  const clearFilters = () => {
    setSearch('')
    setCategoryId('')
    setDateFrom('')
    setDateTo('')
    setMinAmount('')
    setMaxAmount('')
    setAppliedSearch('')
    setAppliedMin('')
    setAppliedMax('')
  }

  if (loading && page === 1) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">History</h1>
        <p className="text-[var(--muted-foreground)]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-2xl font-bold">History</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--muted-foreground)]">{total} expenses</span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative p-2 rounded-lg transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
            }`}
          >
            <Filter size={18} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--destructive)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-[var(--muted)] p-4 rounded-xl mb-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-[var(--primary)] flex items-center gap-1">
                <X size={12} /> Clear all
              </button>
            )}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="w-full p-2.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:border-[var(--primary)]"
          />

          {/* Category */}
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full p-2.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:border-[var(--primary)]"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From"
              className="flex-1 p-2.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:border-[var(--primary)]"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To"
              className="flex-1 p-2.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          {/* Amount range */}
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              placeholder="Min ₹"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="flex-1 p-2.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:border-[var(--primary)]"
            />
            <input
              type="number"
              inputMode="decimal"
              placeholder="Max ₹"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="flex-1 p-2.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          {/* Apply button for typed filters */}
          <button
            onClick={applyFilters}
            className="w-full py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg"
          >
            Apply Filters
          </button>
        </div>
      )}

      {/* Expense List */}
      {expenses.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted-foreground)]">
          <p className="text-lg">{activeFilterCount > 0 ? 'No matching expenses' : 'No expenses yet'}</p>
          <p className="text-sm mt-1">
            {activeFilterCount > 0 ? 'Try adjusting your filters' : 'Tap "Add" to record your first expense'}
          </p>
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

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={sentinelRef} className="py-4 text-center">
              {loadingMore && (
                <p className="text-sm text-[var(--muted-foreground)]">Loading more...</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
