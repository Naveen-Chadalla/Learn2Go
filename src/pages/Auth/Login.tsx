import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { motion } from 'framer-motion'
import { BookOpen, User, AlertCircle, CheckCircle, Crown } from 'lucide-react'

const Login: React.FC = () => {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<{
    available: boolean
    message: string
    checked: boolean
  }>({ available: false, message: '', checked: false })
  
  const { signIn, isAuthenticated, checkUsernameAvailability } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get the intended destination or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard'

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Real-time username availability checking
  useEffect(() => {
    const checkUsername = async () => {
      if (username.length >= 3) {
        setIsCheckingUsername(true)
        try {
          const result = await checkUsernameAvailability(username)
          setUsernameStatus({
            available: result.available,
            message: result.message,
            checked: true
          })
        } catch (error) {
          setUsernameStatus({
            available: false,
            message: 'Error checking username',
            checked: true
          })
        } finally {
          setIsCheckingUsername(false)
        }
      } else {
        setUsernameStatus({ available: false, message: '', checked: false })
      }
    }

    const debounceTimer = setTimeout(checkUsername, 500)
    return () => clearTimeout(debounceTimer)
  }, [username, checkUsernameAvailability])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!username.trim()) {
      setError('Username is required')
      setLoading(false)
      return
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long')
      setLoading(false)
      return
    }

    try {
      const { error } = await signIn(username.trim())
      if (error) {
        setError(error.message)
      } else {
        // Check if this is admin user 'Hari'
        if (username.toLowerCase() === 'hari') {
          navigate('/admin', { replace: true })
        } else {
          navigate(from, { replace: true })
        }
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const isAdminUser = username.toLowerCase() === 'hari'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('auth.login')}
          </h2>
          <p className="text-gray-600">
            Welcome back to Learn2Go
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl"
              >
                {error}
              </motion.div>
            )}

            {/* Admin User Detection */}
            {isAdminUser && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4"
              >
                <div className="flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-800">Admin Access Detected</span>
                </div>
                <p className="text-purple-700 text-sm mt-1">
                  You will be redirected to the Admin Dashboard after login.
                </p>
              </motion.div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.username')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none relative block w-full pl-10 pr-12 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:z-10 transition-all duration-200"
                  placeholder={t('auth.enterUsername')}
                  disabled={loading}
                />
                
                {/* Username Status Indicator */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {isCheckingUsername && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                  {!isCheckingUsername && usernameStatus.checked && username.length >= 3 && (
                    <>
                      {usernameStatus.available ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Username Status Message */}
              {usernameStatus.checked && username.length >= 3 && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-2 text-sm ${
                    usernameStatus.available ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {usernameStatus.message}
                </motion.p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || username.length < 3}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{t('auth.signingIn')}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    {isAdminUser && <Crown className="h-4 w-4" />}
                    <span>{isAdminUser ? 'Admin Login' : t('auth.login')}</span>
                  </div>
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {t('auth.noAccount')}{' '}
                <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  {t('auth.signup')}
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
            <p className="font-medium mb-1">🔒 Secure Session Management</p>
            <p>Your session is isolated and secure. You'll be logged out automatically when you close this tab.</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Login