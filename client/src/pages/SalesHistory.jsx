
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search,
  RefreshCw,
  Receipt,
  CalendarDays,
  Banknote,
  ShoppingBag,
  Eye,
  Printer,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { getSales } from '../services/saleService'

const money = (value) =>
  `Rs. ${Number(value || 0).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const formatDate = (value) =>
  new Date(value).toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

const localDate = (value) => {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function SummaryCard({ title, value, detail, Icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-3 text-2xl font-bold text-white">{value}</p>
          <p className="mt-2 text-xs text-slate-500">{detail}</p>
        </div>
        <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}

function SaleReceipt({ sale, onClose }) {
  if (!sale) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-3 sm:p-6">
      <div className="mx-auto my-4 max-w-xl rounded-2xl border border-white/10 bg-[#111827] p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-3 print:hidden">
          <div>
            <h2 className="text-xl font-bold text-white">Sale receipt</h2>
            <p className="mt-1 text-sm text-slate-400">
              {sale.receiptNumber}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close receipt"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            .sales-receipt-print,
            .sales-receipt-print * { visibility: visible !important; }
            .sales-receipt-print {
              position: absolute !important;
              inset: 0 auto auto 0 !important;
              width: 100% !important;
              max-width: 80mm !important;
              margin: 0 !important;
              padding: 4mm !important;
              border: 0 !important;
              background: white !important;
              color: black !important;
              box-shadow: none !important;
            }
            .sales-receipt-print * { color: black !important; }
            .sales-receipt-print .receipt-muted { color: #444 !important; }
            @page { margin: 5mm; }
          }
        `}</style>

        <div className="sales-receipt-print rounded-xl border border-white/10 p-4 text-white">
          <div className="border-b border-dashed border-white/20 pb-4 text-center">
            <h3 className="text-xl font-bold">FreshMart Grocery</h3>
            <p className="receipt-muted mt-1 text-xs text-slate-400">
              Sales receipt
            </p>
            <p className="mt-3 break-all text-sm font-semibold">
              {sale.receiptNumber}
            </p>
            <p className="receipt-muted mt-1 text-xs text-slate-400">
              {formatDate(sale.createdAt)}
            </p>
          </div>

          <div className="space-y-3 border-b border-dashed border-white/20 py-4">
            {sale.items.map((item, index) => (
              <div key={`${item.product}-${index}`} className="text-sm">
                <div className="flex justify-between gap-3">
                  <span className="min-w-0 break-words font-medium">
                    {item.name}
                  </span>
                  <span className="shrink-0">{money(item.lineTotal)}</span>
                </div>
                <p className="receipt-muted mt-1 text-xs text-slate-400">
                  {item.quantity} {item.unit} × {money(item.unitPrice)}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-b border-dashed border-white/20 py-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="receipt-muted text-slate-400">Subtotal</span>
              <span>{money(sale.subtotal)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="receipt-muted text-slate-400">Discount</span>
              <span>{money(sale.discount)}</span>
            </div>
            <div className="flex justify-between gap-3 pt-1 text-lg font-bold">
              <span>Total</span>
              <span>{money(sale.total)}</span>
            </div>
          </div>

          <div className="space-y-2 py-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="receipt-muted text-slate-400">Payment</span>
              <span className="capitalize">
                {String(sale.paymentMethod || '').replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="receipt-muted text-slate-400">Paid</span>
              <span>{money(sale.amountPaid)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="receipt-muted text-slate-400">Change</span>
              <span>{money(sale.changeDue)}</span>
            </div>
          </div>

          <p className="receipt-muted border-t border-dashed border-white/20 pt-4 text-center text-xs text-slate-400">
            Thank you for shopping with FreshMart!
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-3 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            <Printer size={17} />
            Print receipt
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-3 text-slate-300 hover:bg-white/5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SalesHistory() {
  const [sales, setSales] = useState([])
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedSale, setSelectedSale] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSales = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getSales()
      setSales(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Unable to load sales history.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSales()
  }, [loadSales])

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase()

    return sales.filter((sale) => {
      const saleDate = localDate(sale.createdAt)

      const matchesSearch =
        !query ||
        String(sale.receiptNumber || '').toLowerCase().includes(query) ||
        sale.items?.some((item) =>
          String(item.name || '').toLowerCase().includes(query)
        ) ||
        String(sale.paymentMethod || '').toLowerCase().includes(query)

      const matchesFrom = !dateFrom || saleDate >= dateFrom
      const matchesTo = !dateTo || saleDate <= dateTo

      return matchesSearch && matchesFrom && matchesTo
    })
  }, [sales, search, dateFrom, dateTo])

  const summary = useMemo(() => {
    const revenue = filteredSales.reduce(
      (sum, sale) => sum + Number(sale.total || 0),
      0
    )

    const itemsSold = filteredSales.reduce(
      (sum, sale) =>
        sum +
        (sale.items || []).reduce(
          (itemSum, item) => itemSum + Number(item.quantity || 0),
          0
        ),
      0
    )

    return {
      revenue,
      count: filteredSales.length,
      average: filteredSales.length
        ? revenue / filteredSales.length
        : 0,
      itemsSold,
    }
  }, [filteredSales])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales History</h1>
          <p className="mt-1 text-sm text-slate-400">
            Search transactions, review totals, and open receipts.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSales}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Completed sales"
          value={summary.count.toLocaleString()}
          detail="Transactions matching your filters"
          Icon={Receipt}
        />
        <SummaryCard
          title="Sales revenue"
          value={money(summary.revenue)}
          detail="Total value after discounts"
          Icon={Banknote}
        />
        <SummaryCard
          title="Average transaction"
          value={money(summary.average)}
          detail="Revenue divided by transactions"
          Icon={ShoppingBag}
        />
        <SummaryCard
          title="Units sold"
          value={summary.itemsSold.toLocaleString()}
          detail="Sum of sold product quantities"
          Icon={CheckCircle2}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-[#111827] p-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search receipt, product, or payment..."
            className="w-full rounded-xl border border-white/10 bg-[#0b1220] py-3 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-400">From date</label>
          <input
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(event) => setDateFrom(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-400">To date</label>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(event) => setDateTo(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setSearch('')
            setDateFrom('')
            setDateTo('')
          }}
          className="self-end rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 hover:bg-white/5"
        >
          Clear filters
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
          <div>
            <h2 className="font-semibold text-white">Transactions</h2>
            <p className="mt-1 text-xs text-slate-400">
              {filteredSales.length} matching transactions
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CalendarDays size={16} />
            Newest first
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Loading sales history...
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-10 text-center">
            <Receipt size={32} className="mx-auto text-slate-600" />
            <p className="mt-3 font-medium text-white">No sales found</p>
            <p className="mt-1 text-sm text-slate-400">
              Try different search terms or date filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Receipt</th>
                  <th className="px-5 py-4 font-medium">Date</th>
                  <th className="px-5 py-4 font-medium">Items</th>
                  <th className="px-5 py-4 font-medium">Payment</th>
                  <th className="px-5 py-4 text-right font-medium">Total</th>
                  <th className="px-5 py-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">
                        {sale.receiptNumber}
                      </p>
                      <p className="mt-1 text-xs capitalize text-slate-500">
                        {sale.status || 'completed'}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {(sale.items || []).reduce(
                        (sum, item) => sum + Number(item.quantity || 0),
                        0
                      )}{' '}
                      units
                      <p className="mt-1 text-xs text-slate-500">
                        {(sale.items || []).length} products
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs capitalize text-slate-300">
                        {String(sale.paymentMethod || '').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-white">
                      {money(sale.total)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedSale(sale)}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-cyan-300 hover:bg-cyan-400/10"
                      >
                        <Eye size={15} />
                        View receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <SaleReceipt
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
      />
    </div>
  )
}
