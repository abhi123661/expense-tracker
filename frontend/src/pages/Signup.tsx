import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

export function Signup() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await api.signup({ email, password, name })
      login(res.token, res.user)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-[var(--background)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-1">💰 Expense Tracker</h1>
          <p className="text-[var(--muted-foreground)]">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="text-sm text-[var(--destructive)] bg-[var(--muted)] p-3 rounded-xl">{error}</p>
          )}

          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="w-full p-3.5 border border-[var(--border)] rounded-xl bg-[var(--background)] focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full p-3.5 border border-[var(--border)] rounded-xl bg-[var(--background)] focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
          />

          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={6}
            className="w-full p-3.5 border border-[var(--border)] rounded-xl bg-[var(--background)] focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[var(--primary)] text-white font-semibold rounded-xl disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--muted-foreground)] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--primary)] font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
