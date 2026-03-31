import type { OrderStatus } from '../../types/models'

const styles: Record<OrderStatus, string> = {
  Pending: 'badge-warning',
  Confirmed: 'badge-info',
  Shipped: 'badge-info',
  Delivered: 'badge-success',
  Cancelled: 'badge-ghost opacity-80',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`badge badge-sm ${styles[status]}`}>{status}</span>
  )
}
