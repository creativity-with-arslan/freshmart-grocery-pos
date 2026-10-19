
import { useCallback, useEffect, useState } from 'react'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  RefreshCw,
  Boxes,
  AlertCircle,
} from 'lucide-react'
import { getProducts } from '../services/productService'

const API_URL = `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/api`

const initialForm = {
  productId: '',
  type: 'increase',
  quantity: '',
  reason: 'New stock received',
  notes: '',
}

const reasons = [
  'New stock received',
  'Damaged goods',
  'Expired products',
  'Stock count correction',
  'Returned goods',
  'Other',
]

function formatDate(date) {
  return new Date(date).toLocaleString()
}

export default function StockAdjustmentPanel() {
  const [products, setProducts] = useState([])
  const [history, setHistory] = useState([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [productData, historyResponse] = await Promise.all([
        getProducts(),
        fetch(`${API_URL}/stock-adjustments`),
      ])

      const historyResult = await historyResponse.json()

      if (!historyResponse.ok || !historyResult.success) {
        throw new Error(
          historyResult.message || 'Could not load adjustment history.'
        )
      }

      setProducts(productData)
      setHistory(historyResult.data || [])

      setForm((current) => {
        const stillExists = productData.some(
          (product) => product._id === current.productId
        )

        return {
          ...current,
          productId: stillExists
            ? current.productId
            : productData[0]?._id || '',
        }
      })
    } catch (err) {
      setError(err.message || 'Could not load inventory data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const selectedProduct = products.find(
    (product) => product._id === form.productId
  )

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    setError('')
    setSuccess('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const amount = Number(form.quantity)

    if (!form.productId) {
      setError('Please select a product.')
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a quantity greater than zero.')
      return
    }

    if (amount > 1000000000) {
      setError('The quantity is too large.')
      return
    }

    if (!form.reason.trim()) {
      setError('Please provide a reason.')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(
        `${API_URL}/products/${form.productId}/adjust-stock`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: form.type,
            quantity: amount,
            reason: form.reason,
            notes: form.notes,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Stock adjustment failed.')
      }

      setSuccess(result.message || 'Stock adjusted successfully.')

      setForm((current) => ({
        ...current,
        quantity: '',
        notes: '',
      }))

      await loadData()
    } catch (err) {
      setError(err.message || 'Could not adjust stock.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-400'

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Stock Adjustment
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Update quantities and keep a record of every change.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
        >
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-white/10 bg-[#111827] p-5"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
              <Boxes size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Adjust quantity</h3>
              <p className="text-xs text-slate-400">
                Choose a product and enter the change.
              </p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Product
            </label>
            <select
              name="productId"
              value={form.productId}
              onChange={handleChange}
              disabled={loading || products.length === 0}
              required
              className={inputClass}
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name} — Stock: {product.stock} {product.unit}
                </option>
              ))}
            </select>

            {selectedProduct && (
              <p className="mt-2 text-xs text-slate-400">
                Current stock:{' '}
                <span className="font-semibold text-white">
                  {selectedProduct.stock} {selectedProduct.unit}
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Adjustment type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    type: 'increase',
                    reason: 'New stock received',
                  }))
                }
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm ${
                  form.type === 'increase'
                    ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300'
                    : 'border-white/10 text-slate-400 hover:bg-white/5'
                }`}
              >
                <ArrowUpCircle size={18} />
                Increase
              </button>

              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    type: 'decrease',
                    reason: 'Damaged goods',
                  }))
                }
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm ${
                  form.type === 'decrease'
                    ? 'border-rose-400 bg-rose-400/10 text-rose-300'
                    : 'border-white/10 text-slate-400 hover:bg-white/5'
                }`}
              >
                <ArrowDownCircle size={18} />
                Decrease
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              min="0.000001"
              max="1000000000"
              step="any"
              required
              placeholder="Enter quantity"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-500">
              Enter the amount to add or remove, not the final stock total.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Reason
            </label>
            <select
              name="reason"
              value={form.reason}
              onChange={handleChange}
              required
              className={inputClass}
            >
              {reasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Additional notes (optional)
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              maxLength={500}
              rows={3}
              placeholder="Supplier delivery, damaged batch, stock count..."
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={saving || loading || products.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && (
              <RefreshCw size={17} className="animate-spin" />
            )}
            {saving ? 'Saving adjustment...' : 'Save adjustment'}
          </button>

          {!loading && products.length === 0 && (
            <p className="text-sm text-amber-300">
              Add a product on the Products page before adjusting stock.
            </p>
          )}
        </form>

        <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-violet-400/10 p-3 text-violet-300">
              <History size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-white">
                Recent stock movements
              </h3>
              <p className="text-xs text-slate-400">
                Showing the latest 100 adjustments.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Loading stock history...
            </p>
          ) : history.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No adjustments recorded yet.
            </p>
          ) : (
            <div className="max-h-[650px] space-y-3 overflow-y-auto pr-1">
              {history.map((item) => (
                <div
                  key={item._id}
                  className="rounded-xl border border-white/10 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">
                        {item.productName}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.reason}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        item.type === 'increase'
                          ? 'bg-emerald-400/10 text-emerald-300'
                          : 'bg-rose-400/10 text-rose-300'
                      }`}
                    >
                      {item.type === 'increase' ? '+' : '-'}
                      {item.quantity}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-slate-400">
                    <span>
                      {item.previousStock} → {item.newStock}
                    </span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>

                  {item.notes && (
                    <p className="mt-2 break-words text-xs text-slate-500">
                      {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
