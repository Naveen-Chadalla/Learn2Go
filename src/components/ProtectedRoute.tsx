import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
  requireAuth?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  adminOnly = false, 
  requireAuth = true 
}) => {
  const { user, loading, isAdmin, isAuthenticated } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying secure session...</p>
        </div>
      </div>
    )
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    console.log('[PROTECTED ROUTE] User not authenticated, redirecting to login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If admin access is required but user is not admin
  if (adminOnly && !isAdmin) {
    console.log('[PROTECTED ROUTE] Admin access required but user is not admin')
    return <Navigate to="/dashboard" replace />
  }

  // Additional security check for admin routes
  if (adminOnly && user?.user_metadata?.username !== 'Hari') {
    console.log('[PROTECTED ROUTE] Admin route access denied - not Hari')
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute