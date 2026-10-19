
import { apiRequest } from './api'

const API_URL = `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/api/sales`

export async function createSale(saleData) {
  const result = await apiRequest(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(saleData),
  })

  return result.data
}

export async function getSales() {
  const result = await apiRequest(API_URL)
  return result.data
}
