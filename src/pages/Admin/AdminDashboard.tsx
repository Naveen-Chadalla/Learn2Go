import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
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
  UserX
} from 'lucide-react'

interface AdminUser {
  username: string
  email: string
  created_at: string
  last_active: string
  progress: number
  current_level: number
  session_start: string
  session_end: string
  country: string
  language: string
}

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalLessons: number
  completedLessons: number
  onlineUsers: number
}

interface UserActivity {
  username: string
  action: string
  timestamp: string
  details: string
}

const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth()
  const { t } = useLanguage()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalLessons: 0,
    completedLessons: 0,
    onlineUsers: 0
  })
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [realtimeUsers, setRealtimeUsers] = useState<AdminUser[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
      fetchStats()
      
      // Set up real-time subscription for users table
      const usersSubscription = supabase
        .channel('admin-users-realtime')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'users' 
        }, (payload) => {
          console.log('[ADMIN] Real-time user update:', payload)
          fetchUsers()
          fetchStats()
          setLastUpdate(new Date())
        })
        .subscribe()

      // Set up real-time subscription for user progress
      const progressSubscription = supabase
        .channel('admin-progress-realtime')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'user_progress' 
        }, (payload) => {
          console.log('[ADMIN] Real-time progress update:', payload)
          fetchStats()
          setLastUpdate(new Date())
        })
        .subscribe()

      // Auto-refresh every 30 seconds if enabled
      const refreshInterval = setInterval(() => {
        if (autoRefresh) {
          fetchUsers()
          fetchStats()
          setLastUpdate(new Date())
        }
      }, 30000)

      return () => {
        usersSubscription.unsubscribe()
        progressSubscription.unsubscribe()
        clearInterval(refreshInterval)
      }
    }
  }, [isAdmin, autoRefresh])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('last_active', { ascending: false })

      if (error) throw error
      
      setUsers(data || [])
      setRealtimeUsers(data || [])
      
      console.log('[ADMIN] Fetched users:', data?.length)
    } catch (error) {
      console.error('[ADMIN] Error fetching users:', error)
    }
  }

  const fetchStats = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Get active users (logged in within last 24 hours)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_active', yesterday.toISOString())

      // Get online users (active within last 5 minutes)
      const fiveMinutesAgo = new Date()
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)
      
      const { count: onlineUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_active', fiveMinutesAgo.toISOString())

      // Get total lessons
      const { count: totalLessons } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })

      // Get completed lessons
      const { count: completedLessons } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true)

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalLessons: totalLessons || 0,
        completedLessons: completedLessons || 0,
        onlineUsers: onlineUsers || 0
      })

      console.log('[ADMIN] Updated stats:', {
        totalUsers,
        activeUsers,
        onlineUsers,
        totalLessons,
        completedLessons
      })
    } catch (error) {
      console.error('[ADMIN] Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (username: string) => {
    try {
      console.log('[ADMIN] Deleting user:', username)
      
      // Delete user progress first
      await supabase
        .from('user_progress')
        .delete()
        .eq('username', username)

      // Delete user
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('username', username)

      if (error) throw error

      setDeleteConfirm(null)
      fetchUsers()
      fetchStats()
      
      console.log('[ADMIN] User deleted successfully:', username)
    } catch (error) {
      console.error('[ADMIN] Error deleting user:', error)
    }
  }

  const getSessionDuration = (start: string, end: string) => {
    if (!start) return 'N/A'
    
    const startTime = new Date(start)
    const endTime = end ? new Date(end) : new Date()
    const duration = endTime.getTime() - startTime.getTime()
    const minutes = Math.floor(duration / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  const isUserOnline = (lastActive: string) => {
    const last = new Date(lastActive)
    const now = new Date()
    const diffMinutes = (now.getTime() - last.getTime()) / (1000 * 60)
    return diffMinutes < 5 // Online if active within last 5 minutes
  }

  const isUserActive = (lastActive: string) => {
    const last = new Date(lastActive)
    const now = new Date()
    const diffHours = (now.getTime() - last.getTime()) / (1000 * 60 * 60)
    return diffHours < 24 // Active if within last 24 hours
  }

  const getCurrentPage = (username: string) => {
    // This would typically come from real-time tracking
    // For now, we'll simulate based on recent activity
    const user = users.find(u => u.username === username)
    if (!user) return 'Unknown'
    
    const lastActiveTime = new Date(user.last_active)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastActiveTime.getTime()) / (1000 * 60)
    
    if (diffMinutes < 1) return 'Dashboard'
    if (diffMinutes < 5) return 'Lesson View'
    return 'Offline'
  }

  const manualRefresh = () => {
    setLoading(true)
    fetchUsers()
    fetchStats()
    setLastUpdate(new Date())
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
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
                Real-time user management and system monitoring
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
                onClick={manualRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">Refresh</span>
              </button>
              
              {/* Last update */}
              <div className="text-sm text-gray-500">
                Last update: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Real-time Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-3">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-3">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.onlineUsers}</div>
            <div className="text-sm text-gray-600">Online Now</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-3">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.activeUsers}</div>
            <div className="text-sm text-gray-600">Active (24h)</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-3">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalLessons}</div>
            <div className="text-sm text-gray-600">Total Lessons</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-3">
                <Award className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.completedLessons}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </motion.div>

        {/* Real-time Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Real-time User Activity</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Updates</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Page
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((adminUser, index) => (
                  <motion.tr
                    key={adminUser.username}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center relative">
                            <User className="h-5 w-5 text-white" />
                            {isUserOnline(adminUser.last_active) && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                            <span>{adminUser.username}</span>
                            {adminUser.username === 'Hari' && (
                              <Crown className="h-4 w-4 text-purple-600" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{adminUser.email}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            {adminUser.country} • {adminUser.language}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isUserOnline(adminUser.last_active)
                            ? 'bg-green-100 text-green-800'
                            : isUserActive(adminUser.last_active)
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isUserOnline(adminUser.last_active) ? 'Online' : 
                           isUserActive(adminUser.last_active) ? 'Active' : 'Offline'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(adminUser.last_active).toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(adminUser.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{getSessionDuration(adminUser.session_start, adminUser.session_end)}</span>
                        </div>
                        {adminUser.session_start && (
                          <div className="text-xs text-gray-500">
                            Started: {new Date(adminUser.session_start).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full"
                            style={{ width: `${adminUser.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{adminUser.progress}%</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Level {adminUser.current_level}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Eye className="h-4 w-4" />
                        <span>{getCurrentPage(adminUser.username)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {adminUser.username !== 'Hari' && (
                        <>
                          {deleteConfirm === adminUser.username ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleDeleteUser(adminUser.username)}
                                className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="bg-gray-300 text-gray-700 px-3 py-1 rounded-lg text-sm hover:bg-gray-400 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(adminUser.username)}
                              className="text-red-600 hover:text-red-900 transition-colors p-2 rounded-lg hover:bg-red-50"
                              title="Delete User"
                            >
                              <UserX className="h-5 w-5" />
                            </button>
                          )}
                        </>
                      )}
                      {adminUser.username === 'Hari' && (
                        <div className="flex items-center space-x-1 text-purple-600">
                          <Shield className="h-4 w-4" />
                          <span className="text-xs font-medium">Protected</span>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">Users will appear here once they register.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default AdminDashboard