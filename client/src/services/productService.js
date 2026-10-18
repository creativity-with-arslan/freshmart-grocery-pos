
import { apiRequest } from './api'

const API_URL = 'http://localhost:5000/api/products'

export async function getProducts() {
  const result = await apiRequest(API_URL)
  return result.data
}

export async function createProduct(productData) {
  const result = await apiRequest(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData),
  })

  return result.data
}

export async function updateProduct(productId, productData) {
  const result = await apiRequest(`${API_URL}/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData),
  })

  return result.data
}

export async function deleteProduct(productId) {
  return apiRequest(`${API_URL}/${productId}`, {
    method: 'DELETE',
  })
}
