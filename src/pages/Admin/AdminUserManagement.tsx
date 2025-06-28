import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { 
  Users, 
  Search, 
  Filter, 
  UserX, 
  RefreshCw, 
  Edit, 
  Eye, 
  Download, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  Globe, 
  BarChart3, 
  Shield, 
  RotateCcw, 
  Award, 
  Zap, 
  MessageCircle
} from 'lucide-react'

interface AdminUser {
  username: string
  email: string
  created_at: string
  last_active: string
  progress: number
  current_level: number
  badges: string[]
  country: string
  language: string
  total_login_count: number
  total_session_time_seconds: number
  current_streak_days: number
  longest_streak_days: number
  last_lesson_completed: string
  current_page: string
  total_quiz_attempts: number
  total_games_played: number
  average_quiz_score: number
  best_quiz_score: number
}

interface UserProgress {
  id: string
  username: string
  lesson_id: string
  completed: boolean
  score: number
  completed_at: string
}

interface UserActivity {
  id: string
  username: string
  activity_type: string
  timestamp: string
  activity_details: any
}

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [countryFilter, setCountryFilter] = useState<string>('')
  const [languageFilter, setLanguageFilter] = useState<string>('')
  const [sortField, setSortField] = useState<keyof AdminUser>('last_active')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [userActivity, setUserActivity] = useState<UserActivity[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [resetConfirm, setResetConfirm] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [availableCountries, setAvailableCountries] = useState<{code: string, name: string}[]>([])
  const [availableLanguages, setAvailableLanguages] = useState<{code: string, name: string}[]>([])

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setRefreshing(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' })

      if (error) throw error
      
      setUsers(data || [])
      setFilteredUsers(data || [])
      
      // Extract unique countries and languages
      const countries = [...new Set(data?.map(user => user.country) || [])]
        .filter(Boolean)
        .map(code => {
          const countryNames: Record<string, string> = {
            'US': 'United States',
            'IN': 'India',
            'GB': 'United Kingdom',
            'CA': 'Canada',
            'AU': 'Australia',
            'DE': 'Germany',
            'FR': 'France',
            'ES': 'Spain',
            'JP': 'Japan',
            'BR': 'Brazil',
            'MX': 'Mexico',
            'CN': 'China'
          }
          return { code, name: countryNames[code] || code }
        })
      
      const languages = [...new Set(data?.map(user => user.language) || [])]
        .filter(Boolean)
        .map(code => {
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
          return { code, name: languageNames[code] || code }
        })
      
      setAvailableCountries(countries)
      setAvailableLanguages(languages)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [sortField, sortDirection])

  // Initial data load
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Apply filters and search
  useEffect(() => {
    let result = [...users]
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(user => 
        user.username.toLowerCase().includes(term) || 
        user.email.toLowerCase().includes(term)
      )
    }
    
    // Apply country filter
    if (countryFilter) {
      result = result.filter(user => user.country === countryFilter)
    }
    
    // Apply language filter
    if (languageFilter) {
      result = result.filter(user => user.language === languageFilter)
    }
    
    setFilteredUsers(result)
  }, [users, searchTerm, countryFilter, languageFilter])

  // Fetch user details
  const fetchUserDetails = async (username: string) => {
    setSelectedUser(username)
    
    try {
      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('username', username)
        .order('completed_at', { ascending: false })
      
      if (progressError) throw progressError
      setUserProgress(progressData || [])
      
      // Fetch user activity
      const { data: activityData, error: activityError } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('username', username)
        .order('timestamp', { ascending: false })
        .limit(50)
      
      if (activityError) throw activityError
      setUserActivity(activityData || [])
    } catch (error) {
      console.error('Error fetching user details:', error)
    }
  }

  // Delete user
  const handleDeleteUser = async (username: string) => {
    try {
      // Delete user progress first
      const { error: progressError } = await supabase
        .from('user_progress')
        .delete()
        .eq('username', username)

      if (progressError) throw progressError

      // Delete user activity logs
      const { error: activityError } = await supabase
        .from('user_activity_logs')
        .delete()
        .eq('username', username)

      if (activityError) throw activityError

      // Delete user sessions
      const { error: sessionError } = await supabase
        .from('user_sessions')
        .delete()
        .eq('username', username)

      if (sessionError) throw sessionError

      // Finally delete user
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('username', username)

      if (userError) throw userError

      setDeleteConfirm(null)
      setActionSuccess(`User ${username} has been deleted successfully`)
      
      // Refresh user list
      fetchUsers()
      
      // Clear selected user if it was deleted
      if (selectedUser === username) {
        setSelectedUser(null)
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setActionSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error deleting user:', error)
      setActionError(`Failed to delete user: ${error.message || 'Unknown error'}`)
      
      // Clear error message after 5 seconds
      setTimeout(() => setActionError(null), 5000)
    }
  }

  // Reset user progress
  const handleResetProgress = async (username: string) => {
    try {
      // Delete user progress
      const { error: progressError } = await supabase
        .from('user_progress')
        .delete()
        .eq('username', username)

      if (progressError) throw progressError

      // Reset user stats
      const { error: userError } = await supabase
        .from('users')
        .update({
          progress: 0,
          current_level: 1,
          badges: [],
          total_quiz_attempts: 0,
          total_games_played: 0,
          average_quiz_score: 0,
          best_quiz_score: 0,
          current_streak_days: 0
        })
        .eq('username', username)

      if (userError) throw userError

      setResetConfirm(null)
      setActionSuccess(`Progress for user ${username} has been reset successfully`)
      
      // Refresh user list and details
      fetchUsers()
      if (selectedUser === username) {
        fetchUserDetails(username)
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setActionSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error resetting user progress:', error)
      setActionError(`Failed to reset progress: ${error.message || 'Unknown error'}`)
      
      // Clear error message after 5 seconds
      setTimeout(() => setActionError(null), 5000)
    }
  }

  // Update user settings
  const handleUpdateUser = async (username: string, updates: Partial<AdminUser>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('username', username)

      if (error) throw error

      setActionSuccess(`User ${username} has been updated successfully`)
      
      // Refresh user list and details
      fetchUsers()
      if (selectedUser === username) {
        fetchUserDetails(username)
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setActionSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error updating user:', error)
      setActionError(`Failed to update user: ${error.message || 'Unknown error'}`)
      
      // Clear error message after 5 seconds
      setTimeout(() => setActionError(null), 5000)
    }
  }

  // Handle sort change
  const handleSortChange = (field: keyof AdminUser) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to descending
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  // Format time duration
  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
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

  // Get activity icon
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

  // Format activity type
  const formatActivityType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Export user data as CSV
  const exportUserData = () => {
    // Create CSV content
    const headers = [
      'Username', 'Email', 'Country', 'Language', 'Created At', 'Last Active',
      'Progress', 'Level', 'Streak', 'Total Logins', 'Session Time', 'Quiz Attempts', 'Avg Score'
    ]
    
    const rows = filteredUsers.map(user => [
      user.username,
      user.email,
      user.country,
      user.language,
      user.created_at,
      user.last_active,
      user.progress,
      user.current_level,
      user.current_streak_days,
      user.total_login_count,
      user.total_session_time_seconds,
      user.total_quiz_attempts,
      user.average_quiz_score
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `learn2go_users_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('')
    setCountryFilter('')
    setLanguageFilter('')
    setFilteredUsers(users)
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
              <Users className="h-8 w-8 text-blue-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                User Management
              </h2>
            </div>
            <p className="text-gray-600">
              Manage user accounts, view progress, and monitor activity
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchUsers}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
            
            <button
              onClick={exportUserData}
              className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm font-medium">Export CSV</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center space-x-2"
          >
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </motion.div>
        )}
        
        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2"
          >
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>{actionError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by username or email..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Country Filter */}
            <div className="relative">
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="appearance-none block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Countries</option>
                {availableCountries.map(country => (
                  <option key={country.code} value={country.code}>
                    {getCountryFlag(country.code)} {country.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            {/* Language Filter */}
            <div className="relative">
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="appearance-none block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Languages</option>
                {availableLanguages.map(language => (
                  <option key={language.code} value={language.code}>
                    {language.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <MessageCircle className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
              <span className="text-sm font-medium">Clear</span>
            </button>
          </div>
        </div>
        
        {/* Filter Stats */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredUsers.length} of {users.length} users
          {countryFilter && ` in ${getCountryFlag(countryFilter)} ${availableCountries.find(c => c.code === countryFilter)?.name || countryFilter}`}
          {languageFilter && ` speaking ${availableLanguages.find(l => l.code === languageFilter)?.name || languageFilter}`}
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-1 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Users</h3>
              <div className="text-sm text-gray-600">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[600px]">
              {filteredUsers.length === 0 ? (
                <div className="p-6 text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No users found</h4>
                  <p className="text-gray-600">Try adjusting your filters</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredUsers.map((user, index) => (
                    <motion.li
                      key={user.username}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index, duration: 0.2 }}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedUser === user.username ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => fetchUserDetails(user.username)}
                    >
                      <div className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.username}
                              </p>
                              {user.username === 'Hari' && (
                                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {user.email}
                            </p>
                            <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                              <span>{getCountryFlag(user.country)}</span>
                              <span>Level {user.current_level}</span>
                              <span>{user.progress}% complete</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-xs text-gray-500">
                              Last active:
                            </p>
                            <p className="text-xs font-medium text-gray-700">
                              {new Date(user.last_active).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </motion.div>

        {/* User Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="lg:col-span-2"
        >
          {selectedUser ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {/* User Profile Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                      {selectedUser.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                        <span>{selectedUser}</span>
                        {selectedUser === 'Hari' && (
                          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                            Admin
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-600">
                        {users.find(u => u.username === selectedUser)?.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {selectedUser !== 'Hari' && (
                      <>
                        <button
                          onClick={() => setResetConfirm(selectedUser)}
                          className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                          title="Reset Progress"
                        >
                          <RotateCcw className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(selectedUser)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Delete User"
                        >
                          <UserX className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* User Stats */}
              <div className="p-6 border-b border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4">User Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedUser && users.find(u => u.username === selectedUser) && (
                    <>
                      <div className="bg-blue-50 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Registered</span>
                        </div>
                        <div className="text-sm text-blue-900">
                          {formatDate(users.find(u => u.username === selectedUser)?.created_at || '')}
                        </div>
                      </div>
                      
                      <div className="bg-green-50 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <BarChart3 className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Progress</span>
                        </div>
                        <div className="text-sm text-green-900">
                          {users.find(u => u.username === selectedUser)?.progress || 0}% Complete
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Award className="h-5 w-5 text-purple-600" />
                          <span className="text-sm font-medium text-purple-800">Level</span>
                        </div>
                        <div className="text-sm text-purple-900">
                          Level {users.find(u => u.username === selectedUser)?.current_level || 1}
                        </div>
                      </div>
                      
                      <div className="bg-amber-50 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Zap className="h-5 w-5 text-amber-600" />
                          <span className="text-sm font-medium text-amber-800">Streak</span>
                        </div>
                        <div className="text-sm text-amber-900">
                          {users.find(u => u.username === selectedUser)?.current_streak_days || 0} days
                        </div>
                      </div>
                      
                      <div className="bg-red-50 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="h-5 w-5 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Last Active</span>
                        </div>
                        <div className="text-sm text-red-900">
                          {formatDate(users.find(u => u.username === selectedUser)?.last_active || '')}
                        </div>
                      </div>
                      
                      <div className="bg-indigo-50 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Globe className="h-5 w-5 text-indigo-600" />
                          <span className="text-sm font-medium text-indigo-800">Location</span>
                        </div>
                        <div className="text-sm text-indigo-900">
                          {getCountryFlag(users.find(u => u.username === selectedUser)?.country || 'US')} {users.find(u => u.username === selectedUser)?.country || 'US'} / {users.find(u => u.username === selectedUser)?.language || 'en'}
                        </div>
                      </div>
                      
                      <div className="bg-teal-50 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Award className="h-5 w-5 text-teal-600" />
                          <span className="text-sm font-medium text-teal-800">Quiz Score</span>
                        </div>
                        <div className="text-sm text-teal-900">
                          Avg: {users.find(u => u.username === selectedUser)?.average_quiz_score || 0}% / Best: {users.find(u => u.username === selectedUser)?.best_quiz_score || 0}%
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="h-5 w-5 text-gray-600" />
                          <span className="text-sm font-medium text-gray-800">Total Time</span>
                        </div>
                        <div className="text-sm text-gray-900">
                          {formatDuration(users.find(u => u.username === selectedUser)?.total_session_time_seconds || 0)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* User Progress */}
              <div className="p-6 border-b border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Learning Progress</h4>
                {userProgress.length === 0 ? (
                  <div className="text-center py-6">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h5 className="text-lg font-medium text-gray-900 mb-2">No progress data</h5>
                    <p className="text-gray-600">This user hasn't completed any lessons yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Lesson ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Completed At
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userProgress.map((progress, index) => (
                          <tr key={progress.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {progress.lesson_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {progress.completed ? (
                                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                  Completed
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                  In Progress
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {progress.score}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(progress.completed_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* User Activity */}
              <div className="p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h4>
                {userActivity.length === 0 ? (
                  <div className="text-center py-6">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h5 className="text-lg font-medium text-gray-900 mb-2">No activity data</h5>
                    <p className="text-gray-600">No recent activity has been recorded for this user.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Activity
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
                        {userActivity.map((activity, index) => (
                          <tr key={activity.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                {getActivityIcon(activity.activity_type)}
                                <span className="text-sm font-medium text-gray-900">
                                  {formatActivityType(activity.activity_type)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {activity.activity_details ? JSON.stringify(activity.activity_details) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(activity.timestamp)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Select a User</h3>
              <p className="text-gray-600 mb-6">
                Click on a user from the list to view detailed information and manage their account.
              </p>
              <div className="flex justify-center">
                <div className="bg-blue-50 rounded-xl p-6 max-w-md text-left">
                  <h4 className="flex items-center space-x-2 text-blue-800 font-bold mb-3">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span>Admin Actions</span>
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li className="flex items-start space-x-2">
                      <Eye className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span>View detailed user statistics and progress</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Edit className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span>Edit user settings and preferences</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <RotateCcw className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span>Reset user progress if needed</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Trash2 className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span>Remove inactive or problematic accounts</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Deletion</h3>
                <p className="text-gray-600">
                  Are you sure you want to delete user <span className="font-bold">{deleteConfirm}</span>? This action cannot be undone and will remove all user data.
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  Delete User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Progress Confirmation Modal */}
      <AnimatePresence>
        {resetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <RotateCcw className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Reset User Progress</h3>
                <p className="text-gray-600">
                  Are you sure you want to reset all progress for user <span className="font-bold">{resetConfirm}</span>? This will delete all lesson completions, quiz scores, and reset their level to 1.
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setResetConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleResetProgress(resetConfirm)}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors"
                >
                  Reset Progress
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminUserManagement