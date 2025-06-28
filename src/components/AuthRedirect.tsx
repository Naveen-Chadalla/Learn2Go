import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

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

    // If user is not authenticated and on protected pages, redirect to login
    if (!isAuthenticated && 
        (location.pathname === '/dashboard' || 
         location.pathname === '/admin' || 
         location.pathname.startsWith('/lessons/') ||
         location.pathname === '/results' ||
         location.pathname === '/leaderboard')) {
      navigate('/login', { 
        replace: true,
        state: { from: location }
      })
      return
    }
  }, [isAuthenticated, loading, location.pathname, navigate, user])

  // STABLE loading screen - no animations that cause blinking
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Show error message if there's an issue with authentication
  if (!isAuthenticated && 
      (location.pathname === '/dashboard' || 
       location.pathname === '/admin' || 
       location.pathname.startsWith('/lessons/') ||
       location.pathname === '/results' ||
       location.pathname === '/leaderboard')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full mx-4 text-center"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-100">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Please log in to access this page.</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Go to Login
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}

export default AuthRedirect