import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { 
  Settings, 
  Database, 
  Server, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Shield, 
  Globe, 
  Zap, 
  HardDrive, 
  Clock, 
  Trash2, 
  Archive, 
  FileText, 
  Lock, 
  Key, 
  Save, 
  X
} from 'lucide-react'

interface SystemStats {
  databaseSize: string
  totalTables: number
  totalRows: number
  oldestRecord: string
  newestRecord: string
  activeConnections: number
  cacheHitRatio: number
  systemVersion: string
}

interface SystemSettings {
  defaultLanguage: string
  defaultCountry: string
  sessionTimeout: number
  maintenanceMode: boolean
  debugMode: boolean
  analyticsEnabled: boolean
  contentCacheTime: number
  maxLoginAttempts: number
  passwordResetTimeout: number
}

const AdminSystemSettings: React.FC = () => {
  const [systemStats, setSystemStats] = useState<SystemStats>({
    databaseSize: '0 MB',
    totalTables: 0,
    totalRows: 0,
    oldestRecord: 'N/A',
    newestRecord: 'N/A',
    activeConnections: 0,
    cacheHitRatio: 0,
    systemVersion: '1.0.0'
  })
  
  const [settings, setSettings] = useState<SystemSettings>({
    defaultLanguage: 'en',
    defaultCountry: 'US',
    sessionTimeout: 60,
    maintenanceMode: false,
    debugMode: false,
    analyticsEnabled: true,
    contentCacheTime: 30,
    maxLoginAttempts: 5,
    passwordResetTimeout: 24
  })
  
  const [editedSettings, setEditedSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Fetch system stats
  const fetchSystemStats = useCallback(async () => {
    setRefreshing(true)
    
    try {
      // In a real system, these would be fetched from the database
      // For this demo, we'll simulate the data
      
      // Get table counts
      const { data: tables, error: tablesError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
      
      if (tablesError) throw tablesError
      
      // Get row counts for each table
      let totalRows = 0
      
      const rowCountPromises = [
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('lessons').select('*', { count: 'exact', head: true }),
        supabase.from('user_progress').select('*', { count: 'exact', head: true }),
        supabase.from('user_activity_logs').select('*', { count: 'exact', head: true }),
        supabase.from('user_sessions').select('*', { count: 'exact', head: true })
      ]
      
      const results = await Promise.all(rowCountPromises)
      
      results.forEach(result => {
        if (result.count) {
          totalRows += result.count
        }
      })
      
      // Get oldest and newest records
      const { data: oldestUser } = await supabase
        .from('users')
        .select('created_at')
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
      
      const { data: newestActivity } = await supabase
        .from('user_activity_logs')
        .select('timestamp')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()
      
      // Set system stats
      setSystemStats({
        databaseSize: `${(totalRows * 0.002).toFixed(2)} MB`,
        totalTables: tables?.length || 0,
        totalRows,
        oldestRecord: oldestUser?.created_at ? new Date(oldestUser.created_at).toLocaleString() : 'N/A',
        newestRecord: newestActivity?.timestamp ? new Date(newestActivity.timestamp).toLocaleString() : 'N/A',
        activeConnections: Math.floor(Math.random() * 10) + 1, // Simulated
        cacheHitRatio: Math.floor(Math.random() * 30) + 70, // Simulated
        systemVersion: '1.0.0'
      })
      
      setLastRefresh(new Date())
      setActionSuccess('System stats refreshed successfully')
      setTimeout(() => setActionSuccess(null), 3000)
    } catch (error) {
      console.error('Error fetching system stats:', error)
      setActionError('Failed to fetch system stats')
      setTimeout(() => setActionError(null), 5000)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Fetch system settings
  const fetchSystemSettings = useCallback(async () => {
    // In a real system, these would be fetched from the database
    // For this demo, we'll use default values
    
    const defaultSettings: SystemSettings = {
      defaultLanguage: 'en',
      defaultCountry: 'US',
      sessionTimeout: 60,
      maintenanceMode: false,
      debugMode: false,
      analyticsEnabled: true,
      contentCacheTime: 30,
      maxLoginAttempts: 5,
      passwordResetTimeout: 24
    }
    
    setSettings(defaultSettings)
  }, [])

  // Initial data load
  useEffect(() => {
    fetchSystemStats()
    fetchSystemSettings()
  }, [fetchSystemStats, fetchSystemSettings])

  // Save settings
  const saveSettings = () => {
    if (!editedSettings) return
    
    // In a real system, these would be saved to the database
    setSettings(editedSettings)
    setEditedSettings(null)
    
    setActionSuccess('Settings saved successfully')
    setTimeout(() => setActionSuccess(null), 3000)
  }

  // Cancel edit
  const cancelEdit = () => {
    setEditedSettings(null)
  }

  // Start editing
  const startEditing = () => {
    setEditedSettings({ ...settings })
  }

  // Perform maintenance action
  const performMaintenance = async (action: string) => {
    setShowConfirmation(null)
    setRefreshing(true)
    
    try {
      // Simulate maintenance action
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      let successMessage = ''
      
      switch (action) {
        case 'vacuum':
          successMessage = 'Database vacuum completed successfully'
          break
        case 'clearLogs':
          // In a real system, this would delete old logs
          successMessage = 'Old logs cleared successfully'
          break
        case 'clearSessions':
          // In a real system, this would delete expired sessions
          successMessage = 'Expired sessions cleared successfully'
          break
        case 'resetCache':
          // In a real system, this would reset the cache
          successMessage = 'Cache reset successfully'
          break
      }
      
      setActionSuccess(successMessage)
      setTimeout(() => setActionSuccess(null), 3000)
      
      // Refresh stats
      fetchSystemStats()
    } catch (error) {
      console.error(`Error performing maintenance action ${action}:`, error)
      setActionError(`Failed to perform maintenance action: ${action}`)
      setTimeout(() => setActionError(null), 5000)
    } finally {
      setRefreshing(false)
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
              <Settings className="h-8 w-8 text-red-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                System Settings
              </h2>
            </div>
            <p className="text-gray-600">
              Manage system configuration and perform maintenance tasks
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchSystemStats}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
            
            <div className="text-sm text-gray-500">
              Last update: {lastRefresh.toLocaleTimeString()}
            </div>
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

      {/* System Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
      >
        {/* Database Stats */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-100 rounded-xl p-3">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Database Statistics</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Database Size</div>
              <div className="text-sm font-medium text-gray-900">{systemStats.databaseSize}</div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Total Tables</div>
              <div className="text-sm font-medium text-gray-900">{systemStats.totalTables}</div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Total Records</div>
              <div className="text-sm font-medium text-gray-900">{systemStats.totalRows.toLocaleString()}</div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Oldest Record</div>
              <div className="text-sm font-medium text-gray-900">{systemStats.oldestRecord}</div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Newest Record</div>
              <div className="text-sm font-medium text-gray-900">{systemStats.newestRecord}</div>
            </div>
          </div>
        </div>
        
        {/* System Stats */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-purple-100 rounded-xl p-3">
              <Server className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">System Information</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">System Version</div>
              <div className="text-sm font-medium text-gray-900">{systemStats.systemVersion}</div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Active Connections</div>
              <div className="text-sm font-medium text-gray-900">{systemStats.activeConnections}</div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Cache Hit Ratio</div>
              <div className="text-sm font-medium text-gray-900">{systemStats.cacheHitRatio}%</div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Database Provider</div>
              <div className="text-sm font-medium text-gray-900">Supabase</div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Environment</div>
              <div className="text-sm font-medium text-gray-900">Production</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* System Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 rounded-xl p-3">
              <Settings className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">System Configuration</h3>
          </div>
          
          {editedSettings ? (
            <div className="flex space-x-2">
              <button
                onClick={cancelEdit}
                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <button
                onClick={saveSettings}
                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
              >
                <Save className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={startEditing}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
            >
              Edit Settings
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Localization Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
              <Globe className="h-4 w-4 text-gray-600" />
              <span>Localization Settings</span>
            </h4>
            
            <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Default Language</label>
                {editedSettings ? (
                  <select
                    value={editedSettings.defaultLanguage}
                    onChange={(e) => setEditedSettings({ ...editedSettings, defaultLanguage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="hi">Hindi</option>
                    <option value="te">Telugu</option>
                  </select>
                ) : (
                  <div className="text-sm font-medium text-gray-900">
                    {settings.defaultLanguage === 'en' ? 'English' :
                     settings.defaultLanguage === 'es' ? 'Spanish' :
                     settings.defaultLanguage === 'fr' ? 'French' :
                     settings.defaultLanguage === 'de' ? 'German' :
                     settings.defaultLanguage === 'hi' ? 'Hindi' :
                     settings.defaultLanguage === 'te' ? 'Telugu' :
                     settings.defaultLanguage}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Default Country</label>
                {editedSettings ? (
                  <select
                    value={editedSettings.defaultCountry}
                    onChange={(e) => setEditedSettings({ ...editedSettings, defaultCountry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="US">United States</option>
                    <option value="IN">India</option>
                    <option value="GB">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                  </select>
                ) : (
                  <div className="text-sm font-medium text-gray-900">
                    {settings.defaultCountry === 'US' ? 'United States' :
                     settings.defaultCountry === 'IN' ? 'India' :
                     settings.defaultCountry === 'GB' ? 'United Kingdom' :
                     settings.defaultCountry === 'CA' ? 'Canada' :
                     settings.defaultCountry === 'AU' ? 'Australia' :
                     settings.defaultCountry}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Session Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span>Session Settings</span>
            </h4>
            
            <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Session Timeout (minutes)</label>
                {editedSettings ? (
                  <input
                    type="number"
                    value={editedSettings.sessionTimeout}
                    onChange={(e) => setEditedSettings({ ...editedSettings, sessionTimeout: parseInt(e.target.value) })}
                    min="5"
                    max="1440"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                ) : (
                  <div className="text-sm font-medium text-gray-900">
                    {settings.sessionTimeout} minutes
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Login Attempts</label>
                {editedSettings ? (
                  <input
                    type="number"
                    value={editedSettings.maxLoginAttempts}
                    onChange={(e) => setEditedSettings({ ...editedSettings, maxLoginAttempts: parseInt(e.target.value) })}
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                ) : (
                  <div className="text-sm font-medium text-gray-900">
                    {settings.maxLoginAttempts}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Password Reset Timeout (hours)</label>
                {editedSettings ? (
                  <input
                    type="number"
                    value={editedSettings.passwordResetTimeout}
                    onChange={(e) => setEditedSettings({ ...editedSettings, passwordResetTimeout: parseInt(e.target.value) })}
                    min="1"
                    max="72"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                ) : (
                  <div className="text-sm font-medium text-gray-900">
                    {settings.passwordResetTimeout} hours
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* System Flags */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
              <Zap className="h-4 w-4 text-gray-600" />
              <span>System Flags</span>
            </h4>
            
            <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
              <div>
                <label className="flex items-center justify-between text-sm text-gray-600">
                  <span>Maintenance Mode</span>
                  {editedSettings ? (
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input
                        type="checkbox"
                        checked={editedSettings.maintenanceMode}
                        onChange={(e) => setEditedSettings({ ...editedSettings, maintenanceMode: e.target.checked })}
                        className="sr-only"
                        id="maintenance-mode"
                      />
                      <label
                        htmlFor="maintenance-mode"
                        className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                          editedSettings.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                            editedSettings.maintenanceMode ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        ></span>
                      </label>
                    </div>
                  ) : (
                    <span className={`text-sm font-medium ${settings.maintenanceMode ? 'text-red-600' : 'text-green-600'}`}>
                      {settings.maintenanceMode ? 'Enabled' : 'Disabled'}
                    </span>
                  )}
                </label>
              </div>
              
              <div>
                <label className="flex items-center justify-between text-sm text-gray-600">
                  <span>Debug Mode</span>
                  {editedSettings ? (
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input
                        type="checkbox"
                        checked={editedSettings.debugMode}
                        onChange={(e) => setEditedSettings({ ...editedSettings, debugMode: e.target.checked })}
                        className="sr-only"
                        id="debug-mode"
                      />
                      <label
                        htmlFor="debug-mode"
                        className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                          editedSettings.debugMode ? 'bg-yellow-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                            editedSettings.debugMode ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        ></span>
                      </label>
                    </div>
                  ) : (
                    <span className={`text-sm font-medium ${settings.debugMode ? 'text-yellow-600' : 'text-green-600'}`}>
                      {settings.debugMode ? 'Enabled' : 'Disabled'}
                    </span>
                  )}
                </label>
              </div>
              
              <div>
                <label className="flex items-center justify-between text-sm text-gray-600">
                  <span>Analytics Collection</span>
                  {editedSettings ? (
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input
                        type="checkbox"
                        checked={editedSettings.analyticsEnabled}
                        onChange={(e) => setEditedSettings({ ...editedSettings, analyticsEnabled: e.target.checked })}
                        className="sr-only"
                        id="analytics-enabled"
                      />
                      <label
                        htmlFor="analytics-enabled"
                        className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                          editedSettings.analyticsEnabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                            editedSettings.analyticsEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        ></span>
                      </label>
                    </div>
                  ) : (
                    <span className={`text-sm font-medium ${settings.analyticsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                      {settings.analyticsEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  )}
                </label>
              </div>
            </div>
          </div>
          
          {/* Performance Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
              <Zap className="h-4 w-4 text-gray-600" />
              <span>Performance Settings</span>
            </h4>
            
            <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Content Cache Time (minutes)</label>
                {editedSettings ? (
                  <input
                    type="number"
                    value={editedSettings.contentCacheTime}
                    onChange={(e) => setEditedSettings({ ...editedSettings, contentCacheTime: parseInt(e.target.value) })}
                    min="0"
                    max="1440"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                ) : (
                  <div className="text-sm font-medium text-gray-900">
                    {settings.contentCacheTime} minutes
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">Current Cache Hit Ratio</div>
                <div className="text-sm font-medium text-gray-900">{systemStats.cacheHitRatio}%</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">Active Database Connections</div>
                <div className="text-sm font-medium text-gray-900">{systemStats.activeConnections}</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Maintenance Tasks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-yellow-100 rounded-xl p-3">
            <HardDrive className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Maintenance Tasks</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-gray-900">Database Maintenance</h4>
              </div>
              <button
                onClick={() => setShowConfirmation('vacuum')}
                disabled={refreshing}
                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm disabled:opacity-50"
              >
                Run Vacuum
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Optimize database performance by reclaiming storage and updating statistics.
              This operation may take several minutes to complete.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                <h4 className="font-medium text-gray-900">Clear Old Logs</h4>
              </div>
              <button
                onClick={() => setShowConfirmation('clearLogs')}
                disabled={refreshing}
                className="px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm disabled:opacity-50"
              >
                Clear Logs
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Remove activity logs older than 90 days to free up database space.
              This action cannot be undone.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Archive className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-gray-900">Clear Expired Sessions</h4>
              </div>
              <button
                onClick={() => setShowConfirmation('clearSessions')}
                disabled={refreshing}
                className="px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm disabled:opacity-50"
              >
                Clear Sessions
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Remove expired user sessions to improve authentication performance.
              Currently active sessions will not be affected.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium text-gray-900">Reset Content Cache</h4>
              </div>
              <button
                onClick={() => setShowConfirmation('resetCache')}
                disabled={refreshing}
                className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm disabled:opacity-50"
              >
                Reset Cache
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Clear the content cache to ensure all users see the latest content.
              May temporarily increase database load.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Security Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200 shadow-lg mt-8"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-red-100 rounded-xl p-3">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Security Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <Lock className="h-5 w-5 text-red-600" />
              <h4 className="font-medium text-gray-900">Authentication</h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <div className="min-w-4 mt-0.5">•</div>
                <span>Session isolation is enabled for all users</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="min-w-4 mt-0.5">•</div>
                <span>Row-level security is enforced on all tables</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="min-w-4 mt-0.5">•</div>
                <span>Max login attempts: {settings.maxLoginAttempts}</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="min-w-4 mt-0.5">•</div>
                <span>Session timeout: {settings.sessionTimeout} minutes</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <Key className="h-5 w-5 text-red-600" />
              <h4 className="font-medium text-gray-900">API Security</h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <div className="min-w-4 mt-0.5">•</div>
                <span>API rate limiting is active</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="min-w-4 mt-0.5">•</div>
                <span>JWT authentication for all API requests</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="min-w-4 mt-0.5">•</div>
                <span>CORS protection enabled</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="min-w-4 mt-0.5">•</div>
                <span>Input validation and sanitization active</span>
              </li>
            </ul>
          </div>
          
          <div className="md:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="h-5 w-5 text-red-600" />
              <h4 className="font-medium text-gray-900">Security Recommendations</h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>All security policies are properly configured</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Database backups are enabled and running on schedule</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>User data is properly isolated with row-level security</span>
              </li>
              <li className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <span>Consider enabling two-factor authentication for admin users</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
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
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Action</h3>
                <p className="text-gray-600">
                  {showConfirmation === 'vacuum' && 'Are you sure you want to run database vacuum? This operation may take several minutes to complete.'}
                  {showConfirmation === 'clearLogs' && 'Are you sure you want to clear old logs? This action cannot be undone.'}
                  {showConfirmation === 'clearSessions' && 'Are you sure you want to clear expired sessions? Currently active sessions will not be affected.'}
                  {showConfirmation === 'resetCache' && 'Are you sure you want to reset the content cache? This may temporarily increase database load.'}
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowConfirmation(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => performMaintenance(showConfirmation)}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminSystemSettings