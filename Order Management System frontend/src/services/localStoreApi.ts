import type {
  Activity,
  AppUser,
  Category,
  ChartPoint,
  DashboardStats,
  ListedUser,
  Order,
  OrderLine,
  OrderStatus,
  Product,
  ProductStatus,
  RestockPriority,
} from '../types/models'

const STORAGE_KEY = 'inv_mgmt_v2'

interface Store {
  categories: Category[]
  products: Product[]
  orders: Order[]
  activities: Activity[]
}

function nowIso(): string {
  return new Date().toISOString()
}

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as Store
    }
  } catch {
    /* ignore */
  }
  return seedStore()
}

function saveStore(s: Store): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

function seedStore(): Store {
  const t = nowIso()
  const catElectronics: Category = {
    id: crypto.randomUUID(),
    name: 'Electronics',
    createdAt: t,
  }
  const catOffice: Category = {
    id: crypto.randomUUID(),
    name: 'Office',
    createdAt: t,
  }
  const products: Product[] = [
    {
      id: crypto.randomUUID(),
      name: 'Wireless Mouse',
      categoryId: catElectronics.id,
      price: 29.99,
      stock: 8,
      minThreshold: 10,
      status: 'Active',
      createdAt: t,
    },
    {
      id: crypto.randomUUID(),
      name: 'USB-C Hub',
      categoryId: catElectronics.id,
      price: 45,
      stock: 24,
      minThreshold: 5,
      status: 'Active',
      createdAt: t,
    },
    {
      id: crypto.randomUUID(),
      name: 'Notebook Set',
      categoryId: catOffice.id,
      price: 12.5,
      stock: 0,
      minThreshold: 15,
      status: 'Out of Stock',
      createdAt: t,
    },
    {
      id: crypto.randomUUID(),
      name: 'Desk Lamp',
      categoryId: catOffice.id,
      price: 39,
      stock: 3,
      minThreshold: 6,
      status: 'Active',
      createdAt: t,
    },
  ]
  const orders: Order[] = []
  const activities: Activity[] = [
    {
      id: crypto.randomUUID(),
      type: 'product_created',
      message: 'Seeded inventory with sample products',
      createdAt: t,
    },
  ]
  const store: Store = {
    categories: [catElectronics, catOffice],
    products,
    orders,
    activities,
  }
  saveStore(store)
  return store
}

function delay(ms = 280): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function pushActivity(
  store: Store,
  type: Activity['type'],
  message: string
): void {
  store.activities.unshift({
    id: crypto.randomUUID(),
    type,
    message,
    createdAt: nowIso(),
  })
  if (store.activities.length > 100) {
    store.activities.length = 100
  }
}

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function isToday(iso: string): boolean {
  return new Date(iso) >= startOfToday()
}

export function restockPriorityFor(product: Product): RestockPriority {
  if (product.stock <= 0 || product.stock <= product.minThreshold * 0.25) {
    return 'High'
  }
  if (product.stock <= product.minThreshold * 0.75) {
    return 'Medium'
  }
  return 'Low'
}

// ——— Categories ———

export async function fetchCategories(): Promise<Category[]> {
  await delay()
  return [...loadStore().categories].sort((a, b) =>
    a.name.localeCompare(b.name)
  )
}

export async function createCategory(name: string): Promise<Category> {
  await delay()
  const store = loadStore()
  const cat: Category = {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: nowIso(),
  }
  store.categories.push(cat)
  pushActivity(store, 'category_created', `Category "${cat.name}" added`)
  saveStore(store)
  return cat
}

// ——— Products ———

export async function fetchProducts(params?: {
  search?: string
  categoryId?: string
  page?: number
  pageSize?: number
}): Promise<{ items: Product[]; total: number }> {
  await delay()
  const store = loadStore()
  let list = [...store.products]
  const q = params?.search?.trim().toLowerCase()
  if (q) {
    list = list.filter((p) => p.name.toLowerCase().includes(q))
  }
  if (params?.categoryId) {
    list = list.filter((p) => p.categoryId === params.categoryId)
  }
  list.sort((a, b) => a.name.localeCompare(b.name))
  const total = list.length
  const page = Math.max(1, params?.page ?? 1)
  const pageSize = Math.min(50, Math.max(5, params?.pageSize ?? 10))
  const start = (page - 1) * pageSize
  const items = list.slice(start, start + pageSize)
  return { items, total }
}

