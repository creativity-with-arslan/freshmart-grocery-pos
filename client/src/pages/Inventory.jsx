import StockAdjustmentPanel from '../components/StockAdjustmentPanel'
import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  RefreshCw,
  Boxes,
  Package,
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
} from 'lucide-react'
import { getProducts } from '../services/productService'

const currency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString('en-PK', {
    maximumFractionDigits: 2,
  })}`

function Inventory() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadInventory() {
    setLoading(true)
    setError('')

    try {
      const data = await getProducts()
      setProducts(data)
    } catch (err) {
      setError(err.message || 'Unable to load inventory.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInventory()
  }, [])

  const lowStockProducts = products.filter(
    (product) =>
      Number(product.stock) <= Number(product.lowStockThreshold),
  )

  const outOfStockProducts = products.filter(
    (product) => Number(product.stock) === 0,
  )

  const totalUnits = products.reduce(
    (total, product) => total + Number(product.stock || 0),
    0,
  )

  const inventoryCostValue = products.reduce(
    (total, product) =>
      total + Number(product.stock || 0) * Number(product.costPrice || 0),
    0,
  )

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase()

    return products.filter((product) => {
      const matchesSearch = [
        product.name,
        product.barcode,
        product.category,
      ].some((value) => String(value || '').toLowerCase().includes(term))

      const stock = Number(product.stock)
      const threshold = Number(product.lowStockThreshold)

      let matchesStock = true

      if (stockFilter === 'In stock') {
        matchesStock = stock > threshold
      } else if (stockFilter === 'Low stock') {
        matchesStock = stock > 0 && stock <= threshold
      } else if (stockFilter === 'Out of stock') {
        matchesStock = stock === 0
      }

      return matchesSearch && matchesStock
    })
  }, [products, search, stockFilter])

  function getStockStatus(product) {
    const stock = Number(product.stock)
    const threshold = Number(product.lowStockThreshold)

    if (stock === 0) {
      return {
        label: 'Out of stock',
        className: 'bg-rose-400/10 text-rose-300',
      }
    }

    if (stock <= threshold) {
      return {
        label: 'Low stock',
        className: 'bg-amber-400/10 text-amber-300',
      }
    }

    return {
      label: 'In stock',
      className: 'bg-emerald-400/10 text-emerald-300',
    }
  }

  function getExpiryStatus(expiryDate) {
    if (!expiryDate) return 'No expiry date'

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const expiry = new Date(expiryDate)
    expiry.setHours(0, 0, 0, 0)

    if (Number.isNaN(expiry.getTime())) return 'Invalid date'

    if (expiry < today) return 'Expired'

    const daysRemaining = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    )

    if (daysRemaining <= 30) {
      return `Expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`
    }

    return expiry.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-400">
            Monitor stock levels and product availability
          </p>
          <h2 className="mt-1 text-2xl font-bold">Inventory Management</h2>
        </div>

        <button
          onClick={loadInventory}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh inventory
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Product types"
          value={products.length.toLocaleString()}
          icon={Package}
        />

        <SummaryCard
          label="Total units in stock"
          value={totalUnits.toLocaleString()}
          icon={Boxes}
        />

        <SummaryCard
          label="Low-stock products"
          value={lowStockProducts.length.toLocaleString()}
          icon={AlertTriangle}
          warning={lowStockProducts.length > 0}
        />

        <SummaryCard
          label="Out of stock"
          value={outOfStockProducts.length.toLocaleString()}
          icon={CheckCircle2}
          warning={outOfStockProducts.length > 0}
        />
      </div>

      <section className="rounded-2xl border border-white/[0.07] bg-[#11182a] p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-sky-400/10 p-3 text-sky-300">
            <Boxes size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-400">
              Estimated inventory cost value
            </p>
            <p className="mt-1 text-2xl font-bold">
              {currency(inventoryCostValue)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Calculated using current stock × cost price. This is not the
              selling value or profit.
            </p>
          </div>
        </div>
      </section>

      {lowStockProducts.length > 0 && (
        <section className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-300" />
            <h3 className="font-bold">Restocking attention needed</h3>
          </div>

          <p className="mt-2 text-sm text-slate-400">
            {lowStockProducts.length} product
            {lowStockProducts.length === 1 ? ' is' : 's are'} at or below
            its configured stock threshold.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {lowStockProducts.slice(0, 8).map((product) => (
              <span
                key={product._id}
                className="rounded-lg border border-amber-400/10 bg-amber-400/5 px-3 py-2 text-xs text-amber-200"
              >
                {product.name}: {product.stock} {product.unit}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#11182a]">
        <div className="flex flex-col gap-3 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products, barcodes or categories..."
              className="w-full rounded-xl border border-white/10 bg-[#0b1020] py-3 pl-10 pr-3 text-sm outline-none placeholder:text-slate-600 focus:border-emerald-400/50"
            />
          </div>

          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0b1020] px-3 py-3 text-sm text-slate-300 outline-none"
          >
            <option value="All">All stock statuses</option>
            <option value="In stock">In stock</option>
            <option value="Low stock">Low stock</option>
            <option value="Out of stock">Out of stock</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Product</th>
                <th className="px-5 py-4 font-medium">Category</th>
                <th className="px-5 py-4 font-medium">Stock</th>
                <th className="px-5 py-4 font-medium">Threshold</th>
                <th className="px-5 py-4 font-medium">Stock status</th>
                <th className="px-5 py-4 font-medium">Expiry</th>
                <th className="px-5 py-4 font-medium">Stock cost value</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.05]">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-slate-400"
                  >
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <Boxes
                      size={30}
                      className="mx-auto mb-3 text-slate-600"
                    />
                    <p className="font-medium text-slate-300">
                      No matching inventory
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Try another search or stock status.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const status = getStockStatus(product)

                  return (
                    <tr
                      key={product._id}
                      className="transition hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-100">
                          {product.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {product.barcode || 'No barcode'}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-400">
                        {product.category}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-200">
                        {product.stock} {product.unit}
                      </td>

                      <td className="px-5 py-4 text-slate-400">
                        {product.lowStockThreshold} {product.unit}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-400">
                        <span className="inline-flex items-center gap-2">
                          <CalendarClock
                            size={15}
                            className="shrink-0 text-slate-500"
                          />
                          {getExpiryStatus(product.expiryDate)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {currency(
                          Number(product.stock || 0) *
                            Number(product.costPrice || 0),
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-white/[0.07] px-5 py-4 text-xs text-slate-500">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </section>
      <StockAdjustmentPanel />
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon, warning = false }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#11182a] p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>

        <div
          className={`rounded-xl p-2.5 ${
            warning
              ? 'bg-amber-400/10 text-amber-300'
              : 'bg-emerald-400/10 text-emerald-300'
          }`}
        >
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-4 text-2xl font-bold">{value}</p>
    </div>
  )
}

export default Inventory
