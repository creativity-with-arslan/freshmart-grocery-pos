
import { useState } from 'react'
import { ShoppingCart, LockKeyhole, Mail, Eye, EyeOff } from 'lucide-react'
import { loginUser } from '../services/authService'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await loginUser(email.trim(), password)
      login(data)
    } catch (err) {
      setError(err.message || 'Unable to log in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b1020] px-4 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#11182a] p-7 shadow-2xl sm:p-9">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950">
            <ShoppingCart size={28} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold">FreshMart POS</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to manage your store
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
              Email address
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0b1020] px-4">
              <Mail size={18} className="text-slate-500" />
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@freshmart.local"
                className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
              Password
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0b1020] px-4">
              <LockKeyhole size={18} className="text-slate-500" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="text-slate-500 hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-400 px-4 py-3.5 font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-slate-500">
          Authorized FreshMart staff only. Contact your administrator if you need an account.
        </p>
      </div>
    </div>
  )
}
