import { supabase } from '../lib/supabase'
import { geminiService } from './geminiService'

interface PreloadProgress {
  current: number
  total: number
  message: string
  percentage: number
}

interface PreloadedData {
  userProfile: any
  lessons: any[]
  userProgress: any[]
  badges: any[]
  games: any[]
  analytics: any
  countryTheme: any
  images: string[]
  animations: any[]
  languageContent: any
}

class DataPreloader {
  private progressCallback?: (progress: PreloadProgress) => void
  private cache = new Map<string, { data: any; timestamp: number; expiry: number }>()
  private readonly CACHE_DURATION = 30 * 60 * 1000 // 30 minutes
  private readonly QUICK_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes for dynamic content

  setProgressCallback(callback: (progress: PreloadProgress) => void) {
    this.progressCallback = callback
  }

  private updateProgress(current: number, total: number, message: string) {
    const percentage = Math.round((current / total) * 100)
    console.log(`[PRELOAD] ${percentage}% - ${message}`)
    this.progressCallback?.({
      current,
      total,
      message,
      percentage
    })
  }

  private getCacheKey(key: string, params?: any): string {
    return params ? `${key}_${JSON.stringify(params)}` : key
  }

  private setCache(key: string, data: any, customExpiry?: number) {
    const expiry = customExpiry || this.CACHE_DURATION
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    })
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > cached.expiry) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  async preloadAllData(user: any): Promise<PreloadedData> {
    const totalSteps = 6 // Reduced steps for faster loading
    let currentStep = 0

    try {
      console.log('[PRELOAD] Starting optimized data preload...')
      
      // Step 1: Load essential user data (with fallbacks)
      this.updateProgress(++currentStep, totalSteps, 'Loading your profile...')
      const profile = await this.loadUserProfileSafe(user)

      // Step 2: Load lessons from database (with fallbacks)
      this.updateProgress(++currentStep, totalSteps, 'Loading lessons...')
      const lessons = await this.loadLessonsSafe(profile.country, profile.language)

      // Step 3: Load user progress (with fallbacks)
      this.updateProgress(++currentStep, totalSteps, 'Loading your progress...')
      const progress = await this.loadUserProgressSafe(profile.username)

      // Step 4: Calculate analytics and generate content (instant)
      this.updateProgress(++currentStep, totalSteps, 'Calculating progress...')
      const analytics = this.calculateAnalytics(progress, lessons)
      const badges = this.generateBadges(progress, lessons)
      const countryTheme = this.getCountryTheme(profile.country)

      // Step 5: Load static content (fast, with fallbacks)
      this.updateProgress(++currentStep, totalSteps, 'Loading media content...')
      const [images, games] = await Promise.allSettled([
        this.loadImagesSafe(profile.country),
        this.loadGamesSafe(profile.country, profile.language)
      ])

      // Step 6: Complete
      this.updateProgress(++currentStep, totalSteps, 'Ready to learn!')

      console.log('[PRELOAD] Data preload completed successfully')

      return {
        userProfile: profile,
        lessons,
        userProgress: progress,
        badges,
        games: games.status === 'fulfilled' ? games.value : [],
        analytics,
        countryTheme,
        images: images.status === 'fulfilled' ? images.value : [],
        animations: [],
        languageContent: {}
      }
    } catch (error) {
      console.error('[PRELOAD] Data preloading failed:', error)
      // Return minimal working data instead of throwing
      return this.getMinimalData(user)
    }
  }

  private async loadUserProfileSafe(user: any) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', user.user_metadata?.username)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.warn('[PRELOAD] Failed to load user profile, using defaults:', error)
      return this.getDefaultProfile(user)
    }
  }

  private async loadLessonsSafe(country: string, language: string) {
    try {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .or(`and(country.eq.${country},language.eq.${language}),and(country.eq.${country},language.eq.en),and(country.eq.US,language.eq.en)`)
        .order('level', { ascending: true })
        .order('order', { ascending: true })
        .limit(10) // Limit for faster loading

      return lessons || this.getDefaultLessons(country, language)
    } catch (error) {
      console.warn('[PRELOAD] Failed to load lessons, using defaults:', error)
      return this.getDefaultLessons(country, language)
    }
  }

  private async loadUserProgressSafe(username: string) {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('username', username)
        .order('completed_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data || []
    } catch (error) {
      console.warn('[PRELOAD] Failed to load user progress:', error)
      return []
    }
  }

  private async loadImagesSafe(country: string) {
    // Pre-validated Pexels URLs for instant loading
    const images = [
      'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=400',
    ]

    return images
  }

  private async loadGamesSafe(country: string, language: string) {
    // Return default games to prevent empty state
    return [
      {
        id: 'default_quiz',
        name: 'Traffic Safety Quiz',
        description: 'Test your knowledge of traffic rules',
        type: 'quiz',
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

  private getDefaultProfile(user: any) {
    return {
      username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
      email: user.email || 'user@example.com',
      country: user.user_metadata?.country || 'US',
      language: user.user_metadata?.language || 'en',
      progress: 0,
      current_level: 1,
      badges: [],
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString()
    }
  }

  private getDefaultLessons(country: string, language: string) {
    return [
      {
        id: 'default-traffic-signals',
        title: 'Traffic Signals and Signs',
        description: 'Learn about traffic lights, stop signs, and road markings.',
        content: `Traffic signals are essential for safe road navigation. Understanding their meanings can prevent accidents and save lives.

**Traffic Lights:**
• Red Light: Complete stop required
• Yellow Light: Prepare to stop safely
• Green Light: Proceed with caution

**Stop Signs:**
• Always come to a complete stop
• Look both ways before proceeding
• Yield to pedestrians and cross traffic

**Road Markings:**
• Solid lines: No passing
• Dashed lines: Passing allowed when safe
• Crosswalks: Pedestrian crossing areas

Remember: Following traffic signals is not just the law—it's about protecting yourself and others on the road.`,
        level: 1,
        order: 1,
        category: 'basics',
        quiz_questions: [
          {
            id: '1',
            question: 'What should you do when you see a yellow traffic light?',
            options: ['Speed up to get through', 'Prepare to stop safely', 'Honk your horn', 'Change lanes'],
            correct_answer: 1,
            explanation: 'Yellow light means prepare to stop. You should slow down and prepare to stop safely.'
          },
          {
            id: '2',
            question: 'At a stop sign, you must:',
            options: ['Slow down and proceed', 'Come to a complete stop', 'Stop only if cars are coming', 'Yield and continue'],
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
        country,
        language,
        created_at: new Date().toISOString()
      },
      {
        id: 'default-pedestrian-safety',
        title: 'Pedestrian Safety',
        description: 'Essential rules for pedestrian and driver interactions.',
        content: `Pedestrian safety is a shared responsibility between drivers and pedestrians. Understanding these rules can prevent tragic accidents.

**For Drivers:**
• Always yield to pedestrians at crosswalks
• Look for pedestrians before turning
• Slow down in school zones and residential areas
• Be extra careful in bad weather conditions

**For Pedestrians:**
• Use designated crosswalks when available
• Look both ways before crossing
• Make eye contact with drivers when possible
• Stay visible with bright clothing, especially at night

**Special Situations:**
• School zones: Reduced speed limits during school hours
• Construction zones: Follow flaggers and posted signs
• Emergency vehicles: Pull over and stop

Working together, we can make our roads safer for everyone.`,
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
        country,
        language,
        created_at: new Date().toISOString()
      }
    ]
  }

  private getMinimalData(user: any): PreloadedData {
    const profile = this.getDefaultProfile(user)
    const lessons = this.getDefaultLessons(profile.country, profile.language)
    
    return {
      userProfile: profile,
      lessons,
      userProgress: [],
      badges: [],
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
      countryTheme: this.getCountryTheme(profile.country),
      images: [],
      animations: [],
      languageContent: {}
    }
  }

  private calculateAnalytics(userProgress: any[], lessons: any[]) {
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
      streak: this.calculateStreak(userProgress),
      lastActivity: userProgress.length > 0 ? userProgress[0].completed_at : null
    }
  }

  private calculateStreak(userProgress: any[]): number {
    const completedDates = userProgress
      .filter(p => p.completed)
      .map(p => new Date(p.completed_at).toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    let streak = 0
    
    for (let i = 0; i < completedDates.length; i++) {
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() - i)
      
      if (completedDates[i] === expectedDate.toDateString()) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  private generateBadges(userProgress: any[], lessons: any[]) {
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
        id: 'consistent',
        name: 'Consistent Learner',
        description: 'Complete 5 lessons',
        icon: '🔥',
        condition: 'complete_5_lessons',
        earned: completedProgress.length >= 5,
        earned_at: completedProgress.length >= 5 ? completedProgress[4]?.completed_at : undefined
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

  private getCountryTheme(country: string) {
    const themes: Record<string, any> = {
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
    }

    return themes[country] || themes['US']
  }

  // Clear all cache
  clearCache() {
    this.cache.clear()
    console.log('[PRELOAD] Cache cleared')
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalMemory: JSON.stringify(Array.from(this.cache.values())).length
    }
  }
}

export const dataPreloader = new DataPreloader()
export default dataPreloader