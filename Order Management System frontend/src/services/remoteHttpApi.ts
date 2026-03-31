import axios from 'axios'
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
import { remoteClient } from './httpClient'

function apiErr(e: unknown): never {
  if (axios.isAxiosError(e)) {
    const msg = (e.response?.data as { message?: string })?.message
    throw new Error(msg || e.message)
  }
  throw e
}

function mapCategory(raw: Record<string, unknown>): Category {
  return {
    id: String(raw._id),
    name: String(raw.name),
    createdAt:
      raw.createdAt instanceof Date
        ? raw.createdAt.toISOString()
        : String(raw.createdAt ?? ''),
  }
}

function mapProduct(raw: Record<string, unknown>): Product {
  const cat = raw.category as Record<string, unknown> | string | undefined
  const categoryId =
    typeof cat === 'object' && cat && '_id' in cat
      ? String(cat._id)
      : String(cat ?? '')
  return {
    id: String(raw._id),
    name: String(raw.name),
    categoryId,
    price: Number(raw.price),
    stock: Number(raw.stockQuantity),
    minThreshold: Number(raw.minStockThreshold),
    status: raw.status as ProductStatus,
    createdAt:
      raw.createdAt instanceof Date
        ? raw.createdAt.toISOString()
        : String(raw.createdAt ?? ''),
  }
}

function mapOrderLine(line: Record<string, unknown>): OrderLine {
  const pid = line.productId as Record<string, unknown> | string
  const productId =
    typeof pid === 'object' && pid && '_id' in pid
      ? String(pid._id)
      : String(pid)
  return {
    productId,
    quantity: Number(line.quantity),
    unitPrice: Number(line.price),
  }
}

function mapOrder(raw: Record<string, unknown>): Order {
  return {
    id: String(raw._id),
    customerName: String(raw.customerName),
    items: ((raw.products as Record<string, unknown>[]) || []).map(mapOrderLine),
    total: Number(raw.totalPrice),
    status: raw.status as OrderStatus,
    createdAt:
      raw.createdAt instanceof Date
        ? raw.createdAt.toISOString()
        : String(raw.createdAt ?? ''),
  }
}

