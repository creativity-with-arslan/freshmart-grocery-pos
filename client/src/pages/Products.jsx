
import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Package,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  AlertTriangle,
  Boxes,
} from 'lucide-react'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../services/productService'

const initialForm = {
  name: '',
  barcode: '',
  category: 'Dairy',
  price: '',
  costPrice: '',
  stock: '',
  unit: 'piece',
  lowStockThreshold: '10',
  expiryDate: '',
}

const categories = [
  'Dairy',
  'Bakery',
  'Beverages',
  'Snacks',
  'Fruits & Vegetables',
  'Grains & Pulses',
  'Household',
  'Personal Care',
  'Other',
]

const units = ['piece', 'kg', 'gram', 'liter', 'ml', 'pack', 'dozen']

const currency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString('en-PK', {
    maximumFractionDigits: 2,
  })}`

function Products() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadProducts() {
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
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase()

    return products.filter((product) => {
      const matchesSearch = [
        product.name,
        product.barcode,
        product.category,
      ].some((value) => String(value || '').toLowerCase().includes(term))

      const matchesCategory =
        categoryFilter === 'All' || product.category === categoryFilter

      return matchesSearch && matchesCategory
    })
  }, [products, search, categoryFilter])

  const lowStockCount = products.filter(
    (product) => Number(product.stock) <= Number(product.lowStockThreshold),
  ).length

  const totalStockUnits = products.reduce(
    (total, product) => total + Number(product.stock || 0),
    0,
  )

  function updateField(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  function openAddForm() {
    setEditingId(null)
    setForm({ ...initialForm })
    setError('')
    setSuccess('')
    setShowForm(true)
  }

  function openEditForm(product) {
    setEditingId(product._id)
    setError('')
    setSuccess('')

    setForm({
      name: product.name || '',
      barcode: product.barcode || '',
      category: product.category || 'Other',
      price: String(product.price ?? ''),
      costPrice: String(product.costPrice ?? ''),
      stock: String(product.stock ?? ''),
      unit: product.unit || 'piece',
      lowStockThreshold: String(product.lowStockThreshold ?? 10),
      expiryDate: product.expiryDate
        ? new Date(product.expiryDate).toISOString().slice(0, 10)
        : '',
    })

    setShowForm(true)
  }

  function closeForm() {
    if (saving) return

    setShowForm(false)
    setEditingId(null)
    setForm({ ...initialForm })
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const price = Number(form.price)
    const costPrice = Number(form.costPrice)
    const stock = Number(form.stock)
    const lowStockThreshold = Number(form.lowStockThreshold)

    if (
      !form.name.trim() ||
      !form.category ||
      form.price.trim() === '' ||
      form.costPrice.trim() === '' ||
      form.stock.trim() === '' ||
      form.lowStockThreshold.trim() === ''
    ) {
      setError('Please fill in all required fields.')
      return
    }

    if (
      !Number.isFinite(price) ||
      !Number.isFinite(costPrice) ||
      !Number.isFinite(stock) ||
      !Number.isFinite(lowStockThreshold) ||
      price < 0 ||
      costPrice < 0 ||
      stock < 0 ||
      lowStockThreshold < 0
    ) {
      setError('Prices and stock values must be valid non-negative numbers.')
      return
    }

    const barcode = form.barcode.trim()

    if (
      barcode &&
      products.some(
        (product) =>
          product.barcode === barcode && product._id !== editingId,
      )
    ) {
      setError('Another product with this barcode already exists.')
      return
    }

    const productData = {
      name: form.name.trim(),
      barcode,
      category: form.category,
      price,
      costPrice,
      stock,
      unit: form.unit,
      lowStockThreshold,
      expiryDate: form.expiryDate || null,
    }

    setSaving(true)

    try {
      if (editingId) {
        const updated = await updateProduct(editingId, productData)

        setProducts((previous) =>
          previous.map((product) =>
            product._id === editingId ? updated : product,
          ),
        )

        setSuccess(`${updated.name} was updated successfully.`)
      } else {
        const created = await createProduct(productData)

        setProducts((previous) => [created, ...previous])
        setSuccess(`${created.name} was added successfully.`)
      }

      setShowForm(false)
      setEditingId(null)
      setForm({ ...initialForm })
    } catch (err) {
      setError(err.message || 'Unable to save the product.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This action cannot be undone.`,
    )

    if (!confirmed) return

    setError('')
    setSuccess('')
    setDeletingId(product._id)

    try {
      await deleteProduct(product._id)

      setProducts((previous) =>
        previous.filter((item) => item._id !== product._id),
      )

      setSuccess(`${product.name} was deleted.`)
    } catch (err) {
      setError(err.message || 'Unable to delete the product.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-400">
            Manage your grocery catalog
          </p>
          <h2 className="mt-1 text-2xl font-bold">Products</h2>
        </div>

        <button
          onClick={openAddForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-300"
        >
          <Plus size={18} /> Add product
        </button>
      </div>

      {error && !showForm && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300"
        >
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300"
        >
          {success}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total products"
          value={products.length.toLocaleString()}
          icon={Package}
        />
        <SummaryCard
          label="Units in stock"
          value={totalStockUnits.toLocaleString()}
          icon={Boxes}
        />
        <SummaryCard
          label="Low-stock products"
          value={lowStockCount.toLocaleString()}
          icon={AlertTriangle}
          warning={lowStockCount > 0}
        />
      </div>

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
              placeholder="Search by product, barcode or category..."
              className="w-full rounded-xl border border-white/10 bg-[#0b1020] py-3 pl-10 pr-3 text-sm outline-none placeholder:text-slate-600 focus:border-emerald-400/50"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0b1020] px-3 py-3 text-sm text-slate-300 outline-none sm:flex-none"
            >
              <option value="All">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <button
              onClick={loadProducts}
              disabled={loading}
              aria-label="Refresh products"
              className="rounded-xl border border-white/10 p-3 text-slate-300 hover:bg-white/5 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? 'animate-spin' : ''}
              />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Product</th>
                <th className="px-5 py-4 font-medium">Category</th>
                <th className="px-5 py-4 font-medium">Selling price</th>
                <th className="px-5 py-4 font-medium">Cost price</th>
                <th className="px-5 py-4 font-medium">Stock</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.05]">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-slate-400"
                  >
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <Package
                      size={30}
                      className="mx-auto mb-3 text-slate-600"
                    />
                    <p className="font-medium text-slate-300">
                      {products.length === 0
                        ? 'No products yet'
                        : 'No matching products'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {products.length === 0
                        ? 'Add your first product to get started.'
                        : 'Try another search or category.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const lowStock =
                    Number(product.stock) <=
                    Number(product.lowStockThreshold)

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
                        {currency(product.price)}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {currency(product.costPrice)}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {product.stock} {product.unit}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            lowStock
                              ? 'bg-amber-400/10 text-amber-300'
                              : 'bg-emerald-400/10 text-emerald-300'
                          }`}
                        >
                          {lowStock ? 'Low stock' : 'In stock'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEditForm(product)}
                            aria-label={`Edit ${product.name}`}
                            title="Edit product"
                            disabled={Boolean(deletingId) || saving}
                            className="rounded-lg p-2 text-slate-500 hover:bg-emerald-400/10 hover:text-emerald-300 disabled:opacity-50"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            disabled={deletingId === product._id || saving}
                            onClick={() => handleDelete(product)}
                            aria-label={`Delete ${product.name}`}
                            title="Delete product"
                            className="rounded-lg p-2 text-slate-500 hover:bg-rose-400/10 hover:text-rose-300 disabled:opacity-50"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
            className="my-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-[#11182a] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.07] p-5">
              <div>
                <h3
                  id="product-form-title"
                  className="text-lg font-bold"
                >
                  {editingId ? 'Edit product' : 'Add new product'}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {editingId
                    ? 'Update the product details below.'
                    : 'Enter the product details below.'}
                </p>
              </div>

              <button
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Product name *">
                  <input
                    required
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    placeholder="e.g. Milk 1 Liter"
                    className={inputClass}
                  />
                </Field>

                <Field label="Barcode (optional)">
                  <input
                    name="barcode"
                    value={form.barcode}
                    onChange={updateField}
                    placeholder="e.g. 123456789"
                    className={inputClass}
                  />
                </Field>

                <Field label="Category *">
                  <select
                    required
                    name="category"
                    value={form.category}
                    onChange={updateField}
                    className={inputClass}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Unit">
                  <select
                    name="unit"
                    value={form.unit}
                    onChange={updateField}
                    className={inputClass}
                  >
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Selling price (Rs.) *">
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    name="price"
                    value={form.price}
                    onChange={updateField}
                    placeholder="0.00"
                    className={inputClass}
                  />
                </Field>

                <Field label="Cost price (Rs.) *">
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    name="costPrice"
                    value={form.costPrice}
                    onChange={updateField}
                    placeholder="0.00"
                    className={inputClass}
                  />
                </Field>

                <Field label="Stock *">
                  <input
                    required
                    type="number"
                    min="0"
                    step="any"
                    name="stock"
                    value={form.stock}
                    onChange={updateField}
                    placeholder="0"
                    className={inputClass}
                  />
                </Field>

                <Field label="Low-stock threshold *">
                  <input
                    required
                    type="number"
                    min="0"
                    step="any"
                    name="lowStockThreshold"
                    value={form.lowStockThreshold}
                    onChange={updateField}
                    className={inputClass}
                  />
                </Field>

                <Field label="Expiry date (optional)">
                  <input
                    type="date"
                    name="expiryDate"
                    value={form.expiryDate}
                    onChange={updateField}
                    className={inputClass}
                  />
                </Field>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-300"
                >
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-white/[0.07] pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? 'Saving...'
                    : editingId
                      ? 'Save changes'
                      : 'Save product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-[#0b1020] px-3 py-3 text-sm text-slate-100 outline-none focus:border-emerald-400/50'

function Field({ label, children }) {
  return (
    <label className="block space-y-2 text-sm text-slate-300">
      <span>{label}</span>
      {children}
    </label>
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

export default Products