export async function createProduct(input: {
  name: string
  categoryId: string
  price: number
  stock: number
  minThreshold: number
  status: ProductStatus
}): Promise<Product> {
  await delay()
  const store = loadStore()
  if (!store.categories.some((c) => c.id === input.categoryId)) {
    throw new Error('Invalid category')
  }
  const product: Product = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    categoryId: input.categoryId,
    price: input.price,
    stock: input.stock,
    minThreshold: input.minThreshold,
    status: input.status,
    createdAt: nowIso(),
  }
  store.products.push(product)
  pushActivity(
    store,
    'product_created',
    `Product "${product.name}" created`
  )
  saveStore(store)
  return product
}

export async function updateProductStock(
  productId: string,
  newStock: number
): Promise<Product> {
  await delay()
  const store = loadStore()
  const p = store.products.find((x) => x.id === productId)
  if (!p) throw new Error('Product not found')
  const n = Math.max(0, Math.floor(newStock))
  p.stock = n
  if (n === 0) {
    p.status = 'Out of Stock'
  } else if (p.status === 'Out of Stock') {
    p.status = 'Active'
  }
  pushActivity(store, 'restock', `Restocked "${p.name}" to ${n} units`)
  saveStore(store)
  return p
}

// ——— Orders ———

export async function fetchOrders(params?: {
  search?: string
  status?: OrderStatus | 'all'
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}): Promise<{ items: Order[]; total: number }> {
  await delay()
  const store = loadStore()
  let list = [...store.orders]
  const q = params?.search?.trim().toLowerCase()
  if (q) {
    list = list.filter((o) => o.customerName.toLowerCase().includes(q))
  }
  if (params?.status && params.status !== 'all') {
    list = list.filter((o) => o.status === params.status)
  }
  if (params?.dateFrom) {
    const from = new Date(params.dateFrom).getTime()
    list = list.filter((o) => new Date(o.createdAt).getTime() >= from)
  }
  if (params?.dateTo) {
    const to = new Date(params.dateTo)
    to.setHours(23, 59, 59, 999)
    list = list.filter((o) => new Date(o.createdAt).getTime() <= to.getTime())
  }
  list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const total = list.length
  const page = Math.max(1, params?.page ?? 1)
  const pageSize = Math.min(50, Math.max(5, params?.pageSize ?? 10))
  const start = (page - 1) * pageSize
  const items = list.slice(start, start + pageSize)
  return { items, total }
}

export async function createOrder(input: {
  customerName: string
  items: { productId: string; quantity: number }[]
}): Promise<Order> {
  await delay()
  const store = loadStore()
  const name = input.customerName.trim()
  if (!name) throw new Error('Customer name is required')
  if (!input.items.length) throw new Error('Add at least one product')

  const ids = new Set<string>()
  for (const line of input.items) {
    if (ids.has(line.productId)) throw new Error('Product already added')
    ids.add(line.productId)
    const p = store.products.find((x) => x.id === line.productId)
    if (!p) throw new Error('Product not found')
    if (p.status !== 'Active') throw new Error('Product unavailable')
    if (line.quantity < 1) throw new Error('Invalid quantity')
    if (line.quantity > p.stock) {
      throw new Error('Insufficient stock')
    }
  }

  const lines: OrderLine[] = input.items.map((line) => {
    const p = store.products.find((x) => x.id === line.productId)!
    return {
      productId: line.productId,
      quantity: line.quantity,
      unitPrice: p.price,
    }
  })
  const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0)

  for (const line of lines) {
    const p = store.products.find((x) => x.id === line.productId)!
    p.stock -= line.quantity
    if (p.stock <= 0) {
      p.stock = 0
      p.status = 'Out of Stock'
    }
  }

  const order: Order = {
    id: crypto.randomUUID(),
    customerName: name,
    items: lines,
    total,
    status: 'Pending',
    createdAt: nowIso(),
  }
  store.orders.unshift(order)
  pushActivity(
    store,
    'order_created',
    `Order #${order.id.slice(0, 8)} for ${name} — $${total.toFixed(2)}`
  )
  saveStore(store)
  return order
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  await delay()
  const store = loadStore()
  const o = store.orders.find((x) => x.id === orderId)
  if (!o) throw new Error('Order not found')
  if (o.status === 'Cancelled') throw new Error('Cancelled order cannot change')
  if (status === 'Cancelled') throw new Error('Use cancel endpoint')
  o.status = status
  pushActivity(
    store,
    'order_status',
    `Order #${o.id.slice(0, 8)} → ${status}`
  )
  saveStore(store)
  return o
}

