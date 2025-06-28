import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, Settings, LogOut, User, Globe, AlertCircle, Crown, Trophy, MessageCircle, Sparkles, AlignCenterVertical as Certificate } from 'lucide-react'

const Navbar: React.FC = () => {
  const { user, signOut, isAdmin, debugInfo } = useAuth()
  const { t, language, setLanguage } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)

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
    { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳', nativeName: 'తెలుగు' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳', nativeName: 'हिन्दी' },
  ]

  const currentLanguage = languages.find(l => l.code === language) || languages[0]

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-200/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-3 group">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <img 
                src="/src/assets/ChatGPT Image Jun 21, 2025, 03_33_49 PM copy.png" 
                alt="Learn2Go Logo" 
                className="h-10 w-auto shadow-lg rounded-lg group-hover:shadow-glow transition-all duration-300"
                onError={(e) => {
                  // Fallback to gradient logo if image fails to load
                  e.currentTarget.style.display = 'none'
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement
                  if (fallback) fallback.classList.remove('hidden')
                }}
              />
              <div className="hidden w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all duration-300">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </motion.div>
            <motion.span 
              className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
              whileHover={{ scale: 1.02 }}
            >
              Learn2Go
            </motion.span>
          </Link>

          {/* Navigation Links - Only show if user is logged in */}
          {user && (
            <div className="hidden md:flex items-center space-x-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-2xl transition-all duration-300 ${
                    isActive('/dashboard') 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/80 backdrop-blur-sm'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="font-medium">{t('nav.dashboard')}</span>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/results"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-2xl transition-all duration-300 ${
                    isActive('/results') 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25' 
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/80 backdrop-blur-sm'
                  }`}
                >
                  <Trophy className="h-4 w-4" />
                  <span className="font-medium">{t('nav.results')}</span>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/leaderboard"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-2xl transition-all duration-300 ${
                    isActive('/leaderboard') 
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg shadow-yellow-500/25' 
                      : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50/80 backdrop-blur-sm'
                  }`}
                >
                  <Trophy className="h-4 w-4" />
                  <span className="font-medium">Leaderboard</span>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/certificate"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-2xl transition-all duration-300 ${
                    isActive('/certificate') 
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/25' 
                      : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50/80 backdrop-blur-sm'
                  }`}
                >
                  <Certificate className="h-4 w-4" />
                  <span className="font-medium">Certificate</span>
                </Link>
              </motion.div>

              {isAdmin && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/admin"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-2xl transition-all duration-300 ${
                      isActive('/admin') 
                        ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/25' 
                        : 'text-gray-600 hover:text-red-600 hover:bg-red-50/80 backdrop-blur-sm'
                    }`}
                  >
                    <Crown className="h-4 w-4" />
                    <span className="font-medium">{t('nav.admin')}</span>
                  </Link>
                </motion.div>
              )}
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center space-x-3">
            {/* AI Chat Assistant Button */}
            {user && (
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                title="AI Assistant"
              >
                <MessageCircle className="h-5 w-5" />
                <motion.div 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.button>
            )}

            {/* Language Selector */}
            <div className="relative">
              <motion.button 
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-3 py-2 rounded-2xl text-gray-600 hover:text-blue-600 hover:bg-blue-50/80 backdrop-blur-sm transition-all duration-300"
              >
                <Globe className="h-4 w-4" />
                <span className="text-lg">{currentLanguage.flag}</span>
                <span className="hidden sm:inline font-medium">{currentLanguage.nativeName}</span>
              </motion.button>
              
              <AnimatePresence>
                {showLanguageMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden"
                    onMouseLeave={() => setShowLanguageMenu(false)}
                  >
                    {languages.map((lang) => (
                      <motion.button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code)
                          setShowLanguageMenu(false)
                        }}
                        whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                        className={`w-full text-left px-4 py-3 flex items-center space-x-3 transition-colors ${
                          language === lang.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:text-blue-600'
                        }`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <div>
                          <div className="font-medium">{lang.nativeName}</div>
                          <div className="text-xs opacity-75">{lang.name}</div>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {user ? (
              <div className="flex items-center space-x-3">
                {/* User Profile */}
                <div className="flex items-center space-x-3">
                  <motion.div 
                    className="relative"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      {isAdmin ? (
                        <Crown className="h-5 w-5 text-white" />
                      ) : (
                        <User className="h-5 w-5 text-white" />
                      )}
                    </div>
                    {isAdmin && (
                      <motion.div 
                        className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Crown className="h-2 w-2 text-white" />
                      </motion.div>
                    )}
                  </motion.div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-semibold text-gray-700">
                      {user.user_metadata?.username || user.email?.split('@')[0]}
                    </div>
                    {isAdmin && (
                      <div className="text-xs text-yellow-600 font-medium">Administrator</div>
                    )}
                  </div>
                </div>

                {/* Logout Error */}
                <AnimatePresence>
                  {logoutError && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center space-x-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">{logoutError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Logout Button */}
                <motion.button
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50/80 backdrop-blur-sm rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  {isLoggingOut ? (
                    <>
                      <motion.div 
                        className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span className="hidden sm:inline font-medium">Logging out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline font-medium">{t('nav.logout')}</span>
                    </>
                  )}
                </motion.button>
              </div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 font-medium"
                >
                  {t('nav.login')}
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {user && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="md:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-xl"
        >
          <div className="px-4 py-3 flex justify-around">
            <Link
              to="/dashboard"
              className={`flex flex-col items-center py-2 px-3 rounded-2xl transition-all duration-300 ${
                isActive('/dashboard') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium">{t('nav.dashboard')}</span>
            </Link>
            <Link
              to="/results"
              className={`flex flex-col items-center py-2 px-3 rounded-2xl transition-all duration-300 ${
                isActive('/results') ? 'text-purple-600 bg-purple-50' : 'text-gray-600'
              }`}
            >
              <Trophy className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium">{t('nav.results')}</span>
            </Link>
            <Link
              to="/leaderboard"
              className={`flex flex-col items-center py-2 px-3 rounded-2xl transition-all duration-300 ${
                isActive('/leaderboard') ? 'text-yellow-600 bg-yellow-50' : 'text-gray-600'
              }`}
            >
              <Trophy className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium">Leaderboard</span>
            </Link>
            <Link
              to="/certificate"
              className={`flex flex-col items-center py-2 px-3 rounded-2xl transition-all duration-300 ${
                isActive('/certificate') ? 'text-amber-600 bg-amber-50' : 'text-gray-600'
              }`}
            >
              <Certificate className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium">Certificate</span>
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex flex-col items-center py-2 px-3 rounded-2xl transition-all duration-300 ${
                  isActive('/admin') ? 'text-red-600 bg-red-50' : 'text-gray-600'
                }`}
              >
                <Crown className="h-5 w-5" />
                <span className="text-xs mt-1 font-medium">{t('nav.admin')}</span>
              </Link>
            )}
          </div>
        </motion.div>
      )}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && debugInfo.lastError && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-red-50 border-t border-red-200 px-4 py-2"
        >
          <div className="text-red-800 text-sm">
            <strong>Debug:</strong> {debugInfo.lastError}
          </div>
          <div className="text-red-600 text-xs">
            Auth changes: {debugInfo.authStateChanges} | Last activity: {debugInfo.lastActivity}
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}

export default Navbar