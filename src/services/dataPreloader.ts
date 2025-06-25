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
    const totalSteps = 8 // Reduced steps for faster loading
    let currentStep = 0

    try {
      console.log('[PRELOAD] Starting optimized data preload...')
      
      // Step 1: Load essential user data (parallel)
      this.updateProgress(++currentStep, totalSteps, 'Loading your profile...')
      const [userProfile, userProgress] = await Promise.allSettled([
        this.loadUserProfile(user),
        this.loadUserProgress(user.user_metadata?.username)
      ])

      const profile = userProfile.status === 'fulfilled' ? userProfile.value : this.getDefaultProfile(user)
      const progress = userProgress.status === 'fulfilled' ? userProgress.value : []

      // Step 2: Load lessons from database (fast)
      this.updateProgress(++currentStep, totalSteps, 'Loading lessons...')
      const lessons = await this.loadLessons(profile.country, profile.language)

      // Step 3: Load static content (parallel, fast)
      this.updateProgress(++currentStep, totalSteps, 'Loading media content...')
      const [images, animations, languageContent] = await Promise.allSettled([
        this.loadImages(profile.country),
        this.loadAnimations(),
        this.loadLanguageContent(profile.language)
      ])

      // Step 4: Calculate analytics (instant)
      this.updateProgress(++currentStep, totalSteps, 'Calculating progress...')
      const analytics = this.calculateAnalytics(progress, lessons)
      const badges = this.generateBadges(progress, lessons)
      const countryTheme = this.getCountryTheme(profile.country)

      // Step 5: Load basic games (with timeout)
      this.updateProgress(++currentStep, totalSteps, 'Loading interactive content...')
      const games = await this.loadGamesOptimized(profile.country, profile.language)

      // Step 6: Generate additional content (with strict timeout, non-blocking)
      this.updateProgress(++currentStep, totalSteps, 'Enhancing content...')
      const additionalLessons = await this.generateAdditionalContentOptimized(profile.country, profile.language)

      // Step 7: Finalize
      this.updateProgress(++currentStep, totalSteps, 'Almost ready...')
      const allLessons = [...lessons, ...additionalLessons]

      // Step 8: Complete
      this.updateProgress(++currentStep, totalSteps, 'Ready to learn!')

      console.log('[PRELOAD] Data preload completed successfully')

      return {
        userProfile: profile,
        lessons: allLessons,
        userProgress: progress,
        badges,
        games,
        analytics,
        countryTheme,
        images: images.status === 'fulfilled' ? images.value : [],
        animations: animations.status === 'fulfilled' ? animations.value : [],
        languageContent: languageContent.status === 'fulfilled' ? languageContent.value : {}
      }
    } catch (error) {
      console.error('[PRELOAD] Data preloading failed:', error)
      // Return minimal working data instead of throwing
      return this.getMinimalData(user)
    }
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

  private getMinimalData(user: any): PreloadedData {
    const profile = this.getDefaultProfile(user)
    return {
      userProfile: profile,
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
      countryTheme: this.getCountryTheme(profile.country),
      images: [],
      animations: [],
      languageContent: {}
    }
  }

  private async loadUserProfile(user: any) {
    const cacheKey = `profile_${user.user_metadata?.username}`
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', user.user_metadata?.username)
        .single()

      if (error) throw error

      this.setCache(cacheKey, data, this.QUICK_CACHE_DURATION)
      return data
    } catch (error) {
      console.warn('[PRELOAD] Failed to load user profile:', error)
      return this.getDefaultProfile(user)
    }
  }

  private async loadUserProgress(username: string) {
    const cacheKey = `progress_${username}`
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('username', username)
        .order('completed_at', { ascending: false })
        .limit(50) // Limit for performance

      if (error) throw error

      this.setCache(cacheKey, data || [], this.QUICK_CACHE_DURATION)
      return data || []
    } catch (error) {
      console.warn('[PRELOAD] Failed to load user progress:', error)
      return []
    }
  }

  private async loadLessons(country: string, language: string) {
    const cacheKey = `lessons_${country}_${language}`
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    try {
      // Single optimized query with fallbacks
      const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .or(`and(country.eq.${country},language.eq.${language}),and(country.eq.${country},language.eq.en),and(country.eq.US,language.eq.en)`)
        .order('level', { ascending: true })
        .order('order', { ascending: true })
        .limit(20) // Limit initial lessons for faster loading

      this.setCache(cacheKey, lessons || [])
      return lessons || []
    } catch (error) {
      console.warn('[PRELOAD] Failed to load lessons:', error)
      return []
    }
  }

  private async generateAdditionalContentOptimized(country: string, language: string) {
    if (!geminiService.isAvailable()) {
      console.log('[PRELOAD] Gemini not available, skipping content generation')
      return []
    }

    const cacheKey = `generated_lessons_${country}_${language}`
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    try {
      console.log('[PRELOAD] Generating additional content with timeout...')
      
      // Generate only 1 lesson with strict timeout
      const topics = ['Pedestrian Safety']
      const generatedLessons = []

      // Single lesson generation with 3 second timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Generation timeout')), 3000)
      )
      
      try {
        const lessonPromise = geminiService.generateLessonContent(
          country,
          language,
          topics[0],
          1
        )

        const lessonContent = await Promise.race([lessonPromise, timeoutPromise])

        generatedLessons.push({
          id: `generated_${Date.now()}`,
          title: lessonContent.title,
          description: lessonContent.description,
          content: lessonContent.content,
          level: 1,
          order: 100,
          category: 'generated',
          quiz_questions: lessonContent.quiz_questions,
          country,
          language,
          created_at: new Date().toISOString(),
          generated: true
        })

        console.log('[PRELOAD] Generated 1 additional lesson')
      } catch (error) {
        console.warn('[PRELOAD] Content generation failed:', error)
      }

      this.setCache(cacheKey, generatedLessons, 60 * 60 * 1000) // 1 hour cache
      return generatedLessons
    } catch (error) {
      console.error('[PRELOAD] Failed to generate additional content:', error)
      return []
    }
  }

  private async loadGamesOptimized(country: string, language: string) {
    const cacheKey = `games_${country}_${language}`
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    const games = []

    if (geminiService.isAvailable()) {
      try {
        console.log('[PRELOAD] Generating game with timeout...')
        
        // Generate 1 simple game with 2 second timeout
        const gamePromise = geminiService.generateGameContent(country, language, 'quiz')
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Game generation timeout')), 2000)
        )

        try {
          const gameContent = await Promise.race([gamePromise, timeoutPromise])
          games.push(gameContent)
          console.log('[PRELOAD] Generated 1 game')
        } catch (error) {
          console.warn('[PRELOAD] Game generation failed:', error)
        }
      } catch (error) {
        console.error('[PRELOAD] Failed to generate games:', error)
      }
    }

    // Add default game if none generated
    if (games.length === 0) {
      games.push({
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
      })
    }

    this.setCache(cacheKey, games)
    return games
  }

  private async loadImages(country: string) {
    const cacheKey = `images_${country}`
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    // Pre-validated Pexels URLs for instant loading
    const images = [
      'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=400',
    ]

    this.setCache(cacheKey, images, 24 * 60 * 60 * 1000) // 24 hour cache for images
    return images
  }

  private async loadAnimations() {
    const cacheKey = 'animations'
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    const animations = [
      {
        id: 'traffic_light',
        name: 'Traffic Light Animation',
        type: 'css',
        content: {
          keyframes: 'traffic-light-cycle',
          duration: '3s',
          timing: 'infinite'
        }
      },
      {
        id: 'car_movement',
        name: 'Car Movement',
        type: 'framer',
        content: {
          initial: { x: -100 },
          animate: { x: 100 },
          transition: { duration: 2, repeat: Infinity, repeatType: 'reverse' }
        }
      }
    ]

    this.setCache(cacheKey, animations, 24 * 60 * 60 * 1000) // 24 hour cache
    return animations
  }

  private async loadLanguageContent(language: string) {
    const cacheKey = `language_${language}`
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    const languageContent = {
      language,
      loaded: true,
      timestamp: Date.now()
    }

    this.setCache(cacheKey, languageContent, 24 * 60 * 60 * 1000) // 24 hour cache
    return languageContent
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
      },
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Score 100% on 3 quizzes',
        icon: '💎',
        condition: 'score_100_percent_3_times',
        earned: scores.filter(score => score === 100).length >= 3,
        earned_at: completedProgress.filter(p => p.score === 100)[2]?.completed_at
      },
      {
        id: 'ai_learner',
        name: 'AI-Powered Learner',
        description: 'Complete AI-generated content',
        icon: '🤖',
        condition: 'complete_ai_content',
        earned: completedProgress.some(p => lessons.find(l => l.id === p.lesson_id)?.generated),
        earned_at: completedProgress.find(p => lessons.find(l => l.id === p.lesson_id)?.generated)?.completed_at
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
      },
      'GB': {
        primaryColor: '#1E3A8A',
        secondaryColor: '#DC2626',
        accentColor: '#FFFFFF',
        roadSigns: ['🚦', '🛑', '⚠️', '🚸'],
        trafficRules: [
          'Drive on the left side of the road',
          'Roundabouts are common',
          'Speed cameras are frequent',
          'MOT test required annually'
        ],
        culturalElements: ['👑', '☂️', '🚌', '☕'],
        emergencyNumber: '999',
        currency: '£'
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