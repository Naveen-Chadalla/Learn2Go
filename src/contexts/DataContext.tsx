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

  // Load data using dataPreloader service
  const loadData = useCallback(async () => {
    if (!user || !isAuthenticated || initialized) {
      return
    }

    console.log('[DATA] Starting data load with preloader...')
    setLoading(true)
    setError(null)
    setProgress(0)
    
    try {
      // Set up progress callback
      dataPreloader.setProgressCallback((progressInfo) => {
        setProgress(progressInfo.percentage)
      })

      // Load all data using the preloader
      const preloadedData = await dataPreloader.preloadAllData(user)
      
      // Set the loaded data
      setData(preloadedData)
      setProgress(100)
      setIsDataReady(true)
      setInitialized(true)
      setLoading(false)
      
      console.log('[DATA] Data preload completed successfully')

    } catch (error) {
      console.error('[DATA] Data load failed:', error)
      setError('Failed to load data')
      setLoading(false)
      
      // Set minimal fallback data
      setData({
        ...defaultData,
        userProfile: {
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
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
    }
  }, [user, isAuthenticated, initialized])

  const refreshData = useCallback(async () => {
    console.log('[DATA] Manual refresh requested')
    setInitialized(false)
    await loadData()
  }, [loadData])

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
        }, {
          onConflict: 'username,lesson_id'
        })

      if (error) throw error

      // Update local data
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

        // Update user profile progress
        const userProfile = prev.userProfile ? {
          ...prev.userProfile,
          progress: Math.min(100, Math.round((completedProgress.length / Math.max(prev.lessons.length, 1)) * 100)),
          current_level: Math.max(1, Math.floor(completedProgress.length / 3) + 1)
        } : null

        return {
          ...prev,
          userProgress: updatedProgress,
          analytics: updatedAnalytics,
          userProfile
        }
      })

      // Also update the user's progress in the database
      if (completed) {
        try {
          const { data: userProfile } = await supabase
            .from('users')
            .select('progress, current_level')
            .eq('username', username)
            .single()
          
          if (userProfile) {
            const completedLessons = data.userProgress.filter(p => p.completed).length + (
              data.userProgress.findIndex(p => p.lesson_id === lessonId && p.completed) === -1 ? 1 : 0
            )
            
            const totalLessons = Math.max(data.lessons.length, 1)
            const newProgress = Math.min(100, Math.round((completedLessons / totalLessons) * 100))
            const newLevel = Math.max(1, Math.floor(completedLessons / 3) + 1)
            
            await supabase
              .from('users')
              .update({
                progress: newProgress,
                current_level: newLevel,
                last_lesson_completed: lessonId,
                last_active: new Date().toISOString()
              })
              .eq('username', username)
          }
        } catch (updateError) {
          console.error('Error updating user profile progress:', updateError)
          // Non-critical error, don't throw
        }
      }

    } catch (error) {
      console.error('Error updating user progress:', error)
      throw error
    }
  }, [user, data.userProgress, data.lessons.length])

  const clearCache = useCallback(() => {
    dataPreloader.clearCache()
    console.log('[DATA] Cache cleared')
  }, [])

  const getCacheStats = useCallback(() => {
    return dataPreloader.getCacheStats()
  }, [])

  // Initialize data when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && user && !initialized) {
      // Use setTimeout to prevent any potential race conditions
      setTimeout(() => {
        loadData()
      }, 0)
    } else if (!isAuthenticated) {
      // Reset everything when user logs out
      setData(defaultData)
      setIsDataReady(false)
      setProgress(0)
      setInitialized(false)
      setLoading(false)
    }
  }, [isAuthenticated, user, initialized, loadData])

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