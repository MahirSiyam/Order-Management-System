/**
 * Data layer: local IndexedDB-style store (default) or remote Express API when
 * VITE_USE_REMOTE_API=true or VITE_API_BASE_URL is http(s).
 */
import type { AppUser } from '../types/models'
import { isRemoteApi } from './apiConfig'
import { apiClient } from './httpClient'
import * as local from './localStoreApi'
import * as remote from './remoteHttpApi'

export { apiClient }

export async function fetchCategories() {
  return isRemoteApi() ? remote.fetchCategories() : local.fetchCategories()
}

export async function createCategory(name: string) {
  return isRemoteApi() ? remote.createCategory(name) : local.createCategory(name)
}

export async function fetchProducts(
  params?: Parameters<typeof local.fetchProducts>[0]
) {
  return isRemoteApi() ? remote.fetchProducts(params) : local.fetchProducts(params)
}

export async function createProduct(
  input: Parameters<typeof local.createProduct>[0]
) {
  return isRemoteApi() ? remote.createProduct(input) : local.createProduct(input)
}

export async function updateProductStock(productId: string, newStock: number) {
  return isRemoteApi()
    ? remote.updateProductStock(productId, newStock)
    : local.updateProductStock(productId, newStock)
}

export async function deleteProduct(productId: string) {
  return isRemoteApi()
    ? remote.deleteProduct(productId)
    : local.deleteProduct(productId)
}

export async function fetchOrders(params?: Parameters<typeof local.fetchOrders>[0]) {
  return isRemoteApi() ? remote.fetchOrders(params) : local.fetchOrders(params)
}

export async function createOrder(input: Parameters<typeof local.createOrder>[0]) {
  return isRemoteApi() ? remote.createOrder(input) : local.createOrder(input)
}

export async function updateOrderStatus(
  orderId: string,
  status: Parameters<typeof local.updateOrderStatus>[1]
) {
  return isRemoteApi()
    ? remote.updateOrderStatus(orderId, status)
    : local.updateOrderStatus(orderId, status)
}

export async function cancelOrder(orderId: string) {
  return isRemoteApi() ? remote.cancelOrder(orderId) : local.cancelOrder(orderId)
}

export async function fetchDashboardStats() {
  return isRemoteApi()
    ? remote.fetchDashboardStats()
    : local.fetchDashboardStats()
}

export async function fetchActivities(limit?: number) {
  return isRemoteApi()
    ? remote.fetchActivities(limit)
    : local.fetchActivities(limit)
}

export async function fetchChartSeries() {
  return isRemoteApi() ? remote.fetchChartSeries() : local.fetchChartSeries()
}

export async function fetchProductSummary(limit?: number) {
  return isRemoteApi()
    ? remote.fetchProductSummary(limit)
    : local.fetchProductSummary(limit)
}

export async function fetchRestockQueue() {
  return isRemoteApi() ? remote.fetchRestockQueue() : local.fetchRestockQueue()
}

export function restockPriorityFor(
  product: Parameters<typeof local.restockPriorityFor>[0]
) {
  return isRemoteApi()
    ? remote.restockPriorityFor(product)
    : local.restockPriorityFor(product)
}

export async function fetchMe() {
  return isRemoteApi() ? remote.fetchMe() : local.fetchMe()
}

export async function fetchUsers() {
  return isRemoteApi() ? remote.fetchUsers() : local.fetchUsers()
}

export async function updateUserRole(userId: string, role: AppUser['role']) {
  return isRemoteApi()
    ? remote.updateUserRole(userId, role)
    : local.updateUserRole(userId, role)
}

export async function removeFromRestockQueue(productId: string) {
  return isRemoteApi()
    ? remote.removeFromRestockQueue(productId)
    : local.removeFromRestockQueue(productId)
}
