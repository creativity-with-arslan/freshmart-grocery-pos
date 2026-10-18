
import { useCallback, useEffect, useState } from 'react'
import { UserPlus, Users, RefreshCw, ShieldCheck } from 'lucide-react'
import { apiRequest } from '../services/api'

const API_URL = 'http://localhost:5000/api/auth/users'

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'cashier',
}

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = await apiRequest(API_URL)
      setUsers(result.data.users)
    } catch (err) {
      setError(err.message || 'Could not load users.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      await apiRequest(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: form.role,
        }),
      })

      setForm(emptyForm)
      setSuccess('User account created successfully.')
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Could not create user.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'mt-2 w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-400'

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/[0.07] bg-[#11182a] p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-300">
            <UserPlus size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Create staff account</h3>
            <p className="mt-1 text-sm text-slate-400">
              Add an administrator or cashier to FreshMart.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-300">
            Full name
            <input
              className={inputClass}
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter full name"
              maxLength={100}
              required
            />
          </label>

          <label className="text-sm font-medium text-slate-300">
            Email address
            <input
              className={inputClass}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="cashier@example.com"
              maxLength={254}
              required
            />
          </label>

          <label className="text-sm font-medium text-slate-300">
            Password
            <input
              className={inputClass}
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 10 characters"
              minLength={10}
              maxLength={72}
              autoComplete="new-password"
              required
            />
            <span className="mt-1 block text-xs text-slate-500">
              Use a strong, unique password.
            </span>
          </label>

          <label className="text-sm font-medium text-slate-300">
            Account role
            <select
              className={inputClass}
              name="role"
              value={form.role}
              onChange={handleChange}
              required
            >
              <option value="cashier">Cashier</option>
              <option value="admin">Administrator</option>
            </select>
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus size={17} />
              {saving ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-300">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">
            {success}
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#11182a]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/5 p-3 text-emerald-300">
              <Users size={21} />
            </div>
            <div>
              <h3 className="font-bold">Staff accounts</h3>
              <p className="mt-1 text-xs text-slate-500">
                {users.length} registered account{users.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-60"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Name</th>
                <th className="px-5 py-4 font-medium">Email</th>
                <th className="px-5 py-4 font-medium">Role</th>
                <th className="px-5 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                    Loading staff accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                    No user accounts found.
                  </td>
                </tr>
              ) : (
                users.map((item) => (
                  <tr key={item._id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-4 font-medium text-white">
                      {item.name}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {item.email}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-300">
                        <ShieldCheck size={13} />
                        {item.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.active
                          ? 'bg-emerald-400/10 text-emerald-300'
                          : 'bg-rose-400/10 text-rose-300'
                      }`}>
                        {item.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
