import type { Product } from '../../types/models'

export function StockBadge({ product }: { product: Product }) {
  const low = product.stock <= product.minThreshold
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-semibold leading-none ${
        low
          ? 'border-red-300 bg-red-100 text-red-900'
          : 'border-emerald-300 bg-emerald-100 text-emerald-900'
      }`}
    >
      {low ? 'Low stock' : 'OK'}
    </span>
  )
}
