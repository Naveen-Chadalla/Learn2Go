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
          await activityTracker.startSession(username)
        } catch (error) {
          console.error('[ACTIVITY] Failed to start session:', error)
        }
      }
      
      startTracking()

      // Set up heartbeat to keep activity updated
      const heartbeatInterval = setInterval(() => {
        activityTracker.updateActivityHeartbeat(username)
      }, 60000) // Every minute

      return () => {
        clearInterval(heartbeatInterval)
        // End session when component unmounts or user logs out
        activityTracker.endSession(username)
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

      const pageTitle = getPageTitle(location.pathname)
      activityTracker.trackPageView(username, location.pathname, pageTitle)
    }
  }, [location.pathname, isAuthenticated, user, getCurrentUsername])

  // Lesson tracking functions
  const trackLessonStart = useCallback((lessonId: string, lessonTitle: string) => {
    const username = getCurrentUsername()
    if (username) {
      activityTracker.trackLessonStart(username, lessonId, lessonTitle)
    }
  }, [getCurrentUsername])

  const trackLessonComplete = useCallback((lessonId: string, lessonTitle: string, timeSpent: number) => {
    const username = getCurrentUsername()
    if (username) {
      activityTracker.trackLessonComplete(username, lessonId, lessonTitle, timeSpent)
    }
  }, [getCurrentUsername])

  // Quiz tracking functions
  const trackQuizAttempt = useCallback((lessonId: string, quizData: any) => {
    const username = getCurrentUsername()
    if (username) {
      activityTracker.trackQuizAttempt(username, lessonId, quizData)
    }
  }, [getCurrentUsername])

  const trackQuizComplete = useCallback((lessonId: string, score: number, timeSpent: number, quizData: any) => {
    const username = getCurrentUsername()
    if (username) {
      activityTracker.trackQuizComplete(username, lessonId, score, timeSpent, quizData)
    }
  }, [getCurrentUsername])

  // Game tracking functions
  const trackGamePlay = useCallback((gameId: string, gameName: string, score: number, timeSpent: number) => {
    const username = getCurrentUsername()
    if (username) {
      activityTracker.trackGamePlay(username, gameId, gameName, score, timeSpent)
    }
  }, [getCurrentUsername])

  // Get activity summary
  const getActivitySummary = useCallback(async (days: number = 7) => {
    const username = getCurrentUsername()
    if (username) {
      return await activityTracker.getUserActivitySummary(username, days)
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