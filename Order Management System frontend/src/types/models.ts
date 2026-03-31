/** Aligned with backend Product.status */
export type ProductStatus = 'Active' | 'Out of Stock'

/** Aligned with backend Order.status */
export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'

/** Aligned with backend RestockQueue.priority */
export type RestockPriority = 'High' | 'Medium' | 'Low'

export interface Category {
  id: string
  name: string
  createdAt: string
}

export interface Product {
  id: string
  name: string
  categoryId: string
  price: number
  stock: number
  minThreshold: number
  status: ProductStatus
  createdAt: string
}

export interface OrderLine {
  productId: string
  quantity: number
  unitPrice: number
}

export interface Order {
  id: string
  customerName: string
  items: OrderLine[]
  total: number
  status: OrderStatus
  createdAt: string
}

export type ActivityType =
  | 'category_created'
  | 'product_created'
  | 'product_updated'
  | 'order_created'
  | 'order_status'
  | 'order_cancelled'
  | 'restock'

export interface Activity {
  id: string
  type: ActivityType
  message: string
  createdAt: string
}

export interface DashboardStats {
  ordersToday: number
  pendingOrders: number
  completedOrders: number
  lowStockCount: number
  revenueToday: number
}

export interface ChartPoint {
  date: string
  revenue: number
  orders: number
}

export interface AppUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

export interface ListedUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  createdAt: string
}
