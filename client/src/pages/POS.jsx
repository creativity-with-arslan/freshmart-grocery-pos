
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  CheckCircle2,
  X,
  Package,
  AlertCircle,
  ChevronUp,
} from 'lucide-react'
import { getProducts } from '../services/productService'
import { createSale } from '../services/saleService'

const initialCheckout = {
  discount: '0',
  paymentMethod: 'cash',
  amountPaid: '',
}

const money = (value) =>
  `Rs. ${Number(value || 0).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const roundMoney = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100

export default function POS() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [checkout, setCheckout] = useState(initialCheckout)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getProducts()
      setProducts(data)
    } catch (err) {
      setError(err.message || 'Unable to load products.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Close the mobile cart panel with the Escape key.
  useEffect(() => {
    if (!cartOpen) return

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setCartOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cartOpen])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return products

    return products.filter((product) =>
      [product.name, product.barcode, product.category].some((value) =>
        String(value || '').toLowerCase().includes(query)
      )
    )
  }, [products, search])

  const subtotal = useMemo(
    () =>
      roundMoney(
        cart.reduce(
          (sum, item) => sum + Number(item.price) * item.quantity,
          0
        )
      ),
    [cart]
  )

  const discount = Number(checkout.discount)
  const validDiscount =
    Number.isFinite(discount) && discount >= 0 && discount <= subtotal

  const total = validDiscount ? roundMoney(subtotal - discount) : subtotal

  const cashPaid = Number(checkout.amountPaid)
  const validCashPayment =
    checkout.paymentMethod !== 'cash' ||
    (checkout.amountPaid.trim() !== '' &&
      Number.isFinite(cashPaid) &&
      cashPaid >= total)

  const changeDue =
    checkout.paymentMethod === 'cash' && validCashPayment
      ? roundMoney(cashPaid - total)
      : 0

  const totalCartQuantity = cart.reduce(
    (sum, item) => sum + Number(item.quantity),
    0
  )

  function addToCart(product) {
    setError('')
    setSuccess('')
    setReceipt(null)

    if (Number(product.stock) <= 0) {
      setError(`${product.name} is out of stock.`)
      return
    }

    setCart((current) => {
      const existing = current.find((item) => item._id === product._id)

      if (existing) {
        if (existing.quantity + 1 > Number(product.stock)) {
          setError(
            `Only ${product.stock} ${product.unit} available for ${product.name}.`
          )
          return current
        }

        return current.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [...current, { ...product, quantity: 1 }]
    })
  }

  function changeQuantity(productId, quantityValue) {
    setError('')
    setSuccess('')
    setReceipt(null)

    const quantity = Number(quantityValue)
    const product = products.find((item) => item._id === productId)

    if (!product) return

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setCart((current) =>
        current.filter((item) => item._id !== productId)
      )
      return
    }

    if (quantity > Number(product.stock)) {
      setError(`Available stock for ${product.name} is ${product.stock}.`)
      return
    }

    setCart((current) =>
      current.map((item) =>
        item._id === productId ? { ...item, quantity } : item
      )
    )
  }

  function removeFromCart(productId) {
    setCart((current) =>
      current.filter((item) => item._id !== productId)
    )
    setError('')
    setReceipt(null)
  }

  function updateCheckout(name, value) {
    setCheckout((current) => ({ ...current, [name]: value }))
    setError('')
    setSuccess('')
    setReceipt(null)
  }

  async function handleCheckout(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (cart.length === 0) {
      setError('Add at least one product to the cart.')
      return
    }

    if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) {
      setError('Discount must be between zero and the subtotal.')
      return
    }

    if (
      checkout.paymentMethod === 'cash' &&
      (checkout.amountPaid.trim() === '' ||
        !Number.isFinite(cashPaid) ||
        cashPaid < total)
    ) {
      setError(
        'Enter a cash payment amount equal to or greater than the total.'
      )
      return
    }

    setProcessing(true)

    try {
      const sale = await createSale({
        items: cart.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
        })),
        discount: roundMoney(discount),
        paymentMethod: checkout.paymentMethod,
        amountPaid:
          checkout.paymentMethod === 'cash' ? cashPaid : total,
      })

      setReceipt(sale)
      setSuccess('Sale completed successfully!')
      setCart([])
      setCheckout(initialCheckout)
      setCartOpen(false)
      await loadProducts()
    } catch (err) {
      setError(err.message || 'Checkout failed. Please try again.')
      await loadProducts()
    } finally {
      setProcessing(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400'

  return (
    <div className="space-y-6 pb-24 xl:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Point of Sale</h1>
          <p className="mt-1 text-sm text-slate-400">
            Select products, build a cart, and complete checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={loadProducts}
          disabled={loading || processing}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh products
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
          className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
        >
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {receipt && (
        <div className="rounded-2xl border border-emerald-500/20 bg-[#111827] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-400" size={28} />
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Sale completed
                </h2>
                <p className="text-sm text-slate-400">
                  Receipt: {receipt.receiptNumber}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setReceipt(null)}
              aria-label="Close receipt"
              className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {receipt.items.map((item, index) => (
              <div
                key={`${item.product}-${index}`}
                className="flex justify-between gap-3 text-sm"
              >
                <span className="text-slate-300">
                  {item.name} × {item.quantity} {item.unit}
                </span>
                <span className="text-white">{money(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span>{money(receipt.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Discount</span>
              <span>{money(receipt.discount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-white">
              <span>Total</span>
              <span>{money(receipt.total)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Payment</span>
              <span className="capitalize">
                {receipt.paymentMethod.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Amount paid</span>
              <span>{money(receipt.amountPaid)}</span>
            </div>
            <div className="flex justify-between text-emerald-300">
              <span>Change due</span>
              <span>{money(receipt.changeDue)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white hover:bg-white/5 print:hidden"
          >
            <Receipt size={17} />
            Print receipt
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
        <section className="min-w-0 space-y-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product, category, or barcode..."
              className={`${inputClass} pl-10`}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-white">Available products</h2>
            <span className="text-xs text-slate-400">
              {filteredProducts.length} products
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 p-8 text-center text-sm text-slate-400">
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-white/10 p-8 text-center text-sm text-slate-400">
              {products.length === 0
                ? 'No products available. Add products first.'
                : 'No products match your search.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const outOfStock = Number(product.stock) <= 0

                return (
                  <button
                    type="button"
                    key={product._id}
                    onClick={() => addToCart(product)}
                    disabled={outOfStock || processing}
                    className="group rounded-2xl border border-white/10 bg-[#111827] p-4 text-left transition hover:border-cyan-400/50 hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
                        <Package size={21} />
                      </div>
                      <span
                        className={`rounded-lg px-2 py-1 text-xs ${
                          outOfStock
                            ? 'bg-red-400/10 text-red-300'
                            : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        {outOfStock
                          ? 'Out of stock'
                          : `Stock: ${product.stock} ${product.unit}`}
                      </span>
                    </div>

                    <h3 className="mt-4 font-semibold text-white">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {product.category}
                    </p>

                    <div className="mt-4 flex items-end justify-between gap-2">
                      <div>
                        <p className="text-lg font-bold text-cyan-300">
                          {money(product.price)}
                        </p>
                        <p className="text-xs text-slate-500">
                          per {product.unit}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-sm text-slate-300 group-hover:text-cyan-300">
                        <Plus size={16} />
                        Add
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* Backdrop for the mobile cart panel */}
        {cartOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm xl:hidden"
            onClick={() => setCartOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* One shared cart form for both mobile and desktop */}
        <form
          onSubmit={handleCheckout}
          role={cartOpen ? 'dialog' : undefined}
          aria-modal={cartOpen ? 'true' : undefined}
          aria-label="Shopping cart and checkout"
          className={`space-y-5 rounded-2xl border border-white/10 bg-[#111827] p-5 ${
            cartOpen
              ? 'fixed inset-x-3 bottom-3 z-50 max-h-[88dvh] overflow-y-auto overscroll-contain shadow-2xl xl:static xl:max-h-none xl:overflow-visible xl:shadow-none'
              : 'hidden xl:block'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
                <ShoppingCart size={22} />
              </div>
              <div>
                <h2 className="font-semibold text-white">Current cart</h2>
                <p className="text-xs text-slate-400">
                  {cart.length} different products · {totalCartQuantity} items
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCart([])
                    setError('')
                    setReceipt(null)
                  }}
                  className="text-xs text-rose-300 hover:text-rose-200"
                >
                  Clear cart
                </button>
              )}

              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Close mobile cart"
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white xl:hidden"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {cart.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center">
              <ShoppingCart
                size={30}
                className="mx-auto text-slate-600"
              />
              <p className="mt-3 text-sm text-slate-400">
                Your cart is empty.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Select a product to get started.
              </p>
            </div>
          ) : (
            <div className="max-h-[340px] space-y-3 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item._id}
                  className="rounded-xl border border-white/10 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {money(item.price)} / {item.unit}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item._id)}
                      aria-label={`Remove ${item.name}`}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-400/10 hover:text-rose-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Decrease ${item.name} quantity`}
                        onClick={() =>
                          changeQuantity(item._id, item.quantity - 1)
                        }
                        className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:bg-white/5"
                      >
                        <Minus size={14} />
                      </button>

                      <input
                        type="number"
                        aria-label={`${item.name} quantity`}
                        min="0.000001"
                        max={item.stock}
                        step="any"
                        value={item.quantity}
                        onChange={(event) =>
                          changeQuantity(item._id, event.target.value)
                        }
                        className="w-20 rounded-lg border border-white/10 bg-[#0b1220] px-2 py-1.5 text-center text-sm text-white outline-none focus:border-cyan-400"
                      />

                      <button
                        type="button"
                        aria-label={`Increase ${item.name} quantity`}
                        disabled={item.quantity + 1 > Number(item.stock)}
                        onClick={() =>
                          changeQuantity(item._id, item.quantity + 1)
                        }
                        className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:bg-white/5 disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <p className="text-sm font-semibold text-white">
                      {money(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 border-t border-white/10 pt-4">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Discount (Rs.)
              </label>
              <input
                type="number"
                name="discount"
                min="0"
                max={subtotal}
                step="0.01"
                value={checkout.discount}
                onChange={(event) =>
                  updateCheckout('discount', event.target.value)
                }
                className={inputClass}
              />
              {!validDiscount && (
                <p className="mt-1 text-xs text-red-300">
                  Discount cannot exceed the subtotal.
                </p>
              )}
            </div>

            <div className="flex justify-between text-lg font-bold text-white">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Payment method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'cash', label: 'Cash', Icon: Banknote },
                { value: 'card', label: 'Card', Icon: CreditCard },
                {
                  value: 'mobile_wallet',
                  label: 'Wallet',
                  Icon: Smartphone,
                },
              ].map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateCheckout('paymentMethod', value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs ${
                    checkout.paymentMethod === value
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                      : 'border-white/10 text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <Icon size={19} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {checkout.paymentMethod === 'cash' && (
            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Cash received (Rs.)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={checkout.amountPaid}
                onChange={(event) =>
                  updateCheckout('amountPaid', event.target.value)
                }
                placeholder="Enter amount received"
                className={inputClass}
              />
              {checkout.amountPaid !== '' && (
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-slate-400">Change due</span>
                  <span
                    className={
                      validCashPayment
                        ? 'font-semibold text-emerald-300'
                        : 'text-rose-300'
                    }
                  >
                    {validCashPayment
                      ? money(changeDue)
                      : 'Insufficient cash'}
                  </span>
                </div>
              )}
            </div>
          )}

          {checkout.paymentMethod !== 'cash' && (
            <p className="text-xs text-slate-500">
              This records the selected payment method. It does not process
              a real card or mobile-wallet payment.
            </p>
          )}

          <button
            type="submit"
            disabled={
              processing ||
              loading ||
              cart.length === 0 ||
              !validDiscount ||
              !validCashPayment
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Processing sale...
              </>
            ) : (
              <>
                <Receipt size={18} />
                Complete sale — {money(total)}
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-500">
            Inventory is updated only after the backend confirms the sale.
          </p>
        </form>
      </div>

      {/* Sticky cart bar shown only on mobile and tablet */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0b1220]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl xl:hidden">
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          aria-label={`Open cart with ${totalCartQuantity} items, total ${money(total)}`}
          className="flex w-full items-center justify-between gap-3 rounded-xl bg-cyan-400 px-4 py-3 text-left text-slate-950 transition hover:bg-cyan-300"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="relative shrink-0">
              <ShoppingCart size={23} />
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-950 px-1 text-[10px] font-bold text-white">
                {totalCartQuantity}
              </span>
            </span>

            <span className="min-w-0">
              <span className="block font-semibold">
                {cart.length === 0 ? 'Open cart' : 'View cart'}
              </span>
              <span className="block text-xs text-slate-800">
                {cart.length} different products
              </span>
            </span>
          </span>

          <span className="flex shrink-0 items-center gap-2 font-bold">
            {money(total)}
            <ChevronUp size={20} />
          </span>
        </button>
      </div>
    </div>
  )
}
