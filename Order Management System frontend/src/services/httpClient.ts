import axios from 'axios'
import { getToken } from '../auth/tokenStorage'
import { isRemoteApi } from './apiConfig'

const baseURL = String(import.meta.env.VITE_API_BASE_URL || '').trim() || '/api'

export const remoteClient = axios.create({
  baseURL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
})

remoteClient.interceptors.request.use((config) => {
  if (!isRemoteApi()) return config
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const apiClient = remoteClient
