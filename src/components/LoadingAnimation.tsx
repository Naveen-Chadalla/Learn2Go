import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Car, MapPin, Target, Zap, Globe, BookOpen, Trophy, Star, AlertCircle, CheckCircle } from 'lucide-react'

interface LoadingAnimationProps {
  progress: number
  message?: string
  country?: string
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  progress, 
  message = 'Loading...', 
  country = 'US' 
}) => {
  const [currentMessage, setCurrentMessage] = useState(message)
  const [showFacts, setShowFacts] = useState(false)
  const [currentFactIndex, setCurrentFactIndex] = useState(0)
  const [showSlowWarning, setShowSlowWarning] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const messages = [
    'Starting your learning journey...',
    'Loading your profile...',
    'Setting up your dashboard...',
    'Preparing content...',
    'Almost ready...',
    'Ready to learn!'
  ]

  const facts = [
    'Traffic rules save over 1.3 million lives annually worldwide!',
    'The first traffic light was installed in London in 1868!',
    'Wearing seat belts reduces the risk of death by 45%!',
    'Road safety education can reduce accidents by up to 40%!',
    'Interactive learning increases retention by 60%!',
    'Personalized learning paths are 2x more effective!'
  ]

  useEffect(() => {
    const messageIndex = Math.min(Math.floor((progress / 100) * (messages.length - 1)), messages.length - 1)
    setCurrentMessage(messages[messageIndex] || message)
  }, [progress, message])

  useEffect(() => {
    const timer = setTimeout(() => setShowFacts(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (showFacts) {
      const interval = setInterval(() => {
        setCurrentFactIndex((prev) => (prev + 1) % facts.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [showFacts, facts.length])

  // Show warning if loading is taking too long
  useEffect(() => {
    const timer = setTimeout(() => {
      if (progress < 50) {
        setShowSlowWarning(true)
      }
    }, 8000) // Show warning after 8 seconds

    return () => clearTimeout(timer)
  }, [progress])

  // Show success when complete
  useEffect(() => {
    if (progress >= 100) {
      setShowSuccess(true)
    }
  }, [progress])

  const getCountryFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      'IN': '🇮🇳',
      'US': '🇺🇸',
      'GB': '🇬🇧',
      'CA': '🇨🇦',
      'AU': '🇦🇺',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'ES': '🇪🇸',
      'JP': '🇯🇵',
      'BR': '🇧🇷',
      'MX': '🇲🇽',
      'CN': '🇨🇳'
    }
    return flags[countryCode] || '🌍'
  }

  const getCountryTheme = (countryCode: string) => {
    const themes: Record<string, { primary: string; secondary: string; accent: string; gradient: string }> = {
      'IN': { 
        primary: 'from-orange-500 to-green-500', 
        secondary: 'from-orange-100 to-green-100', 
        accent: 'border-orange-300',
        gradient: 'bg-gradient-to-br from-orange-50 via-white to-green-50'
      },
      'US': { 
        primary: 'from-blue-600 to-red-600', 
        secondary: 'from-blue-100 to-red-100', 
        accent: 'border-blue-300',
        gradient: 'bg-gradient-to-br from-blue-50 via-white to-red-50'
      }
    }
    return themes[countryCode] || { 
      primary: 'from-blue-500 to-purple-600', 
      secondary: 'from-blue-50 to-purple-50', 
      accent: 'border-blue-300',
      gradient: 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }
  }

  const theme = getCountryTheme(country)
  const flag = getCountryFlag(country)

  const getProgressIcon = () => {
    if (progress >= 100) return <CheckCircle className="h-6 w-6" />
    if (progress >= 80) return <Star className="h-6 w-6" />
    if (progress >= 60) return <Trophy className="h-6 w-6" />
    if (progress >= 40) return <Zap className="h-6 w-6" />
    if (progress >= 20) return <BookOpen className="h-6 w-6" />
    return <Globe className="h-6 w-6" />
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${theme.gradient} relative overflow-hidden`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-blue-300 rounded-full opacity-20"
            animate={{
              x: [0, 150, 0],
              y: [0, -120, 0],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              delay: i * 0.7,
            }}
            style={{
              left: `${5 + i * 15}%`,
              top: `${15 + i * 12}%`,
            }}
          />
        ))}
      </div>

      <div className="max-w-2xl w-full mx-4 relative z-10">
        {/* Slow Loading Warning */}
        <AnimatePresence>
          {showSlowWarning && progress < 80 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4"
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-yellow-800 font-medium">Loading is taking longer than expected</p>
                  <p className="text-yellow-700 text-sm">
                    Don't worry! The app will load with essential content and enhance features in the background.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-green-800 font-medium">Ready to learn!</p>
                  <p className="text-green-700 text-sm">
                    Your personalized dashboard is ready. Let's start your safety journey!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header with enhanced animation */}
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <motion.div 
            className="text-8xl mb-4"
            animate={{ 
              rotate: progress >= 100 ? [0, 360] : [0, 5, -5, 0],
              scale: progress >= 100 ? [1, 1.2, 1] : [1, 1.1, 1]
            }}
            transition={{ 
              duration: progress >= 100 ? 1 : 2, 
              repeat: progress >= 100 ? 1 : Infinity,
              ease: "easeInOut"
            }}
          >
            {flag}
          </motion.div>
          <motion.h1 
            className={`text-4xl font-bold bg-gradient-to-r ${theme.primary} bg-clip-text text-transparent mb-2`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Learn2Go
          </motion.h1>
          <motion.p 
            className="text-gray-600 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Ultra-Fast Traffic Safety Education
          </motion.p>
        </motion.div>

        {/* Enhanced Road Animation with Car */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative mb-8"
        >
          {/* Road container with 3D effect */}
          <div className="relative h-24 bg-gradient-to-b from-gray-600 via-gray-700 to-gray-800 rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-400">
            {/* Road surface texture */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent"></div>
            </div>

            {/* Animated road markings */}
            <div className="absolute top-1/2 left-0 right-0 h-1 transform -translate-y-1/2">
              <motion.div
                className="h-full"
                style={{ 
                  background: 'repeating-linear-gradient(to right, transparent 0px, transparent 20px, #FCD34D 20px, #FCD34D 35px)'
                }}
                animate={{ x: [-35, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              />
            </div>

            {/* Source point with enhanced animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="absolute left-6 top-1/2 transform -translate-y-1/2"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-green-500 rounded-full p-3 shadow-xl relative"
              >
                <MapPin className="h-5 w-5 text-white" />
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
              </motion.div>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-green-700 whitespace-nowrap">
                START
              </div>
            </motion.div>

            {/* Destination point with enhanced animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="absolute right-6 top-1/2 transform -translate-y-1/2"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="bg-red-500 rounded-full p-3 shadow-xl relative"
              >
                <Target className="h-5 w-5 text-white" />
                <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></div>
              </motion.div>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-red-700 whitespace-nowrap">
                FINISH
              </div>
            </motion.div>

            {/* Enhanced moving car with realistic movement */}
            <motion.div
              className="absolute top-1/2 transform -translate-y-1/2 z-20"
              initial={{ left: '1.5rem' }}
              animate={{ left: `calc(${Math.min(progress, 82)}% + 1rem)` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <motion.div
                animate={{ 
                  y: [0, -3, 0],
                  scale: progress >= 100 ? [1, 1.3, 1] : [1, 1.08, 1],
                  rotate: progress >= 100 ? [0, 5, -5, 0] : [0, 2, -2, 0]
                }}
                transition={{ 
                  duration: 0.6, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className={`bg-gradient-to-r ${theme.primary} rounded-xl p-3 shadow-2xl relative overflow-hidden border-2 border-white`}
              >
                <motion.div
                  animate={{ rotate: progress >= 100 ? 360 : 0 }}
                  transition={{ duration: progress >= 100 ? 1 : 2, repeat: progress >= 100 ? 1 : Infinity, ease: "linear" }}
                >
                  <Car className="h-6 w-6 text-white" />
                </motion.div>
                <div className="absolute inset-0 bg-white opacity-30 rounded-xl"></div>
                
                {/* Car exhaust effect */}
                <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-gray-400 rounded-full opacity-60"
                      animate={{
                        x: [-5, -15],
                        y: [0, -2, 2, 0],
                        opacity: [0.6, 0]
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                    />
                  ))}
                </div>
              </motion.div>
              
              {/* Progress percentage above car */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute -top-12 left-1/2 transform -translate-x-1/2"
              >
                <div className="bg-white rounded-full px-3 py-1 shadow-lg border-2 border-gray-200">
                  <span className={`text-sm font-bold bg-gradient-to-r ${theme.primary} bg-clip-text text-transparent`}>
                    {progress}%
                  </span>
                </div>
              </motion.div>
            </motion.div>

            {/* Progress overlay with gradient */}
            <motion.div 
              className={`absolute top-0 left-0 h-full bg-gradient-to-r ${theme.primary} opacity-25 rounded-l-2xl`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />

            {/* Speed lines effect */}
            {progress > 10 && (
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-0.5 bg-white opacity-40"
                    style={{
                      top: `${30 + i * 10}%`,
                      width: '20px'
                    }}
                    animate={{
                      x: [300, -50],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "linear"
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Enhanced Progress Bar with Percentage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <div className={`w-full bg-gray-200 rounded-full h-4 border-2 ${theme.accent} shadow-inner relative overflow-hidden`}>
            <motion.div
              className={`h-full bg-gradient-to-r ${theme.primary} rounded-full shadow-lg relative overflow-hidden`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Animated shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40"
                animate={{ x: [-100, 200] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
            
            {/* Large progress percentage in center */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ scale: progress >= 100 ? [1, 1.2, 1] : [1, 1.05, 1] }}
              transition={{ duration: 0.5, repeat: progress >= 100 ? 3 : Infinity }}
            >
              <span className={`text-lg font-bold ${progress > 50 ? 'text-white' : 'text-gray-700'} drop-shadow-sm`}>
                {progress}%
              </span>
            </motion.div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <motion.span 
              className="text-base text-gray-700 font-medium"
              key={currentMessage}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {currentMessage}
            </motion.span>
            <motion.div
              className="flex items-center space-x-2"
              animate={{ scale: progress >= 100 ? [1, 1.1, 1] : [1, 1.02, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div className={`p-2 rounded-lg bg-gradient-to-r ${theme.primary}`}>
                <div className="text-white">
                  {getProgressIcon()}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced loading dots with car theme */}
        <div className="flex justify-center space-x-3 mb-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`w-4 h-4 bg-gradient-to-r ${theme.primary} rounded-full shadow-lg`}
              animate={{
                scale: progress >= 100 ? [1, 1.5, 1] : [1, 1.3, 1],
                opacity: progress >= 100 ? [0.4, 1, 0.4] : [0.4, 1, 0.4],
                y: progress >= 100 ? [0, -10, 0] : [0, -6, 0]
              }}
              transition={{
                duration: progress >= 100 ? 0.8 : 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Enhanced fun facts with better styling */}
        <AnimatePresence mode="wait">
          {showFacts && (
            <motion.div
              key={currentFactIndex}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.9 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-center"
            >
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/30 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -translate-y-10 translate-x-10 opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-green-100 to-blue-100 rounded-full translate-y-8 -translate-x-8 opacity-50"></div>
                
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-3xl mb-4"
                >
                  💡
                </motion.div>
                <p className="text-sm text-gray-700 font-semibold mb-3">Did you know?</p>
                <motion.p 
                  className="text-base text-gray-600 leading-relaxed font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {facts[currentFactIndex]}
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ultra-fast indicator with enhanced styling */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-6"
        >
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-full px-6 py-3 text-sm text-gray-600 shadow-lg border border-white/50">
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            >
              ⚡
            </motion.div>
            <span className="font-medium">Ultra-Fast Loading • Optimized for {flag}</span>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              🚗
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default LoadingAnimation