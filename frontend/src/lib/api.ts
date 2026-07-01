const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth_token')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, {
    headers,
    ...options,
  })

  if (res.status === 401) {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    window.location.href = '/login'
    throw new Error('Session expired')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Categories
  getCategories: () => request<import('./types').Category[]>('/api/categories'),
  createCategory: (data: { name: string; icon: string; color: string }) =>
    request<import('./types').Category>('/api/categories', { method: 'POST', body: JSON.stringify(data) }),

  // Expenses
  getExpenses: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<import('./types').ExpenseListResponse>(`/api/expenses${query}`)
  },
  getExpense: (id: string) => request<import('./types').Expense>(`/api/expenses/${id}`),
  createExpense: (data: import('./types').ExpenseCreate) =>
    request<import('./types').Expense>('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id: string, data: import('./types').ExpenseCreate) =>
    request<import('./types').Expense>(`/api/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id: string) =>
    request<{ message: string }>(`/api/expenses/${id}`, { method: 'DELETE' }),

  // Budgets
  getBudgets: () => request<import('./types').Budget[]>('/api/budgets'),
  createBudget: (data: { category_id: string; amount: number; period: string }) =>
    request('/api/budgets', { method: 'POST', body: JSON.stringify(data) }),
  deleteBudget: (id: string) =>
    request<{ message: string }>(`/api/budgets/${id}`, { method: 'DELETE' }),

  // Recurring
  getRecurring: () => request<import('./types').RecurringExpense[]>('/api/recurring'),
  createRecurring: (data: Record<string, unknown>) =>
    request('/api/recurring', { method: 'POST', body: JSON.stringify(data) }),
  updateRecurring: (id: string, data: Record<string, unknown>) =>
    request(`/api/recurring/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRecurring: (id: string) =>
    request<{ message: string }>(`/api/recurring/${id}`, { method: 'DELETE' }),
  processRecurring: () =>
    request<{ message: string; created: number }>('/api/recurring/process', { method: 'POST' }),

  // Summary
  getSummary: (period = 'monthly', date?: string) => {
    const params = new URLSearchParams({ period })
    if (date) params.set('date', date)
    return request<import('./types').Summary>(`/api/summary?${params}`)
  },

  // Export
  getExportUrl: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return `${API_URL}/api/expenses/export${query}`
  },

  // Auth
  signup: (data: { email: string; password: string; name: string }) =>
    request<{ token: string; user: { id: string; email: string; name: string } }>('/api/auth/signup', {
      method: 'POST', body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: { id: string; email: string; name: string } }>('/api/auth/login', {
      method: 'POST', body: JSON.stringify(data),
    }),
}
