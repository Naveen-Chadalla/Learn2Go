import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { BookOpen, Home, BarChart3, Settings, LogOut, User, Globe, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const Navbar: React.FC = () => {
  const { user, signOut, isAdmin, debugInfo } = useAuth()
  const { t, language, setLanguage } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    setLogoutError(null)
    
    try {
      console.log('[LOGOUT] Starting instant logout...')
      
      // INSTANT LOGOUT - no waiting for server operations
      const result = await signOut()
      
      console.log('[LOGOUT] Logout completed, redirecting immediately')
      
      // Immediate redirect - don't wait for anything
      navigate('/', { replace: true })
      
      // Show any non-critical errors after redirect
      if (result.error) {
        console.warn('[LOGOUT] Non-critical logout issue:', result.error)
        // Don't show error to user since logout was successful
      }
      
    } catch (error) {
      console.error('[LOGOUT] Logout exception (forcing redirect):', error)
      
      // Force redirect even on error - user experience is priority
      navigate('/', { replace: true })
      
    } finally {
      // Reset loading state after a brief delay
      setTimeout(() => {
        setIsLoggingOut(false)
        setLogoutError(null)
      }, 500)
    }
  }

  const isActive = (path: string) => location.pathname === path

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  ]

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Learn2Go
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>{t('nav.home')}</span>
            </Link>

            {user && (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                    isActive('/dashboard') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>{t('nav.dashboard')}</span>
                </Link>

                <Link
                  to="/results"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                    isActive('/results') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>{t('nav.results')}</span>
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                      isActive('/admin') ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:text-red-600'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>{t('nav.admin')}</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative group">
              <button className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-600 hover:text-blue-600 transition-colors">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{languages.find(l => l.code === language)?.flag}</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 ${
                      language === lang.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                    {user.user_metadata?.username || user.email?.split('@')[0]}
                  </span>
                </div>

                {/* Logout Error Display */}
                {logoutError && (
                  <div className="flex items-center space-x-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">{logoutError}</span>
                  </div>
                )}

                <button
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      <span className="hidden sm:inline">Logging out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline">{t('nav.logout')}</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {t('nav.login')}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {user && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-2 flex justify-around">
            <Link
              to="/dashboard"
              className={`flex flex-col items-center py-2 px-3 rounded-lg ${
                isActive('/dashboard') ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs mt-1">{t('nav.dashboard')}</span>
            </Link>
            <Link
              to="/results"
              className={`flex flex-col items-center py-2 px-3 rounded-lg ${
                isActive('/results') ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs mt-1">{t('nav.results')}</span>
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex flex-col items-center py-2 px-3 rounded-lg ${
                  isActive('/admin') ? 'text-red-600' : 'text-gray-600'
                }`}
              >
                <Settings className="h-5 w-5" />
                <span className="text-xs mt-1">{t('nav.admin')}</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && debugInfo.lastError && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-2">
          <div className="text-red-800 text-sm">
            <strong>Debug:</strong> {debugInfo.lastError}
          </div>
          <div className="text-red-600 text-xs">
            Auth changes: {debugInfo.authStateChanges} | Last activity: {debugInfo.lastActivity}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar