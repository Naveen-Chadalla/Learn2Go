import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import { dataPreloader } from '../services/dataPreloader'

interface UserProfile {
  username: string
  email: string
  country: string
  language: string
  progress: number
  current_level: number
  badges: string[]
  created_at: string
  last_active: string
  session_start: string
  session_end: string
}

interface Lesson {
  id: string
  title: string
  description: string
  content: string
  level: number
  order: number
  category: string
  quiz_questions: QuizQuestion[]
  country: string
  language: string
  created_at: string
  generated?: boolean
}

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct_answer: number
  explanation: string
}

interface UserProgress {
  id: string
  username: string
  lesson_id: string
  completed: boolean
  score: number
  completed_at: string
}

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  condition: string
  earned: boolean
  earned_at?: string
}

interface Game {
  id: string
  name: string
  description: string
  type: 'simulation' | 'quiz' | 'memory' | 'scenario'
  content: any
}

interface PreloadedData {
  userProfile: UserProfile | null
  lessons: Lesson[]
  userProgress: UserProgress[]
  badges: Badge[]
  games: Game[]
  analytics: {
    totalQuizzes: number
    averageScore: number
    bestScore: number
    studyTime: string
    completionRate: number
    totalLessons: number
    lessonsCompleted: number
    streak: number
    lastActivity: string | null
  }
  countryTheme: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    roadSigns: string[]
    trafficRules: string[]
    culturalElements: string[]
    emergencyNumber: string
    currency: string
  }
  images: string[]
  animations: any[]
  languageContent: any
}

interface DataContextType {
  data: PreloadedData
  loading: boolean
  progress: number
  error: string | null
  refreshData: () => Promise<void>
  updateUserProgress: (lessonId: string, score: number, completed: boolean) => Promise<void>
  isDataReady: boolean
  cacheStats: any
  clearCache: () => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export const useData = () => {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

const defaultData: PreloadedData = {
  userProfile: null,
  lessons: [],
  userProgress: [],
  badges: [],
  games: [],
  analytics: {
    totalQuizzes: 0,
    averageScore: 0,
    bestScore: 0,
    studyTime: '0h 0m',
    completionRate: 0,
    totalLessons: 0,
    lessonsCompleted: 0,
    streak: 0,
    lastActivity: null
  },
  countryTheme: {
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
    accentColor: '#FFFFFF',
    roadSigns: [],
    trafficRules: [],
    culturalElements: [],
    emergencyNumber: '911',
    currency: '$'
  },
  images: [],
  animations: [],
  languageContent: {}
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [data, setData] = useState<PreloadedData>(defaultData)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isDataReady, setIsDataReady] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Enhanced session isolation for data context
  const clearUserData = useCallback(() => {
    const currentUser = user?.user_metadata?.username || user?.email?.split('@')[0]
    
    if (currentUser) {
      // Clear user-specific data cache
      const userCacheKey = `data-${currentUser.toLowerCase()}`
      sessionStorage.removeItem(userCacheKey)
      localStorage.removeItem(`learn2go-${currentUser}-data`)
      
      console.log(`[DATA] Cleared data cache for user: ${currentUser}`)
    }
    
    // Reset data state
    setData(defaultData)
    setIsDataReady(false)
    setProgress(0)
    setInitialized(false)
    setLoading(false)
  }, [user])

  // STABLE: Enhanced data loading with session isolation and no blinking
  const loadData = useCallback(async () => {
    if (!user || !isAuthenticated || initialized) {
      return
    }

    const currentUser = user.user_metadata?.username || user.email?.split('@')[0]
    if (!currentUser) {
      console.error('[DATA] No valid user identifier found')
      return
    }

    console.log(`[DATA] Starting stable isolated data load for user: ${currentUser}`)
    setLoading(true)
    setError(null)
    setProgress(0)
    
    try {
      // Check for cached data with user isolation
      const userCacheKey = `data-${currentUser.toLowerCase()}`
      const cachedData = sessionStorage.getItem(userCacheKey)
      
      if (cachedData) {
        try {
          const parsedCache = JSON.parse(cachedData)
          const cacheAge = Date.now() - parsedCache.timestamp
          
          // Use cache if less than 5 minutes old
          if (cacheAge < 5 * 60 * 1000) {
            console.log(`[DATA] Using cached data for user: ${currentUser}`)
            setData(parsedCache.data)
            setProgress(100)
            setIsDataReady(true)
            setInitialized(true)
            setLoading(false)
            return
          }
        } catch (cacheError) {
          console.warn('[DATA] Cache parse error:', cacheError)
        }
      }

      // Set up progress callback with user isolation
      dataPreloader.setProgressCallback((progressInfo) => {
        setProgress(progressInfo.percentage)
      })

      // Load all data using the preloader with user isolation
      const preloadedData = await dataPreloader.preloadAllData(user)
      
      // Cache the data with user isolation
      const cacheData = {
        data: preloadedData,
        timestamp: Date.now(),
        user: currentUser
      }
      sessionStorage.setItem(userCacheKey, JSON.stringify(cacheData))
      
      // Set the loaded data
      setData(preloadedData)
      setProgress(100)
      setIsDataReady(true)
      setInitialized(true)
      setLoading(false)
      
      console.log(`[DATA] Stable data load completed successfully for user: ${currentUser}`)

    } catch (error) {
      console.error(`[DATA] Data load failed for user ${currentUser}:`, error)
      setError('Failed to load data')
      setLoading(false)
      
      // Set minimal fallback data with user isolation
      setData({
        ...defaultData,
        userProfile: {
          username: currentUser,
          email: user.email || 'user@example.com',
          country: user.user_metadata?.country || 'US',
          language: user.user_metadata?.language || 'en',
          progress: 0,
          current_level: 1,
          badges: [],
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
          session_start: new Date().toISOString(),
          session_end: ''
        }
      })
      setIsDataReady(true)
      setInitialized(true)
    }
  }, [user, isAuthenticated, initialized])

  const refreshData = useCallback(async () => {
    console.log('[DATA] Manual refresh requested with session isolation')
    const currentUser = user?.user_metadata?.username || user?.email?.split('@')[0]
    
    if (currentUser) {
      // Clear user-specific cache
      const userCacheKey = `data-${currentUser.toLowerCase()}`
      sessionStorage.removeItem(userCacheKey)
    }
    
    setInitialized(false)
    await loadData()
  }, [loadData, user])

  const updateUserProgress = useCallback(async (lessonId: string, score: number, completed: boolean) => {
    if (!user) return

    try {
      const username = user.user_metadata?.username || user.email?.split('@')[0] || user.email

      const { error } = await supabase
        .from('user_progress')
        .upsert({
          username,
          lesson_id: lessonId,
          completed,
          score,
          completed_at: new Date().toISOString()
        })

      if (error) throw error

      // Update local data with session isolation
      setData(prev => {
        const existingIndex = prev.userProgress.findIndex(p => p.lesson_id === lessonId)
        const newProgress = {
          id: `${username}-${lessonId}`,
          username,
          lesson_id: lessonId,
          completed,
          score,
          completed_at: new Date().toISOString()
        }

        const updatedProgress = [...prev.userProgress]
        if (existingIndex >= 0) {
          updatedProgress[existingIndex] = newProgress
        } else {
          updatedProgress.push(newProgress)
        }

        // Recalculate analytics
        const completedProgress = updatedProgress.filter(p => p.completed)
        const scores = completedProgress.map(p => p.score)
        
        const updatedAnalytics = {
          totalQuizzes: completedProgress.length,
          averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
          bestScore: scores.length > 0 ? Math.max(...scores) : 0,
          studyTime: `${Math.floor(completedProgress.length * 0.25)}h ${(completedProgress.length * 15) % 60}m`,
          completionRate: prev.lessons.length > 0 ? Math.round((completedProgress.length / prev.lessons.length) * 100) : 0,
          totalLessons: prev.lessons.length,
          lessonsCompleted: completedProgress.length,
          streak: prev.analytics.streak,
          lastActivity: updatedProgress.length > 0 ? updatedProgress[0].completed_at : null
        }

        const updatedData = {
          ...prev,
          userProgress: updatedProgress,
          analytics: updatedAnalytics
        }

        // Update cache with user isolation
        const currentUser = user.user_metadata?.username || user.email?.split('@')[0]
        if (currentUser) {
          const userCacheKey = `data-${currentUser.toLowerCase()}`
          const cacheData = {
            data: updatedData,
            timestamp: Date.now(),
            user: currentUser
          }
          sessionStorage.setItem(userCacheKey, JSON.stringify(cacheData))
        }

        return updatedData
      })

    } catch (error) {
      console.error('Error updating user progress:', error)
      throw error
    }
  }, [user])

  const clearCache = useCallback(() => {
    dataPreloader.clearCache()
    
    // Clear user-specific cache
    const currentUser = user?.user_metadata?.username || user?.email?.split('@')[0]
    if (currentUser) {
      const userCacheKey = `data-${currentUser.toLowerCase()}`
      sessionStorage.removeItem(userCacheKey)
    }
    
    console.log('[DATA] Cache cleared with session isolation')
  }, [user])

  const getCacheStats = useCallback(() => {
    return dataPreloader.getCacheStats()
  }, [])

  // STABLE: Initialize data when user becomes authenticated with session isolation and no blinking
  useEffect(() => {
    if (isAuthenticated && user && !initialized) {
      // Verify user session isolation
      const currentUser = user.user_metadata?.username || user.email?.split('@')[0]
      const sessionUser = sessionStorage.getItem('learn2go-current-user')
      
      if (sessionUser && sessionUser !== currentUser?.toLowerCase()) {
        console.log('[DATA] Different user detected, clearing previous data')
        clearUserData()
      }
      
      // STABLE: Load data immediately without timeout to prevent blinking
      loadData()
    } else if (!isAuthenticated) {
      // Reset everything when user logs out with session isolation
      clearUserData()
    }
  }, [isAuthenticated, user, initialized, loadData, clearUserData])

  const value = {
    data,
    loading,
    progress,
    error,
    refreshData,
    updateUserProgress,
    isDataReady,
    cacheStats: getCacheStats(),
    clearCache
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}