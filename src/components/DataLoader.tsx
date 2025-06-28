import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import LoadingAnimation from './LoadingAnimation'

interface DataLoaderProps {
  children: React.ReactNode
}

const DataLoader: React.FC<DataLoaderProps> = ({ children }) => {
  const { isAuthenticated, user, loading: authLoading } = useAuth()
  const { loading: dataLoading, progress, isDataReady, data, error } = useData()

  // STABLE: Only show loading when auth is loading OR when data is actively loading for authenticated users
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Show error state if data loading failed for authenticated users
  if (isAuthenticated && error && !isDataReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show loading animation ONLY if authenticated user is actively loading data and data is not ready
  if (isAuthenticated && dataLoading && !isDataReady && progress < 100) {
    return (
      <LoadingAnimation 
        progress={Math.max(progress, 25)} 
        country={user?.user_metadata?.country || data.userProfile?.country || 'US'}
      />
    )
  }

  // Always render children when not in loading state
  return <>{children}</>
}

export default DataLoader