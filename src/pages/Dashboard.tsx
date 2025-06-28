import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useData } from '../contexts/DataContext'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  TrendingUp, 
  Award, 
  Clock, 
  PlayCircle, 
  CheckCircle,
  Star,
  Target,
  Zap,
  Globe,
  MapPin,
  Trophy,
  RefreshCw,
  Sparkles,
  Users,
  Calendar,
  Flame,
  AlertCircle
} from 'lucide-react'
import { getCountryByCode, getLanguageByCode } from '../types/countries'
import DynamicTagline from '../components/DynamicTagline'

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const { t } = useLanguage()
  const { data, refreshData, loading, error } = useData()
  const [refreshing, setRefreshing] = useState(false)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  // Ensure user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setDashboardError('Please log in to access your dashboard')
      return
    }

    if (!user) {
      setDashboardError('User information not available')
      return
    }

    // Clear any previous errors
    setDashboardError(null)
  }, [isAuthenticated, user])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshData()
    } catch (error) {
      console.error('Error refreshing data:', error)
      setDashboardError('Failed to refresh data. Please try again.')
    } finally {
      setRefreshing(false)
    }
  }

  // Show error state if there's an authentication or data issue
  if (dashboardError || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Error</h2>
            <p className="text-gray-600 mb-6">{dashboardError || error}</p>
            <div className="space-y-3">
              <button
                onClick={handleRefresh}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Try Again
              </button>
              <Link
                to="/login"
                className="block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state
  if (loading && !data.userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const { userProfile, lessons, userProgress, badges, analytics, countryTheme } = data

  const completedLessonIds = new Set(
    userProgress.filter(p => p.completed).map(p => p.lesson_id)
  )

  const lessonsWithProgress = lessons.slice(0, 6).map(lesson => ({
    ...lesson,
    completed: completedLessonIds.has(lesson.id)
  }))

  const stats = [
    {
      title: t('dashboard.currentLevel'),
      value: userProfile?.current_level || 1,
      icon: <Target className="h-6 w-6" />,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
      iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500'
    },
    {
      title: t('dashboard.completedLessons'),
      value: analytics.lessonsCompleted,
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
      iconBg: 'bg-gradient-to-br from-green-500 to-emerald-500'
    },
    {
      title: t('dashboard.badges'),
      value: badges.filter(b => b.earned).length,
      icon: <Award className="h-6 w-6" />,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-gradient-to-br from-yellow-50 to-orange-50',
      iconBg: 'bg-gradient-to-br from-yellow-500 to-orange-500'
    },
    {
      title: 'Average Score',
      value: `${analytics.averageScore}%`,
      icon: <Zap className="h-6 w-6" />,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
      iconBg: 'bg-gradient-to-br from-purple-500 to-pink-500'
    }
  ]

  const countryData = getCountryByCode(userProfile?.country || 'US')
  const languageData = getLanguageByCode(userProfile?.language || 'en')

  return (
    <div 
      className="min-h-screen pt-16"
      style={{
        background: `linear-gradient(135deg, ${countryTheme.primaryColor}08 0%, ${countryTheme.secondaryColor}08 100%)`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <motion.h1 
                className="text-4xl font-bold text-gray-900 mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {t('dashboard.welcome')}, {userProfile?.username || user?.user_metadata?.username || 'User'}! 
                <motion.span
                  animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                  className="inline-block ml-2"
                >
                  👋
                </motion.span>
              </motion.h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <p className="text-lg">Keep up the great work on your safety learning journey</p>
                <motion.div 
                  className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-soft border border-gray-200/50"
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <MapPin className="h-4 w-4" style={{ color: countryTheme.primaryColor }} />
                  <span className="text-sm font-semibold">
                    {countryData?.flag} {countryData?.name}
                  </span>
                  <Globe className="h-4 w-4" style={{ color: countryTheme.secondaryColor }} />
                  <span className="text-sm font-semibold">
                    {languageData?.nativeName}
                  </span>
                </motion.div>
              </div>
            </div>
            <motion.button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 disabled:opacity-50 border border-gray-200/50"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-medium">Refresh</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Dynamic Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <DynamicTagline 
            showRefreshButton={true}
            autoRefresh={true}
            size="medium"
          />
        </motion.div>

        {/* Country Theme Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-3xl p-6 mb-8 border-2 shadow-soft backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, ${countryTheme.primaryColor}15, ${countryTheme.secondaryColor}15)`,
            borderColor: `${countryTheme.primaryColor}30`
          }}
        >
          <div className="flex items-center space-x-3 mb-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="h-6 w-6" style={{ color: countryTheme.primaryColor }} />
            </motion.div>
            <span className="font-bold text-lg" style={{ color: countryTheme.primaryColor }}>
              Personalized for {countryData?.name}
            </span>
          </div>
          <p className="text-gray-700 leading-relaxed">
            Content is customized for {countryData?.name}'s traffic rules and displayed in {languageData?.nativeName}.
            {lessons.length === 0 && (
              <span className="text-orange-600 font-semibold"> Localized content is being prepared for your region.</span>
            )}
          </p>
          <div className="flex items-center space-x-6 mt-4 text-sm text-gray-600">
            <span className="flex items-center space-x-1">
              <span>🚦</span>
              <span>Traffic Rules: {countryTheme.trafficRules.length} specific rules</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>🛣️</span>
              <span>Road Signs: {countryTheme.roadSigns.join(' ')}</span>
            </span>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div 
              key={index} 
              className={`${stat.bgColor} rounded-3xl p-6 border border-gray-100/50 shadow-soft hover:shadow-medium transition-all duration-300 backdrop-blur-sm`}
              whileHover={{ scale: 1.02, y: -4 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <div className="flex items-center justify-between mb-4">
                <motion.div 
                  className={`${stat.iconBg} rounded-2xl p-3 shadow-lg`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="text-white">{stat.icon}</div>
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                  className="text-2xl"
                >
                  ✨
                </motion.div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 font-medium">{stat.title}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Progress Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-large p-8 mb-8 border border-gray-100/50"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">{t('dashboard.progress')}</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="font-semibold">{userProfile?.progress || 0}% Complete</span>
            </div>
          </div>
          
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-3">
              <span className="font-medium">Overall Progress</span>
              <span className="font-bold">{userProfile?.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
              <motion.div 
                className="h-4 rounded-full shadow-lg"
                style={{ 
                  background: `linear-gradient(90deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})`
                }}
                initial={{ width: 0 }}
                animate={{ width: `${userProfile?.progress || 0}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Badges */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <Trophy className="h-6 w-6" style={{ color: countryTheme.primaryColor }} />
              <span>{t('dashboard.badges')}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className={`flex items-center space-x-3 p-4 rounded-2xl border-2 transition-all duration-300 ${
                    badge.earned
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 text-yellow-800 shadow-medium'
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  <motion.span 
                    className="text-2xl"
                    animate={badge.earned ? { rotate: [0, 10, -10, 0] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {badge.icon}
                  </motion.span>
                  <div className="flex-1">
                    <div className="font-bold">{badge.name}</div>
                    <div className="text-sm opacity-75">{badge.description}</div>
                  </div>
                  {badge.earned && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Available Lessons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-large p-8 border border-gray-100/50"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">{t('dashboard.availableLessons')}</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <TrendingUp className="h-5 w-5" />
              <span className="font-semibold">{analytics.completionRate}% completed</span>
            </div>
          </div>

          {lessonsWithProgress.length === 0 ? (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <BookOpen className="h-20 w-20 text-gray-300 mx-auto mb-6" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Content Coming Soon</h3>
              <p className="text-gray-600 mb-6 text-lg">
                Localized content for {countryData?.name} in {languageData?.nativeName} is being prepared.
              </p>
              <p className="text-sm text-gray-500">
                In the meantime, you can explore our general traffic safety content.
              </p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessonsWithProgress.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-3xl p-6 hover:shadow-large transition-all duration-300 border border-gray-200/50 group backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <motion.div 
                        className="rounded-2xl p-3 shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <BookOpen className="h-5 w-5 text-white" />
                      </motion.div>
                      <span className="text-sm font-bold text-gray-600 bg-white/80 px-3 py-1 rounded-full">
                        {t('lessons.level')} {lesson.level}
                      </span>
                    </div>
                    {lesson.completed && (
                      <motion.div 
                        className="flex items-center space-x-1"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <CheckCircle className="h-6 w-6 text-green-500" />
                        <Star className="h-5 w-5 text-yellow-500" />
                      </motion.div>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors text-lg">
                    {lesson.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                    {lesson.description}
                  </p>
                  
                  <Link
                    to={`/lessons/${lesson.id}`}
                    className="flex items-center justify-center space-x-2 w-full text-white py-3 px-4 rounded-2xl transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                    style={{ 
                      background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` 
                    }}
                  >
                    <PlayCircle className="h-5 w-5" />
                    <span>{lesson.completed ? t('lessons.continue') : t('lessons.start')}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard