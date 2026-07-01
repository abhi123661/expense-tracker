import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/utils'
import type { Summary } from '../lib/types'
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell
} from 'recharts'

export function Dashboard() {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getSummary(period).then((data) => {
      setSummary(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [period])

  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[var(--muted-foreground)] mt-4">Loading...</p>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[var(--muted-foreground)] mt-4">Failed to load data.</p>
      </div>
    )
  }

  const { summary: stats, categories, daily } = summary

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* Header + Period Toggle */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {period === 'weekly' ? "This week's" : "This month's"} overview
          </p>
        </div>
        <div className="flex bg-[var(--muted)] rounded-lg p-1">
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              period === 'weekly'
                ? 'bg-[var(--background)] shadow-sm text-[var(--foreground)]'
                : 'text-[var(--muted-foreground)]'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              period === 'monthly'
                ? 'bg-[var(--background)] shadow-sm text-[var(--foreground)]'
                : 'text-[var(--muted-foreground)]'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--muted)] p-4 rounded-xl">
          <p className="text-xs text-[var(--muted-foreground)]">Total Spent</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(stats.total_spent)}</p>
        </div>
        <div className="bg-[var(--muted)] p-4 rounded-xl">
          <p className="text-xs text-[var(--muted-foreground)]">Transactions</p>
          <p className="text-xl font-bold mt-1">{stats.total_count}</p>
        </div>
        <div className="bg-[var(--muted)] p-4 rounded-xl">
          <p className="text-xs text-[var(--muted-foreground)]">Daily Average</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(stats.avg_expense)}</p>
        </div>
        <div className="bg-[var(--muted)] p-4 rounded-xl">
          <p className="text-xs text-[var(--muted-foreground)]">Top Category</p>
          <p className="text-xl font-bold mt-1">
            {categories.length > 0 ? categories[0].category_icon + ' ' + categories[0].category_name : '—'}
          </p>
        </div>
      </div>

      {/* Daily Spending Bar Chart */}
      {daily.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[var(--muted-foreground)] mb-3">Daily Spending</h2>
          <div className="bg-[var(--muted)] p-3 rounded-xl">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={daily}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).getDate().toString()}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), 'Spent']}
                  labelFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                />
                <Bar dataKey="total_spent" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {categories.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[var(--muted-foreground)] mb-3">By Category</h2>
          <div className="bg-[var(--muted)] p-4 rounded-xl flex gap-4">
            {/* Pie Chart */}
            <div className="w-24 h-24 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="total_spent"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    strokeWidth={2}
                  >
                    {categories.map((cat) => (
                      <Cell key={cat.category_id} fill={cat.category_color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex-1 flex flex-col gap-2">
              {categories.map((cat) => (
                <div key={cat.category_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.category_color }} />
                    <span className="text-xs">{cat.category_icon} {cat.category_name}</span>
                  </div>
                  <span className="text-xs font-medium">{formatCurrency(cat.total_spent)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
