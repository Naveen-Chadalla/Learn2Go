import { supabase } from '../lib/supabase'

interface ActivityLog {
  username: string
  activityType: 'login' | 'logout' | 'lesson_start' | 'lesson_complete' | 'quiz_attempt' | 'quiz_complete' | 'game_play' | 'page_view' | 'navigation'
  details?: Record<string, any>
  sessionToken?: string
  durationSeconds?: number
  score?: number
  pageUrl?: string
}

interface SessionData {
  username: string
  sessionToken: string
  ipAddress?: string
  userAgent?: string
}

class ActivityTracker {
  private currentSessionToken: string | null = null
  private pageStartTime: number = Date.now()
  private currentPage: string = ''
  private sessionStartTime: number = 0

  // Generate unique session token with timestamp and random component
  private generateSessionToken(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 12)
    const userRandom = Math.floor(Math.random() * 10000)
    return `session_${timestamp}_${random}_${userRandom}`
  }

  // Check if current session is valid
  private async isSessionValid(): Promise<boolean> {
    if (!this.currentSessionToken) return false

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('is_active, login_time')
        .eq('session_token', this.currentSessionToken)
        .eq('is_active', true)
        .single()

      if (error || !data) return false

      // Check if session is not too old (24 hours max)
      const sessionAge = Date.now() - new Date(data.login_time).getTime()
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      
      return sessionAge < maxAge
    } catch {
      return false
    }
  }

  // Start tracking session with improved token management
  async startSession(username: string): Promise<string> {
    try {
      // First, check if we have an existing valid session
      const existingToken = sessionStorage.getItem('activity_session_token')
      if (existingToken) {
        this.currentSessionToken = existingToken
        const isValid = await this.isSessionValid()
        if (isValid) {
          console.log('[ACTIVITY] Reusing existing valid session:', this.currentSessionToken)
          this.startPageTracking()
          return this.currentSessionToken
        } else {
          // Clean up invalid session
          sessionStorage.removeItem('activity_session_token')
          this.currentSessionToken = null
        }
      }

      // Generate new unique session token
      let attempts = 0
      let sessionToken = ''
      
      while (attempts < 5) {
        sessionToken = this.generateSessionToken()
        
        // Check if this token already exists
        const { data: existingSession } = await supabase
          .from('user_sessions')
          .select('session_token')
          .eq('session_token', sessionToken)
          .single()

        if (!existingSession) {
          break // Token is unique
        }
        
        attempts++
        // Add small delay to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      if (attempts >= 5) {
        throw new Error('Failed to generate unique session token after 5 attempts')
      }

      this.currentSessionToken = sessionToken
      this.sessionStartTime = Date.now()
      
      const sessionData: SessionData = {
        username,
        sessionToken: this.currentSessionToken,
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent
      }

      // Call database function to start session
      const { error } = await supabase.rpc('start_user_session', {
        user_name: username,
        session_token: this.currentSessionToken,
        user_ip: sessionData.ipAddress,
        user_agent_string: sessionData.userAgent
      })

      if (error) {
        console.error('[ACTIVITY] Failed to start session:', error)
        this.currentSessionToken = null
        throw error
      } else {
        console.log('[ACTIVITY] Session started:', this.currentSessionToken)
        
        // Store session token securely only after successful creation
        sessionStorage.setItem('activity_session_token', this.currentSessionToken)
        
        // Start page tracking
        this.startPageTracking()
      }

      return this.currentSessionToken
    } catch (error) {
      console.error('[ACTIVITY] Exception starting session:', error)
      this.currentSessionToken = null
      sessionStorage.removeItem('activity_session_token')
      return ''
    }
  }

  // End tracking session
  async endSession(username: string): Promise<void> {
    try {
      if (!this.currentSessionToken) {
        this.currentSessionToken = sessionStorage.getItem('activity_session_token')
      }

      if (this.currentSessionToken) {
        // Call database function to end session
        const { error } = await supabase.rpc('end_user_session', {
          user_name: username,
          token_value: this.currentSessionToken
        })

        if (error) {
          console.error('[ACTIVITY] Failed to end session:', error)
        } else {
          console.log('[ACTIVITY] Session ended:', this.currentSessionToken)
        }
      }

      // Clear session data
      this.currentSessionToken = null
      sessionStorage.removeItem('activity_session_token')
      this.stopPageTracking()
    } catch (error) {
      console.error('[ACTIVITY] Exception ending session:', error)
    }
  }

  // Log general activity with better error handling
  async logActivity(activity: ActivityLog): Promise<void> {
    try {
      if (!this.currentSessionToken) {
        this.currentSessionToken = sessionStorage.getItem('activity_session_token')
      }

      const { error } = await supabase.rpc('log_user_activity', {
        user_name: activity.username,
        activity: activity.activityType,
        details: activity.details || {},
        token_value: this.currentSessionToken,
        duration_secs: activity.durationSeconds,
        activity_score: activity.score,
        page_path: activity.pageUrl || window.location.pathname
      })

      if (error) {
        console.error('[ACTIVITY] Failed to log activity:', error)
        // Don't throw error to prevent breaking user experience
      } else {
        console.log('[ACTIVITY] Logged:', activity.activityType)
      }
    } catch (error) {
      console.error('[ACTIVITY] Exception logging activity:', error)
    }
  }

  // Track lesson progress
  async trackLessonStart(username: string, lessonId: string, lessonTitle: string): Promise<void> {
    await this.logActivity({
      username,
      activityType: 'lesson_start',
      details: {
        lesson_id: lessonId,
        lesson_title: lessonTitle,
        started_at: new Date().toISOString()
      }
    })
  }

  async trackLessonComplete(username: string, lessonId: string, lessonTitle: string, timeSpent: number): Promise<void> {
    await this.logActivity({
      username,
      activityType: 'lesson_complete',
      details: {
        lesson_id: lessonId,
        lesson_title: lessonTitle,
        completed_at: new Date().toISOString()
      },
      durationSeconds: timeSpent
    })

    // Update user's last completed lesson
    try {
      await supabase
        .from('users')
        .update({ 
          last_lesson_completed: lessonTitle,
          last_active: new Date().toISOString()
        })
        .eq('username', username)
    } catch (error) {
      console.error('[ACTIVITY] Failed to update user lesson completion:', error)
    }
  }

  // Track quiz attempts and results
  async trackQuizAttempt(username: string, lessonId: string, quizData: any): Promise<void> {
    await this.logActivity({
      username,
      activityType: 'quiz_attempt',
      details: {
        lesson_id: lessonId,
        quiz_data: quizData,
        attempted_at: new Date().toISOString()
      }
    })
  }

  async trackQuizComplete(username: string, lessonId: string, score: number, timeSpent: number, quizData: any): Promise<void> {
    await this.logActivity({
      username,
      activityType: 'quiz_complete',
      details: {
        lesson_id: lessonId,
        quiz_data: quizData,
        completed_at: new Date().toISOString(),
        total_questions: quizData.totalQuestions,
        correct_answers: quizData.correctAnswers
      },
      score,
      durationSeconds: timeSpent
    })
  }

  // Track game participation
  async trackGamePlay(username: string, gameId: string, gameName: string, score: number, timeSpent: number): Promise<void> {
    await this.logActivity({
      username,
      activityType: 'game_play',
      details: {
        game_id: gameId,
        game_name: gameName,
        played_at: new Date().toISOString()
      },
      score,
      durationSeconds: timeSpent
    })
  }

  // Track page navigation with improved error handling
  async trackPageView(username: string, pagePath: string, pageTitle: string): Promise<void> {
    try {
      // Log previous page duration if we have one
      if (this.currentPage && this.pageStartTime) {
        const timeSpent = Math.floor((Date.now() - this.pageStartTime) / 1000)
        
        await this.logActivity({
          username,
          activityType: 'page_view',
          details: {
            page_path: this.currentPage,
            page_title: document.title,
            viewed_at: new Date(this.pageStartTime).toISOString()
          },
          durationSeconds: timeSpent,
          pageUrl: this.currentPage
        })
      }

      // Update current page tracking
      this.currentPage = pagePath
      this.pageStartTime = Date.now()

      // Update user's current page in database
      try {
        await supabase
          .from('users')
          .update({ 
            current_page: pageTitle,
            last_active: new Date().toISOString()
          })
          .eq('username', username)
      } catch (error) {
        console.error('[ACTIVITY] Failed to update user current page:', error)
      }

      // Log navigation
      await this.logActivity({
        username,
        activityType: 'navigation',
        details: {
          from_page: this.currentPage,
          to_page: pagePath,
          navigated_at: new Date().toISOString()
        },
        pageUrl: pagePath
      })
    } catch (error) {
      console.error('[ACTIVITY] Exception in trackPageView:', error)
    }
  }

  // Start automatic page tracking
  private startPageTracking(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('[ACTIVITY] Page hidden - pausing tracking')
      } else {
        console.log('[ACTIVITY] Page visible - resuming tracking')
        this.pageStartTime = Date.now()
      }
    })

    // Track beforeunload for page duration
    window.addEventListener('beforeunload', () => {
      if (this.currentPage && this.pageStartTime) {
        const timeSpent = Math.floor((Date.now() - this.pageStartTime) / 1000)
        // Use sendBeacon for reliable tracking on page unload
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/track-page-duration', JSON.stringify({
            page: this.currentPage,
            duration: timeSpent,
            sessionToken: this.currentSessionToken
          }))
        }
      }
    })
  }

  private stopPageTracking(): void {
    // Clean up event listeners if needed
    console.log('[ACTIVITY] Stopped page tracking')
  }

  // Get client IP (simplified - in production use proper service)
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip || 'unknown'
    } catch {
      return 'unknown'
    }
  }

  // Update user activity heartbeat
  async updateActivityHeartbeat(username: string): Promise<void> {
    try {
      await supabase
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('username', username)
    } catch (error) {
      console.error('[ACTIVITY] Failed to update heartbeat:', error)
    }
  }

  // Get user activity summary
  async getUserActivitySummary(username: string, days: number = 7): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('username', username)
        .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })

      if (error) throw error

      // Process and summarize data
      const summary = {
        totalActivities: data?.length || 0,
        lessonActivities: data?.filter(a => a.activity_type.includes('lesson')).length || 0,
        quizActivities: data?.filter(a => a.activity_type.includes('quiz')).length || 0,
        gameActivities: data?.filter(a => a.activity_type === 'game_play').length || 0,
        pageViews: data?.filter(a => a.activity_type === 'page_view').length || 0,
        totalTimeSpent: data?.reduce((sum, a) => sum + (a.duration_seconds || 0), 0) || 0,
        averageScore: this.calculateAverageScore(data?.filter(a => a.score) || []),
        dailyBreakdown: this.groupActivitiesByDay(data || [])
      }

      return summary
    } catch (error) {
      console.error('[ACTIVITY] Failed to get activity summary:', error)
      return null
    }
  }

  private calculateAverageScore(activities: any[]): number {
    if (activities.length === 0) return 0
    const totalScore = activities.reduce((sum, a) => sum + (a.score || 0), 0)
    return Math.round(totalScore / activities.length)
  }

  private groupActivitiesByDay(activities: any[]): Record<string, number> {
    const grouped: Record<string, number> = {}
    activities.forEach(activity => {
      const day = new Date(activity.timestamp).toDateString()
      grouped[day] = (grouped[day] || 0) + 1
    })
    return grouped
  }
}

export const activityTracker = new ActivityTracker()
export default activityTracker