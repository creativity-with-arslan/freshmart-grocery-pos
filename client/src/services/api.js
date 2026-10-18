
export function getAuthHeaders() {
  const token = sessionStorage.getItem('freshmart_token')

  return token
    ? { Authorization: `Bearer ${token}` }
    : {}
}

export async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  })

  let result

  try {
    result = await response.json()
  } catch {
    throw new Error('The server returned an invalid response.')
  }

  if (response.status === 401) {
    sessionStorage.removeItem('freshmart_token')
    sessionStorage.removeItem('freshmart_user')
    window.location.reload()

    throw new Error('Your session expired. Please log in again.')
  }

  if (!response.ok || result.success === false) {
    throw new Error(result.message || 'The request failed.')
  }

  return result
}
