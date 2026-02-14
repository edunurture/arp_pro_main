import axios from 'axios'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

export { API_BASE }
export default apiClient
