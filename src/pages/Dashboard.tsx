import React, { useState } from 'react'
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
  Sparkles
} from 'lucide-react'
import { getCountryByCode, getLanguageByCode } from '../types/countries'
import DynamicTagline from '../components/DynamicTagline'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { data, refreshData, loading } = useData()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshData()
    setRefreshing(false)
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
      bgColor: 'bg-blue-50'
    },
    {
      title: t('dashboard.completedLessons'),
      value: analytics.totalQuizzes,
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50'
    },
    {
      title: t('dashboard.badges'),
      value: badges.filter(b => b.earned).length,
      icon: <Award className="h-6 w-6" />,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Average Score',
      value: `${analytics.averageScore}%`,
      icon: <Zap className="h-6 w-6" />,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50'
    }
  ]

  const countryData = getCountryByCode(userProfile?.country || 'US')
  const languageData = getLanguageByCode(userProfile?.language || 'en')

  return (
    <div 
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${countryTheme.primaryColor}10 0%, ${countryTheme.secondaryColor}10 100%)`
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('dashboard.welcome')}, {user?.user_metadata?.username}! 👋
              </h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <p>Keep up the great work on your safety learning journey</p>
                <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-1 shadow-sm">
                  <MapPin className="h-4 w-4" style={{ color: countryTheme.primaryColor }} />
                  <span className="text-sm font-medium">
                    {countryData?.flag} {countryData?.name}
                  </span>
                  <Globe className="h-4 w-4" style={{ color: countryTheme.secondaryColor }} />
                  <span className="text-sm font-medium">
                    {languageData?.nativeName}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
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
          className="rounded-2xl p-4 mb-8 border-2"
          style={{
            background: `linear-gradient(135deg, ${countryTheme.primaryColor}15, ${countryTheme.secondaryColor}15)`,
            borderColor: `${countryTheme.primaryColor}30`
          }}
        >
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="h-5 w-5" style={{ color: countryTheme.primaryColor }} />
            <span className="font-medium" style={{ color: countryTheme.primaryColor }}>
              Personalized for {countryData?.name}
            </span>
          </div>
          <p className="text-gray-700">
            Content is customized for {countryData?.name}'s traffic rules and displayed in {languageData?.nativeName}.
            {lessons.length === 0 && (
              <span className="text-orange-600 font-medium"> Localized content is being prepared for your region.</span>
            )}
          </p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
            <span>🚦 Traffic Rules: {countryTheme.trafficRules.length} specific rules</span>
            <span>🛣️ Road Signs: {countryTheme.roadSigns.join(' ')}</span>
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
            <div key={index} className={`${stat.bgColor} rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300`}>
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="rounded-xl p-3"
                  style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                >
                  <div className="text-white">{stat.icon}</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.title}</div>
            </div>
          ))}
        </motion.div>

        {/* Progress Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('dashboard.progress')}</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <TrendingUp className="h-4 w-4" />
              <span>{userProfile?.progress || 0}% Complete</span>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Overall Progress</span>
              <span>{userProfile?.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="h-3 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${userProfile?.progress || 0}%`,
                  background: `linear-gradient(90deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})`
                }}
              ></div>
            </div>
          </div>

          {/* Badges */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Trophy className="h-5 w-5" style={{ color: countryTheme.primaryColor }} />
              <span>{t('dashboard.badges')}</span>
            </h3>
            <div className="flex flex-wrap gap-4">
              {badges.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl border-2 transition-all ${
                    badge.earned
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 text-yellow-800 shadow-md'
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  <span className="text-lg">{badge.icon}</span>
                  <div>
                    <div className="font-medium">{badge.name}</div>
                    <div className="text-xs opacity-75">{badge.description}</div>
                  </div>
                  {badge.earned && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
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
          className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('dashboard.availableLessons')}</h2>
            <div className="text-sm text-gray-600">
              {analytics.completionRate}% completed
            </div>
          </div>

          {lessonsWithProgress.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Content Coming Soon</h3>
              <p className="text-gray-600 mb-4">
                Localized content for {countryData?.name} in {languageData?.nativeName} is being prepared.
              </p>
              <p className="text-sm text-gray-500">
                In the meantime, you can explore our general traffic safety content.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessonsWithProgress.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 hover:shadow-lg transition-all duration-200 border border-gray-200 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="rounded-lg p-2"
                        style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                      >
                        <BookOpen className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        {t('lessons.level')} {lesson.level}
                      </span>
                    </div>
                    {lesson.completed && (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <Star className="h-4 w-4 text-yellow-500" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {lesson.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {lesson.description}
                  </p>
                  
                  <Link
                    to={`/lessons/${lesson.id}`}
                    className="flex items-center justify-center space-x-2 w-full text-white py-2 px-4 rounded-lg transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
                    style={{ 
                      background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` 
                    }}
                  >
                    <PlayCircle className="h-4 w-4" />
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