export async function cancelOrder(orderId: string): Promise<Order> {
  await delay()
  const store = loadStore()
  const o = store.orders.find((x) => x.id === orderId)
  if (!o) throw new Error('Order not found')
  if (o.status === 'Cancelled') return o
  if (o.status === 'Delivered') {
    throw new Error('Delivered orders cannot be cancelled')
  }
  for (const line of o.items) {
    const p = store.products.find((x) => x.id === line.productId)
    if (p) {
      p.stock += line.quantity
      if (p.stock > 0) p.status = 'Active'
    }
  }
  o.status = 'Cancelled'
  pushActivity(store, 'order_cancelled', `Order #${o.id.slice(0, 8)} cancelled`)
  saveStore(store)
  return o
}

// ——— Dashboard & activity ———

export async function fetchDashboardStats(): Promise<DashboardStats> {
  await delay()
  const store = loadStore()
  const todayOrders = store.orders.filter((o) => isToday(o.createdAt))
  const pendingOrders = store.orders.filter((o) =>
    ['Pending', 'Confirmed', 'Shipped'].includes(o.status)
  ).length
  const completedOrders = store.orders.filter(
    (o) => o.status === 'Delivered'
  ).length
  const lowStockCount = store.products.filter(
    (p) => p.stock <= p.minThreshold
  ).length
  const revenueToday = todayOrders
    .filter((o) => o.status === 'Delivered')
    .reduce((s, o) => s + o.total, 0)
  return {
    ordersToday: todayOrders.length,
    pendingOrders,
    completedOrders,
    lowStockCount,
    revenueToday,
  }
}

export async function fetchActivities(limit = 10): Promise<Activity[]> {
  await delay()
  return loadStore().activities.slice(0, limit)
}

export async function fetchChartSeries(): Promise<ChartPoint[]> {
  await delay()
  const store = loadStore()
  const days: ChartPoint[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    const key = d.toISOString().slice(0, 10)
    const dayOrders = store.orders.filter((o) => {
      const t = new Date(o.createdAt).getTime()
      return t >= d.getTime() && t < next.getTime()
    })
    const revenue = dayOrders
      .filter((o) => o.status === 'Delivered')
      .reduce((s, o) => s + o.total, 0)
    days.push({
      date: key,
      revenue,
      orders: dayOrders.length,
    })
  }
  return days
}

export async function fetchProductSummary(limit = 5): Promise<Product[]> {
  await delay()
  const store = loadStore()
  return [...store.products]
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, limit)
}

export async function fetchRestockQueue(): Promise<Product[]> {
  await delay()
  const store = loadStore()
  return store.products
    .filter((p) => p.stock <= p.minThreshold)
    .sort((a, b) => a.stock - b.stock)
}

/** Local mode: treat as admin so all UI actions stay available. */
export async function fetchMe(): Promise<AppUser> {
  await Promise.resolve()
  return {
    id: 'local',
    name: 'Local user',
    email: 'local@offline',
    role: 'admin',
  }
}

export async function fetchUsers(): Promise<ListedUser[]> {
  await delay()
  return []
}

export async function updateUserRole(
  _userId: string,
  _role: AppUser['role']
): Promise<void> {
  await delay()
}

/** Remove queue entry — no-op offline (queue is derived from stock). */
export async function removeFromRestockQueue(_productId: string): Promise<void> {
  await Promise.resolve()
}

/**
 * Delete product if not referenced on any order.
 */
export async function deleteProduct(productId: string): Promise<void> {
  await delay()
  const store = loadStore()
  const hasOrder = store.orders.some((o) =>
    o.items.some((i) => i.productId === productId)
  )
  if (hasOrder) {
    throw new Error('Cannot delete product that appears on an order')
  }
  const idx = store.products.findIndex((p) => p.id === productId)
  if (idx === -1) throw new Error('Product not found')
  const [removed] = store.products.splice(idx, 1)
  pushActivity(store, 'product_updated', `Product deleted: ${removed.name}`)
  saveStore(store)
}
