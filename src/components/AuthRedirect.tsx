import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface AuthRedirectProps {
  children: React.ReactNode
}

const AuthRedirect: React.FC<AuthRedirectProps> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Don't redirect while still loading
    if (loading) return

    // If user is authenticated and on home page, redirect based on user type
    if (isAuthenticated && location.pathname === '/') {
      if (user?.user_metadata?.username === 'Hari') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
      return
    }

    // If user is authenticated and on auth pages, redirect based on user type
    if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/signup')) {
      if (user?.user_metadata?.username === 'Hari') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
      return
    }
  }, [isAuthenticated, loading, location.pathname, navigate, user])

  // SIMPLIFIED loading screen - no blinking
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default AuthRedirect