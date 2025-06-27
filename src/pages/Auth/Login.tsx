import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  User, 
  AlertCircle, 
  Crown, 
  Sparkles, 
  Shield, 
  Lock,
  Home,
  ArrowLeft
} from 'lucide-react'

const Login: React.FC = () => {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  
  const { signIn, isAuthenticated } = useAuth()
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

  // Input validation
  const validateInput = (name: string, value: string) => {
    const errors: {[key: string]: string} = {}
    
    if (name === 'username') {
      if (!value.trim()) {
        errors.username = 'Username is required'
      } else if (value.trim().length < 3) {
        errors.username = 'Username must be at least 3 characters'
      } else if (value.trim().length > 20) {
        errors.username = 'Username must be less than 20 characters'
      } else if (!/^[a-zA-Z0-9_]+$/.test(value.trim())) {
        errors.username = 'Username can only contain letters, numbers, and underscores'
      }
    }
    
    return errors
  }

  // Sanitize input
  const sanitizeInput = (value: string) => {
    return value.trim().replace(/[<>\"'&]/g, '')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const sanitizedValue = sanitizeInput(value)
    
    if (name === 'username') {
      setUsername(sanitizedValue)
    }
    
    // Clear validation errors for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
    
    // Clear general error
    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setValidationErrors({})

    // Validate username
    const usernameErrors = validateInput('username', username)

    if (Object.keys(usernameErrors).length > 0) {
      setValidationErrors(usernameErrors)
      setLoading(false)
      return
    }

    try {
      console.log('[LOGIN] Attempting secure login...')
      
      // Clear any existing session data
      sessionStorage.clear()
      localStorage.removeItem('learn2go-session')
      
      const { error } = await signIn(username)
      
      if (error) {
        console.error('[LOGIN] Authentication failed:', error)
        
        // Enhanced error handling with updated error codes
        if (error.code === 'invalid_credentials') {
          setError('Invalid username or the account may not exist. Please check your username or sign up for a new account.')
        } else if (error.code === 'rate_limit') {
          setError('Too many login attempts. Please wait a few minutes before trying again.')
        } else if (error.code === 'network_error') {
          setError('Network error. Please check your connection and try again.')
        } else if (error.code === 'email_not_confirmed') {
          setError('Please verify your email address before signing in.')
        } else {
          setError(error.message || 'Login failed. Please try again.')
        }
      } else {
        console.log('[LOGIN] Authentication successful')
        
        // Generate new session token
        const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`
        sessionStorage.setItem('learn2go-session', sessionToken)
        
        // Check if this is admin user 'Hari'
        if (username.toLowerCase() === 'hari') {
          navigate('/admin', { replace: true })
        } else {
          navigate(from, { replace: true })
        }
      }
    } catch (error) {
      console.error('[LOGIN] Unexpected error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isAdminUser = username.toLowerCase() === 'hari'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-blue-300/20 rounded-full"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              delay: i * 1.5,
            }}
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + i * 8}%`,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full space-y-8 relative"
      >
        {/* Home Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-start"
        >
          <Link
            to="/"
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-soft border border-gray-200/50"
          >
            <Home className="h-5 w-5" />
            <span className="font-medium">Home</span>
          </Link>
        </motion.div>

        {/* Header */}
        <div className="text-center">
          <motion.div 
            className="flex justify-center mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <div className="relative">
              <img 
                src="/src/assets/ChatGPT Image Jun 21, 2025, 03_33_49 PM copy.png" 
                alt="Learn2Go Logo" 
                className="h-16 w-auto shadow-2xl rounded-2xl"
                onError={(e) => {
                  // Fallback to gradient logo if image fails to load
                  e.currentTarget.style.display = 'none'
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement
                  if (fallback) fallback.classList.remove('hidden')
                }}
              />
              <motion.div
                className="hidden w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl"
                whileHover={{ scale: 1.1, rotate: 5 }}
                animate={{ 
                  boxShadow: [
                    "0 20px 40px rgba(59, 130, 246, 0.3)",
                    "0 20px 40px rgba(139, 92, 246, 0.3)",
                    "0 20px 40px rgba(236, 72, 153, 0.3)",
                    "0 20px 40px rgba(59, 130, 246, 0.3)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Lock className="h-8 w-8 text-white" />
              </motion.div>
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
          <motion.h2 
            className="text-4xl font-bold text-gray-900 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Welcome Back
          </motion.h2>
          <motion.p 
            className="text-gray-600 text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Enter your username to continue learning
          </motion.p>
        </div>

        {/* Form */}
        <motion.div 
          className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center space-x-2"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {/* Admin User Detection */}
            {isAdminUser && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4"
              >
                <div className="flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-purple-600" />
                  <span className="font-bold text-purple-800">Admin Access Detected</span>
                </div>
                <p className="text-purple-700 text-sm mt-1">
                  You will be redirected to the Admin Dashboard after login.
                </p>
              </motion.div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-gray-700 mb-2">
                Username <span className="text-red-500">*</span>
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
                  onChange={handleInputChange}
                  className={`appearance-none relative block w-full pl-10 pr-4 py-3 border ${
                    validationErrors.username ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:z-10 transition-all duration-200 bg-white/80 backdrop-blur-sm`}
                  placeholder="Enter your username"
                  disabled={loading}
                  maxLength={20}
                  autoComplete="username"
                />
              </div>
              {validationErrors.username && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600"
                >
                  {validationErrors.username}
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <motion.button
                type="submit"
                disabled={loading || !username.trim()}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-xl hover:shadow-2xl"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <motion.div 
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    {isAdminUser && <Crown className="h-4 w-4" />}
                    <Shield className="h-4 w-4" />
                    <span>{isAdminUser ? 'Admin Login' : 'Sign In'}</span>
                  </div>
                )}
              </motion.button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/signup" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
                  Sign up for Learn2Go
                </Link>
              </p>
            </div>
          </form>
        </motion.div>

        {/* Security Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 text-sm text-gray-600 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="font-bold text-blue-900">Secure Access</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs mb-4">
              <div className="flex items-center justify-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-left">Username-based authentication</span>
              </div>
              <div className="flex items-center justify-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-left">Session isolation</span>
              </div>
              <div className="flex items-center justify-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-left">Input sanitization</span>
              </div>
              <div className="flex items-center justify-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-left">Auto-logout protection</span>
              </div>
            </div>
            
            <p className="text-gray-700 leading-relaxed">
              Your session will automatically expire when you close the browser or after inactivity.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Login