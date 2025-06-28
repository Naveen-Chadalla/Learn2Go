import { useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLocation } from 'react-router-dom'
import { activityTracker } from '../services/activityTracker'

export const useActivityTracking = () => {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  // Get username with fallback to email
  const getCurrentUsername = useCallback(() => {
    if (!user) return null
    
    // Try user_metadata.username first, then fall back to email
    const username = user.user_metadata?.username || user.email
    
    if (!username) {
      console.warn('[ACTIVITY] No username or email found for user:', user)
      return null
    }
    
    return username
  }, [user])

  // Start session when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      const username = getCurrentUsername()
      
      if (!username) {
        console.error('[ACTIVITY] Cannot start tracking - no valid username')
        return
      }

      const startTracking = async () => {
        try {
          await activityTracker.startTracking(username)
        } catch (error) {
          console.error('[ACTIVITY] Failed to start session:', error)
        }
      }
      
      startTracking()

      // Set up heartbeat to keep activity updated
      const heartbeatInterval = setInterval(() => {
        if (activityTracker.updateActivityHeartbeat) {
          activityTracker.updateActivityHeartbeat()
        }
      }, 60000) // Every minute

      return () => {
        clearInterval(heartbeatInterval)
        // End session when component unmounts or user logs out
        try {
          activityTracker.stopTracking()
        } catch (error) {
          console.error('[ACTIVITY] Failed to stop tracking:', error)
        }
      }
    }
  }, [isAuthenticated, user, getCurrentUsername])

  // Track page navigation
  useEffect(() => {
    if (isAuthenticated && user) {
      const username = getCurrentUsername()
      
      if (!username) {
        console.error('[ACTIVITY] Cannot track page view - no valid username')
        return
      }

      try {
        activityTracker.logPageView(location.pathname)
      } catch (error) {
        console.error('[ACTIVITY] Failed to log page view:', error)
      }
    }
  }, [location.pathname, isAuthenticated, user, getCurrentUsername])

  // Lesson tracking functions
  const trackLessonStart = useCallback((lessonId: string, lessonTitle: string) => {
    const username = getCurrentUsername()
    if (username) {
      try {
        activityTracker.logLessonStart(lessonId)
      } catch (error) {
        console.error('[ACTIVITY] Failed to track lesson start:', error)
      }
    }
  }, [getCurrentUsername])

  const trackLessonComplete = useCallback((lessonId: string, lessonTitle: string, timeSpent: number) => {
    const username = getCurrentUsername()
    if (username) {
      try {
        activityTracker.logLessonComplete(lessonId, 0, timeSpent)
      } catch (error) {
        console.error('[ACTIVITY] Failed to track lesson complete:', error)
      }
    }
  }, [getCurrentUsername])

  // Quiz tracking functions
  const trackQuizAttempt = useCallback((lessonId: string, quizData: any) => {
    const username = getCurrentUsername()
    if (username) {
      try {
        activityTracker.logQuizAttempt(lessonId, quizData.score || 0, quizData.totalQuestions || 0)
      } catch (error) {
        console.error('[ACTIVITY] Failed to track quiz attempt:', error)
      }
    }
  }, [getCurrentUsername])

  const trackQuizComplete = useCallback((lessonId: string, score: number, timeSpent: number, quizData: any) => {
    const username = getCurrentUsername()
    if (username) {
      try {
        activityTracker.logQuizAttempt(lessonId, score, quizData.totalQuestions || 0)
      } catch (error) {
        console.error('[ACTIVITY] Failed to track quiz complete:', error)
      }
    }
  }, [getCurrentUsername])

  // Game tracking functions
  const trackGamePlay = useCallback((gameId: string, gameName: string, score: number, timeSpent: number) => {
    const username = getCurrentUsername()
    if (username) {
      try {
        activityTracker.logGamePlay(gameName, score, timeSpent)
      } catch (error) {
        console.error('[ACTIVITY] Failed to track game play:', error)
      }
    }
  }, [getCurrentUsername])

  // Get activity summary
  const getActivitySummary = useCallback(async (days: number = 7) => {
    const username = getCurrentUsername()
    if (username) {
      // This method doesn't exist in the current ActivityTracker, so we'll return null for now
      return null
    }
    return null
  }, [getCurrentUsername])

  return {
    trackLessonStart,
    trackLessonComplete,
    trackQuizAttempt,
    trackQuizComplete,
    trackGamePlay,
    getActivitySummary
  }
}

// Helper function to get page titles
function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/': 'Home',
    '/login': 'Login',
    '/signup': 'Sign Up',
    '/dashboard': 'Dashboard',
    '/results': 'Results',
    '/admin': 'Admin Dashboard'
  }

  // Handle dynamic routes
  if (pathname.startsWith('/lessons/')) {
    return 'Lesson View'
  }

  return titles[pathname] || 'Unknown Page'
}