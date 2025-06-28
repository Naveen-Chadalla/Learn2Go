import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { supabase } from '../../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  TrendingUp, 
  BookOpen, 
  Award, 
  Trash2, 
  Calendar,
  Clock,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  User,
  Mail,
  Eye,
  Activity,
  Shield,
  Crown,
  RefreshCw,
  UserX,
  Settings,
  Database,
  FileText,
  Server,
  Layers,
  Download,
  Search,
  Filter,
  Globe,
  Zap,
  Sparkles,
  PieChart,
  LayoutDashboard,
  UserCog,
  FileEdit,
  ListChecks,
  MessageSquare
} from 'lucide-react'
import AdminUserManagement from './AdminUserManagement'
import AdminContentManagement from './AdminContentManagement'
import AdminAnalytics from './AdminAnalytics'
import AdminSystemSettings from './AdminSystemSettings'
import AdminActivityLogs from './AdminActivityLogs'

type AdminTab = 'dashboard' | 'users' | 'content' | 'analytics' | 'settings' | 'logs'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalLessons: number
  completedLessons: number
  onlineUsers: number
  registrationsToday: number
  averageScore: number
  totalQuizAttempts: number
}

const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalLessons: 0,
    completedLessons: 0,
    onlineUsers: 0,
    registrationsToday: 0,
    averageScore: 0,
    totalQuizAttempts: 0
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    
    try {
      // Fetch stats
      const [
        { count: totalUsers }, 
        { count: activeUsers },
        { count: totalLessons },
        { count: completedLessons },
        { count: onlineUsers },
        { count: registrationsToday },
        { data: quizData }
      ] = await Promise.all([
        // Total users
        supabase.from('users').select('*', { count: 'exact', head: true }),
        
        // Active users (logged in within last 24 hours)
        supabase.from('users')
          .select('*', { count: 'exact', head: true })
          .gte('last_active', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        
        // Total lessons
        supabase.from('lessons').select('*', { count: 'exact', head: true }),
        
        // Completed lessons
        supabase.from('user_progress')
          .select('*', { count: 'exact', head: true })
          .eq('completed', true),
        
        // Online users (active within last 5 minutes)
        supabase.from('users')
          .select('*', { count: 'exact', head: true })
          .gte('last_active', new Date(Date.now() - 5 * 60 * 1000).toISOString()),
        
        // Registrations today
        supabase.from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        
        // Quiz data for average score
        supabase.from('user_progress')
          .select('score')
          .eq('completed', true)
      ])

      // Calculate average score
      const averageScore = quizData && quizData.length > 0
        ? Math.round(quizData.reduce((sum, item) => sum + item.score, 0) / quizData.length)
        : 0

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalLessons: totalLessons || 0,
        completedLessons: completedLessons || 0,
        onlineUsers: onlineUsers || 0,
        registrationsToday: registrationsToday || 0,
        averageScore,
        totalQuizAttempts: quizData?.length || 0
      })

      // Fetch recent activity
      const { data: activityData, error: activityError } = await supabase
        .from('user_activity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10)

      if (activityError) throw activityError
      
      setRecentActivity(activityData || [])
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial data load
  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData()
    }
  }, [isAdmin, fetchDashboardData])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!isAdmin) return

    // Set up real-time subscription for users table
    const usersSubscription = supabase
      .channel('admin-users-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'users' 
      }, () => {
        if (autoRefresh) fetchDashboardData()
      })
      .subscribe()

    // Set up real-time subscription for user progress
    const progressSubscription = supabase
      .channel('admin-progress-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_progress' 
      }, () => {
        if (autoRefresh) fetchDashboardData()
      })
      .subscribe()

    // Set up real-time subscription for activity logs
    const activitySubscription = supabase
      .channel('admin-activity-realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'user_activity_logs' 
      }, () => {
        if (autoRefresh) fetchDashboardData()
      })
      .subscribe()

    // Auto-refresh every 60 seconds if enabled
    const refreshInterval = setInterval(() => {
      if (autoRefresh) {
        fetchDashboardData()
      }
    }, 60000)

    return () => {
      usersSubscription.unsubscribe()
      progressSubscription.unsubscribe()
      activitySubscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [isAdmin, autoRefresh, fetchDashboardData])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return <User className="h-4 w-4 text-blue-500" />
      case 'logout': return <User className="h-4 w-4 text-gray-500" />
      case 'signup': return <User className="h-4 w-4 text-green-500" />
      case 'lesson_start': return <BookOpen className="h-4 w-4 text-purple-500" />
      case 'lesson_complete': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'quiz_attempt': return <Award className="h-4 w-4 text-yellow-500" />
      case 'page_view': return <Eye className="h-4 w-4 text-blue-500" />
      case 'game_play': return <Zap className="h-4 w-4 text-orange-500" />
      case 'heartbeat': return <Activity className="h-4 w-4 text-gray-400" />
      case 'session_start': return <Clock className="h-4 w-4 text-green-500" />
      case 'session_end': return <Clock className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const formatActivityType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const getActivityDetails = (activity: any) => {
    const details = activity.activity_details || {}
    
    switch (activity.activity_type) {
      case 'lesson_start':
      case 'lesson_complete':
        return details.lesson_id ? `Lesson ID: ${details.lesson_id}` : 'Unknown lesson'
      
      case 'quiz_attempt':
        return `Score: ${details.score || 0}/${details.total_questions || 0}`
      
      case 'page_view':
        return details.page_path || 'Unknown page'
      
      case 'game_play':
        return `Game: ${details.game_type || 'Unknown'}, Score: ${details.score || 0}`
      
      default:
        return ''
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 pt-16">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 pt-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pt-16">
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
              <div className="flex items-center space-x-3 mb-2">
                <Crown className="h-8 w-8 text-purple-600" />
                <h1 className="text-3xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
              </div>
              <p className="text-gray-600">
                Manage users, content, and monitor system performance
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Auto-refresh toggle */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Auto-refresh:</label>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoRefresh ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoRefresh ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Manual refresh */}
              <button
                onClick={fetchDashboardData}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">Refresh</span>
              </button>
              
              {/* Last update */}
              <div className="text-sm text-gray-500">
                Last update: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
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

        {/* Admin Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="flex flex-wrap border-b border-gray-200">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'dashboard' 
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' 
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/50'
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </button>
            
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'users' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'
              }`}
            >
              <UserCog className="h-5 w-5" />
              <span>User Management</span>
            </button>
            
            <button
              onClick={() => setActiveTab('content')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'content' 
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50' 
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50/50'
              }`}
            >
              <FileEdit className="h-5 w-5" />
              <span>Content Management</span>
            </button>
            
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'analytics' 
                  ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50' 
                  : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50/50'
              }`}
            >
              <PieChart className="h-5 w-5" />
              <span>Analytics</span>
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'settings' 
                  ? 'text-red-600 border-b-2 border-red-600 bg-red-50' 
                  : 'text-gray-600 hover:text-red-600 hover:bg-red-50/50'
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>System Settings</span>
            </button>
            
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'logs' 
                  ? 'text-gray-800 border-b-2 border-gray-800 bg-gray-50' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <ListChecks className="h-5 w-5" />
              <span>Activity Logs</span>
            </button>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                  whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-3">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="bg-blue-50 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
                      Total
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalUsers}</div>
                  <div className="text-sm text-gray-600">Registered Users</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                  whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-3">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div className="bg-green-50 text-green-600 text-xs font-medium px-2 py-1 rounded-full">
                      Online
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stats.onlineUsers}</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                  whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-3">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div className="bg-yellow-50 text-yellow-600 text-xs font-medium px-2 py-1 rounded-full">
                      Today
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stats.registrationsToday}</div>
                  <div className="text-sm text-gray-600">New Registrations</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                  whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-3">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div className="bg-purple-50 text-purple-600 text-xs font-medium px-2 py-1 rounded-full">
                      Content
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalLessons}</div>
                  <div className="text-sm text-gray-600">Total Lessons</div>
                </motion.div>
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                  whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-3">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats.completedLessons}</div>
                      <div className="text-sm text-gray-600">Completed Lessons</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500"
                      style={{ width: `${stats.totalLessons > 0 ? (stats.completedLessons / stats.totalLessons) * 100 : 0}%` }}
                    ></div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                  whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl p-3">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats.averageScore}%</div>
                      <div className="text-sm text-gray-600">Average Score</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500"
                      style={{ width: `${stats.averageScore}%` }}
                    ></div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                  whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-3">
                      <Globe className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats.activeUsers}</div>
                      <div className="text-sm text-gray-600">Active Users (24h)</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      style={{ width: `${stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0}%` }}
                    ></div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                  whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-3">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats.totalQuizAttempts}</div>
                      <div className="text-sm text-gray-600">Quiz Attempts</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span>Engagement metric</span>
                  </div>
                </motion.div>
              </div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Activity className="h-5 w-5 text-purple-500" />
                      <span>Live Updates</span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Activity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentActivity.map((activity, index) => (
                        <motion.tr
                          key={activity.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index, duration: 0.2 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {getActivityIcon(activity.activity_type)}
                              <span className="text-sm font-medium text-gray-900">
                                {formatActivityType(activity.activity_type)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{activity.username}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {getActivityDetails(activity)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTimestamp(activity.timestamp)}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {recentActivity.length === 0 && (
                  <div className="text-center py-12">
                    <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
                    <p className="text-gray-600">User activity will appear here as it occurs.</p>
                  </div>
                )}
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <UserCog className="h-5 w-5 text-blue-600" />
                    <span>User Management</span>
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Manage user accounts, reset progress, or remove inactive users.
                  </p>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Manage Users
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <FileEdit className="h-5 w-5 text-green-600" />
                    <span>Content Management</span>
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Create, edit, or remove lessons, quizzes, and educational content.
                  </p>
                  <button
                    onClick={() => setActiveTab('content')}
                    className="w-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Manage Content
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <Database className="h-5 w-5 text-purple-600" />
                    <span>System Health</span>
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    View system logs, check database status, and manage settings.
                  </p>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="w-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    System Settings
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AdminUserManagement />
            </motion.div>
          )}

          {activeTab === 'content' && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AdminContentManagement />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AdminAnalytics />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AdminSystemSettings />
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AdminActivityLogs />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AdminDashboard