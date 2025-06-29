import { supabase } from '../lib/supabase'

export class ActivityTracker {
  private heartbeatInterval: NodeJS.Timeout | null = null
  private sessionId: string | null = null
  private username: string | null = null
  private isActive = false
  private isPausedByNetwork = false
  private lastHeartbeatAttempt = 0
  private heartbeatRetryCount = 0
  private readonly MAX_RETRIES = 3
  private readonly RETRY_DELAY = 5000 // 5 seconds

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
      
      try {
        // Log session start
        await this.logActivity('session_start', {
          session_id: this.sessionId,
          timestamp: new Date().toISOString()
        }).catch(err => console.warn('Failed to log session start:', err))
      } catch (error) {
        console.warn('Error logging session start (non-critical):', error)
      }
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
      try {
        await this.logActivity('session_end', {
          session_id: this.sessionId,
          timestamp: new Date().toISOString()
        }).catch(err => console.warn('Failed to log session end:', err))
      } catch (error) {
        console.warn('Error logging session end (non-critical):', error)
      }
    }
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.heartbeatInterval = setInterval(async () => {
      if (this.isActive && this.username && navigator.onLine && !this.isPausedByNetwork) {
        try {
          await this.updateActivityHeartbeat()
        } catch (err) {
          console.warn('Heartbeat error (non-critical):', err)
        }
      }
    }, 30000) // 30 seconds
  }

  async updateActivityHeartbeat() {
    if (!this.username || !this.sessionId) return

    // Check network status before attempting any requests
    if (!navigator.onLine || this.isPausedByNetwork) {
      return
    }

    // Prevent too frequent retries
    const now = Date.now()
    if (now - this.lastHeartbeatAttempt < this.RETRY_DELAY && this.heartbeatRetryCount > 0) {
      console.log('Skipping heartbeat - too soon after failure')
      return
    }
    
    this.lastHeartbeatAttempt = now

    try {
      // Use a timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
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
        }, { signal: controller.signal })

      clearTimeout(timeoutId)

      if (error) {
        console.warn('Activity heartbeat warning:', error)
        this.heartbeatRetryCount++
        return
      }

      // Reset retry count on success
      this.heartbeatRetryCount = 0

      // Update user's last activity
      try {
        await supabase
          .from('users')
          .update({ 
            last_active: new Date().toISOString(),
            current_page: window.location.pathname
          })
          .eq('username', this.username)
      } catch (updateError) {
        console.warn('User activity update warning (non-critical):', updateError)
      }
    } catch (error) {
      console.warn('Activity heartbeat failed (non-critical):', error)
      this.heartbeatRetryCount++
      
      // If it's a network error, pause tracking and let network events handle resumption
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('Network connectivity issue detected, pausing activity tracking')
        this.isPausedByNetwork = true
        this.pauseTracking()
      }
      
      // If we've tried too many times, pause heartbeats for a while
      if (this.heartbeatRetryCount >= this.MAX_RETRIES) {
        console.warn(`Pausing heartbeats after ${this.MAX_RETRIES} failed attempts`)
        this.pauseTracking()
        
        // Try to resume after a longer delay
        setTimeout(() => {
          if (this.isActive && navigator.onLine) {
            console.log('Attempting to resume heartbeats after pause')
            this.heartbeatRetryCount = 0
            this.isPausedByNetwork = false
            this.startHeartbeat()
          }
        }, 60000) // Try again after 1 minute
      }
    }
  }

  private pauseTracking() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  async logActivity(activityType: string, details: any = {}) {
    if (!this.username) return

    // Check network status before attempting any requests
    if (!navigator.onLine || this.isPausedByNetwork) {
      console.log(`Skipping activity log (${activityType}) - offline or network paused`)
      return
    }

    try {
      // Use a timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
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
        }, { signal: controller.signal })

      clearTimeout(timeoutId)

      if (error) {
        console.warn('Activity logging warning (non-critical):', error)
      }
    } catch (error) {
      console.warn('Activity logging failed (non-critical):', error)
      
      // If it's a network error, mark as paused
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        this.isPausedByNetwork = true
      }
    }
  }

  async logLessonStart(lessonId: string) {
    try {
      await this.logActivity('lesson_start', { lesson_id: lessonId })
    } catch (error) {
      console.warn('Lesson start logging error (non-critical):', error)
    }
  }

  async logLessonComplete(lessonId: string, score: number, timeSpent: number) {
    try {
      await this.logActivity('lesson_complete', {
        lesson_id: lessonId,
        score,
        time_spent_seconds: timeSpent
      })
    } catch (error) {
      console.warn('Lesson complete logging error (non-critical):', error)
    }
  }

  async logQuizAttempt(lessonId: string, score: number, totalQuestions: number) {
    try {
      await this.logActivity('quiz_attempt', {
        lesson_id: lessonId,
        score,
        total_questions: totalQuestions,
        percentage: totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
      })
    } catch (error) {
      console.warn('Quiz attempt logging error (non-critical):', error)
    }
  }

  async logGamePlay(gameType: string, score: number, duration: number) {
    try {
      await this.logActivity('game_play', {
        game_type: gameType,
        score,
        duration_seconds: duration
      })
    } catch (error) {
      console.warn('Game play logging error (non-critical):', error)
    }
  }

  async logPageView(pagePath: string) {
    try {
      await this.logActivity('page_view', {
        page_path: pagePath,
        referrer: document.referrer
      })
    } catch (error) {
      console.warn('Page view logging error (non-critical):', error)
    }
  }
}

// Export singleton instance
export const activityTracker = new ActivityTracker()