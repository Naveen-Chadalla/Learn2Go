import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  User, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle, 
  Crown, 
  Shield,
  Home,
  X
} from 'lucide-react'
import CountryLanguageSelector from '../../components/CountryLanguageSelector'

const Signup: React.FC = () => {
  const [step, setStep] = useState(1)
  const [username, setUsername] = useState('')
  const [country, setCountry] = useState('')
  const [language, setLanguage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<{
    available: boolean
    message: string
    checked: boolean
  }>({ available: false, message: '', checked: false })
  
  const { signUp, isAuthenticated, checkUsernameAvailability } = useAuth()
  const { t, setLanguage: setAppLanguage } = useLanguage()
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Live username availability checking (debounced)
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

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setValidationErrors({})

    // Validate username
    const usernameErrors = validateInput('username', username)

    if (Object.keys(usernameErrors).length > 0) {
      setValidationErrors(usernameErrors)
      return
    }

    if (!usernameStatus.available && usernameStatus.checked) {
      setError(usernameStatus.message)
      return
    }

    setStep(2)
  }

  const handleCountryLanguageChange = (selectedCountry: string, selectedLanguage: string) => {
    setCountry(selectedCountry)
    setLanguage(selectedLanguage)
  }

  const handleFinalSubmit = async () => {
    setLoading(true)
    setError('')

    if (!country || !language) {
      setError('Please select both country and language')
      setLoading(false)
      return
    }

    try {
      console.log('[SIGNUP] Starting secure registration...')
      
      // Clear any existing session data
      sessionStorage.clear()
      localStorage.removeItem('learn2go-session')
      
      const { data, error } = await signUp(username, country, language)
      
      if (error) {
        console.error('[SIGNUP] Registration failed:', error)
        setError(error.message)
      } else {
        console.log('[SIGNUP] Registration successful')
        
        // Set the app language to user's selection
        setAppLanguage(language)
        
        // Check if we should redirect to login
        if (data?.shouldRedirectToLogin) {
          // Show success message and redirect to login
          navigate('/login', { 
            replace: true,
            state: { 
              message: 'Account created successfully! Please sign in with your username.',
              username: username
            }
          })
        } else {
          // Generate new session token for immediate login
          const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`
          sessionStorage.setItem('learn2go-session', sessionToken)
          
          // Check if this is admin user 'Hari'
          if (username.toLowerCase() === 'hari') {
            navigate('/admin', { replace: true })
          } else {
            navigate('/dashboard', { replace: true })
          }
        }
      }
    } catch (error) {
      console.error('[SIGNUP] Unexpected error:', error)
      setError('An unexpected error occurred during registration')
    } finally {
      setLoading(false)
    }
  }

  const isAdminUser = username.toLowerCase() === 'hari'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-green-300/20 rounded-full"
            animate={{
              x: [0, 120, 0],
              y: [0, -120, 0],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 12 + i * 2,
              repeat: Infinity,
              delay: i * 1.5,
            }}
            style={{
              left: `${5 + i * 12}%`,
              top: `${15 + i * 10}%`,
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
                className="hidden w-16 h-16 bg-gradient-to-br from-blue-500 via-green-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl"
                whileHover={{ scale: 1.1, rotate: 5 }}
                animate={{ 
                  boxShadow: [
                    "0 20px 40px rgba(34, 197, 94, 0.3)",
                    "0 20px 40px rgba(59, 130, 246, 0.3)",
                    "0 20px 40px rgba(139, 92, 246, 0.3)",
                    "0 20px 40px rgba(34, 197, 94, 0.3)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Shield className="h-8 w-8 text-white" />
              </motion.div>
              <motion.div
                className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
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
            Join Learn2Go
          </motion.h2>
          
          <motion.p 
            className="text-gray-600 text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {step === 1 ? 'Choose your unique username' : 'Complete your profile setup'}
          </motion.p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all duration-300 ${
            step >= 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
          }`}>
            {step > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
          </div>
          <div className={`w-20 h-1 rounded transition-all duration-300 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all duration-300 ${
            step >= 2 ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
          }`}>
            {step > 2 ? <CheckCircle className="h-5 w-5" /> : '2'}
          </div>
        </div>

        {/* Form */}
        <motion.div 
          className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 flex items-center space-x-2"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {step === 1 ? (
            /* Step 1: Username Creation */
            <form onSubmit={handleUsernameSubmit} className="space-y-6">
              {/* Admin User Detection */}
              {isAdminUser && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4"
                >
                  <div className="flex items-center space-x-2">
                    <Crown className="h-5 w-5 text-purple-600" />
                    <span className="font-bold text-purple-800">Admin Account Setup</span>
                  </div>
                  <p className="text-purple-700 text-sm mt-1">
                    Setting up admin account with full dashboard access and user management capabilities.
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
                    className={`appearance-none relative block w-full pl-10 pr-12 py-3 border ${
                      validationErrors.username ? 'border-red-300' : 
                      usernameStatus.checked && usernameStatus.available ? 'border-green-300' :
                      usernameStatus.checked && !usernameStatus.available ? 'border-red-300' :
                      'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:z-10 transition-all duration-200 bg-white/80 backdrop-blur-sm`}
                    placeholder="Choose a unique username"
                    maxLength={20}
                    autoComplete="username"
                  />
                  
                  {/* Live Status Indicator */}
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {isCheckingUsername && (
                      <motion.div 
                        className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                    {!isCheckingUsername && usernameStatus.checked && username.length >= 3 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        {usernameStatus.available ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : (
                          <X className="h-6 w-6 text-red-500" />
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
                
                {/* Character Counter */}
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-gray-500">
                    {username.length}/20 characters
                  </div>
                  {username.length > 0 && (
                    <div className={`text-xs ${username.length <= 20 ? 'text-green-600' : 'text-red-600'}`}>
                      {username.length <= 20 ? '✓ Valid length' : '✗ Too long'}
                    </div>
                  )}
                </div>
                
                {/* Live Status Message */}
                {usernameStatus.checked && username.length >= 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-3 p-3 rounded-lg border ${
                      usernameStatus.available 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {usernameStatus.available ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">{usernameStatus.message}</span>
                    </div>
                  </motion.div>
                )}
                
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

              {/* Username Requirements */}
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">Username Requirements:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className={`flex items-center space-x-1 ${username.length >= 3 ? 'text-green-600' : ''}`}>
                    <span>{username.length >= 3 ? '✓' : '•'}</span>
                    <span>At least 3 characters long</span>
                  </li>
                  <li className={`flex items-center space-x-1 ${username.length <= 20 ? 'text-green-600' : username.length > 0 ? 'text-red-600' : ''}`}>
                    <span>{username.length <= 20 ? '✓' : username.length > 0 ? '✗' : '•'}</span>
                    <span>Maximum 20 characters</span>
                  </li>
                  <li className={`flex items-center space-x-1 ${/^[a-zA-Z0-9_]*$/.test(username) ? 'text-green-600' : username.length > 0 ? 'text-red-600' : ''}`}>
                    <span>{/^[a-zA-Z0-9_]*$/.test(username) && username.length > 0 ? '✓' : username.length > 0 ? '✗' : '•'}</span>
                    <span>Only letters, numbers, and underscores</span>
                  </li>
                  <li className={`flex items-center space-x-1 ${usernameStatus.available && usernameStatus.checked ? 'text-green-600' : ''}`}>
                    <span>{usernameStatus.available && usernameStatus.checked ? '✓' : '•'}</span>
                    <span>Must be unique</span>
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={!usernameStatus.available || !usernameStatus.checked || username.length < 3}
                className="group relative w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-blue-500 to-green-600 hover:from-blue-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-xl hover:shadow-2xl"
              >
                {isAdminUser && <Crown className="h-4 w-4" />}
                <span>Continue to Location Setup</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            /* Step 2: Location and Language Setup */
            <div className="space-y-6">
              {isAdminUser && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4"
                >
                  <div className="flex items-center space-x-2">
                    <Crown className="h-5 w-5 text-purple-600" />
                    <span className="font-bold text-purple-800">Admin Setup - Final Step</span>
                  </div>
                  <p className="text-purple-700 text-sm mt-1">
                    Complete your admin account setup with location preferences for content customization.
                  </p>
                </motion.div>
              )}

              <CountryLanguageSelector
                onSelectionChange={handleCountryLanguageChange}
                disabled={loading}
              />

              <div className="flex space-x-4">
                <motion.button
                  onClick={() => setStep(1)}
                  disabled={loading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 flex justify-center items-center space-x-2 py-3 px-4 border border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </motion.button>

                <motion.button
                  onClick={handleFinalSubmit}
                  disabled={loading || !country || !language}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 flex justify-center items-center space-x-2 py-3 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-blue-500 to-green-600 hover:from-blue-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-xl hover:shadow-2xl"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <motion.div 
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    <>
                      {isAdminUser && <Crown className="h-4 w-4" />}
                      <Shield className="h-4 w-4" />
                      <span>{isAdminUser ? 'Create Admin Account' : 'Create Account'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 text-sm text-gray-600 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="font-bold text-blue-900">Secure Registration</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Username validation</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Session isolation</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Input validation</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Auto-logout protection</span>
              </div>
            </div>
            <p className="mt-3 text-gray-700">
              Your account will be secured with session isolation, automatic logout protection, and real-time activity monitoring.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Signup