import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { 
  Home, 
  BookOpen, 
  Trophy, 
  BarChart3, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Search,
  Bell,
  Settings,
  Crown,
  Sparkles
} from 'lucide-react'
import Button from '../UI/Button'
import SearchBar from '../UI/SearchBar'
import Tooltip from '../UI/Tooltip'

const ModernNavbar: React.FC = () => {
  const { user, signOut, isAdmin } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (path: string) => location.pathname === path

  const navItems = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: BarChart3 },
    { path: '/results', label: t('nav.results'), icon: Trophy },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ]

  if (isAdmin) {
    navItems.push({ path: '/admin', label: t('nav.admin'), icon: Crown })
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const handleSearch = (query: string, filters: string[]) => {
    console.log('Search:', query, filters)
    // Implement search functionality
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-fixed transition-all duration-300 ${
          scrolled 
            ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-neutral-200/50' 
            : 'bg-white/80 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-3 group">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </motion.div>
              <motion.span 
                className="text-xl font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-600 bg-clip-text text-transparent"
                whileHover={{ scale: 1.02 }}
              >
                Learn2Go
              </motion.span>
            </Link>

            {/* Desktop Navigation */}
            {user && (
              <div className="hidden lg:flex items-center space-x-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Tooltip key={item.path} content={item.label}>
                      <Link
                        to={item.path}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-2xl transition-all duration-300 ${
                          isActive(item.path)
                            ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                            : 'text-neutral-600 hover:text-primary-600 hover:bg-primary-50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </Tooltip>
                  )
                })}
              </div>
            )}

            {/* Search Bar (Desktop) */}
            {user && (
              <div className="hidden md:block flex-1 max-w-md mx-8">
                <SearchBar
                  placeholder="Search lessons..."
                  onSearch={handleSearch}
                  results={[]}
                />
              </div>
            )}

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Search Toggle (Mobile) */}
              {user && (
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="md:hidden p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}

              {/* Notifications */}
              {user && (
                <Tooltip content="Notifications">
                  <button className="relative p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                  </button>
                </Tooltip>
              )}

              {user ? (
                <>
                  {/* User Menu */}
                  <div className="flex items-center space-x-3">
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-semibold text-neutral-800">
                        {user.user_metadata?.username || user.email?.split('@')[0]}
                      </p>
                      {isAdmin && (
                        <p className="text-xs text-yellow-600 font-medium">Administrator</p>
                      )}
                    </div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="relative"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl flex items-center justify-center shadow-lg">
                        {isAdmin ? (
                          <Crown className="h-5 w-5 text-white" />
                        ) : (
                          <User className="h-5 w-5 text-white" />
                        )}
                      </div>
                      {isAdmin && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                          <Crown className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* Logout Button */}
                  <Tooltip content="Sign out">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      icon={<LogOut className="h-4 w-4" />}
                      className="hidden sm:flex"
                    >
                      Sign Out
                    </Button>
                  </Tooltip>
                </>
              ) : (
                <Button
                  onClick={() => navigate('/login')}
                  icon={<User className="h-4 w-4" />}
                >
                  Sign In
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              {user && (
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-neutral-200 bg-white p-4"
            >
              <SearchBar
                placeholder="Search lessons..."
                onSearch={handleSearch}
                results={[]}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && user && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-neutral-200 bg-white"
            >
              <div className="px-4 py-6 space-y-3">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                        isActive(item.path)
                          ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                          : 'text-neutral-600 hover:bg-primary-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                })}
                
                <div className="pt-3 border-t border-neutral-200">
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    icon={<LogOut className="h-4 w-4" />}
                    className="w-full justify-start"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  )
}

export default ModernNavbar