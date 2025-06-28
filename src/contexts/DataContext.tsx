import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'

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

const getDefaultData = (user: any): PreloadedData => {
  const profile = {
    username: user?.user_metadata?.username || user?.email?.split('@')[0] || 'user',
    email: user?.email || 'user@example.com',
    country: user?.user_metadata?.country || 'US',
    language: user?.user_metadata?.language || 'en',
    progress: 0,
    current_level: 1,
    badges: [],
    created_at: new Date().toISOString(),
    last_active: new Date().toISOString(),
    session_start: new Date().toISOString(),
    session_end: ''
  }

  const lessons = [
    {
      id: 'traffic-signals-101',
      title: 'Traffic Signals and Signs',
      description: 'Learn about traffic lights, stop signs, and road markings for safe driving.',
      content: `Traffic signals are essential for safe road navigation. Understanding their meanings can prevent accidents and save lives.

**Traffic Lights:**
• Red Light: Complete stop required - wait behind the stop line
• Yellow Light: Prepare to stop safely - don't speed up to "beat" the light
• Green Light: Proceed with caution after checking for pedestrians and cross traffic

**Stop Signs:**
• Always come to a complete stop at the stop line or before the crosswalk
• Look both ways before proceeding
• Yield to pedestrians and cross traffic
• The first vehicle to arrive has the right of way

**Road Markings:**
• Solid white lines: No lane changes allowed
• Dashed white lines: Lane changes allowed when safe
• Yellow lines: Separate traffic going in opposite directions
• Crosswalks: Designated pedestrian crossing areas

**Important Safety Tips:**
• Always look both ways even on green lights
• Be extra cautious in bad weather conditions
• Watch for pedestrians, especially children and elderly
• Never run red lights or roll through stop signs

Remember: Following traffic signals is not just the law—it's about protecting yourself and others on the road.`,
      level: 1,
      order: 1,
      category: 'basics',
      quiz_questions: [
        {
          id: '1',
          question: 'What should you do when you see a yellow traffic light?',
          options: ['Speed up to get through', 'Prepare to stop safely', 'Honk your horn', 'Change lanes immediately'],
          correct_answer: 1,
          explanation: 'Yellow light means prepare to stop. You should slow down and prepare to stop safely unless you are too close to stop safely.'
        },
        {
          id: '2',
          question: 'At a stop sign, you must:',
          options: ['Slow down and proceed if clear', 'Come to a complete stop', 'Stop only if cars are coming', 'Yield and continue'],
          correct_answer: 1,
          explanation: 'You must come to a complete stop at every stop sign, regardless of traffic conditions.'
        },
        {
          id: '3',
          question: 'What does a solid white line on the road mean?',
          options: ['Passing is allowed', 'No lane changes allowed', 'Speed up zone', 'Parking area'],
          correct_answer: 1,
          explanation: 'Solid white lines indicate that lane changes are not allowed in that area.'
        }
      ],
      country: profile.country,
      language: profile.language,
      created_at: new Date().toISOString()
    },
    {
      id: 'pedestrian-safety-101',
      title: 'Pedestrian Safety',
      description: 'Essential rules for pedestrian and driver interactions to prevent accidents.',
      content: `Pedestrian safety is a shared responsibility between drivers and pedestrians. Understanding these rules can prevent tragic accidents.

**For Drivers:**
• Always yield to pedestrians at crosswalks, whether marked or unmarked
• Look for pedestrians before turning, especially right turns
• Slow down in school zones and residential areas
• Be extra careful in bad weather conditions when visibility is reduced
• Never pass vehicles stopped at crosswalks

**For Pedestrians:**
• Use designated crosswalks when available
• Look both ways before crossing, even at traffic lights
• Make eye contact with drivers when possible to ensure they see you
• Stay visible with bright clothing, especially at night
• Avoid distractions like phones while crossing

**Special Situations:**
• School zones: Reduced speed limits during school hours
• Construction zones: Follow flaggers and posted signs carefully
• Emergency vehicles: Both drivers and pedestrians must yield
• Parking lots: Extra caution needed as visibility may be limited

**Night Safety:**
• Wear reflective or bright colored clothing
• Use flashlights or phone lights when crossing
• Stay in well-lit areas when possible
• Be extra cautious as driver visibility is reduced

Working together, we can make our roads safer for everyone. Remember, a moment of caution can prevent a lifetime of regret.`,
      level: 1,
      order: 2,
      category: 'safety',
      quiz_questions: [
        {
          id: '1',
          question: 'When should drivers yield to pedestrians?',
          options: ['Only at traffic lights', 'At all crosswalks', 'Never', 'Only when convenient'],
          correct_answer: 1,
          explanation: 'Drivers must always yield to pedestrians at crosswalks, whether marked or unmarked.'
        },
        {
          id: '2',
          question: 'What should pedestrians do before crossing a street?',
          options: ['Run quickly across', 'Look both ways', 'Use their phone', 'Close their eyes'],
          correct_answer: 1,
          explanation: 'Pedestrians should always look both ways and check for oncoming traffic before crossing.'
        },
        {
          id: '3',
          question: 'How can pedestrians stay visible at night?',
          options: ['Wear dark clothes', 'Wear bright/reflective clothing', 'Walk in shadows', 'Avoid walking'],
          correct_answer: 1,
          explanation: 'Bright and reflective clothing helps drivers see pedestrians in low light conditions.'
        }
      ],
      country: profile.country,
      language: profile.language,
      created_at: new Date().toISOString()
    },
    {
      id: 'emergency-procedures-101',
      title: 'Emergency Procedures',
      description: 'What to do in traffic emergencies and accident situations.',
      content: `Knowing how to handle emergencies can save lives and prevent further accidents.

**Emergency Numbers:**
• ${profile.country === 'IN' ? '112' : profile.country === 'US' ? '911' : '999'} - Main emergency number
• Keep your phone charged and accessible
• Know your location to help emergency responders

**Vehicle Breakdown:**
• Pull over safely to the shoulder or side of the road
• Turn on hazard lights immediately
• Exit vehicle away from traffic if safe to do so
• Call for help and wait in a safe location
• Keep an emergency kit in your vehicle

**In Case of Accidents:**
• Check for injuries (yourself and others)
• Call emergency services immediately
• Move to safety if possible, but don't move injured persons
• Document the scene with photos if safe to do so
• Exchange information with other parties
• Contact your insurance company

**Emergency Kit Essentials:**
• First aid supplies
• Flashlight and batteries
• Emergency contact numbers
• Basic tools and spare tire
• Water and non-perishable snacks
• Blanket and warm clothing

**When Emergency Vehicles Approach:**
• Pull over to the right side of the road
• Come to a complete stop
• Stay stopped until the emergency vehicle passes
• Never follow emergency vehicles closely

Remember: Stay calm, prioritize safety over speed, and always call for professional help when needed.`,
      level: 2,
      order: 3,
      category: 'emergency',
      quiz_questions: [
        {
          id: '1',
          question: `What is the emergency number in ${profile.country === 'IN' ? 'India' : profile.country === 'US' ? 'the United States' : 'your country'}?`,
          options: ['911', '112', '999', '108'],
          correct_answer: profile.country === 'IN' ? 1 : profile.country === 'US' ? 0 : 2,
          explanation: `The emergency number in ${profile.country === 'IN' ? 'India' : profile.country === 'US' ? 'the United States' : 'your country'} is ${profile.country === 'IN' ? '112' : profile.country === 'US' ? '911' : '999'}.`
        },
        {
          id: '2',
          question: 'What should you do first if your car breaks down?',
          options: ['Keep driving', 'Pull over safely', 'Get out immediately', 'Call a friend'],
          correct_answer: 1,
          explanation: 'Always pull over safely to avoid blocking traffic and ensure your safety.'
        },
        {
          id: '3',
          question: 'What should you turn on when stopped on the roadside?',
          options: ['Headlights', 'Hazard lights', 'Radio', 'Air conditioning'],
          correct_answer: 1,
          explanation: 'Hazard lights alert other drivers that your vehicle is stopped and potentially in distress.'
        }
      ],
      country: profile.country,
      language: profile.language,
      created_at: new Date().toISOString()
    }
  ]

  const badges = [
    {
      id: 'first_steps',
      name: 'First Steps',
      description: 'Complete your first lesson',
      icon: '🎯',
      condition: 'complete_1_lesson',
      earned: false
    },
    {
      id: 'quick_learner',
      name: 'Quick Learner',
      description: 'Score 90% or higher on a quiz',
      icon: '⚡',
      condition: 'score_90_percent',
      earned: false
    },
    {
      id: 'consistent',
      name: 'Consistent Learner',
      description: 'Complete 5 lessons',
      icon: '🔥',
      condition: 'complete_5_lessons',
      earned: false
    },
    {
      id: 'safety_expert',
      name: 'Safety Expert',
      description: 'Complete all available lessons',
      icon: '🛡️',
      condition: 'complete_all_lessons',
      earned: false
    }
  ]

  const countryTheme = {
    'IN': {
      primaryColor: '#FF6B35',
      secondaryColor: '#138808',
      accentColor: '#FFD700',
      roadSigns: ['🚦', '🛑', '⚠️', '🚸'],
      trafficRules: [
        'Drive on the left side of the road',
        'Helmet mandatory for two-wheelers',
        'Speed limit in cities: 50 km/h',
        'Honking prohibited in silence zones'
      ],
      culturalElements: ['🏛️', '🕌', '🛺', '🐄'],
      emergencyNumber: '112',
      currency: '₹'
    },
    'US': {
      primaryColor: '#1E40AF',
      secondaryColor: '#DC2626',
      accentColor: '#FFFFFF',
      roadSigns: ['🛑', '⚠️', '🚸', '🚧'],
      trafficRules: [
        'Drive on the right side of the road',
        'Seat belts mandatory for all passengers',
        'Speed limits vary by state',
        'Right turn on red allowed (unless prohibited)'
      ],
      culturalElements: ['🗽', '🏈', '🚗', '🦅'],
      emergencyNumber: '911',
      currency: '$'
    }
  }[profile.country] || {
    primaryColor: '#1E40AF',
    secondaryColor: '#DC2626',
    accentColor: '#FFFFFF',
    roadSigns: ['🛑', '⚠️', '🚸', '🚧'],
    trafficRules: [
      'Drive on the right side of the road',
      'Seat belts mandatory for all passengers',
      'Follow local speed limits',
      'Obey all traffic signals'
    ],
    culturalElements: ['🚗', '🛣️', '🏙️', '🌍'],
    emergencyNumber: '911',
    currency: '$'
  }

  return {
    userProfile: profile,
    lessons,
    userProgress: [],
    badges,
    games: [],
    analytics: {
      totalQuizzes: 0,
      averageScore: 0,
      bestScore: 0,
      studyTime: '0h 0m',
      completionRate: 0,
      totalLessons: lessons.length,
      lessonsCompleted: 0,
      streak: 0,
      lastActivity: null
    },
    countryTheme,
    images: [
      'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    animations: [],
    languageContent: {}
  }
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [data, setData] = useState<PreloadedData>(getDefaultData(null))
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isDataReady, setIsDataReady] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const loadData = useCallback(async () => {
    if (!user || !isAuthenticated || initialized) {
      return
    }

    console.log('[DATA] Loading data...')
    setLoading(true)
    setError(null)
    setProgress(25)
    
    try {
      // Simulate loading progress
      setProgress(50)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setProgress(75)
      const defaultData = getDefaultData(user)
      
      setProgress(100)
      setData(defaultData)
      setIsDataReady(true)
      setInitialized(true)
      setLoading(false)
      
      console.log('[DATA] Data loaded successfully')

    } catch (error) {
      console.error('[DATA] Data load failed:', error)
      setError('Failed to load data')
      setLoading(false)
      
      const fallbackData = getDefaultData(user)
      setData(fallbackData)
      setIsDataReady(true)
      setInitialized(true)
    }
  }, [user, isAuthenticated, initialized])

  const refreshData = useCallback(async () => {
    console.log('[DATA] Refreshing data')
    setInitialized(false)
    await loadData()
  }, [loadData])

  const updateUserProgress = useCallback(async (lessonId: string, score: number, completed: boolean) => {
    if (!user) return

    try {
      const username = user.user_metadata?.username || user.email?.split('@')[0] || user.email

      // Update local data immediately
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

        // Update badges
        const updatedBadges = prev.badges.map(badge => {
          if (badge.id === 'first_steps' && completedProgress.length >= 1 && !badge.earned) {
            return { ...badge, earned: true, earned_at: new Date().toISOString() }
          }
          if (badge.id === 'quick_learner' && scores.some(s => s >= 90) && !badge.earned) {
            return { ...badge, earned: true, earned_at: new Date().toISOString() }
          }
          if (badge.id === 'consistent' && completedProgress.length >= 5 && !badge.earned) {
            return { ...badge, earned: true, earned_at: new Date().toISOString() }
          }
          if (badge.id === 'safety_expert' && completedProgress.length >= prev.lessons.length && !badge.earned) {
            return { ...badge, earned: true, earned_at: new Date().toISOString() }
          }
          return badge
        })

        return {
          ...prev,
          userProgress: updatedProgress,
          analytics: updatedAnalytics,
          badges: updatedBadges
        }
      })

      // Store in localStorage for persistence in demo mode
      if (!isSupabaseConfigured) {
        const storageKey = `learn2go-${username}-progress`
        const progressData = {
          lessonId,
          score,
          completed,
          timestamp: Date.now()
        }
        localStorage.setItem(storageKey, JSON.stringify(progressData))
      }

    } catch (error) {
      console.error('Error updating user progress:', error)
    }
  }, [user])

  const clearCache = useCallback(() => {
    console.log('[DATA] Cache cleared')
  }, [])

  const getCacheStats = useCallback(() => {
    return {
      size: 0,
      keys: [],
      totalMemory: 0
    }
  }, [])

  // Initialize data when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && user && !initialized) {
      setTimeout(() => {
        loadData()
      }, 100)
    } else if (!isAuthenticated) {
      setData(getDefaultData(null))
      setIsDataReady(false)
      setProgress(0)
      setInitialized(false)
      setLoading(false)
      setError(null)
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