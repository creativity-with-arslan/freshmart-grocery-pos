import UserManagement from './pages/UserManagement'
import { useEffect, useState } from 'react'
import Reports from './components/Reports'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Boxes,
  ArrowUpRight,
  ChevronDown,
  CalendarDays,
  Plus,
  LogOut,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

import Inventory from './pages/Inventory'
import Products from './pages/Products'
import POS from './pages/POS'
import DashboardAnalytics from './pages/DashboardAnalytics'
import SalesHistory from './pages/SalesHistory'
import Login from './pages/Login'
import { useAuth } from './context/AuthContext'

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Point of Sale', icon: ShoppingCart },
  { label: 'Products', icon: Package },
  { label: 'Inventory', icon: Boxes },
  { label: 'Orders', icon: ClipboardList },
  { label: 'Customers', icon: Users },
  { label: 'Reports', icon: BarChart3 },
]

const salesData = [
  { day: 'Mon', sales: 4200 },
  { day: 'Tue', sales: 5800 },
  { day: 'Wed', sales: 4900 },
  { day: 'Thu', sales: 7200 },
  { day: 'Fri', sales: 6100 },
  { day: 'Sat', sales: 8900 },
  { day: 'Sun', sales: 7600 },
]

const transactions = [
  { id: '#TRX-1048', customer: 'Ahmed Khan', date: 'Today, 10:42 AM', amount: 2450, status: 'Completed' },
  { id: '#TRX-1047', customer: 'Fatima Ali', date: 'Today, 10:28 AM', amount: 1820, status: 'Completed' },
  { id: '#TRX-1046', customer: 'Walk-in Customer', date: 'Today, 10:15 AM', amount: 760, status: 'Pending' },
  { id: '#TRX-1045', customer: 'Usman Tariq', date: 'Today, 09:54 AM', amount: 3450, status: 'Completed' },
  { id: '#TRX-1044', customer: 'Ayesha Malik', date: 'Today, 09:32 AM', amount: 1290, status: 'Completed' },
]

const stats = [
  {
    title: "Today's Sales",
    value: 'Rs. 24,580',
    change: '+12.8%',
    positive: true,
    icon: DollarSign,
    description: 'vs. yesterday',
  },
  {
    title: 'Total Orders',
    value: '156',
    change: '+8.2%',
    positive: true,
    icon: Receipt,
    description: 'vs. yesterday',
  },
  {
    title: 'Products in Stock',
    value: '1,284',
    change: '-2.4%',
    positive: false,
    icon: Package,
    description: 'vs. last week',
  },
  {
    title: 'Low Stock Items',
    value: '18',
    change: '+4 items',
    positive: false,
    icon: Boxes,
    description: 'need restocking',
  },
]

