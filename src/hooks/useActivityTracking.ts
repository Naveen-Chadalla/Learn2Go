import { useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLocation } from 'react-router-dom'
import { activityTracker } from '../services/activityTracker'

export const useActivityTracking = () => {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  // Start session when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.user_metadata?.username) {
      const startTracking = async () => {
        await activityTracker.startSession(user.user_metadata.username)
      }
      startTracking()

      // Set up heartbeat to keep activity updated
      const heartbeatInterval = setInterval(() => {
        activityTracker.updateActivityHeartbeat(user.user_metadata.username)
      }, 60000) // Every minute

      return () => {
        clearInterval(heartbeatInterval)
        // End session when component unmounts or user logs out
        activityTracker.endSession(user.user_metadata.username)
      }
    }
  }, [isAuthenticated, user])

  // Track page navigation
  useEffect(() => {
    if (isAuthenticated && user?.user_metadata?.username) {
      const pageTitle = getPageTitle(location.pathname)
      activityTracker.trackPageView(
        user.user_metadata.username,
        location.pathname,
        pageTitle
      )
    }
  }, [location.pathname, isAuthenticated, user])

  // Lesson tracking functions
  const trackLessonStart = useCallback((lessonId: string, lessonTitle: string) => {
    if (user?.user_metadata?.username) {
      activityTracker.trackLessonStart(user.user_metadata.username, lessonId, lessonTitle)
    }
  }, [user])

  const trackLessonComplete = useCallback((lessonId: string, lessonTitle: string, timeSpent: number) => {
    if (user?.user_metadata?.username) {
      activityTracker.trackLessonComplete(user.user_metadata.username, lessonId, lessonTitle, timeSpent)
    }
  }, [user])

  // Quiz tracking functions
  const trackQuizAttempt = useCallback((lessonId: string, quizData: any) => {
    if (user?.user_metadata?.username) {
      activityTracker.trackQuizAttempt(user.user_metadata.username, lessonId, quizData)
    }
  }, [user])

  const trackQuizComplete = useCallback((lessonId: string, score: number, timeSpent: number, quizData: any) => {
    if (user?.user_metadata?.username) {
      activityTracker.trackQuizComplete(user.user_metadata.username, lessonId, score, timeSpent, quizData)
    }
  }, [user])

  // Game tracking functions
  const trackGamePlay = useCallback((gameId: string, gameName: string, score: number, timeSpent: number) => {
    if (user?.user_metadata?.username) {
      activityTracker.trackGamePlay(user.user_metadata.username, gameId, gameName, score, timeSpent)
    }
  }, [user])

  // Get activity summary
  const getActivitySummary = useCallback(async (days: number = 7) => {
    if (user?.user_metadata?.username) {
      return await activityTracker.getUserActivitySummary(user.user_metadata.username, days)
    }
    return null
  }, [user])

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