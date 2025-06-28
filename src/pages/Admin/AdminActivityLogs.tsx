import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { 
  ListChecks, 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  Calendar, 
  User, 
  Activity, 
  Eye, 
  BookOpen, 
  CheckCircle, 
  Award, 
  Clock, 
  Zap, 
  MessageCircle, 
  AlertTriangle, 
  FileText, 
  X, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react'

interface ActivityLog {
  id: string
  username: string
  activity_type: string
  activity_details: any
  timestamp: string
  session_id: string
  ip_address: string
  user_agent: string
  page_url: string
  duration_seconds: number
  score: number
  metadata: any
}

const AdminActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [usernameFilter, setUsernameFilter] = useState('')
  const [activityTypeFilter, setActivityTypeFilter] = useState('')
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('week')
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [availableUsers, setAvailableUsers] = useState<string[]>([])
  const [availableActivityTypes, setAvailableActivityTypes] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const logsPerPage = 50

  // Fetch activity logs
  const fetchActivityLogs = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    
    try {
      // Calculate date range
      const now = new Date()
      let startDate: Date | null = null
      
      if (dateFilter === 'today') {
        startDate = new Date(now)
        startDate.setHours(0, 0, 0, 0)
      } else if (dateFilter === 'week') {
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
      } else if (dateFilter === 'month') {
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
      }
      
      // Build query
      let query = supabase
        .from('user_activity_logs')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false })
      
      // Apply date filter
      if (startDate) {
        query = query.gte('timestamp', startDate.toISOString())
      }
      
      // Apply username filter
      if (usernameFilter) {
        query = query.eq('username', usernameFilter)
      }
      
      // Apply activity type filter
      if (activityTypeFilter) {
        query = query.eq('activity_type', activityTypeFilter)
      }
      
      // Apply pagination
      const from = (currentPage - 1) * logsPerPage
      const to = from + logsPerPage - 1
      query = query.range(from, to)
      
      // Execute query
      const { data, error, count } = await query
      
      if (error) throw error
      
      setLogs(data || [])
      setFilteredLogs(data || [])
      
      // Calculate total pages
      if (count) {
        setTotalPages(Math.ceil(count / logsPerPage))
      }
      
      // Fetch unique usernames and activity types for filters
      const { data: usersData } = await supabase
        .from('user_activity_logs')
        .select('username')
        .order('username', { ascending: true })
      
      const { data: activityTypesData } = await supabase
        .from('user_activity_logs')
        .select('activity_type')
        .order('activity_type', { ascending: true })
      
      if (usersData) {
        const uniqueUsers = [...new Set(usersData.map(log => log.username))]
        setAvailableUsers(uniqueUsers)
      }
      
      if (activityTypesData) {
        const uniqueTypes = [...new Set(activityTypesData.map(log => log.activity_type))]
        setAvailableActivityTypes(uniqueTypes)
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error)
      setError('Failed to load activity logs. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [dateFilter, usernameFilter, activityTypeFilter, currentPage])

  // Initial data load
  useEffect(() => {
    fetchActivityLogs()
  }, [fetchActivityLogs])

  // Apply search filter
  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const filtered = logs.filter(log => 
        log.username.toLowerCase().includes(term) || 
        log.activity_type.toLowerCase().includes(term) ||
        (log.page_url && log.page_url.toLowerCase().includes(term)) ||
        (log.ip_address && log.ip_address.toLowerCase().includes(term))
      )
      setFilteredLogs(filtered)
    } else {
      setFilteredLogs(logs)
    }
  }, [logs, searchTerm])

  // Export logs as CSV
  const exportLogs = () => {
    // Create CSV content
    const headers = [
      'ID', 'Username', 'Activity Type', 'Timestamp', 'Session ID', 
      'IP Address', 'Page URL', 'Duration (s)', 'Score', 'Details'
    ]
    
    const rows = filteredLogs.map(log => [
      log.id,
      log.username,
      log.activity_type,
      log.timestamp,
      log.session_id || '',
      log.ip_address || '',
      log.page_url || '',
      log.duration_seconds || '',
      log.score || '',
      JSON.stringify(log.activity_details || {})
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
    link.setAttribute('download', `learn2go_activity_logs_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('')
    setUsernameFilter('')
    setActivityTypeFilter('')
    setDateFilter('week')
    setCurrentPage(1)
  }

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  // Format activity type
  const formatActivityType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
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

  // Get activity details
  const getActivityDetails = (activity: ActivityLog) => {
    const details = activity.activity_details || {}
    
    switch (activity.activity_type) {
      case 'lesson_start':
      case 'lesson_complete':
        return details.lesson_id ? `Lesson ID: ${details.lesson_id}` : 'Unknown lesson'
      
      case 'quiz_attempt':
        return `Score: ${details.score || 0}/${details.total_questions || 0}`
      
      case 'page_view':
        return details.page_path || activity.page_url || 'Unknown page'
      
      case 'game_play':
        return `Game: ${details.game_type || 'Unknown'}, Score: ${details.score || 0}`
      
      default:
        return ''
    }
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
              <ListChecks className="h-8 w-8 text-gray-700" />
              <h2 className="text-3xl font-bold text-gray-900">
                Activity Logs
              </h2>
            </div>
            <p className="text-gray-600">
              View and analyze user activity across the platform
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchActivityLogs}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
            
            <button
              onClick={exportLogs}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm font-medium">Export CSV</span>
            </button>
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
              placeholder="Search logs..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Username Filter */}
            <div className="relative">
              <select
                value={usernameFilter}
                onChange={(e) => {
                  setUsernameFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="appearance-none block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="">All Users</option>
                {availableUsers.map(username => (
                  <option key={username} value={username}>
                    {username}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            {/* Activity Type Filter */}
            <div className="relative">
              <select
                value={activityTypeFilter}
                onChange={(e) => {
                  setActivityTypeFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="appearance-none block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="">All Activity Types</option>
                {availableActivityTypes.map(type => (
                  <option key={type} value={type}>
                    {formatActivityType(type)}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Activity className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            {/* Date Filter */}
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value as any)
                  setCurrentPage(1)
                }}
                className="appearance-none block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
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
          Showing {filteredLogs.length} logs
          {usernameFilter && ` for user "${usernameFilter}"`}
          {activityTypeFilter && ` of type "${formatActivityType(activityTypeFilter)}"`}
          {dateFilter === 'today' && ' from today'}
          {dateFilter === 'week' && ' from the last 7 days'}
          {dateFilter === 'month' && ' from the last 30 days'}
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      </motion.div>

      {/* Activity Logs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Activity Log</h3>
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading activity logs...</p>
          </div>
        ) : (
          <>
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No activity logs found</h4>
                <p className="text-gray-600">Try adjusting your filters or search criteria</p>
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
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Session
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLogs.map((log, index) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getActivityIcon(log.activity_type)}
                            <span className="text-sm font-medium text-gray-900">
                              {formatActivityType(log.activity_type)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{log.username}</div>
                          {log.ip_address && (
                            <div className="text-xs text-gray-500">{log.ip_address}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {getActivityDetails(log)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs text-gray-500 truncate max-w-[100px]">
                            {log.session_id || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm">Previous</span>
            </button>
            
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </motion.div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                {getActivityIcon(selectedLog.activity_type)}
                <span>{formatActivityType(selectedLog.activity_type)}</span>
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Basic Information</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">ID:</span>
                    <span className="text-sm text-gray-900">{selectedLog.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Username:</span>
                    <span className="text-sm text-gray-900">{selectedLog.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Activity Type:</span>
                    <span className="text-sm text-gray-900">{formatActivityType(selectedLog.activity_type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Timestamp:</span>
                    <span className="text-sm text-gray-900">{formatDate(selectedLog.timestamp)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Session Information</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Session ID:</span>
                    <span className="text-sm text-gray-900 truncate max-w-[200px]">{selectedLog.session_id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">IP Address:</span>
                    <span className="text-sm text-gray-900">{selectedLog.ip_address || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Page URL:</span>
                    <span className="text-sm text-gray-900 truncate max-w-[200px]">{selectedLog.page_url || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="text-sm text-gray-900">{selectedLog.duration_seconds ? `${selectedLog.duration_seconds}s` : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-700 mb-2">User Agent</div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-900 break-words">{selectedLog.user_agent || 'N/A'}</p>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Activity Details</div>
              <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto">
                <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                  {JSON.stringify(selectedLog.activity_details || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminActivityLogs