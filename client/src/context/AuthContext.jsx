import { createContext, useContext, useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, check localStorage for existing token and fetch user
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => setCurrentUser(data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const signup = async (name, email, password, userType) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, userType })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    localStorage.setItem('token', data.token)
    setCurrentUser(data.user)
    return data
  }

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    localStorage.setItem('token', data.token)
    setCurrentUser(data.user)
    return data
  }

  const loginWithGoogle = async (accessToken, mode = 'login') => {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, mode })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    localStorage.setItem('token', data.token)
    // Don't set currentUser yet if the user still needs to pick a type.
    // Setting it would trigger <Navigate to="/" /> and unmount the page.
    if (!data.needsUserType) {
      setCurrentUser(data.user)
    }
    return data // caller checks data.needsUserType
  }

  const setUserType = async (userType) => {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_URL}/auth/set-user-type`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ userType })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    // Now commit the user into context — this triggers the auth redirect
    setCurrentUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setCurrentUser(null)
  }

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
    setUserType,
    logout,
    loading,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
