
import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => sessionStorage.getItem('freshmart_token') || ''
  )

  const [user, setUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem('freshmart_user')
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      sessionStorage.removeItem('freshmart_user')
      return null
    }
  })

  function login(authData) {
    sessionStorage.setItem('freshmart_token', authData.token)
    sessionStorage.setItem('freshmart_user', JSON.stringify(authData.user))
    setToken(authData.token)
    setUser(authData.user)
  }

  function logout() {
    sessionStorage.removeItem('freshmart_token')
    sessionStorage.removeItem('freshmart_user')
    setToken('')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
