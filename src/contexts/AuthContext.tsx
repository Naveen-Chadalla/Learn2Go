import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (username: string) => Promise<any>
  signUp: (username: string, country: string, language: string) => Promise<any>
  signOut: () => Promise<{ success: boolean; error?: string }>
  isAdmin: boolean
  isAuthenticated: boolean
  checkUsernameAvailability: (username: string) => Promise<{ available: boolean; message: string }>
  debugInfo: {
    lastError: string | null
    authStateChanges: number
    lastActivity: string | null
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState({
    lastError: null as string | null,
    authStateChanges: 0,
    lastActivity: null as string | null
  })

  const logDebugInfo = useCallback((message: string, error?: any) => {
    console.log(`[AUTH] ${message}`, error || '')
    setDebugInfo(prev => ({
      ...prev,
      lastError: error ? `${message}: ${error.message || error}` : null,
      lastActivity: new Date().toISOString()
    }))
  }, [])

  // Enhanced session isolation - clear data with user-specific namespacing
  const clearSessionData = useCallback((specificUser?: string) => {
    const sessionId = Date.now().toString()
    
    if (specificUser) {
      // Clear only data for specific user with enhanced isolation
      const userPrefix = `learn2go-${specificUser}-`
      const keysToRemove = []
      
      // Clear localStorage for this user
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(userPrefix)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Clear sessionStorage for this user
      const sessionKeys = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && key.startsWith(userPrefix)) {
          sessionKeys.push(key)
        }
      }
      sessionKeys.forEach(key => sessionStorage.removeItem(key))
      
      // Clear any cached data for this user
      const cacheKeys = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes(specificUser) || key.includes(`user_${specificUser}`))) {
          cacheKeys.push(key)
        }
      }
      cacheKeys.forEach(key => localStorage.removeItem(key))
      
      console.log(`[AUTH] Cleared session data for user: ${specificUser}`)
    } else {
      // Clear all session data
      sessionStorage.clear()
      
      // Clear only Learn2Go related localStorage items
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('learn2go-')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      console.log('[AUTH] Cleared all session data')
    }
    
    // Set session isolation marker
    sessionStorage.setItem('learn2go-session-id', sessionId)
  }, [])

  // Enhanced user profile sync with session isolation
  const syncUserProfile = useCallback(async (authUser: User) => {
    try {
      const username = (authUser.user_metadata?.username || authUser.email!.split('@')[0]).toLowerCase()
      const email = authUser.email!
      const country = authUser.user_metadata?.country || 'US'
      const language = authUser.user_metadata?.language || 'en'
      const sessionId = sessionStorage.getItem('learn2go-session-id') || Date.now().toString()

      // Store user-specific session data with enhanced isolation
      const userSessionKey = `learn2go-${username}-session-${sessionId}`
      const userDataKey = `learn2go-${username}-data`
      const userCacheKey = `learn2go-${username}-cache`
      
      // Clear any existing session data for this user first
      clearSessionData(username)
      
      // Set new session data
      sessionStorage.setItem(userSessionKey, JSON.stringify({
        username,
        email,
        sessionId,
        timestamp: Date.now(),
        isolated: true
      }))
      
      localStorage.setItem(userDataKey, JSON.stringify({
        username,
        country,
        language,
        lastLogin: new Date().toISOString(),
        sessionId
      }))
      
      // Initialize user cache
      localStorage.setItem(userCacheKey, JSON.stringify({
        lessons: [],
        progress: [],
        lastUpdated: new Date().toISOString()
      }))

      // Check if user profile exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('username, email')
        .eq('username', username)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        logDebugInfo('Error checking existing user profile', checkError)
        return
      }

      if (existingUser) {
        // Update existing profile with session tracking
        const { error: updateError } = await supabase
          .from('users')
          .update({
            last_active: new Date().toISOString(),
            session_start: new Date().toISOString(),
            current_page: window.location.pathname,
            total_login_count: existingUser.total_login_count ? existingUser.total_login_count + 1 : 1
          })
          .eq('username', username)

        if (updateError) {
          logDebugInfo('Error updating user profile', updateError)
        } else {
          logDebugInfo('User profile updated successfully with session isolation')
        }
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            username,
            email,
            country,
            language,
            last_active: new Date().toISOString(),
            session_start: new Date().toISOString(),
            current_page: window.location.pathname,
            total_login_count: 1
          })

        if (insertError) {
          logDebugInfo('Error creating user profile', insertError)
        } else {
          logDebugInfo('User profile created successfully with session isolation')
        }
      }
    } catch (error) {
      logDebugInfo('Exception during user profile sync', error)
    }
  }, [logDebugInfo, clearSessionData])

  const checkUsernameAvailability = useCallback(async (username: string): Promise<{ available: boolean; message: string }> => {
    const normalizedUsername = username.toLowerCase().trim()
    
    if (!normalizedUsername || normalizedUsername.length < 3) {
      return { available: false, message: 'Username must be at least 3 characters long' }
    }

    if (normalizedUsername.length > 20) {
      return { available: false, message: 'Username must be less than 20 characters' }
    }

    if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
      return { available: false, message: 'Username can only contain letters, numbers, and underscores' }
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', normalizedUsername)
        .maybeSingle()

      if (data) {
        return { available: false, message: 'Username is already taken' }
      }

      if (error && error.code !== 'PGRST116') {
        logDebugInfo('Username availability check failed', error)
        return { available: false, message: 'Error checking username availability' }
      }

      return { available: true, message: 'Username is available!' }
    } catch (error) {
      logDebugInfo('Username availability check failed', error)
      return { available: false, message: 'Error checking username availability' }
    }
  }, [logDebugInfo])

  // Initialize auth state with enhanced session isolation
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        logDebugInfo('Starting auth initialization with session isolation')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          logDebugInfo('Error getting session', error)
          clearSessionData()
        }

        if (session?.user) {
          logDebugInfo('Session found with isolation', { username: session.user.user_metadata?.username })
          setSession(session)
          setUser(session.user)
          syncUserProfile(session.user).catch(console.warn)
        } else {
          logDebugInfo('No session found')
          setSession(null)
          setUser(null)
          clearSessionData()
        }
      } catch (error) {
        logDebugInfo('Exception during auth initialization', error)
        if (mounted) {
          setSession(null)
          setUser(null)
          clearSessionData()
        }
      } finally {
        if (mounted) {
          setTimeout(() => {
            if (mounted) {
              setLoading(false)
            }
          }, 100)
        }
      }
    }

    initializeAuth()

    // Auth state listener with session isolation
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      logDebugInfo(`Auth state changed with isolation: ${event}`)
      
      setDebugInfo(prev => ({
        ...prev,
        authStateChanges: prev.authStateChanges + 1
      }))

      if (event === 'SIGNED_IN' && session?.user) {
        setSession(session)
        setUser(session.user)
        syncUserProfile(session.user).catch(console.warn)
      }

      if (event === 'SIGNED_OUT') {
        const currentUsername = user?.user_metadata?.username || user?.email?.split('@')[0]
        logDebugInfo('User signed out with session isolation')
        setSession(null)
        setUser(null)
        clearSessionData(currentUsername)
      }

      if (event === 'TOKEN_REFRESHED' && session?.user) {
        logDebugInfo('Token refreshed with session isolation')
        setSession(session)
        setUser(session.user)
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
      logDebugInfo('Auth provider cleanup completed with session isolation')
    }
  }, [logDebugInfo, clearSessionData, syncUserProfile, user])

  const signIn = async (username: string) => {
    try {
      const normalizedUsername = username.toLowerCase().trim()
      logDebugInfo(`Attempting sign in with session isolation for username: ${normalizedUsername}`)
      
      // Clear any existing session data before new login
      clearSessionData()
      
      const tempEmail = `${normalizedUsername}@learn2go.local`
      const tempPassword = `${normalizedUsername}_temp_pass_123`
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: tempEmail, 
        password: tempPassword 
      })

      if (error) {
        logDebugInfo('Sign in error', error)
        
        if (error.message?.toLowerCase().includes('invalid login credentials') ||
            error.message?.toLowerCase().includes('invalid_credentials') ||
            error.code === 'invalid_credentials' ||
            error.status === 400) {
          return { 
            data: null, 
            error: { 
              message: 'Invalid username or the account may not exist. Please check your username or sign up for a new account.',
              code: 'invalid_credentials'
            } 
          }
        }
        
        return { 
          data: null, 
          error: { 
            message: error.message || 'An error occurred during sign in. Please try again.',
            code: error.code || 'unknown_error'
          } 
        }
      }

      if (data?.user) {
        logDebugInfo('Sign in successful with session isolation', { username: normalizedUsername })
        await syncUserProfile(data.user)
        return { data, error: null }
      }

      return { 
        data: null, 
        error: { 
          message: 'Sign in failed. Please try again.',
          code: 'unknown_error'
        } 
      }

    } catch (error: any) {
      logDebugInfo('Exception during sign in', error)
      return { 
        data: null, 
        error: { 
          message: 'An unexpected error occurred during sign in. Please try again.',
          code: 'unexpected_error'
        } 
      }
    }
  }

  const signUp = async (username: string, country: string, language: string) => {
    try {
      const normalizedUsername = username.toLowerCase().trim()
      logDebugInfo(`Attempting sign up with session isolation for username: ${normalizedUsername}`)
      
      // Clear any existing session data
      clearSessionData()
      
      const availability = await checkUsernameAvailability(normalizedUsername)
      if (!availability.available) {
        return { data: null, error: { message: availability.message } }
      }
      
      const tempEmail = `${normalizedUsername}@learn2go.local`
      const tempPassword = `${normalizedUsername}_temp_pass_123`
      
      const { data, error } = await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
        options: {
          data: {
            username: normalizedUsername,
            country: country,
            language: language,
          },
          emailRedirectTo: undefined
        }
      })

      if (error) {
        logDebugInfo('Sign up error', error)
        return { 
          data: null, 
          error: { 
            message: error.message || 'An error occurred during sign up. Please try again.',
            code: error.code || 'signup_error'
          } 
        }
      }

      if (data.user) {
        logDebugInfo('Creating user profile in database with session isolation')
        const { error: profileError } = await supabase.from('users').insert({
          username: normalizedUsername,
          email: tempEmail,
          country: country,
          language: language,
        })

        if (profileError) {
          logDebugInfo('Error creating user profile', profileError)
        }
        
        logDebugInfo('Sign up successful with session isolation', { username: normalizedUsername })
        
        return { 
          data: { 
            ...data, 
            shouldRedirectToLogin: true 
          }, 
          error: null 
        }
      }

      return { data, error: null }
    } catch (error) {
      logDebugInfo('Exception during sign up', error)
      return { 
        data: null, 
        error: { 
          message: 'An unexpected error occurred during sign up. Please try again.',
          code: 'unexpected_error'
        } 
      }
    }
  }

  const signOut = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      logDebugInfo('Starting secure logout with session isolation')
      
      const currentUsername = user?.user_metadata?.username || user?.email?.split('@')[0]
      
      // Update user's session end time
      if (currentUsername) {
        try {
          await supabase
            .from('users')
            .update({ 
              session_end: new Date().toISOString(),
              current_page: 'offline'
            })
            .eq('username', currentUsername)
        } catch (error) {
          console.warn('[AUTH] Failed to update session end time:', error)
        }
      }
      
      // Clear state immediately
      setSession(null)
      setUser(null)
      
      // Clear user-specific session data with enhanced isolation
      if (currentUsername) {
        clearSessionData(currentUsername)
      } else {
        clearSessionData()
      }
      
      // Background cleanup (non-blocking)
      supabase.auth.signOut().catch(console.warn)
      
      logDebugInfo('Secure logout completed with session isolation')
      return { success: true }
      
    } catch (error) {
      logDebugInfo('Exception during logout', error)
      
      // Force clear state even on error
      setSession(null)
      setUser(null)
      clearSessionData()
      
      return { 
        success: true, 
        error: `Logout completed with minor issues: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  const isAdmin = user?.user_metadata?.username === 'Hari'
  const isAuthenticated = !!user && !!session

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isAuthenticated,
    checkUsernameAvailability,
    debugInfo,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}