export const queryKeys = {
  categories: ['categories'] as const,
  products: (params: Record<string, unknown>) =>
    ['products', params] as const,
  orders: (params: Record<string, unknown>) => ['orders', params] as const,
  dashboardStats: ['dashboardStats'] as const,
  activities: ['activities'] as const,
  chartSeries: ['chartSeries'] as const,
  productSummary: ['productSummary'] as const,
  restockQueue: ['restockQueue'] as const,
}
