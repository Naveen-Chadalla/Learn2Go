import { supabase } from '../lib/supabase'

export class ActivityTracker {
  private heartbeatInterval: NodeJS.Timeout | null = null
  private sessionId: string | null = null
  private username: string | null = null
  private isActive = false
  private sessionStartTime: number = 0

  constructor() {
    this.sessionId = this.generateSessionId()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async startTracking(username: string) {
    this.username = username
    this.isActive = true
    this.sessionStartTime = Date.now()
    
    // Enhanced session isolation - clear any existing data for this user
    this.clearUserSessionData(username)
    
    // Start heartbeat with error handling
    this.startHeartbeat()
    
    // Log session start with isolation
    await this.logActivity('session_start', {
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      user_isolation: true
    })

    // Update user session tracking
    try {
      await supabase
        .from('users')
        .update({ 
          session_start: new Date().toISOString(),
          current_page: window.location.pathname,
          last_active: new Date().toISOString()
        })
        .eq('username', username)
    } catch (error) {
      console.warn('[ACTIVITY] Failed to update user session start:', error)
    }
  }

  async stopTracking() {
    this.isActive = false
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (this.username && this.sessionId) {
      const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000)
      
      await this.logActivity('session_end', {
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
        session_duration_seconds: sessionDuration,
        user_isolation: true
      })

      // Update user session end
      try {
        await supabase
          .from('users')
          .update({ 
            session_end: new Date().toISOString(),
            current_page: 'offline',
            total_session_time_seconds: sessionDuration
          })
          .eq('username', this.username)
      } catch (error) {
        console.warn('[ACTIVITY] Failed to update user session end:', error)
      }
    }

    // Clear session data for this user
    if (this.username) {
      this.clearUserSessionData(this.username)
    }
  }

  private clearUserSessionData(username: string) {
    // Clear user-specific session storage
    const userPrefix = `learn2go-${username}-`
    const keysToRemove = []
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith(userPrefix)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key))
    
    // Clear user-specific localStorage
    const localKeysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(userPrefix)) {
        localKeysToRemove.push(key)
      }
    }
    localKeysToRemove.forEach(key => localStorage.removeItem(key))
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
            user_agent: navigator.userAgent,
            session_isolated: true
          },
          page_url: window.location.href,
          user_agent: navigator.userAgent
        })

      if (error) {
        console.error('Activity heartbeat error:', error)
        return
      }

      // Update user's last activity with session isolation
      await supabase
        .from('users')
        .update({ 
          last_active: new Date().toISOString(),
          current_page: window.location.pathname
        })
        .eq('username', this.username)

    } catch (err) {
      console.error('Activity heartbeat failed:', err)
      
      // If it's a network error, pause tracking temporarily
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
          activity_details: {
            ...details,
            session_isolated: true,
            user_session: this.sessionId
          },
          page_url: window.location.href,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })

      if (error) {
        console.error('Activity logging error:', error)
      }
    } catch (err) {
      console.error('Activity logging failed:', err)
    }
  }

  async logLessonStart(lessonId: string) {
    await this.logActivity('lesson_start', { 
      lesson_id: lessonId,
      started_at: new Date().toISOString()
    })
  }

  async logLessonComplete(lessonId: string, score: number, timeSpent: number) {
    await this.logActivity('lesson_complete', {
      lesson_id: lessonId,
      score,
      time_spent_seconds: timeSpent,
      completed_at: new Date().toISOString()
    })

    // Update user statistics
    try {
      await supabase
        .from('users')
        .update({ 
          last_lesson_completed: lessonId,
          last_active: new Date().toISOString()
        })
        .eq('username', this.username)
    } catch (error) {
      console.warn('[ACTIVITY] Failed to update lesson completion:', error)
    }
  }

  async logQuizAttempt(lessonId: string, score: number, totalQuestions: number) {
    await this.logActivity('quiz_attempt', {
      lesson_id: lessonId,
      score,
      total_questions: totalQuestions,
      percentage: Math.round((score / totalQuestions) * 100),
      attempted_at: new Date().toISOString()
    })

    // Update user quiz statistics
    try {
      const { data: currentUser } = await supabase
        .from('users')
        .select('total_quiz_attempts, average_quiz_score, best_quiz_score')
        .eq('username', this.username)
        .single()

      if (currentUser) {
        const newAttempts = (currentUser.total_quiz_attempts || 0) + 1
        const currentAvg = currentUser.average_quiz_score || 0
        const newAvg = ((currentAvg * (newAttempts - 1)) + score) / newAttempts
        const newBest = Math.max(currentUser.best_quiz_score || 0, score)

        await supabase
          .from('users')
          .update({
            total_quiz_attempts: newAttempts,
            average_quiz_score: Math.round(newAvg * 100) / 100,
            best_quiz_score: newBest,
            last_active: new Date().toISOString()
          })
          .eq('username', this.username)
      }
    } catch (error) {
      console.warn('[ACTIVITY] Failed to update quiz statistics:', error)
    }
  }

  async logGamePlay(gameType: string, score: number, duration: number) {
    await this.logActivity('game_play', {
      game_type: gameType,
      score,
      duration_seconds: duration,
      played_at: new Date().toISOString()
    })

    // Update user game statistics
    try {
      const { data: currentUser } = await supabase
        .from('users')
        .select('total_games_played')
        .eq('username', this.username)
        .single()

      if (currentUser) {
        await supabase
          .from('users')
          .update({
            total_games_played: (currentUser.total_games_played || 0) + 1,
            last_active: new Date().toISOString()
          })
          .eq('username', this.username)
      }
    } catch (error) {
      console.warn('[ACTIVITY] Failed to update game statistics:', error)
    }
  }

  async logPageView(pagePath: string) {
    await this.logActivity('page_view', {
      page_path: pagePath,
      referrer: document.referrer,
      viewed_at: new Date().toISOString()
    })
  }
}

// Export singleton instance
export const activityTracker = new ActivityTracker()