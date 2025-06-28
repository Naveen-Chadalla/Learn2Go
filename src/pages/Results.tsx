import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useData } from '../contexts/DataContext'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Award, 
  Target, 
  Clock, 
  BookOpen,
  Star,
  Trophy,
  Calendar,
  BarChart3,
  Certificate
} from 'lucide-react'

const Results: React.FC = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { data } = useData()

  const { userProgress, analytics, countryTheme, lessons } = data

  const recentResults = userProgress
    .filter(p => p.completed)
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
    .slice(0, 10)
    .map(result => {
      const lesson = lessons.find(l => l.id === result.lesson_id)
      return {
        ...result,
        lesson_title: lesson?.title || 'Unknown Lesson'
      }
    })

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <Trophy className="h-5 w-5" />
    if (score >= 80) return <Star className="h-5 w-5" />
    if (score >= 70) return <Award className="h-5 w-5" />
    return <Target className="h-5 w-5" />
  }

  const stats = [
    {
      title: 'Quizzes Completed',
      value: analytics.totalQuizzes,
      icon: <BarChart3 className="h-6 w-6" />,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Average Score',
      value: `${analytics.averageScore}%`,
      icon: <Target className="h-6 w-6" />,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Best Score',
      value: `${analytics.bestScore}%`,
      icon: <Trophy className="h-6 w-6" />,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Study Time',
      value: analytics.studyTime,
      icon: <Clock className="h-6 w-6" />,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50'
    }
  ]

  // Check if user is eligible for certificate
  const isEligibleForCertificate = () => {
    if (data.lessons.length === 0) return false
    
    const completedLessons = data.userProgress.filter(p => p.completed).length
    const totalLessons = data.lessons.length
    
    // Eligible if completed at least 80% of lessons
    return completedLessons >= Math.floor(totalLessons * 0.8)
  }

  return (
    <div 
      className="min-h-screen pt-16"
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('nav.results')} 📊
          </h1>
          <p className="text-gray-600">
            Track your learning progress and quiz performance
          </p>
        </motion.div>

        {/* Certificate Eligibility Banner */}
        {isEligibleForCertificate() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-3xl p-6 border-2 border-yellow-200 shadow-xl"
          >
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="text-4xl"
                >
                  <Certificate className="h-12 w-12 text-yellow-500" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Congratulations! 🎉</h3>
                  <p className="text-gray-600">
                    You've earned your Certificate of Completion for the Traffic Safety Program!
                  </p>
                </div>
              </div>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/certificate"
                  className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-6 py-3 rounded-xl hover:from-yellow-600 hover:to-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl font-bold flex items-center space-x-2"
                >
                  <Award className="h-5 w-5" />
                  <span>View Your Certificate</span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <div key={index} className={`${stat.bgColor} rounded-2xl p-6 shadow-lg border border-gray-100`}>
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

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Progress</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-700 font-medium">Completion Rate</span>
                <span className="text-gray-600">{analytics.completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                <div 
                  className="h-3 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${analytics.completionRate}%`,
                    background: `linear-gradient(90deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})`
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-700 font-medium">Performance Level</span>
                <span className="text-gray-600">
                  {analytics.averageScore >= 90 ? 'Excellent' : 
                   analytics.averageScore >= 80 ? 'Good' : 
                   analytics.averageScore >= 70 ? 'Fair' : 'Needs Improvement'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                <div 
                  className={`h-3 rounded-full transition-all duration-1000 ${
                    analytics.averageScore >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                    analytics.averageScore >= 80 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                    analytics.averageScore >= 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                    'bg-gradient-to-r from-red-500 to-pink-500'
                  }`}
                  style={{ width: `${analytics.averageScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Quiz Results</h2>
          
          {recentResults.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results yet</h3>
              <p className="text-gray-600 mb-6">Complete some lessons to see your quiz results here.</p>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
              >
                Start Learning
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentResults.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl border-2 ${getScoreColor(result.score)}`}>
                      {getScoreIcon(result.score)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{result.lesson_title}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(result.completed_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      result.score >= 90 ? 'text-green-600' :
                      result.score >= 80 ? 'text-blue-600' :
                      result.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {result.score}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {result.score >= 90 ? 'Excellent' :
                       result.score >= 80 ? 'Good' :
                       result.score >= 70 ? 'Passed' : 'Failed'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Results