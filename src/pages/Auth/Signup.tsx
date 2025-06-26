import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { motion } from 'framer-motion'
import { BookOpen, User, ArrowRight, ArrowLeft, AlertCircle, CheckCircle, Crown, Shield } from 'lucide-react'
import CountryLanguageSelector from '../../components/CountryLanguageSelector'

const Signup: React.FC = () => {
  const [step, setStep] = useState(1)
  const [username, setUsername] = useState('')
  const [country, setCountry] = useState('')
  const [language, setLanguage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Enhanced username validation with real-time checking
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

  // Enhanced username validation
  const validateUsername = (value: string) => {
    if (!value || value.length < 3) {
      return 'Username must be at least 3 characters long'
    }
    if (value.length > 20) {
      return 'Username must be less than 20 characters'
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return 'Username can only contain letters, numbers, and underscores'
    }
    return null
  }

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validateUsername(username.trim())
    if (validationError) {
      setError(validationError)
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
      const { error } = await signUp(username.trim(), country, language)
      if (error) {
        setError(error.message)
      } else {
        // Set the app language to user's selection
        setAppLanguage(language)
        
        // Check if this is admin user 'Hari'
        if (username.toLowerCase() === 'hari') {
          navigate('/admin', { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img 
                src="/src/assets/ChatGPT Image Jun 21, 2025, 03_33_49 PM copy.png" 
                alt="Learn2Go Logo" 
                className="h-16 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
              <div className="hidden bg-gradient-to-r from-blue-500 to-green-600 p-4 rounded-2xl">
                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
                  <div className="w-4 h-4 bg-gradient-to-b from-red-500 via-yellow-500 to-green-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('auth.signup')}
          </h2>
          <p className="text-gray-600">
            {step === 1 ? 'Choose your unique username' : 'Select your location and language preferences'}
          </p>
        </div>

        {/* Enhanced Progress Indicator */}
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
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center space-x-2"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {step === 1 ? (
            /* Step 1: Enhanced Username Input */
            <form onSubmit={handleUsernameSubmit} className="space-y-6">
              {/* Admin User Detection */}
              {isAdminUser && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4"
                >
                  <div className="flex items-center space-x-2">
                    <Crown className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-800">Admin Account Setup</span>
                  </div>
                  <p className="text-purple-700 text-sm mt-1">
                    Setting up admin account with full dashboard access and user management capabilities.
                  </p>
                </motion.div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.username')} <span className="text-red-500">*</span>
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
                    maxLength={20}
                  />
                  
                  {/* Enhanced Status Indicator */}
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
                
                {/* Enhanced Status Message */}
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
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">{usernameStatus.message}</span>
                    </div>
                  </motion.div>
                )}
                
                {/* Username Requirements */}
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-2">Username Requirements:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li className={`flex items-center space-x-1 ${username.length >= 3 ? 'text-green-600' : ''}`}>
                      <span>{username.length >= 3 ? '✓' : '•'}</span>
                      <span>At least 3 characters long</span>
                    </li>
                    <li className={`flex items-center space-x-1 ${username.length <= 20 ? 'text-green-600' : 'text-red-600'}`}>
                      <span>{username.length <= 20 ? '✓' : '✗'}</span>
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
              </div>

              <button
                type="submit"
                disabled={!usernameStatus.available || !usernameStatus.checked || username.length < 3}
                className="group relative w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-green-600 hover:from-blue-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isAdminUser && <Crown className="h-4 w-4" />}
                <span>Continue to Location Setup</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {t('auth.hasAccount')}{' '}
                  <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                    {t('auth.login')}
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            /* Step 2: Enhanced Country and Language Selection */
            <div className="space-y-6">
              {isAdminUser && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4"
                >
                  <div className="flex items-center space-x-2">
                    <Crown className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-800">Admin Setup - Final Step</span>
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
                <button
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 flex justify-center items-center space-x-2 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>

                <button
                  onClick={handleFinalSubmit}
                  disabled={loading || !country || !language}
                  className="flex-1 flex justify-center items-center space-x-2 py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-green-600 hover:from-blue-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{t('auth.joiningUp')}</span>
                    </div>
                  ) : (
                    <>
                      {isAdminUser && <Crown className="h-4 w-4" />}
                      <span>{isAdminUser ? 'Create Admin Account' : 'Join Learn2Go'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {t('auth.hasAccount')}{' '}
                  <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                    {t('auth.login')}
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Security Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 text-sm text-gray-600 border border-gray-200">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Secure Registration</span>
            </div>
            <p>Your account will be secured with session isolation, automatic logout protection, and real-time activity monitoring.</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Signup