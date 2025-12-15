const API_BASE = import.meta.env.VITE_API_URL || '/api'

class ApiClient {
  async request(method, path, body = null) {
    const { useAuthStore } = await import('../store/auth')
    const { accessToken, refreshAccessToken, logout } = useAuthStore.getState()

    const headers = { 'Content-Type': 'application/json' }
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

    let res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    })

    // Try refresh if 401
    if (res.status === 401 && accessToken) {
      try {
        const newToken = await refreshAccessToken()
        headers['Authorization'] = `Bearer ${newToken}`
        res = await fetch(`${API_BASE}${path}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : null,
        })
      } catch {
        logout()
        throw new Error('Session expired')
      }
    }

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Request failed')
    return data
  }

  get(path) { return this.request('GET', path) }
  post(path, body) { return this.request('POST', path, body) }
  patch(path, body) { return this.request('PATCH', path, body) }
  delete(path) { return this.request('DELETE', path) }
}

export default new ApiClient()
