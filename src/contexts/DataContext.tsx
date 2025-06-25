import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

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
  const [hasInitialized, setHasInitialized] = useState(false)

  // INSTANT LOADING - No delays, no complex operations
  const instantLoad = useCallback(async () => {
    if (!user || !isAuthenticated || hasInitialized) {
      return
    }

    console.log('[DATA] Starting instant load...')
    setLoading(true)
    setError(null)
    setProgress(25)
    
    try {
      // Create user profile instantly
      const userProfile = {
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

      setProgress(50)

      // Load default lessons instantly
      const lessons = getDefaultLessons(userProfile.country, userProfile.language)
      
      setProgress(75)

      // Load user progress in background (non-blocking)
      const userProgressPromise = loadUserProgressFromDatabase(userProfile.username)
      
      // Calculate analytics with empty progress first
      const analytics = calculateAnalytics([], lessons)
      const badges = generateBadges([], lessons)
      const countryTheme = getCountryTheme(userProfile.country)

      setProgress(100)

      const finalData = {
        userProfile,
        lessons,
        userProgress: [], // Will be updated when loaded
        badges,
        games: getDefaultGames(),
        analytics,
        countryTheme,
        images: getDefaultImages(),
        animations: [],
        languageContent: {}
      }

      setData(finalData)
      setIsDataReady(true)
      setHasInitialized(true)
      
      console.log('[DATA] Instant load completed')

      // Update with real progress data when available
      userProgressPromise.then(userProgress => {
        if (userProgress.length > 0) {
          setData(prev => ({
            ...prev,
            userProgress,
            analytics: calculateAnalytics(userProgress, lessons),
            badges: generateBadges(userProgress, lessons)
          }))
        }
      }).catch(console.warn)

    } catch (error) {
      console.error('[DATA] Instant load failed:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [user, isAuthenticated, hasInitialized])

  // Load user progress from database (background operation)
  const loadUserProgressFromDatabase = async (username: string) => {
    try {
      const { data: progress, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('username', username)
        .order('completed_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return progress || []
    } catch (error) {
      console.warn('[DATA] Failed to load user progress:', error)
      return []
    }
  }

  const refreshData = useCallback(async () => {
    console.log('[DATA] Manual refresh requested')
    setHasInitialized(false)
    await instantLoad()
  }, [instantLoad])

  const updateUserProgress = useCallback(async (lessonId: string, score: number, completed: boolean) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          username: user.user_metadata?.username,
          lesson_id: lessonId,
          completed,
          score,
          completed_at: new Date().toISOString()
        })

      if (error) throw error

      // Update local data
      setData(prev => {
        const existingIndex = prev.userProgress.findIndex(p => p.lesson_id === lessonId)
        const newProgress = {
          id: `${user.user_metadata?.username}-${lessonId}`,
          username: user.user_metadata?.username,
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

        return {
          ...prev,
          userProgress: updatedProgress,
          analytics: calculateAnalytics(updatedProgress, prev.lessons)
        }
      })

    } catch (error) {
      console.error('Error updating user progress:', error)
    }
  }, [user])

  const clearCache = useCallback(() => {
    console.log('[DATA] Cache cleared')
  }, [])

  const getCacheStats = useCallback(() => {
    return { size: 0, keys: [], totalMemory: 0 }
  }, [])

  // Initialize data when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && user && !hasInitialized) {
      instantLoad()
    } else if (!isAuthenticated) {
      // Reset everything when user logs out
      setData(defaultData)
      setIsDataReady(false)
      setProgress(0)
      setHasInitialized(false)
      setLoading(false)
    }
  }, [isAuthenticated, user, hasInitialized, instantLoad])

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

// Default lessons that load instantly
function getDefaultLessons(country: string, language: string): Lesson[] {
  return [
    {
      id: 'default-1',
      title: 'Traffic Signals and Signs',
      description: 'Learn about basic traffic signals and road signs',
      content: `Understanding traffic signals and road signs is fundamental to road safety.

**Traffic Lights:**
🔴 Red Light: Stop completely
🟡 Yellow Light: Prepare to stop
🟢 Green Light: Proceed with caution

**Common Road Signs:**
🛑 Stop Sign: Come to a complete stop
⚠️ Warning Signs: Indicate potential hazards
🚸 Pedestrian Crossing: Watch for pedestrians

**Key Rules for ${country}:**
${country === 'IN' ? '• Drive on the left side of the road\n• Helmet mandatory for two-wheelers\n• Speed limit in cities: 50 km/h' : ''}
${country === 'US' ? '• Drive on the right side of the road\n• Seat belts mandatory for all passengers\n• Right turn on red allowed (unless prohibited)' : ''}
${country === 'GB' ? '• Drive on the left side of the road\n• Roundabouts are common\n• Speed cameras are frequent' : ''}

Remember: Traffic signals and signs are there for everyone's safety!`,
      level: 1,
      order: 1,
      category: 'basics',
      quiz_questions: [
        {
          id: '1',
          question: 'What should you do when you see a red traffic light?',
          options: ['Speed up', 'Stop completely', 'Slow down', 'Honk horn'],
          correct_answer: 1,
          explanation: 'A red light means you must stop completely and wait for green.'
        },
        {
          id: '2',
          question: 'What does a yellow traffic light mean?',
          options: ['Speed up', 'Stop immediately', 'Prepare to stop', 'Turn left'],
          correct_answer: 2,
          explanation: 'Yellow light means prepare to stop as the light is about to turn red.'
        },
        {
          id: '3',
          question: 'What should you do at a stop sign?',
          options: ['Slow down', 'Stop completely', 'Honk and go', 'Speed up'],
          correct_answer: 1,
          explanation: 'You must come to a complete stop at every stop sign.'
        }
      ],
      country,
      language,
      created_at: new Date().toISOString()
    },
    {
      id: 'default-2',
      title: 'Pedestrian Safety',
      description: 'Learn how to safely share the road with pedestrians',
      content: `Pedestrian safety is everyone's responsibility - both drivers and pedestrians.

**For Drivers:**
• Always yield to pedestrians at crosswalks
• Look for pedestrians before turning
• Slow down in school zones and residential areas
• Be extra careful in bad weather

**For Pedestrians:**
• Use designated crosswalks
• Look both ways before crossing
• Make eye contact with drivers
• Stay visible, especially at night

**Special Rules for ${country}:**
${country === 'IN' ? '• Heavy pedestrian traffic in urban areas\n• Mixed traffic with various vehicles\n• Use foot over-bridges where available' : ''}
${country === 'US' ? '• School zone speed limits when children are present\n• Crosswalk laws vary by state\n• Pedestrians have right of way at marked crossings' : ''}
${country === 'GB' ? '• Zebra crossings give pedestrians right of way\n• Pelican crossings have traffic lights\n• Look right, then left, then right again' : ''}

Working together keeps everyone safe!`,
      level: 1,
      order: 2,
      category: 'safety',
      quiz_questions: [
        {
          id: '1',
          question: 'Where should pedestrians cross the street?',
          options: ['Anywhere', 'At crosswalks', 'Between cars', 'In parking lots'],
          correct_answer: 1,
          explanation: 'Pedestrians should always use designated crosswalks for safety.'
        },
        {
          id: '2',
          question: 'What should drivers do when they see pedestrians at a crosswalk?',
          options: ['Speed up', 'Honk horn', 'Yield to them', 'Ignore them'],
          correct_answer: 2,
          explanation: 'Drivers must always yield to pedestrians at crosswalks.'
        },
        {
          id: '3',
          question: 'How can pedestrians stay safe at night?',
          options: ['Wear dark clothes', 'Use reflective clothing', 'Run across streets', 'Avoid walking'],
          correct_answer: 1,
          explanation: 'Reflective clothing helps drivers see pedestrians in low light conditions.'
        }
      ],
      country,
      language,
      created_at: new Date().toISOString()
    },
    {
      id: 'default-3',
      title: 'Safe Driving Basics',
      description: 'Essential safe driving practices for all drivers',
      content: `Safe driving is about being responsible, alert, and considerate.

**Before You Drive:**
• Adjust mirrors and seat
• Check that seatbelt is fastened
• Put away distractions (phone, etc.)
• Check fuel and basic vehicle condition

**While Driving:**
• Keep both hands on the wheel
• Maintain safe following distance
• Use turn signals for all turns and lane changes
• Check blind spots before changing lanes

**Defensive Driving:**
• Assume other drivers might make mistakes
• Stay alert and scan the road constantly
• Don't drive when tired or distracted
• Adjust speed for road and weather conditions

**Country-Specific Tips for ${country}:**
${country === 'IN' ? '• Be prepared for mixed traffic (cars, bikes, pedestrians)\n• Use horn appropriately to communicate\n• Watch for sudden lane changes' : ''}
${country === 'US' ? '• Maintain proper following distance (3-second rule)\n• Use cruise control on highways when appropriate\n• Be aware of aggressive drivers' : ''}
${country === 'GB' ? '• Give way to traffic from the right at roundabouts\n• Use mirrors frequently\n• Be courteous to other road users' : ''}

Remember: The goal is to get to your destination safely, not quickly!`,
      level: 2,
      order: 3,
      category: 'driving',
      quiz_questions: [
        {
          id: '1',
          question: 'What should you do before starting to drive?',
          options: ['Start engine immediately', 'Adjust mirrors and seat', 'Turn on radio', 'Open windows'],
          correct_answer: 1,
          explanation: 'Always adjust mirrors and seat position before driving for optimal safety.'
        },
        {
          id: '2',
          question: 'When should you use turn signals?',
          options: ['Only for turns', 'For all turns and lane changes', 'Never', 'Only on highways'],
          correct_answer: 1,
          explanation: 'Turn signals should be used for all turns and lane changes to communicate with other drivers.'
        },
        {
          id: '3',
          question: 'What is defensive driving?',
          options: ['Driving aggressively', 'Assuming others might make mistakes', 'Driving very slowly', 'Honking frequently'],
          correct_answer: 1,
          explanation: 'Defensive driving means being prepared for other drivers\' mistakes and staying alert.'
        }
      ],
      country,
      language,
      created_at: new Date().toISOString()
    },
    {
      id: 'default-4',
      title: 'Emergency Procedures',
      description: 'What to do in traffic emergencies and breakdowns',
      content: `Knowing how to handle emergencies can save lives and prevent further accidents.

**Vehicle Breakdown:**
• Pull over safely to the right shoulder
• Turn on hazard lights immediately
• Exit vehicle away from traffic if safe
• Call for help and wait in a safe location
• Use reflective triangles or flares if available

**Accident Procedures:**
• Check for injuries (yourself and others)
• Call emergency services immediately
• Move vehicles out of traffic if possible and safe
• Exchange information with other parties
• Document the scene with photos if safe to do so

**Emergency Numbers for ${country}:**
${country === 'IN' ? '• Police: 100\n• Ambulance: 108\n• Fire: 101\n• General Emergency: 112' : ''}
${country === 'US' ? '• All Emergencies: 911\n• Non-emergency police varies by location\n• Roadside assistance: Contact your insurance' : ''}
${country === 'GB' ? '• All Emergencies: 999 or 112\n• Non-emergency police: 101\n• NHS non-emergency: 111' : ''}

**Emergency Kit Essentials:**
• First aid kit
• Flashlight and batteries
• Reflective triangles or flares
• Basic tools and spare tire
• Emergency contact numbers

Stay calm and prioritize safety over speed in any emergency situation.`,
      level: 2,
      order: 4,
      category: 'emergency',
      quiz_questions: [
        {
          id: '1',
          question: `What is the emergency number in ${country}?`,
          options: ['911', '112', '999', '108'],
          correct_answer: country === 'IN' ? 1 : country === 'US' ? 0 : 2,
          explanation: `The emergency number in ${country} is ${country === 'IN' ? '112' : country === 'US' ? '911' : '999'}.`
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
          explanation: 'Hazard lights alert other drivers that your vehicle is stopped.'
        }
      ],
      country,
      language,
      created_at: new Date().toISOString()
    },
    {
      id: 'default-5',
      title: 'Weather Driving Conditions',
      description: 'Safe driving in various weather conditions',
      content: `Weather conditions significantly affect driving safety and require adjusted techniques.

**Rain Driving:**
• Reduce speed and increase following distance
• Use headlights even during the day
• Avoid sudden movements (braking, steering)
• Watch for hydroplaning on wet roads
• Keep windshield wipers in good condition

**Fog Driving:**
• Use low beam headlights (not high beams)
• Reduce speed significantly
• Use fog lights if available
• Follow road markings and reflectors
• Pull over if visibility becomes too poor

**Night Driving:**
• Use headlights from sunset to sunrise
• Keep headlights clean and properly aimed
• Reduce speed to match visibility
• Avoid looking directly at oncoming headlights
• Take breaks to combat fatigue

**Special Conditions for ${country}:**
${country === 'IN' ? '• Monsoon season requires extra caution\n• Heavy rains can cause flooding\n• Dust storms reduce visibility significantly' : ''}
${country === 'US' ? '• Snow and ice in northern regions\n• Severe thunderstorms and tornadoes\n• Desert heat affects vehicle performance' : ''}
${country === 'GB' ? '• Frequent rain and fog\n• Ice and frost in winter\n• Strong winds, especially on bridges' : ''}

**General Weather Tips:**
• Check weather conditions before traveling
• Keep emergency supplies in your vehicle
• Know when to postpone travel
• Maintain your vehicle for all weather conditions

Adjust your driving to match the conditions - it's better to arrive late than not at all.`,
      level: 2,
      order: 5,
      category: 'weather',
      quiz_questions: [
        {
          id: '1',
          question: 'What should you do when driving in heavy rain?',
          options: ['Drive faster', 'Reduce speed and increase following distance', 'Use high beams', 'Drive closer to other cars'],
          correct_answer: 1,
          explanation: 'Wet roads require reduced speed and increased following distance for safety.'
        },
        {
          id: '2',
          question: 'Which headlights should you use in fog?',
          options: ['High beams', 'Low beams', 'No lights', 'Hazard lights only'],
          correct_answer: 1,
          explanation: 'Low beams provide better visibility in fog without creating glare.'
        },
        {
          id: '3',
          question: 'What is the most important thing when driving in bad weather?',
          options: ['Drive fast to get through it', 'Adjust speed to conditions', 'Use horn frequently', 'Follow closely behind other cars'],
          correct_answer: 1,
          explanation: 'Adjusting your speed to match weather conditions is the most important safety measure.'
        }
      ],
      country,
      language,
      created_at: new Date().toISOString()
    }
  ]
}

// Helper functions (same as before)
function getCountryTheme(country: string) {
  const themes: Record<string, any> = {
    'IN': {
      primaryColor: '#FF6B35',
      secondaryColor: '#138808',
      accentColor: '#FFD700',
      roadSigns: ['🚦', '🛑', '⚠️', '🚸'],
      trafficRules: [
        'Drive on the left side of the road',
        'Helmet mandatory for two-wheelers',
        'Speed limit in cities: 50 km/h'
      ],
      culturalElements: ['🏛️', '🕌', '🛺'],
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
        'Speed limits vary by state'
      ],
      culturalElements: ['🗽', '🏈', '🚗'],
      emergencyNumber: '911',
      currency: '$'
    },
    'GB': {
      primaryColor: '#1E3A8A',
      secondaryColor: '#DC2626',
      accentColor: '#FFFFFF',
      roadSigns: ['🚦', '🛑', '⚠️', '🚸'],
      trafficRules: [
        'Drive on the left side of the road',
        'Roundabouts are common',
        'Speed cameras are frequent'
      ],
      culturalElements: ['👑', '☂️', '🚌'],
      emergencyNumber: '999',
      currency: '£'
    }
  }
  return themes[country] || themes['US']
}

