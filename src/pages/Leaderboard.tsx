import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { supabase } from '../lib/supabase'
import { 
  Trophy, 
  Medal, 
  Star, 
  Crown, 
  Zap, 
  Target, 
  Clock, 
  TrendingUp,
  Award,
  Flame,
  Calendar,
  BarChart3
} from 'lucide-react'

interface LeaderboardUser {
  username: string
  total_score: number
  lessons_completed: number
  average_score: number
  best_score: number
  current_streak: number
  total_time: number
  rank: number
  badges_count: number
  country: string
  last_active: string
}

const Leaderboard: React.FC = () => {
  const { user } = useAuth()
  const { data } = useData()
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<'total_score' | 'lessons_completed' | 'average_score' | 'current_streak'>('total_score')
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all')

  const categories = [
    { key: 'total_score' as const, label: 'Total Score', icon: <Trophy className="h-5 w-5" />, color: 'from-yellow-500 to-orange-500' },
    { key: 'lessons_completed' as const, label: 'Lessons Completed', icon: <Target className="h-5 w-5" />, color: 'from-green-500 to-emerald-500' },
    { key: 'average_score' as const, label: 'Average Score', icon: <Star className="h-5 w-5" />, color: 'from-blue-500 to-cyan-500' },
    { key: 'current_streak' as const, label: 'Current Streak', icon: <Flame className="h-5 w-5" />, color: 'from-red-500 to-pink-500' }
  ]

  useEffect(() => {
    fetchLeaderboardData()
  }, [selectedCategory, timeFilter])

  const fetchLeaderboardData = async () => {
    setLoading(true)
    try {
      // Simulate leaderboard data since we don't have a complex scoring system yet
      const mockData: LeaderboardUser[] = [
        {
          username: user?.user_metadata?.username || 'You',
          total_score: data.analytics.totalQuizzes * data.analytics.averageScore,
          lessons_completed: data.analytics.lessonsCompleted,
          average_score: data.analytics.averageScore,
          best_score: data.analytics.bestScore,
          current_streak: data.analytics.streak,
          total_time: 120,
          rank: 1,
          badges_count: data.badges.filter(b => b.earned).length,
          country: data.userProfile?.country || 'US',
          last_active: new Date().toISOString()
        },
        {
          username: 'SafeDriver123',
          total_score: 2850,
          lessons_completed: 15,
          average_score: 95,
          best_score: 100,
          current_streak: 7,
          total_time: 180,
          rank: 2,
          badges_count: 8,
          country: 'US',
          last_active: new Date(Date.now() - 3600000).toISOString()
        },
        {
          username: 'RoadMaster',
          total_score: 2720,
          lessons_completed: 12,
          average_score: 92,
          best_score: 98,
          current_streak: 5,
          total_time: 150,
          rank: 3,
          badges_count: 6,
          country: 'IN',
          last_active: new Date(Date.now() - 7200000).toISOString()
        },
        {
          username: 'TrafficPro',
          total_score: 2650,
          lessons_completed: 14,
          average_score: 89,
          best_score: 96,
          current_streak: 3,
          total_time: 200,
          rank: 4,
          badges_count: 7,
          country: 'GB',
          last_active: new Date(Date.now() - 10800000).toISOString()
        },
        {
          username: 'SafetyFirst',
          total_score: 2580,
          lessons_completed: 11,
          average_score: 88,
          best_score: 94,
          current_streak: 4,
          total_time: 135,
          rank: 5,
          badges_count: 5,
          country: 'CA',
          last_active: new Date(Date.now() - 14400000).toISOString()
        }
      ]

      // Sort by selected category
      const sortedData = mockData.sort((a, b) => {
        return b[selectedCategory] - a[selectedCategory]
      }).map((user, index) => ({ ...user, rank: index + 1 }))

      setLeaderboardData(sortedData)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white'
    if (rank === 3) return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white'
    return 'bg-gray-100 text-gray-700'
  }

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'US': '🇺🇸',
      'IN': '🇮🇳',
      'GB': '🇬🇧',
      'CA': '🇨🇦',
      'AU': '🇦🇺',
      'DE': '🇩🇪',
      'FR': '🇫🇷'
    }
    return flags[country] || '🌍'
  }

  const currentUser = leaderboardData.find(u => u.username === (user?.user_metadata?.username || 'You'))
  const selectedCategoryData = categories.find(c => c.key === selectedCategory)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Safety Champions
            </h1>
            <Trophy className="h-8 w-8 text-yellow-500" />
          </div>
          <p className="text-gray-600 text-lg">
            Compete with learners worldwide and climb the safety leaderboard!
          </p>
        </motion.div>

        {/* Your Rank Card */}
        {currentUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 mb-8 text-white shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  {getRankIcon(currentUser.rank)}
                </div>
                <div>
                  <h3 className="text-xl font-bold">Your Rank</h3>
                  <p className="text-blue-100">#{currentUser.rank} out of {leaderboardData.length}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{currentUser[selectedCategory]}</div>
                <div className="text-blue-100">{selectedCategoryData?.label}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leaderboard Categories</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`p-4 rounded-xl transition-all duration-200 ${
                    selectedCategory === category.key
                      ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    {category.icon}
                    <span className="font-medium">{category.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Top Safety Learners - {selectedCategoryData?.label}
              </h2>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600">Live Rankings</span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {leaderboardData.map((userData, index) => (
              <motion.div
                key={userData.username}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  userData.username === (user?.user_metadata?.username || 'You') 
                    ? 'bg-blue-50 border-l-4 border-blue-500' 
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Rank */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRankBadge(userData.rank)}`}>
                      {userData.rank <= 3 ? getRankIcon(userData.rank) : `#${userData.rank}`}
                    </div>

                    {/* User Info */}
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {userData.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{userData.username}</h3>
                          <span className="text-lg">{getCountryFlag(userData.country)}</span>
                          {userData.username === (user?.user_metadata?.username || 'You') && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Target className="h-4 w-4" />
                            <span>{userData.lessons_completed} lessons</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Flame className="h-4 w-4" />
                            <span>{userData.current_streak} streak</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Award className="h-4 w-4" />
                            <span>{userData.badges_count} badges</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className={`text-2xl font-bold bg-gradient-to-r ${selectedCategoryData?.color} bg-clip-text text-transparent`}>
                      {userData[selectedCategory]}
                      {selectedCategory === 'average_score' || selectedCategory === 'best_score' ? '%' : ''}
                      {selectedCategory === 'current_streak' ? ' days' : ''}
                    </div>
                    <div className="text-sm text-gray-600">
                      Last active: {new Date(userData.last_active).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Additional Stats for Top 3 */}
                {userData.rank <= 3 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-gray-900">{userData.total_score}</div>
                        <div className="text-xs text-gray-600">Total Score</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">{userData.average_score}%</div>
                        <div className="text-xs text-gray-600">Avg Score</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">{userData.current_streak}</div>
                        <div className="text-xs text-gray-600">Streak</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">{Math.floor(userData.total_time / 60)}h</div>
                        <div className="text-xs text-gray-600">Study Time</div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Achievement Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200"
        >
          <div className="text-center">
            <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Climb the Rankings!</h3>
            <p className="text-gray-600 mb-4">
              Complete more lessons, maintain your streak, and achieve higher scores to rise in the leaderboard.
            </p>
            <div className="flex justify-center space-x-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <Zap className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-sm font-medium text-gray-900">Complete Lessons</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <Flame className="h-6 w-6 text-red-500 mx-auto mb-2" />
                <div className="text-sm font-medium text-gray-900">Maintain Streak</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <div className="text-sm font-medium text-gray-900">Score High</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Leaderboard