function mapActivity(raw: Record<string, unknown>): Activity {
  return {
    id: String(raw._id),
    type: 'order_created',
    message: String(raw.message),
    createdAt:
      raw.timestamp instanceof Date
        ? raw.timestamp.toISOString()
        : String(raw.timestamp ?? ''),
  }
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

export async function fetchCategories(): Promise<Category[]> {
  try {
    const { data } = await remoteClient.get<{ data: Record<string, unknown>[] }>(
      '/categories'
    )
    return (data.data || []).map(mapCategory)
  } catch (e) {
    apiErr(e)
  }
}

export async function createCategory(name: string): Promise<Category> {
  try {
    const { data } = await remoteClient.post<{ data: Record<string, unknown> }>(
      '/categories',
      { name }
    )
    return mapCategory(data.data)
  } catch (e) {
    apiErr(e)
  }
}

export async function fetchProducts(params?: {
  search?: string
  categoryId?: string
  page?: number
  pageSize?: number
}): Promise<{ items: Product[]; total: number }> {
  try {
    const { data } = await remoteClient.get<{
      data: Record<string, unknown>[]
      pagination: { total: number; page: number; limit: number }
    }>('/products', {
      params: {
        q: params?.search,
        category: params?.categoryId,
        page: params?.page,
        limit: params?.pageSize,
      },
    })
    return {
      items: (data.data || []).map(mapProduct),
      total: data.pagination?.total ?? 0,
    }
  } catch (e) {
    apiErr(e)
  }
}

export async function createProduct(input: {
  name: string
  categoryId: string
  price: number
  stock: number
  minThreshold: number
  status: ProductStatus
}): Promise<Product> {
  try {
    const { data } = await remoteClient.post<{ data: Record<string, unknown> }>(
      '/products',
      {
        name: input.name,
        category: input.categoryId,
        price: input.price,
        stockQuantity: input.stock,
        minStockThreshold: input.minThreshold,
        status: input.status,
      }
    )
    return mapProduct(data.data)
  } catch (e) {
    apiErr(e)
  }
}

export async function updateProductStock(
  productId: string,
  newStock: number
): Promise<Product> {
  try {
    const { data } = await remoteClient.patch<{ data: { product: Record<string, unknown> } }>(
      `/restock-queue/${productId}`,
      { newStock: Math.max(0, Math.floor(newStock)) }
    )
    return mapProduct(data.data.product)
  } catch (e) {
    apiErr(e)
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  try {
    await remoteClient.delete(`/products/${productId}`)
  } catch (e) {
    apiErr(e)
  }
}

export async function fetchOrders(params?: {
  search?: string
  status?: OrderStatus | 'all'
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}): Promise<{ items: Order[]; total: number }> {
  try {
    const { data } = await remoteClient.get<{
      data: Record<string, unknown>[]
      pagination: { total: number }
    }>('/orders', {
      params: {
        search: params?.search,
        status: params?.status === 'all' ? undefined : params?.status,
        dateFrom: params?.dateFrom,
        dateTo: params?.dateTo,
        page: params?.page,
        limit: params?.pageSize,
      },
    })
    return {
      items: (data.data || []).map(mapOrder),
      total: data.pagination?.total ?? 0,
    }
  } catch (e) {
    apiErr(e)
  }
}

export async function createOrder(input: {
  customerName: string
  items: { productId: string; quantity: number }[]
}): Promise<Order> {
  try {
    const { data } = await remoteClient.post<{ data: Record<string, unknown> }>(
      '/orders',
      {
        customerName: input.customerName,
        items: input.items,
      }
    )
    return mapOrder(data.data)
  } catch (e) {
    apiErr(e)
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  try {
    const { data } = await remoteClient.patch<{ data: Record<string, unknown> }>(
      `/orders/${orderId}/status`,
      { status }
    )
    return mapOrder(data.data)
  } catch (e) {
    apiErr(e)
  }
}

export async function cancelOrder(orderId: string): Promise<Order> {
  try {
    const { data } = await remoteClient.post<{ data: Record<string, unknown> }>(
      `/orders/${orderId}/cancel`
    )
    return mapOrder(data.data)
  } catch (e) {
    apiErr(e)
  }
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const { data } = await remoteClient.get<{ data: DashboardStats }>(
      '/dashboard/stats'
    )
    return data.data
  } catch (e) {
    apiErr(e)
  }
}

export async function fetchActivities(limit = 10): Promise<Activity[]> {
  try {
    const { data } = await remoteClient.get<{ data: Record<string, unknown>[] }>(
      '/activity',
      { params: { limit } }
    )
    return (data.data || []).map(mapActivity)
  } catch (e) {
    apiErr(e)
  }
}

export async function fetchChartSeries(): Promise<ChartPoint[]> {
  try {
    const { data } = await remoteClient.get<{
      data: { date: string; orders: number; revenue: number }[]
    }>('/analytics/chart', { params: { days: 7 } })
    return (data.data || []).map((row) => ({
      date: row.date,
      orders: row.orders,
      revenue: row.revenue,
    }))
  } catch (e) {
    apiErr(e)
  }
}

export async function fetchProductSummary(limit = 5): Promise<Product[]> {
  const { items } = await fetchProducts({ page: 1, pageSize: limit })
  return items
}

export async function fetchRestockQueue(): Promise<Product[]> {
  try {
    const { data } = await remoteClient.get<{
      data: Record<string, unknown>[]
    }>('/restock-queue')
    return (data.data || []).map((row) => {
      const p = row.productId as Record<string, unknown>
      const base = mapProduct(p)
      return {
        ...base,
        stock: Number(row.currentStock),
      }
    })
  } catch (e) {
    apiErr(e)
  }
}

export async function fetchMe(): Promise<AppUser> {
  try {
    const { data } = await remoteClient.get<{ data: AppUser }>('/me')
    return data.data
  } catch (e) {
    apiErr(e)
  }
}

export async function fetchUsers(): Promise<ListedUser[]> {
  try {
    const { data } = await remoteClient.get<{ data: ListedUser[] }>('/users')
    return data.data || []
  } catch (e) {
    apiErr(e)
  }
}

export async function updateUserRole(
  userId: string,
  role: AppUser['role']
): Promise<void> {
  try {
    await remoteClient.patch(`/users/${userId}/role`, { role })
  } catch (e) {
    apiErr(e)
  }
}

export async function removeFromRestockQueue(productId: string): Promise<void> {
  try {
    await remoteClient.delete(`/restock-queue/${productId}`)
  } catch (e) {
    apiErr(e)
  }
}
