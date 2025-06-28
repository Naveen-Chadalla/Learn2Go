import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
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
  Trophy,
  RefreshCw,
  Sparkles,
  Calendar,
  Flame,
  Users,
  BarChart3,
  ArrowRight,
  Filter
} from 'lucide-react'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import ProgressIndicator from '../components/UI/ProgressIndicator'
import SearchBar from '../components/UI/SearchBar'
import Tooltip from '../components/UI/Tooltip'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { getCountryByCode, getLanguageByCode } from '../types/countries'
import DynamicTagline from '../components/DynamicTagline'

const ModernDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const { data, refreshData, loading, error } = useData()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshData()
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleSearch = (query: string, filters: string[]) => {
    setSearchQuery(query)
    // Implement search logic
  }

  if (loading && !data.userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 text-center">
          <Card.Body>
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">Dashboard Error</h2>
            <p className="text-neutral-600 mb-6">{error}</p>
            <Button onClick={handleRefresh} loading={refreshing}>
              Try Again
            </Button>
          </Card.Body>
        </Card>
      </div>
    )
  }

  const { userProfile, lessons, userProgress, badges, analytics, countryTheme } = data

  const completedLessonIds = new Set(
    userProgress.filter(p => p.completed).map(p => p.lesson_id)
  )

  const filteredLessons = lessons
    .filter(lesson => {
      if (selectedCategory !== 'all' && lesson.category !== selectedCategory) return false
      if (searchQuery && !lesson.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
    .slice(0, 6)
    .map(lesson => ({
      ...lesson,
      completed: completedLessonIds.has(lesson.id)
    }))

  const stats = [
    {
      title: 'Current Level',
      value: userProfile?.current_level || 1,
      icon: <Target className="h-6 w-6" />,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
      change: '+2 this week'
    },
    {
      title: 'Lessons Completed',
      value: analytics.totalQuizzes,
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
      change: '+3 this week'
    },
    {
      title: 'Safety Badges',
      value: badges.filter(b => b.earned).length,
      icon: <Award className="h-6 w-6" />,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-gradient-to-br from-yellow-50 to-orange-50',
      change: '+1 new badge'
    },
    {
      title: 'Average Score',
      value: `${analytics.averageScore}%`,
      icon: <Zap className="h-6 w-6" />,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
      change: '+5% improvement'
    }
  ]

  const learningSteps = [
    {
      id: '1',
      title: 'Choose Lesson',
      description: 'Select from personalized content',
      status: 'completed' as const
    },
    {
      id: '2',
      title: 'Study Content',
      description: 'Learn with interactive materials',
      status: analytics.totalQuizzes > 0 ? 'completed' as const : 'current' as const
    },
    {
      id: '3',
      title: 'Take Quiz',
      description: 'Test your knowledge',
      status: analytics.totalQuizzes > 0 ? 'completed' as const : 'pending' as const
    },
    {
      id: '4',
      title: 'Play Game',
      description: 'Reinforce learning',
      status: analytics.totalQuizzes > 2 ? 'completed' as const : 'pending' as const
    }
  ]

  const countryData = getCountryByCode(userProfile?.country || 'US')
  const languageData = getLanguageByCode(userProfile?.language || 'en')

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <motion.h1 
                className="text-4xl font-bold text-neutral-900 mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                Welcome back, {userProfile?.username || user?.user_metadata?.username || 'User'}! 
                <motion.span
                  animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                  className="inline-block ml-2"
                >
                  👋
                </motion.span>
              </motion.h1>
              <p className="text-lg text-neutral-600">
                Continue your safety learning journey
              </p>
              
              <div className="flex items-center space-x-4 mt-4">
                <div className="flex items-center space-x-2 bg-white rounded-2xl px-4 py-2 shadow-sm border border-neutral-200">
                  <span className="text-2xl">{countryData?.flag}</span>
                  <span className="text-sm font-medium text-neutral-700">
                    {countryData?.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2 bg-white rounded-2xl px-4 py-2 shadow-sm border border-neutral-200">
                  <span className="text-sm font-medium text-neutral-700">
                    {languageData?.nativeName}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Tooltip content="Refresh dashboard data">
                <Button
                  variant="secondary"
                  onClick={handleRefresh}
                  loading={refreshing}
                  icon={<RefreshCw className="h-4 w-4" />}
                >
                  Refresh
                </Button>
              </Tooltip>
            </div>
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

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ y: -4 }}
            >
              <Card className={`${stat.bgColor} border-0 shadow-lg hover:shadow-xl transition-all duration-300`}>
                <Card.Body>
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="rounded-2xl p-3 shadow-lg"
                      style={{ background: `linear-gradient(135deg, var(--primary-500), var(--secondary-500))` }}
                    >
                      <div className="text-white">{stat.icon}</div>
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                      className="text-2xl"
                    >
                      ✨
                    </motion.div>
                  </div>
                  <div className="text-3xl font-bold text-neutral-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-neutral-600 font-medium mb-2">{stat.title}</div>
                  <div className="text-xs text-green-600 font-medium">{stat.change}</div>
                </Card.Body>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Learning Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <Card className="shadow-lg">
            <Card.Header>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-neutral-900">Your Learning Journey</h2>
                <div className="flex items-center space-x-2 text-sm text-neutral-600">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-semibold">{userProfile?.progress || 0}% Complete</span>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <ProgressIndicator
                steps={learningSteps}
                orientation="horizontal"
                showLabels={true}
              />
            </Card.Body>
          </Card>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <Card className="shadow-lg">
            <Card.Body>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <SearchBar
                    placeholder="Search lessons, quizzes, and games..."
                    onSearch={handleSearch}
                    results={[]}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-neutral-700">Category:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="input w-auto min-w-32"
                  >
                    <option value="all">All</option>
                    <option value="traffic-rules">Traffic Rules</option>
                    <option value="safety">Safety</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>
            </Card.Body>
          </Card>
        </motion.div>

        {/* Available Lessons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="shadow-lg">
            <Card.Header>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-neutral-900">Available Lessons</h2>
                <div className="flex items-center space-x-2 text-sm text-neutral-600">
                  <BarChart3 className="h-4 w-4" />
                  <span className="font-semibold">{analytics.completionRate}% completed</span>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {filteredLessons.length === 0 ? (
                <div className="text-center py-16">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <BookOpen className="h-20 w-20 text-neutral-300 mx-auto mb-6" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">Content Coming Soon</h3>
                  <p className="text-neutral-600 mb-6 text-lg">
                    Localized content for {countryData?.name} in {languageData?.nativeName} is being prepared.
                  </p>
                  <Button
                    onClick={handleRefresh}
                    loading={refreshing}
                    icon={<RefreshCw className="h-4 w-4" />}
                  >
                    Check for Updates
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLessons.map((lesson, index) => (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card hover className="h-full">
                        <Card.Body>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="rounded-2xl p-3 shadow-lg"
                                style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                              >
                                <BookOpen className="h-5 w-5 text-white" />
                              </div>
                              <span className="text-sm font-bold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full">
                                Level {lesson.level}
                              </span>
                            </div>
                            {lesson.completed && (
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="h-6 w-6 text-green-500" />
                                <Star className="h-5 w-5 text-yellow-500" />
                              </div>
                            )}
                          </div>
                          
                          <h3 className="font-bold text-neutral-900 mb-3 text-lg line-clamp-2">
                            {lesson.title}
                          </h3>
                          <p className="text-neutral-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                            {lesson.description}
                          </p>
                          
                          <Button
                            as={Link}
                            to={`/lessons/${lesson.id}`}
                            className="w-full"
                            icon={<PlayCircle className="h-4 w-4" />}
                          >
                            {lesson.completed ? 'Review Lesson' : 'Start Lesson'}
                          </Button>
                        </Card.Body>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8"
        >
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-lg">
              <Card.Body className="text-center">
                <Trophy className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-neutral-900 mb-2">View Results</h3>
                <p className="text-neutral-600 text-sm mb-4">
                  Check your quiz scores and progress
                </p>
                <Button
                  as={Link}
                  to="/results"
                  variant="secondary"
                  size="sm"
                  icon={<ArrowRight className="h-4 w-4" />}
                >
                  View Results
                </Button>
              </Card.Body>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg">
              <Card.Body className="text-center">
                <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Leaderboard</h3>
                <p className="text-neutral-600 text-sm mb-4">
                  Compete with other learners
                </p>
                <Button
                  as={Link}
                  to="/leaderboard"
                  variant="secondary"
                  size="sm"
                  icon={<ArrowRight className="h-4 w-4" />}
                >
                  View Rankings
                </Button>
              </Card.Body>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
              <Card.Body className="text-center">
                <Award className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Achievements</h3>
                <p className="text-neutral-600 text-sm mb-4">
                  {badges.filter(b => b.earned).length} badges earned
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ArrowRight className="h-4 w-4" />}
                >
                  View Badges
                </Button>
              </Card.Body>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ModernDashboard