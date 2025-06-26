import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { BarChart3, Settings, LogOut, User, Globe, AlertCircle, Crown, Trophy, MessageCircle } from 'lucide-react'
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
      
      const result = await signOut()
      
      console.log('[LOGOUT] Logout completed, redirecting immediately')
      
      navigate('/', { replace: true })
      
      if (result.error) {
        console.warn('[LOGOUT] Non-critical logout issue:', result.error)
      }
      
    } catch (error) {
      console.error('[LOGOUT] Logout exception (forcing redirect):', error)
      navigate('/', { replace: true })
      
    } finally {
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
    <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-3">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="bg-gradient-to-r from-blue-500 to-green-600 p-2 rounded-xl shadow-lg">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-gradient-to-b from-red-500 via-yellow-500 to-green-500 rounded-full"></div>
                </div>
              </div>
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Learn2Go
            </span>
          </Link>

          {/* Navigation Links - Only show if user is logged in */}
          {user && (
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/dashboard"
                className={`flex items-center space-x-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                  isActive('/dashboard') 
                    ? 'bg-gradient-to-r from-blue-500 to-green-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>{t('nav.dashboard')}</span>
              </Link>

              <Link
                to="/results"
                className={`flex items-center space-x-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                  isActive('/results') 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <Trophy className="h-4 w-4" />
                <span>{t('nav.results')}</span>
              </Link>

              <Link
                to="/leaderboard"
                className={`flex items-center space-x-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                  isActive('/leaderboard') 
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                }`}
              >
                <Trophy className="h-4 w-4" />
                <span>Leaderboard</span>
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                    isActive('/admin') 
                      ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg' 
                      : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  <Crown className="h-4 w-4" />
                  <span>{t('nav.admin')}</span>
                </Link>
              )}
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* AI Chat Assistant Button */}
            {user && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                title="AI Assistant"
              >
                <MessageCircle className="h-5 w-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </motion.button>
            )}

            {/* Language Selector */}
            <div className="relative group">
              <button className="flex items-center space-x-1 px-3 py-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{languages.find(l => l.code === language)?.flag}</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-2 first:rounded-t-xl last:rounded-b-xl transition-colors ${
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
                <div className="flex items-center space-x-3">
                  <motion.div 
                    className="relative"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                      {isAdmin ? (
                        <Crown className="h-5 w-5 text-white" />
                      ) : (
                        <User className="h-5 w-5 text-white" />
                      )}
                    </div>
                    {isAdmin && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Crown className="h-2 w-2 text-white" />
                      </div>
                    )}
                  </motion.div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium text-gray-700">
                      {user.user_metadata?.username || user.email?.split('@')[0]}
                    </div>
                    {isAdmin && (
                      <div className="text-xs text-yellow-600 font-medium">Administrator</div>
                    )}
                  </div>
                </div>

                {logoutError && (
                  <div className="flex items-center space-x-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">{logoutError}</span>
                  </div>
                )}

                <motion.button
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-1 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
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
                </motion.button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-gradient-to-r from-blue-500 to-green-600 text-white px-6 py-2 rounded-xl hover:from-blue-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                {t('nav.login')}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {user && (
        <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
          <div className="px-4 py-2 flex justify-around">
            <Link
              to="/dashboard"
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 ${
                isActive('/dashboard') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs mt-1">{t('nav.dashboard')}</span>
            </Link>
            <Link
              to="/results"
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 ${
                isActive('/results') ? 'text-purple-600 bg-purple-50' : 'text-gray-600'
              }`}
            >
              <Trophy className="h-5 w-5" />
              <span className="text-xs mt-1">{t('nav.results')}</span>
            </Link>
            <Link
              to="/leaderboard"
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 ${
                isActive('/leaderboard') ? 'text-yellow-600 bg-yellow-50' : 'text-gray-600'
              }`}
            >
              <Trophy className="h-5 w-5" />
              <span className="text-xs mt-1">Leaderboard</span>
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 ${
                  isActive('/admin') ? 'text-red-600 bg-red-50' : 'text-gray-600'
                }`}
              >
                <Crown className="h-5 w-5" />
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