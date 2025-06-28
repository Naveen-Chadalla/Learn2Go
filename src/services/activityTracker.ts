import { supabase } from '../lib/supabase'

export class ActivityTracker {
  private heartbeatInterval: NodeJS.Timeout | null = null
  private sessionId: string | null = null
  private username: string | null = null
  private isActive = false

  constructor() {
    this.sessionId = this.generateSessionId()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async startTracking(username: string) {
    this.username = username
    this.isActive = true
    
    // Start heartbeat with error handling
    this.startHeartbeat()
    
    // Log session start
    await this.logActivity('session_start', {
      session_id: this.sessionId,
      timestamp: new Date().toISOString()
    })
  }

  async stopTracking() {
    this.isActive = false
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (this.username && this.sessionId) {
      await this.logActivity('session_end', {
        session_id: this.sessionId,
        timestamp: new Date().toISOString()
      })
    }
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.heartbeatInterval = setInterval(async () => {
      if (this.isActive && this.username) {
        await this.updateActivityHeartbeat()
      }
    }, 30000) // 30 seconds
  }

  async updateActivityHeartbeat() {
    if (!this.username || !this.sessionId) return

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
        console.error('Activity heartbeat error:', error)
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

    } catch (err) {
      console.error('Activity heartbeat failed:', err)
      // Silently handle the error to prevent disrupting user experience
      
      // If it's a network error, we might want to pause tracking temporarily
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.warn('Network connectivity issue detected, pausing activity tracking temporarily')
        this.pauseTracking()
      }
    }
  }

  private pauseTracking() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    
    // Retry connection after 60 seconds
    setTimeout(() => {
      if (this.isActive && this.username) {
        console.log('Attempting to resume activity tracking...')
        this.startHeartbeat()
      }
    }, 60000)
  }

  async logActivity(activityType: string, details: any = {}) {
    if (!this.username) return

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
        console.error('Activity logging error:', error)
      }
    } catch (err) {
      console.error('Activity logging failed:', err)
      // Silently handle errors to prevent disrupting user experience
    }
  }

  async logLessonStart(lessonId: string) {
    await this.logActivity('lesson_start', { lesson_id: lessonId })
  }

  async logLessonComplete(lessonId: string, score: number, timeSpent: number) {
    await this.logActivity('lesson_complete', {
      lesson_id: lessonId,
      score,
      time_spent_seconds: timeSpent
    })
  }

  async logQuizAttempt(lessonId: string, score: number, totalQuestions: number) {
    await this.logActivity('quiz_attempt', {
      lesson_id: lessonId,
      score,
      total_questions: totalQuestions,
      percentage: totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
    })
  }

  async logGamePlay(gameType: string, score: number, duration: number) {
    await this.logActivity('game_play', {
      game_type: gameType,
      score,
      duration_seconds: duration
    })
  }

  async logPageView(pagePath: string) {
    await this.logActivity('page_view', {
      page_path: pagePath,
      referrer: document.referrer
    })
  }
}

// Export singleton instance
export const activityTracker = new ActivityTracker()