function App() {
  const { user, token, logout } = useAuth()

  const [activePage, setActivePage] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (user) {
      setActivePage(user.role === 'cashier' ? 'Point of Sale' : 'Dashboard')
    }
  }, [user?.id, user?.role])

  if (!user || !token) {
    return <Login />
  }

  const allowedNavigation = navigation.filter(({ label }) => {
    if (isAdmin) return true

    return label === 'Point of Sale'
  })

  const filteredTransactions = transactions.filter((transaction) =>
    `${transaction.id} ${transaction.customer}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  const navigateTo = (page) => {
    if (!isAdmin && page !== 'Point of Sale') {
      setActivePage('Point of Sale')
    } else {
      setActivePage(page)
    }

    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-100">
      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      )}

      <aside
className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-y-auto overscroll-contain border-r border-white/[0.07] bg-[#0e1425] transition-transform duration-300        ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/[0.07] px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-slate-950">
              <ShoppingCart size={22} strokeWidth={2.5} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight">FreshMart</h1>
              <p className="text-xs text-slate-500">Grocery POS</p>
            </div>
          </div>

          <button
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Main Menu
          </p>

          <nav className="space-y-1">
            {allowedNavigation.map(({ label, icon: Icon }) => {
              const active = activePage === label

              return (
                <button
                  key={label}
                  onClick={() => navigateTo(label)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    active
                      ? 'bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/10'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <Icon size={19} />
                  <span>{label}</span>

                  {label === 'Inventory' && (
                    <span className="ml-auto rounded-md bg-rose-500/15 px-2 py-0.5 text-xs text-rose-300">
                      18
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto p-4">
          {isAdmin && (
            <div className="mb-4 rounded-2xl border border-emerald-400/10 bg-gradient-to-br from-emerald-400/[0.10] to-transparent p-4">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                <TrendingUp size={18} />
              </div>

              <p className="text-sm font-semibold">Business insights</p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Track your store performance and grow your sales.
              </p>

              <button
                onClick={() => navigateTo('Reports')}
                className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
              >
                View reports <ArrowUpRight size={14} />
              </button>
            </div>
          )}

          {isAdmin && (
            <button
              onClick={() => navigateTo('Settings')}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm ${
                activePage === 'Settings'
                  ? 'bg-emerald-400/10 text-emerald-300'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Settings size={19} />
              Settings
            </button>
          )}

          <div className="mt-4 flex items-center gap-3 border-t border-white/[0.07] pt-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-cyan-500 font-bold text-slate-950">
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="text-xs capitalize text-slate-500">{user.role}</p>
            </div>

            <button
              onClick={logout}
              title="Log out"
              aria-label="Log out"
              className="rounded-lg p-2 text-slate-400 hover:bg-rose-400/10 hover:text-rose-300"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/[0.07] bg-[#0b1020]/90 px-4 backdrop-blur-xl sm:px-6 xl:px-9">
          <div className="flex items-center gap-3">
            <button
              className="rounded-xl border border-white/10 p-2 text-slate-300 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>

            <div>
              <h2 className="text-lg font-bold sm:text-xl">{activePage}</h2>
              <p className="hidden text-xs text-slate-500 sm:block">
                Welcome, {user.name}! Here's what's happening today.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {isAdmin && (
              <div className="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 md:flex">
                <Search size={16} className="text-slate-500" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search transactions..."
                  className="w-40 bg-transparent text-sm outline-none placeholder:text-slate-600 xl:w-52"
                />

                <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-500">
                  /
                </kbd>
              </div>
            )}

            {isAdmin && (
              <button
                aria-label="Notifications"
                className="relative rounded-xl border border-white/[0.08] p-2.5 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <Bell size={19} />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </button>
            )}

            <div className="hidden items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-xs text-slate-300 sm:flex">
              <CalendarDays size={15} className="text-emerald-300" />
              <span>{new Date().toLocaleDateString('en-PK', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}</span>
              <ChevronDown size={14} className="text-slate-500" />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] space-y-7 p-4 sm:p-6 xl:p-9">
          {activePage === 'Products' && isAdmin ? (
            <Products />
          ) : activePage === 'Inventory' && isAdmin ? (
            <Inventory />
          ) : activePage === 'Point of Sale' ? (
            <POS />
          ) : activePage === 'Orders' && isAdmin ? (
            <SalesHistory />
          ) : activePage === 'Dashboard' && isAdmin ? (
            <DashboardAnalytics />
          ) : activePage === 'Customers' && isAdmin ? (
            <div className="rounded-2xl border border-white/[0.07] bg-[#11182a] p-6">
              <h3 className="text-xl font-bold">Customers</h3>
              <p className="mt-2 text-sm text-slate-400">
                Customer management has not been implemented yet.
              </p>
            </div>
        ) : activePage === 'Reports' && isAdmin ? (
  <Reports />
           
          ) : activePage === 'Settings' && isAdmin ? (
  <UserManagement />
) : (
            <>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm text-slate-400">
                    Your store at a glance
                  </p>
                  <h3 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                    Dashboard overview
                  </h3>
                </div>

                <button
                  onClick={() => navigateTo('Point of Sale')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-400/10 transition hover:bg-emerald-300"
                >
                  <Plus size={18} /> New sale
                </button>
              </div>

              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                {stats.map(({ title, value, change, positive, icon: Icon, description }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-white/[0.07] bg-[#11182a] p-5 transition hover:border-white/[0.13]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">{title}</span>
                      <div className="rounded-xl bg-white/[0.05] p-2.5 text-emerald-300">
                        <Icon size={19} />
                      </div>
                    </div>

                    <p className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
                      {value}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold ${
                          positive
                            ? 'bg-emerald-400/10 text-emerald-300'
                            : 'bg-rose-400/10 text-rose-300'
                        }`}
                      >
                        {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        {change}
                      </span>
                      <span className="text-slate-500">{description}</span>
                    </div>
                  </div>
                ))}
              </section>

              <section className="grid grid-cols-1 gap-5 2xl:grid-cols-3">
                <div className="rounded-2xl border border-white/[0.07] bg-[#11182a] p-5 sm:p-6 2xl:col-span-2">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold">Sales overview</h4>
                      <p className="mt-1 text-xs text-slate-500">
                        Sales performance throughout the week
                      </p>
                    </div>

                    <button className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">
                      This week <ChevronDown size={14} />
                    </button>
                  </div>

                  <div className="mt-6 flex items-end gap-3">
                    <p className="text-3xl font-bold">Rs. 44,700</p>
                    <span className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
                      <TrendingUp size={14} /> 14.6%
                    </span>
                  </div>

                  <div className="mt-5 h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={salesData}
                        margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#34d399" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid stroke="#ffffff0c" vertical={false} />

                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 12 }}
                          dy={10}
                        />

                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          tickFormatter={(value) => `${value / 1000}k`}
                        />

                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#111827',
                            border: '1px solid #334155',
                            borderRadius: '12px',
                            color: '#f8fafc',
                          }}
                          formatter={(value) => [
                            `Rs. ${Number(value).toLocaleString()}`,
                            'Sales',
                          ]}
                        />

                        <Area
                          type="monotone"
                          dataKey="sales"
                          stroke="#34d399"
                          strokeWidth={2.5}
                          fill="url(#salesGradient)"
                          activeDot={{
                            r: 5,
                            fill: '#34d399',
                            stroke: '#0b1020',
                            strokeWidth: 3,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-[#11182a] p-5 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">Inventory health</h4>
                      <p className="mt-1 text-xs text-slate-500">
                        Current stock status
                      </p>
                    </div>
                    <Boxes size={19} className="text-emerald-300" />
                  </div>

                  <div className="mt-7 space-y-6">
                    {[
                      { label: 'In stock', count: '1,104', percent: 86, color: 'bg-emerald-400' },
                      { label: 'Low stock', count: '162', percent: 13, color: 'bg-amber-400' },
                      { label: 'Out of stock', count: '18', percent: 1, color: 'bg-rose-400' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-slate-400">{item.label}</span>
                          <span className="font-semibold">{item.count}</span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className={`h-full rounded-full ${item.color}`}
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => navigateTo('Inventory')}
                    className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm font-semibold text-slate-300 transition hover:border-emerald-400/30 hover:text-emerald-300"
                  >
                    Manage inventory <ArrowUpRight size={16} />
                  </button>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#11182a]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-5 sm:px-6">
                  <div>
                    <h4 className="font-semibold">Recent transactions</h4>
                    <p className="mt-1 text-xs text-slate-500">
                      A quick look at your latest sales
                    </p>
                  </div>

                  <button
                    onClick={() => navigateTo('Orders')}
                    className="text-xs font-semibold text-emerald-300 hover:text-emerald-200"
                  >
                    View all transactions →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-6 py-4 font-medium">Transaction ID</th>
                        <th className="px-6 py-4 font-medium">Customer</th>
                        <th className="px-6 py-4 font-medium">Date &amp; Time</th>
                        <th className="px-6 py-4 font-medium">Amount</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/[0.05]">
                      {filteredTransactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="transition hover:bg-white/[0.02]"
                        >
                          <td className="px-6 py-4 font-semibold text-emerald-300">
                            {transaction.id}
                          </td>
                          <td className="px-6 py-4 text-slate-200">
                            {transaction.customer}
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {transaction.date}
                          </td>
                          <td className="px-6 py-4 font-semibold">
                            Rs. {transaction.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                transaction.status === 'Completed'
                                  ? 'bg-emerald-400/10 text-emerald-300'
                                  : 'bg-amber-400/10 text-amber-300'
                              }`}
                            >
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {filteredTransactions.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-10 text-center text-slate-500"
                          >
                            No matching transactions found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <footer className="flex flex-col justify-between gap-2 pb-2 text-xs text-slate-600 sm:flex-row">
                <p>© 2026 FreshMart POS. All rights reserved.</p>
                <p>Built for smarter store management.</p>
              </footer>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
