
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Banknote,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { getProducts } from '../services/productService'
import { getSales } from '../services/saleService'

const money = (value) =>
  `Rs. ${Number(value || 0).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const getLocalDateKey = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getTodayKey = () => getLocalDateKey(new Date())

const formatShortDate = (date) =>
  date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })

const formatDateTime = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Unknown date'
    : date.toLocaleString('en-PK', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
}

function StatCard({ title, value, description, Icon, iconColor = 'text-cyan-300' }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-3 break-words text-2xl font-bold text-white">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <Icon size={22} className={iconColor} />
        </div>
      </div>
    </div>
  )
}

export default function DashboardAnalytics() {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [productData, saleData] = await Promise.all([
        getProducts(),
        getSales(),
      ])

      setProducts(Array.isArray(productData) ? productData : [])
      setSales(Array.isArray(saleData) ? saleData : [])
    } catch (err) {
      setError(err.message || 'Could not load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const analytics = useMemo(() => {
    const todayKey = getTodayKey()
    const todaySales = sales.filter(
      (sale) => getLocalDateKey(sale.createdAt) === todayKey
    )

    const todayRevenue = todaySales.reduce(
      (sum, sale) => sum + Number(sale.total || 0),
      0
    )

    const inventoryValue = products.reduce(
      (sum, product) =>
        sum +
        Number(product.stock || 0) * Number(product.costPrice || 0),
      0
    )

    const lowStockProducts = products.filter(
      (product) =>
        Number(product.stock || 0) <=
        Number(product.lowStockThreshold ?? 10)
    )

    const outOfStockProducts = products.filter(
      (product) => Number(product.stock || 0) <= 0
    )

    const productById = new Map(
      products.map((product) => [String(product._id), product])
    )

    // Estimate gross profit using each product's CURRENT cost price.
    // This is an estimate, not historical accounting profit.
    const estimatedProfit = sales.reduce((saleSum, sale) => {
      const itemMargin = (sale.items || []).reduce((itemSum, item) => {
        const productId =
          typeof item.product === 'object'
            ? item.product?._id
            : item.product

        const product = productById.get(String(productId))
        if (!product || product.costPrice == null) return itemSum

        const quantity = Number(item.quantity || 0)
        const sellingPrice = Number(item.unitPrice || 0)
        const costPrice = Number(product.costPrice || 0)

        return itemSum + (sellingPrice - costPrice) * quantity
      }, 0)

      return saleSum + itemMargin - Number(sale.discount || 0)
    }, 0)

    const chartData = Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - (6 - index))

      const dateKey = getLocalDateKey(date)
      const dailySales = sales.filter(
        (sale) => getLocalDateKey(sale.createdAt) === dateKey
      )

      return {
        date: dateKey,
        day: formatShortDate(date),
        revenue: dailySales.reduce(
          (sum, sale) => sum + Number(sale.total || 0),
          0
        ),
        transactions: dailySales.length,
      }
    })

    return {
      todayRevenue,
      todayTransactions: todaySales.length,
      inventoryValue,
      lowStockProducts,
      outOfStockProducts,
      estimatedProfit,
      chartData,
      recentSales: [...sales]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        )
        .slice(0, 5),
    }
  }, [products, sales])

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-slate-400">
        <RefreshCw size={20} className="animate-spin" />
        Loading live dashboard analytics...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Live sales and inventory overview for FreshMart Grocery.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5"
        >
          <RefreshCw size={16} />
          Refresh data
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
          <button
            type="button"
            onClick={loadDashboard}
            className="ml-3 underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's revenue"
          value={money(analytics.todayRevenue)}
          description={`${analytics.todayTransactions} transactions today`}
          Icon={Banknote}
        />
        <StatCard
          title="Today's transactions"
          value={analytics.todayTransactions.toLocaleString()}
          description="Completed sales recorded today"
          Icon={ShoppingCart}
          iconColor="text-emerald-300"
        />
        <StatCard
          title="Inventory cost value"
          value={money(analytics.inventoryValue)}
          description="Current stock × recorded cost price"
          Icon={Package}
          iconColor="text-violet-300"
        />
        <StatCard
          title="Estimated gross profit"
          value={money(analytics.estimatedProfit)}
          description="Estimate using current product costs"
          Icon={TrendingUp}
          iconColor="text-amber-300"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
        <section className="min-w-0 rounded-2xl border border-white/10 bg-[#111827] p-5">
          <div className="mb-5">
            <h2 className="font-semibold text-white">Revenue trend</h2>
            <p className="mt-1 text-xs text-slate-400">
              Daily revenue for the last 7 calendar days
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#273449"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickFormatter={(value) =>
                    value >= 1000
                      ? `Rs.${(value / 1000).toFixed(1)}k`
                      : `Rs.${value}`
                  }
                  width={72}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{
                    backgroundColor: '#0b1220',
                    border: '1px solid #334155',
                    borderRadius: 12,
                    color: '#fff',
                  }}
                  formatter={(value) => [money(value), 'Revenue']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#22d3ee"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={42}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Chart totals use the sales records currently returned by the API.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111827] p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-white">Inventory alerts</h2>
              <p className="mt-1 text-xs text-slate-400">
                Products that may need attention
              </p>
            </div>
            <AlertTriangle size={20} className="text-amber-300" />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-amber-400/10 p-3">
              <p className="text-xs text-amber-200">Low stock</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {analytics.lowStockProducts.length}
              </p>
            </div>
            <div className="rounded-xl bg-red-400/10 p-3">
              <p className="text-xs text-red-200">Out of stock</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {analytics.outOfStockProducts.length}
              </p>
            </div>
          </div>

          {analytics.lowStockProducts.length === 0 ? (
            <div className="rounded-xl border border-white/5 p-4 text-sm text-slate-400">
              All products are above their low-stock thresholds.
            </div>
          ) : (
            <div className="max-h-64 space-y-3 overflow-y-auto">
              {analytics.lowStockProducts.slice(0, 8).map((product) => {
                const stock = Number(product.stock || 0)
                const threshold = Number(
                  product.lowStockThreshold ?? 10
                )
                const isEmpty = stock <= 0

                return (
                  <div
                    key={product._id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/5 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {product.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Threshold: {threshold} {product.unit || 'units'}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                        isEmpty
                          ? 'bg-red-400/10 text-red-300'
                          : 'bg-amber-400/10 text-amber-200'
                      }`}
                    >
                      {stock} {product.unit || 'units'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 p-5">
          <div>
            <h2 className="font-semibold text-white">Recent transactions</h2>
            <p className="mt-1 text-xs text-slate-400">
              Latest sales returned by the sales API
            </p>
          </div>
          <Activity size={20} className="text-cyan-300" />
        </div>

        {analytics.recentSales.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No sales have been recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Receipt</th>
                  <th className="px-5 py-4 font-medium">Date</th>
                  <th className="px-5 py-4 font-medium">Payment</th>
                  <th className="px-5 py-4 text-right font-medium">Total</th>
                  <th className="px-5 py-4 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {analytics.recentSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-4 font-medium text-white">
                      {sale.receiptNumber || '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className="px-5 py-4 capitalize text-slate-300">
                      {String(sale.paymentMethod || '—').replace('_', ' ')}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-white">
                      {money(sale.total)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="rounded-lg bg-emerald-400/10 px-2.5 py-1.5 text-xs text-emerald-300">
                        {sale.status || 'completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-slate-500">
        Analytics are based on the latest sales records supplied by the current
        API. The profit figure is approximate because it uses today's product
        cost prices, which may differ from costs when older sales occurred.
      </p>
    </div>
  )
}
