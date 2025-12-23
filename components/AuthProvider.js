'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { onAuthStateChange, getSession } from '../lib/auth'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// Routes that require authentication
const protectedRoutes = ['/books', '/french']

// Routes that should redirect to home if user is authenticated
const authRoutes = ['/auth/login', '/auth/signup']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check active sessions and sets the user
    getSession().then((session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!loading) {
      // Redirect to login if accessing protected route without authentication
      if (!user && protectedRoutes.some(route => pathname?.startsWith(route))) {
        router.push('/auth/login')
      }
      
      // Redirect to home if accessing auth routes while authenticated
      if (user && authRoutes.some(route => pathname?.startsWith(route))) {
        router.push('/')
      }
    }
  }, [user, loading, pathname, router])

  const value = {
    user,
    loading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