function generateBadges(userProgress: any[], lessons: any[]) {
  const completedProgress = userProgress.filter(p => p.completed)
  const scores = completedProgress.map(p => p.score)
  
  return [
    {
      id: 'first_steps',
      name: 'First Steps',
      description: 'Complete your first lesson',
      icon: '🎯',
      condition: 'complete_1_lesson',
      earned: completedProgress.length >= 1,
      earned_at: completedProgress.length >= 1 ? completedProgress[0]?.completed_at : undefined
    },
    {
      id: 'quick_learner',
      name: 'Quick Learner',
      description: 'Score 90% or higher on a quiz',
      icon: '⚡',
      condition: 'score_90_percent',
      earned: scores.some(score => score >= 90),
      earned_at: completedProgress.find(p => p.score >= 90)?.completed_at
    },
    {
      id: 'safety_expert',
      name: 'Safety Expert',
      description: 'Complete all available lessons',
      icon: '🛡️',
      condition: 'complete_all_lessons',
      earned: lessons.length > 0 && completedProgress.length >= lessons.length,
      earned_at: completedProgress.length >= lessons.length ? completedProgress[completedProgress.length - 1]?.completed_at : undefined
    }
  ]
}

function getDefaultGames() {
  return [
    {
      id: 'default_quiz',
      name: 'Traffic Safety Quiz',
      description: 'Test your knowledge of traffic rules',
      type: 'quiz' as const,
      content: {
        questions: [
          { q: "What does a red light mean?", a: "Stop" },
          { q: "When should you wear a seatbelt?", a: "Always" },
          { q: "What should you do at a stop sign?", a: "Stop completely" }
        ]
      }
    }
  ]
}

function getDefaultImages() {
  return [
    'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=400'
  ]
}

function calculateAnalytics(userProgress: any[], lessons: any[]) {
  const completedProgress = userProgress.filter(p => p.completed)
  const scores = completedProgress.map(p => p.score)
  
  return {
    totalQuizzes: completedProgress.length,
    averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    bestScore: scores.length > 0 ? Math.max(...scores) : 0,
    studyTime: `${Math.floor(completedProgress.length * 0.25)}h ${(completedProgress.length * 15) % 60}m`,
    completionRate: lessons.length > 0 ? Math.round((completedProgress.length / lessons.length) * 100) : 0,
    totalLessons: lessons.length,
    lessonsCompleted: completedProgress.length,
    streak: 0,
    lastActivity: userProgress.length > 0 ? userProgress[0].completed_at : null
  }
}