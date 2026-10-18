
import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  CalendarDays,
  Download,
  ShoppingBag,
  TrendingUp,
  Wallet,
  Tag,
  LoaderCircle,
  CreditCard,
  Banknote,
  Smartphone,
  Package,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { apiRequest } from '../services/api'

const COLORS = ['#34d399', '#60a5fa', '#fbbf24']

const money = (amount) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)

const dateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const startOfDay = (date) => {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

const endOfDay = (date) => {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}

const escapeCsv = (value) =>
  `"${String(value ?? '').replace(/"/g, '""')}"`

function StatCard({ title, value, description, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#11182a] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-3 break-words text-2xl font-bold text-white">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>
        <div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-300">
          <Icon size={21} />
        </div>
      </div>
    </div>
  )
}

function Section({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#11182a] p-5">
      <div className="mb-5">
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

export default function Reports() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState('7days')
  const [customStart, setCustomStart] = useState(dateKey(new Date()))
  const [customEnd, setCustomEnd] = useState(dateKey(new Date()))

  useEffect(() => {
    let active = true

    async function loadSales() {
      try {
        setLoading(true)
        setError('')
        const result = await apiRequest('/api/sales')

        if (active) {
          setSales(Array.isArray(result.data) ? result.data : [])
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load sales reports.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSales()

    return () => {
      active = false
    }
  }, [])

  const { startDate, endDate } = useMemo(() => {
    const today = startOfDay(new Date())
    const end = endOfDay(today)
    let start = startOfDay(today)

    if (period === '7days') {
      start.setDate(start.getDate() - 6)
    } else if (period === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1)
    } else if (period === 'custom') {
      start = customStart
        ? startOfDay(new Date(`${customStart}T00:00:00`))
        : start
      return {
        startDate: start,
        endDate: customEnd
          ? endOfDay(new Date(`${customEnd}T00:00:00`))
          : end,
      }
    }

    return { startDate: start, endDate: end }
  }, [period, customStart, customEnd])

  const filteredSales = useMemo(
    () =>
      sales.filter((sale) => {
        const createdAt = new Date(sale.createdAt)
        return (
          !Number.isNaN(createdAt.getTime()) &&
          createdAt >= startDate &&
          createdAt <= endDate
        )
      }),
    [sales, startDate, endDate]
  )

  const summary = useMemo(() => {
    const revenue = filteredSales.reduce(
      (sum, sale) => sum + Number(sale.total || 0),
      0
    )
    const discounts = filteredSales.reduce(
      (sum, sale) => sum + Number(sale.discount || 0),
      0
    )

    return {
      revenue,
      discounts,
      orders: filteredSales.length,
      average: filteredSales.length ? revenue / filteredSales.length : 0,
    }
  }, [filteredSales])

  const dailySales = useMemo(() => {
    const grouped = new Map()
    const cursor = new Date(startDate)

    // Keep charts readable for longer custom ranges.
    const days = Math.ceil((endDate - startDate) / 86400000) + 1
    if (days > 366) cursor.setTime(endDate.getTime() - 365 * 86400000)

    while (cursor <= endDate) {
      const key = dateKey(cursor)
      grouped.set(key, { date: key, revenue: 0, orders: 0 })
      cursor.setDate(cursor.getDate() + 1)
    }

    filteredSales.forEach((sale) => {
      const key = dateKey(new Date(sale.createdAt))
      if (!grouped.has(key)) return
      const row = grouped.get(key)
      row.revenue += Number(sale.total || 0)
      row.orders += 1
    })

    return [...grouped.values()].map((row) => ({
      ...row,
      label: new Date(`${row.date}T00:00:00`).toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'short',
      }),
    }))
  }, [filteredSales, startDate, endDate])

  const paymentData = useMemo(() => {
    const methods = [
      { key: 'cash', name: 'Cash', amount: 0, orders: 0 },
      { key: 'card', name: 'Card', amount: 0, orders: 0 },
      {
        key: 'mobile_wallet',
        name: 'Mobile wallet',
        amount: 0,
        orders: 0,
      },
    ]

    filteredSales.forEach((sale) => {
      const method = methods.find((item) => item.key === sale.paymentMethod)
      if (method) {
        method.amount += Number(sale.total || 0)
        method.orders += 1
      }
    })

    return methods
  }, [filteredSales])

  const topProducts = useMemo(() => {
    const products = new Map()

    filteredSales.forEach((sale) => {
      ;(sale.items || []).forEach((item) => {
        const key = item.product || item.name
        const existing = products.get(key) || {
          name: item.name || 'Unknown product',
          quantity: 0,
          revenue: 0,
        }

        existing.quantity += Number(item.quantity || 0)
        existing.revenue += Number(item.lineTotal || 0)
        products.set(key, existing)
      })
    })

    return [...products.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8)
  }, [filteredSales])

  const downloadCsv = () => {
    const rows = [
      ['FreshMart Sales Report'],
      ['From', dateKey(startDate), 'To', dateKey(endDate)],
      [],
      ['Summary'],
      ['Total revenue', summary.revenue],
      ['Orders', summary.orders],
      ['Average order value', summary.average],
      ['Total discounts', summary.discounts],
      [],
      ['Daily sales'],
      ['Date', 'Revenue (PKR)', 'Orders'],
      ...dailySales.map((day) => [day.date, day.revenue, day.orders]),
      [],
      ['Payment methods'],
      ['Method', 'Revenue (PKR)', 'Orders'],
      ...paymentData.map((item) => [
        item.name,
        item.amount,
        item.orders,
      ]),
      [],
      ['Top-selling products'],
      ['Product', 'Quantity sold', 'Sales value (PKR)'],
      ...topProducts.map((item) => [
        item.name,
        item.quantity,
        item.revenue,
      ]),
    ]

    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n')
    const blob = new Blob(['\uFEFF', csv], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `freshmart-report-${dateKey(startDate)}-to-${dateKey(endDate)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-slate-400">
        <LoaderCircle className="animate-spin" size={22} />
        Loading sales reports...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6">
        <h3 className="font-semibold text-red-300">Unable to load reports</h3>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Sales Reports</h2>
          <p className="mt-1 text-sm text-slate-400">
            Review sales performance and payment activity.
          </p>
        </div>

        <button
          onClick={downloadCsv}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
        >
          <Download size={17} />
          Export CSV
        </button>
      </div>

      <div className="rounded-2xl border border-white/[0.07] bg-[#11182a] p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <CalendarDays size={17} className="text-emerald-300" />
          Report period
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ['today', 'Today'],
            ['7days', 'Last 7 days'],
            ['month', 'This month'],
            ['custom', 'Custom range'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`rounded-lg px-4 py-2 text-sm transition ${
                period === value
                  ? 'bg-emerald-400 font-semibold text-slate-950'
                  : 'border border-white/10 text-slate-300 hover:bg-white/5'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-400">
              Start date
              <input
                type="date"
                value={customStart}
                max={customEnd || undefined}
                onChange={(event) => setCustomStart(event.target.value)}
                className="mt-2 block w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-white"
              />
            </label>
            <label className="text-sm text-slate-400">
              End date
              <input
                type="date"
                value={customEnd}
                min={customStart || undefined}
                max={dateKey(new Date())}
                onChange={(event) => setCustomEnd(event.target.value)}
                className="mt-2 block w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-white"
              />
            </label>
          </div>
        )}

        <p className="mt-3 text-xs text-slate-500">
          {dateKey(startDate)} to {dateKey(endDate)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total revenue"
          value={money(summary.revenue)}
          description="Total completed sale value"
          icon={Wallet}
        />
        <StatCard
          title="Total orders"
          value={summary.orders.toLocaleString()}
          description="Completed sales in this period"
          icon={ShoppingBag}
        />
        <StatCard
          title="Average order value"
          value={money(summary.average)}
          description="Revenue divided by orders"
          icon={TrendingUp}
        />
        <StatCard
          title="Total discounts"
          value={money(summary.discounts)}
          description="Discounts recorded on sales"
          icon={Tag}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Section
            title="Revenue over time"
            subtitle="Daily sales revenue for the selected period"
          >
            {summary.orders === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">
                No sales found for this period.
              </p>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySales}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#ffffff12" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      stroke="#94a3b8"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => value.toLocaleString()}
                      width={65}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#0b1020',
                        border: '1px solid #ffffff20',
                        borderRadius: 12,
                        color: '#fff',
                      }}
                      formatter={(value) => [money(value), 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#34d399"
                      strokeWidth={2}
                      fill="url(#revenueFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Section>
        </div>

        <Section
          title="Payment methods"
          subtitle="Revenue by payment type"
        >
          {paymentData.every((item) => item.amount === 0) ? (
            <p className="py-12 text-center text-sm text-slate-500">
              No payment data for this period.
            </p>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentData.filter((item) => item.amount > 0)}
                      dataKey="amount"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={76}
                      paddingAngle={4}
                    >
                      {paymentData
                        .filter((item) => item.amount > 0)
                        .map((item) => (
                          <Cell key={item.key} fill={COLORS[paymentData.indexOf(item)]} />
                        ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#0b1020',
                        border: '1px solid #ffffff20',
                        borderRadius: 12,
                        color: '#fff',
                      }}
                      formatter={(value) => money(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 space-y-3">
                {paymentData.map((item, index) => {
                  const Icon =
                    item.key === 'cash'
                      ? Banknote
                      : item.key === 'card'
                        ? CreditCard
                        : Smartphone

                  return (
                    <div key={item.key} className="flex items-center gap-3">
                      <div
                        className="rounded-lg p-2"
                        style={{
                          backgroundColor: `${COLORS[index]}18`,
                          color: COLORS[index],
                        }}
                      >
                        <Icon size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-200">{item.name}</p>
                        <p className="text-xs text-slate-500">
                          {item.orders} orders
                        </p>
                      </div>
                      <p className="text-right text-sm font-semibold text-white">
                        {money(item.amount)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </Section>
      </div>

      <Section
        title="Top-selling products"
        subtitle="Products ranked by total quantity sold"
      >
        {topProducts.length === 0 ? (
          <div className="py-10 text-center">
            <Package className="mx-auto mb-3 text-slate-500" size={28} />
            <p className="text-sm text-slate-400">
              No product sales found for this period.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.07] text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4 font-medium">#</th>
                  <th className="pb-3 pr-4 font-medium">Product</th>
                  <th className="pb-3 pr-4 text-right font-medium">Quantity sold</th>
                  <th className="pb-3 text-right font-medium">Sales value</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((item, index) => (
                  <tr
                    key={item.name + index}
                    className="border-b border-white/[0.05] last:border-0"
                  >
                    <td className="py-4 pr-4 text-slate-500">{index + 1}</td>
                    <td className="py-4 pr-4 font-medium text-slate-200">
                      {item.name}
                    </td>
                    <td className="py-4 pr-4 text-right text-slate-300">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="py-4 text-right font-semibold text-emerald-300">
                      {money(item.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <p className="text-xs leading-5 text-slate-500">
        Reports use the sales records returned by the sales API. Profit is not
        shown because the sale record does not preserve each product's cost at
        the time of checkout.
      </p>
    </div>
  )
}
