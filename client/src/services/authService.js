
const API_URL = 'http://localhost:5000/api/auth'

async function handleResponse(response) {
  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Authentication request failed.')
  }

  return result.data
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  return handleResponse(response)
}

export async function getCurrentUser(token) {
  const response = await fetch(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return handleResponse(response)
}

export async function createUserAccount(token, userData) {
  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  })

  return handleResponse(response)
}
