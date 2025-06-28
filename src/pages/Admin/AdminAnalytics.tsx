import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  Calendar, 
  Download, 
  RefreshCw, 
  Filter, 
  Globe, 
  Clock, 
  Award, 
  BookOpen, 
  Zap, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface AnalyticsData {
  userGrowth: {
    date: string
    count: number
  }[]
  lessonCompletions: {
    date: string
    count: number
  }[]
  usersByCountry: {
    country: string
    count: number
  }[]
  usersByLanguage: {
    language: string
    count: number
  }[]
  quizScores: {
    score: number
    count: number
  }[]
  activeUsers: {
    daily: number
    weekly: number
    monthly: number
  }
  engagementMetrics: {
    averageSessionTime: number
    averageCompletionRate: number
    averageQuizScore: number
  }
}

const AdminAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    userGrowth: [],
    lessonCompletions: [],
    usersByCountry: [],
    usersByLanguage: [],
    quizScores: [],
    activeUsers: { daily: 0, weekly: 0, monthly: 0 },
    engagementMetrics: { 
      averageSessionTime: 0, 
      averageCompletionRate: 0, 
      averageQuizScore: 0 
    }
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    
    try {
      // Calculate date ranges
      const now = new Date()
      const timeRanges = {
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        'all': '2000-01-01T00:00:00Z' // Effectively all data
      }
      
      const startDate = timeRanges[timeRange]
      
      // Fetch user growth data
      const { data: userGrowthData, error: userGrowthError } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', startDate)
        .order('created_at', { ascending: true })
      
      if (userGrowthError) throw userGrowthError
      
      // Process user growth data by day
      const userGrowth = processDateData(userGrowthData.map(user => user.created_at))
      
      // Fetch lesson completion data
      const { data: lessonCompletionData, error: lessonCompletionError } = await supabase
        .from('user_progress')
        .select('completed_at')
        .eq('completed', true)
        .gte('completed_at', startDate)
        .order('completed_at', { ascending: true })
      
      if (lessonCompletionError) throw lessonCompletionError
      
      // Process lesson completion data by day
      const lessonCompletions = processDateData(lessonCompletionData.map(progress => progress.completed_at))
      
      // Fetch users by country
      const { data: countryData, error: countryError } = await supabase
        .from('users')
        .select('country, count')
        .gte('created_at', startDate)
        .group('country')
      
      if (countryError) throw countryError
      
      const usersByCountry = countryData.map(item => ({
        country: item.country || 'Unknown',
        count: item.count
      })).sort((a, b) => b.count - a.count)
      
      // Fetch users by language
      const { data: languageData, error: languageError } = await supabase
        .from('users')
        .select('language, count')
        .gte('created_at', startDate)
        .group('language')
      
      if (languageError) throw languageError
      
      const usersByLanguage = languageData.map(item => ({
        language: item.language || 'Unknown',
        count: item.count
      })).sort((a, b) => b.count - a.count)
      
      // Fetch quiz scores
      const { data: quizData, error: quizError } = await supabase
        .from('user_progress')
        .select('score')
        .eq('completed', true)
        .gte('completed_at', startDate)
      
      if (quizError) throw quizError
      
      // Process quiz scores into ranges
      const scoreRanges = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
      const quizScores = scoreRanges.map(minScore => {
        const maxScore = minScore + 9
        const count = quizData.filter(quiz => 
          quiz.score >= minScore && (minScore === 100 ? quiz.score === 100 : quiz.score <= maxScore)
        ).length
        
        return {
          score: minScore,
          count
        }
      }).filter(range => range.count > 0)
      
      // Fetch active users
      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      
      const [
        { count: dailyActive }, 
        { count: weeklyActive }, 
        { count: monthlyActive }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('last_active', oneDayAgo),
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('last_active', sevenDaysAgo),
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('last_active', thirtyDaysAgo)
      ])
      
      // Calculate engagement metrics
      const { data: sessionData, error: sessionError } = await supabase
        .from('user_sessions')
        .select('session_duration_seconds')
        .gte('login_time', startDate)
      
      if (sessionError) throw sessionError
      
      const averageSessionTime = sessionData.length > 0
        ? Math.round(sessionData.reduce((sum, session) => sum + (session.session_duration_seconds || 0), 0) / sessionData.length)
        : 0
      
      const { data: progressData, error: progressError } = await supabase
        .from('users')
        .select('progress')
      
      if (progressError) throw progressError
      
      const averageCompletionRate = progressData.length > 0
        ? Math.round(progressData.reduce((sum, user) => sum + (user.progress || 0), 0) / progressData.length)
        : 0
      
      const { data: scoreData, error: scoreError } = await supabase
        .from('users')
        .select('average_quiz_score')
      
      if (scoreError) throw scoreError
      
      const averageQuizScore = scoreData.length > 0
        ? Math.round(scoreData.reduce((sum, user) => sum + (user.average_quiz_score || 0), 0) / scoreData.length)
        : 0
      
      // Set all analytics data
      setAnalyticsData({
        userGrowth,
        lessonCompletions,
        usersByCountry,
        usersByLanguage,
        quizScores,
        activeUsers: {
          daily: dailyActive || 0,
          weekly: weeklyActive || 0,
          monthly: monthlyActive || 0
        },
        engagementMetrics: {
          averageSessionTime,
          averageCompletionRate,
          averageQuizScore
        }
      })
      
      setSuccess('Analytics data refreshed successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      setError('Failed to load analytics data. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [timeRange])

  // Process date data into daily counts
  const processDateData = (dates: string[]) => {
    const dateCounts: Record<string, number> = {}
    
    dates.forEach(dateStr => {
      const date = new Date(dateStr)
      const dateKey = date.toISOString().split('T')[0]
      
      if (dateCounts[dateKey]) {
        dateCounts[dateKey]++
      } else {
        dateCounts[dateKey] = 1
      }
    })
    
    // Convert to array and sort by date
    return Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  // Initial data load
  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  // Export analytics data as CSV
  const exportAnalyticsData = () => {
    // Create CSV content
    const userGrowthCSV = [
      'Date,New Users',
      ...analyticsData.userGrowth.map(item => `${item.date},${item.count}`)
    ].join('\n')
    
    const lessonCompletionsCSV = [
      'Date,Completions',
      ...analyticsData.lessonCompletions.map(item => `${item.date},${item.count}`)
    ].join('\n')
    
    const usersByCountryCSV = [
      'Country,Users',
      ...analyticsData.usersByCountry.map(item => `${item.country},${item.count}`)
    ].join('\n')
    
    const usersByLanguageCSV = [
      'Language,Users',
      ...analyticsData.usersByLanguage.map(item => `${item.language},${item.count}`)
    ].join('\n')
    
    const quizScoresCSV = [
      'Score Range,Count',
      ...analyticsData.quizScores.map(item => `${item.score}-${item.score + 9},${item.count}`)
    ].join('\n')
    
    // Combine all data
    const allDataCSV = [
      '# Learn2Go Analytics Export',
      `# Generated: ${new Date().toISOString()}`,
      `# Time Range: ${timeRange}`,
      '',
      '## User Growth',
      userGrowthCSV,
      '',
      '## Lesson Completions',
      lessonCompletionsCSV,
      '',
      '## Users by Country',
      usersByCountryCSV,
      '',
      '## Users by Language',
      usersByLanguageCSV,
      '',
      '## Quiz Scores',
      quizScoresCSV,
      '',
      '## Active Users',
      'Period,Count',
      `Daily,${analyticsData.activeUsers.daily}`,
      `Weekly,${analyticsData.activeUsers.weekly}`,
      `Monthly,${analyticsData.activeUsers.monthly}`,
      '',
      '## Engagement Metrics',
      'Metric,Value',
      `Average Session Time (seconds),${analyticsData.engagementMetrics.averageSessionTime}`,
      `Average Completion Rate (%),${analyticsData.engagementMetrics.averageCompletionRate}`,
      `Average Quiz Score (%),${analyticsData.engagementMetrics.averageQuizScore}`
    ].join('\n')
    
    // Create download link
    const blob = new Blob([allDataCSV], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `learn2go_analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Format time duration
  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A'
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes < 60) {
      return `${minutes}m ${remainingSeconds}s`
    }
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    return `${hours}h ${remainingMinutes}m`
  }

  // Get country flag
  const getCountryFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      'US': '🇺🇸',
      'IN': '🇮🇳',
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

  // Get language name
  const getLanguageName = (languageCode: string) => {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'hi': 'Hindi',
      'te': 'Telugu',
      'ta': 'Tamil',
      'bn': 'Bengali',
      'ja': 'Japanese',
      'zh': 'Chinese',
      'pt': 'Portuguese'
    }
    return languageNames[languageCode] || languageCode
  }

  // Render bar chart
  const renderBarChart = (data: { label: string, value: number }[], color: string) => {
    const maxValue = Math.max(...data.map(item => item.value))
    
    return (
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className="w-24 text-xs text-gray-600 truncate">{item.label}</div>
            <div className="flex-1">
              <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: color
                  }}
                ></div>
              </div>
            </div>
            <div className="w-12 text-xs font-medium text-gray-900 text-right">{item.value}</div>
          </div>
        ))}
      </div>
    )
  }

  // Render line chart
  const renderLineChart = (data: { date: string, count: number }[], color: string) => {
    if (data.length === 0) return <div className="h-40 flex items-center justify-center text-gray-500">No data available</div>
    
    const maxValue = Math.max(...data.map(item => item.count))
    const minValue = Math.min(...data.map(item => item.count))
    const range = maxValue - minValue
    
    // Group data by week if there are too many points
    let chartData = data
    if (data.length > 30) {
      const weeklyData: Record<string, number> = {}
      
      data.forEach(item => {
        const date = new Date(item.date)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const weekKey = weekStart.toISOString().split('T')[0]
        
        if (weeklyData[weekKey]) {
          weeklyData[weekKey] += item.count
        } else {
          weeklyData[weekKey] = item.count
        }
      })
      
      chartData = Object.entries(weeklyData)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }
    
    return (
      <div className="h-40 relative">
        <div className="absolute inset-0 flex items-end">
          {chartData.map((item, index) => {
            const height = range === 0 ? 100 : ((item.count - minValue) / range) * 100
            
            return (
              <div 
                key={index} 
                className="flex-1 flex flex-col items-center justify-end group"
              >
                <div 
                  className="w-full max-w-[8px] mx-auto rounded-t-sm hover:opacity-80 transition-opacity relative"
                  style={{ 
                    height: `${Math.max(5, height)}%`,
                    backgroundColor: color
                  }}
                >
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.date}: {item.count}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <BarChart3 className="h-8 w-8 text-amber-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                Analytics Dashboard
              </h2>
            </div>
            <p className="text-gray-600">
              Track user engagement, content performance, and platform growth
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <div className="flex items-center space-x-2 bg-white rounded-lg shadow-sm p-1">
              {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    timeRange === range
                      ? 'bg-amber-100 text-amber-800 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {range === '7d' ? 'Week' : 
                   range === '30d' ? 'Month' : 
                   range === '90d' ? 'Quarter' : 'All Time'}
                </button>
              ))}
            </div>
            
            <button
              onClick={fetchAnalyticsData}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
            
            <button
              onClick={exportAnalyticsData}
              className="flex items-center space-x-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm font-medium">Export CSV</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Success/Error Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center space-x-2"
        >
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span>{success}</span>
        </motion.div>
      )}
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2"
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {loading && !refreshing ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="text-sm text-gray-500">
                  Active Users
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{analyticsData.activeUsers.daily}</div>
                  <div className="text-xs text-gray-600">Daily</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{analyticsData.activeUsers.weekly}</div>
                  <div className="text-xs text-gray-600">Weekly</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{analyticsData.activeUsers.monthly}</div>
                  <div className="text-xs text-gray-600">Monthly</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-3">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div className="text-sm text-gray-500">
                  Content Engagement
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analyticsData.engagementMetrics.averageCompletionRate}%
                  </div>
                  <div className="text-xs text-gray-600">Completion</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analyticsData.engagementMetrics.averageQuizScore}%
                  </div>
                  <div className="text-xs text-gray-600">Avg Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analyticsData.lessonCompletions.reduce((sum, item) => sum + item.count, 0)}
                  </div>
                  <div className="text-xs text-gray-600">Completions</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-3">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="text-sm text-gray-500">
                  User Engagement
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatDuration(analyticsData.engagementMetrics.averageSessionTime)}
                  </div>
                  <div className="text-xs text-gray-600">Avg Session Time</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${Math.min(100, analyticsData.engagementMetrics.averageSessionTime / 600 * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Charts Row 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
          >
            {/* User Growth Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span>User Growth</span>
                </h3>
                <div className="text-sm text-gray-500">
                  {timeRange === '7d' ? 'Last 7 days' : 
                   timeRange === '30d' ? 'Last 30 days' : 
                   timeRange === '90d' ? 'Last 90 days' : 'All time'}
                </div>
              </div>
              
              {analyticsData.userGrowth.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-gray-500">
                  No user growth data available for the selected time range
                </div>
              ) : (
                <div>
                  {renderLineChart(
                    analyticsData.userGrowth, 
                    '#3B82F6'
                  )}
                  <div className="mt-4 text-center text-sm text-gray-600">
                    Total new users: {analyticsData.userGrowth.reduce((sum, item) => sum + item.count, 0)}
                  </div>
                </div>
              )}
            </div>
            
            {/* Lesson Completions Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Lesson Completions</span>
                </h3>
                <div className="text-sm text-gray-500">
                  {timeRange === '7d' ? 'Last 7 days' : 
                   timeRange === '30d' ? 'Last 30 days' : 
                   timeRange === '90d' ? 'Last 90 days' : 'All time'}
                </div>
              </div>
              
              {analyticsData.lessonCompletions.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-gray-500">
                  No lesson completion data available for the selected time range
                </div>
              ) : (
                <div>
                  {renderLineChart(
                    analyticsData.lessonCompletions, 
                    '#10B981'
                  )}
                  <div className="mt-4 text-center text-sm text-gray-600">
                    Total completions: {analyticsData.lessonCompletions.reduce((sum, item) => sum + item.count, 0)}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Charts Row 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
          >
            {/* Users by Country */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-indigo-600" />
                  <span>Users by Country</span>
                </h3>
                <div className="text-sm text-gray-500">
                  Top {Math.min(10, analyticsData.usersByCountry.length)} countries
                </div>
              </div>
              
              {analyticsData.usersByCountry.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-gray-500">
                  No country data available
                </div>
              ) : (
                <div>
                  {renderBarChart(
                    analyticsData.usersByCountry
                      .slice(0, 10)
                      .map(item => ({ 
                        label: `${getCountryFlag(item.country)} ${item.country}`, 
                        value: item.count 
                      })),
                    '#4F46E5'
                  )}
                </div>
              )}
            </div>
            
            {/* Users by Language */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-purple-600" />
                  <span>Users by Language</span>
                </h3>
                <div className="text-sm text-gray-500">
                  Top {Math.min(10, analyticsData.usersByLanguage.length)} languages
                </div>
              </div>
              
              {analyticsData.usersByLanguage.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-gray-500">
                  No language data available
                </div>
              ) : (
                <div>
                  {renderBarChart(
                    analyticsData.usersByLanguage
                      .slice(0, 10)
                      .map(item => ({ 
                        label: getLanguageName(item.language), 
                        value: item.count 
                      })),
                    '#8B5CF6'
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Charts Row 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 gap-8"
          >
            {/* Quiz Score Distribution */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <Award className="h-5 w-5 text-amber-600" />
                  <span>Quiz Score Distribution</span>
                </h3>
                <div className="text-sm text-gray-500">
                  Score ranges (%)
                </div>
              </div>
              
              {analyticsData.quizScores.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-gray-500">
                  No quiz score data available
                </div>
              ) : (
                <div>
                  {renderBarChart(
                    analyticsData.quizScores.map(item => ({ 
                      label: item.score === 100 ? '100%' : `${item.score}-${item.score + 9}%`, 
                      value: item.count 
                    })),
                    '#F59E0B'
                  )}
                  <div className="mt-4 text-center text-sm text-gray-600">
                    Average Score: {analyticsData.engagementMetrics.averageQuizScore}%
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-200 shadow-lg mt-8"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Zap className="h-5 w-5 text-amber-600" />
              <span>Key Insights</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900">User Engagement</h4>
                </div>
                <p className="text-sm text-gray-600">
                  {analyticsData.activeUsers.monthly > 0 
                    ? `${Math.round((analyticsData.activeUsers.daily / analyticsData.activeUsers.monthly) * 100)}% of monthly users are active daily.`
                    : 'No active users data available.'}
                  {analyticsData.engagementMetrics.averageSessionTime > 0
                    ? ` Average session time is ${formatDuration(analyticsData.engagementMetrics.averageSessionTime)}.`
                    : ''}
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-gray-900">Content Performance</h4>
                </div>
                <p className="text-sm text-gray-600">
                  {analyticsData.engagementMetrics.averageCompletionRate > 0
                    ? `Users complete ${analyticsData.engagementMetrics.averageCompletionRate}% of content on average.`
                    : 'No completion rate data available.'}
                  {analyticsData.engagementMetrics.averageQuizScore > 0
                    ? ` Average quiz score is ${analyticsData.engagementMetrics.averageQuizScore}%.`
                    : ''}
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <Globe className="h-5 w-5 text-purple-600" />
                  <h4 className="font-medium text-gray-900">Global Reach</h4>
                </div>
                <p className="text-sm text-gray-600">
                  {analyticsData.usersByCountry.length > 0
                    ? `Users from ${analyticsData.usersByCountry.length} countries with ${getCountryFlag(analyticsData.usersByCountry[0].country)} ${analyticsData.usersByCountry[0].country} leading.`
                    : 'No country data available.'}
                  {analyticsData.usersByLanguage.length > 0
                    ? ` ${getLanguageName(analyticsData.usersByLanguage[0].language)} is the most common language.`
                    : ''}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}

export default AdminAnalytics