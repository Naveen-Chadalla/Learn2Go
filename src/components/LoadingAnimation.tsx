import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Car, MapPin, Target, Zap, Globe, BookOpen, Trophy, Star, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'

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
  const [animationPhase, setAnimationPhase] = useState(0)

  const messages = [
    'Starting your learning journey...',
    'Loading your profile...',
    'Setting up your dashboard...',
    'Preparing content...',
    'Almost ready...',
    'Ready to learn!'
  ]

  const facts = [
    'Traffic rules save over 1.3 million lives annually worldwide! 🌍',
    'The first traffic light was installed in London in 1868! 🚦',
    'Wearing seat belts reduces the risk of death by 45%! 🔒',
    'Road safety education can reduce accidents by up to 40%! 📚',
    'Interactive learning increases retention by 60%! 🧠',
    'Personalized learning paths are 2x more effective! ⚡',
    'AI-powered education adapts to your learning style! 🤖',
    'Gamified learning makes safety education fun! 🎮'
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (progress < 50) {
        setShowSlowWarning(true)
      }
    }, 8000)
    return () => clearTimeout(timer)
  }, [progress])

  useEffect(() => {
    if (progress >= 100) {
      setShowSuccess(true)
    }
  }, [progress])

  // Animation phases for more dynamic loading
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

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
    if (progress >= 100) return <CheckCircle className="h-8 w-8" />
    if (progress >= 80) return <Star className="h-8 w-8" />
    if (progress >= 60) return <Trophy className="h-8 w-8" />
    if (progress >= 40) return <Zap className="h-8 w-8" />
    if (progress >= 20) return <BookOpen className="h-8 w-8" />
    return <Globe className="h-8 w-8" />
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${theme.gradient} relative overflow-hidden`}>
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full opacity-20 ${
              i % 3 === 0 ? 'bg-blue-300' : i % 3 === 1 ? 'bg-green-300' : 'bg-purple-300'
            }`}
            style={{
              width: `${20 + (i % 4) * 10}px`,
              height: `${20 + (i % 4) * 10}px`,
            }}
            animate={{
              x: [0, 200, 0],
              y: [0, -150, 0],
              scale: [1, 1.5, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 8 + i,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut"
            }}
            style={{
              left: `${5 + i * 8}%`,
              top: `${10 + (i % 3) * 20}%`,
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl w-full mx-4 relative z-10">
        {/* Slow Loading Warning */}
        <AnimatePresence>
          {showSlowWarning && progress < 80 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="text-yellow-800 font-semibold">Loading is taking longer than expected</p>
                  <p className="text-yellow-700 text-sm mt-1">
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
              className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-green-800 font-semibold">Ready to learn!</p>
                  <p className="text-green-700 text-sm mt-1">
                    Your personalized dashboard is ready. Let's start your safety journey!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <motion.div 
            className="text-8xl mb-6 relative"
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
            {progress >= 100 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-4 -right-4"
              >
                <Sparkles className="h-12 w-12 text-yellow-500" />
              </motion.div>
            )}
          </motion.div>
          
          <motion.h1 
            className={`text-5xl font-bold bg-gradient-to-r ${theme.primary} bg-clip-text text-transparent mb-4`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Learn2Go
          </motion.h1>
          
          <motion.p 
            className="text-gray-600 text-xl font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            AI-Powered Traffic Safety Education
          </motion.p>
        </motion.div>

        {/* Enhanced Road Animation with Multiple Cars */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative mb-12"
        >
          <div className="relative h-32 bg-gradient-to-b from-gray-600 via-gray-700 to-gray-800 rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-400">
            {/* Enhanced road surface */}
            <div className="absolute inset-0 opacity-30">
              <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent"></div>
            </div>

            {/* Multiple animated road markings */}
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`absolute left-0 right-0 h-1 transform -translate-y-1/2`} style={{ top: `${30 + i * 20}%` }}>
                <motion.div
                  className="h-full"
                  style={{ 
                    background: 'repeating-linear-gradient(to right, transparent 0px, transparent 20px, #FCD34D 20px, #FCD34D 35px)'
                  }}
                  animate={{ x: [-35, 0] }}
                  transition={{ duration: 1.2 + i * 0.2, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ))}

            {/* Enhanced source point */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="absolute left-8 top-1/2 transform -translate-y-1/2"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-green-500 rounded-full p-4 shadow-2xl relative"
              >
                <MapPin className="h-6 w-6 text-white" />
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
              </motion.div>
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-sm font-bold text-green-700 whitespace-nowrap">
                START
              </div>
            </motion.div>

            {/* Enhanced destination point */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="absolute right-8 top-1/2 transform -translate-y-1/2"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="bg-red-500 rounded-full p-4 shadow-2xl relative"
              >
                <Target className="h-6 w-6 text-white" />
                <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></div>
              </motion.div>
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-sm font-bold text-red-700 whitespace-nowrap">
                FINISH
              </div>
            </motion.div>

            {/* Multiple moving cars */}
            <motion.div
              className="absolute top-1/2 transform -translate-y-1/2 z-20"
              initial={{ left: '2rem' }}
              animate={{ left: `calc(${Math.min(progress, 78)}% + 2rem)` }}
              transition={{ duration: 1, ease: "easeInOut" }}
            >
              <motion.div
                animate={{ 
                  y: [0, -4, 0],
                  scale: progress >= 100 ? [1, 1.4, 1] : [1, 1.1, 1],
                  rotate: progress >= 100 ? [0, 10, -10, 0] : [0, 3, -3, 0]
                }}
                transition={{ 
                  duration: 0.8, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className={`bg-gradient-to-r ${theme.primary} rounded-2xl p-4 shadow-2xl relative overflow-hidden border-3 border-white`}
              >
                <motion.div
                  animate={{ rotate: progress >= 100 ? 360 : 0 }}
                  transition={{ duration: progress >= 100 ? 1 : 2, repeat: progress >= 100 ? 1 : Infinity, ease: "linear" }}
                >
                  <Car className="h-8 w-8 text-white" />
                </motion.div>
                <div className="absolute inset-0 bg-white opacity-20 rounded-2xl"></div>
                
                {/* Enhanced exhaust effect */}
                <div className="absolute -left-3 top-1/2 transform -translate-y-1/2">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-gray-400 rounded-full opacity-60"
                      animate={{
                        x: [-8, -20],
                        y: [0, -3, 3, 0],
                        opacity: [0.6, 0],
                        scale: [1, 0.5]
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.15
                      }}
                    />
                  ))}
                </div>
              </motion.div>
              
              {/* Enhanced progress display */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute -top-16 left-1/2 transform -translate-x-1/2"
              >
                <div className="bg-white rounded-2xl px-4 py-2 shadow-xl border-2 border-gray-200">
                  <div className="flex items-center space-x-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {getProgressIcon()}
                    </motion.div>
                    <span className={`text-xl font-bold bg-gradient-to-r ${theme.primary} bg-clip-text text-transparent`}>
                      {progress}%
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Enhanced speed lines */}
            {progress > 20 && (
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-1 bg-white opacity-50 rounded-full"
                    style={{
                      top: `${25 + i * 8}%`,
                      width: `${15 + i * 2}px`
                    }}
                    animate={{
                      x: [400, -80],
                    }}
                    transition={{
                      duration: 0.3 + i * 0.05,
                      repeat: Infinity,
                      delay: i * 0.08,
                      ease: "linear"
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Enhanced Progress Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          <div className="flex justify-between items-center mb-6">
            <motion.span 
              className="text-xl text-gray-700 font-semibold"
              key={currentMessage}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {currentMessage}
            </motion.span>
            <motion.div
              className="flex items-center space-x-3"
              animate={{ scale: progress >= 100 ? [1, 1.1, 1] : [1, 1.02, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div className={`p-3 rounded-xl bg-gradient-to-r ${theme.primary} shadow-lg`}>
                <div className="text-white">
                  {getProgressIcon()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{progress}%</div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced loading dots */}
        <div className="flex justify-center space-x-4 mb-12">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className={`w-5 h-5 bg-gradient-to-r ${theme.primary} rounded-full shadow-lg`}
              animate={{
                scale: progress >= 100 ? [1, 1.8, 1] : [1, 1.4, 1],
                opacity: progress >= 100 ? [0.4, 1, 0.4] : [0.4, 1, 0.4],
                y: progress >= 100 ? [0, -15, 0] : [0, -8, 0]
              }}
              transition={{
                duration: progress >= 100 ? 0.8 : 1.4,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Enhanced fun facts */}
        <AnimatePresence mode="wait">
          {showFacts && (
            <motion.div
              key={currentFactIndex}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.9 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center"
            >
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -translate-y-12 translate-x-12 opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-green-100 to-blue-100 rounded-full translate-y-10 -translate-x-10 opacity-50"></div>
                
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-4xl mb-6"
                >
                  💡
                </motion.div>
                <p className="text-lg text-gray-700 font-bold mb-4">Did you know?</p>
                <motion.p 
                  className="text-lg text-gray-600 leading-relaxed font-medium"
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

        {/* Enhanced ultra-fast indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center mt-8"
        >
          <div className="inline-flex items-center space-x-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-full px-8 py-4 text-lg text-gray-600 shadow-xl border border-white/50">
            <motion.div
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              ⚡
            </motion.div>
            <span className="font-semibold">AI-Powered Learning • Optimized for {flag}</span>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
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