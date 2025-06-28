import { supabase } from '../lib/supabase'

export class ActivityTracker {
  private heartbeatInterval: NodeJS.Timeout | null = null
  private sessionId: string | null = null
  private username: string | null = null
  private isActive = false
  private isPausedByNetwork = false

  constructor() {
    this.sessionId = this.generateSessionId()
    this.setupNetworkListeners()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private setupNetworkListeners() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('Network connectivity restored')
      this.isPausedByNetwork = false
      if (this.isActive && this.username && !this.heartbeatInterval) {
        console.log('Resuming activity tracking...')
        this.startHeartbeat()
      }
    })

    window.addEventListener('offline', () => {
      console.log('Network connectivity lost')
      this.isPausedByNetwork = true
      this.pauseTracking()
    })
  }

  async startTracking(username: string) {
    this.username = username
    this.isActive = true
    
    // Only start heartbeat if we're online
    if (navigator.onLine && !this.isPausedByNetwork) {
      this.startHeartbeat()
      
      // Log session start
      await this.logActivity('session_start', {
        session_id: this.sessionId,
        timestamp: new Date().toISOString()
      }).catch(err => console.warn('Failed to log session start:', err))
    } else {
      console.log('Starting tracking in offline mode - will resume when online')
    }
  }

  async stopTracking() {
    this.isActive = false
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (this.username && this.sessionId && navigator.onLine && !this.isPausedByNetwork) {
      await this.logActivity('session_end', {
        session_id: this.sessionId,
        timestamp: new Date().toISOString()
      }).catch(err => console.warn('Failed to log session end:', err))
    }
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.heartbeatInterval = setInterval(async () => {
      if (this.isActive && this.username && navigator.onLine && !this.isPausedByNetwork) {
        await this.updateActivityHeartbeat().catch(err => console.warn('Heartbeat error (non-critical):', err))
      }
    }, 30000) // 30 seconds
  }

  async updateActivityHeartbeat() {
    if (!this.username || !this.sessionId) return

    // Check network status before attempting any requests
    if (!navigator.onLine || this.isPausedByNetwork) {
      return
    }

    try {
      // Wrap in try/catch to prevent errors from bubbling up
      try {
        const { error } = await supabase
          .from('user_activity_logs')
          .insert({
            username: this.username,
            activity_type: 'heartbeat',
            session_id: this.sessionId,
            activity_details: {
              timestamp: new Date().toISOString(),
              page_url: window.location.href,
              user_agent: navigator.userAgent
            },
            page_url: window.location.href,
            user_agent: navigator.userAgent
          })

        if (error) {
          console.warn('Activity heartbeat warning:', error)
          // Don't throw error to prevent disrupting user experience
          return
        }

        // Update user's last activity
        await supabase
          .from('users')
          .update({ 
            last_active: new Date().toISOString(),
            current_page: window.location.pathname
          })
          .eq('username', this.username)
          .catch(err => console.warn('User activity update warning:', err))
      } catch (innerErr) {
        console.warn('Activity heartbeat inner error (non-critical):', innerErr)
      }
    } catch (err) {
      console.warn('Activity heartbeat failed (non-critical):', err)
      
      // If it's a network error, pause tracking and let network events handle resumption
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.warn('Network connectivity issue detected, pausing activity tracking')
        this.isPausedByNetwork = true
        this.pauseTracking()
      }
    }
  }

  private pauseTracking() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    // Note: Resumption is now handled by network event listeners, not timeouts
  }

  async logActivity(activityType: string, details: any = {}) {
    if (!this.username) return

    // Check network status before attempting any requests
    if (!navigator.onLine || this.isPausedByNetwork) {
      console.log(`Skipping activity log (${activityType}) - offline or network paused`)
      return
    }

    try {
      // Wrap in try/catch to prevent errors from bubbling up
      try {
        const { error } = await supabase
          .from('user_activity_logs')
          .insert({
            username: this.username,
            activity_type: activityType,
            session_id: this.sessionId,
            activity_details: details,
            page_url: window.location.href,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          })

        if (error) {
          console.warn('Activity logging warning:', error)
        }
      } catch (innerErr) {
        console.warn('Activity logging inner error (non-critical):', innerErr)
      }
    } catch (err) {
      console.warn('Activity logging failed (non-critical):', err)
      
      // If it's a network error, mark as paused
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        this.isPausedByNetwork = true
      }
    }
  }

  async logLessonStart(lessonId: string) {
    await this.logActivity('lesson_start', { lesson_id: lessonId })
      .catch(err => console.warn('Lesson start logging error (non-critical):', err))
  }

  async logLessonComplete(lessonId: string, score: number, timeSpent: number) {
    await this.logActivity('lesson_complete', {
      lesson_id: lessonId,
      score,
      time_spent_seconds: timeSpent
    }).catch(err => console.warn('Lesson complete logging error (non-critical):', err))
  }

  async logQuizAttempt(lessonId: string, score: number, totalQuestions: number) {
    await this.logActivity('quiz_attempt', {
      lesson_id: lessonId,
      score,
      total_questions: totalQuestions,
      percentage: totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
    }).catch(err => console.warn('Quiz attempt logging error (non-critical):', err))
  }

  async logGamePlay(gameType: string, score: number, duration: number) {
    await this.logActivity('game_play', {
      game_type: gameType,
      score,
      duration_seconds: duration
    }).catch(err => console.warn('Game play logging error (non-critical):', err))
  }

  async logPageView(pagePath: string) {
    await this.logActivity('page_view', {
      page_path: pagePath,
      referrer: document.referrer
    }).catch(err => console.warn('Page view logging error (non-critical):', err))
  }
}

// Export singleton instance
export const activityTracker = new ActivityTracker()