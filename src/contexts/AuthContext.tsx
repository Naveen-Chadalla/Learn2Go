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
  const [initialized, setInitialized] = useState(false)
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

  // Enhanced session isolation - clear ALL user-specific data
  const clearUserSessionData = useCallback((specificUser?: string) => {
    const currentUser = specificUser || user?.user_metadata?.username || user?.email?.split('@')[0]
    
    if (currentUser) {
      // Clear user-specific storage with enhanced isolation
      const userPrefix = `learn2go-${currentUser.toLowerCase()}-`
      const keysToRemove = []
      
      // Clear localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith(userPrefix) || key.startsWith('learn2go-session'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Clear sessionStorage
      const sessionKeys = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (key.startsWith(userPrefix) || key.startsWith('learn2go-'))) {
          sessionKeys.push(key)
        }
      }
      sessionKeys.forEach(key => sessionStorage.removeItem(key))
      
      // Clear any cached data in memory
      if (window.caches) {
        window.caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            if (cacheName.includes('learn2go') || cacheName.includes(currentUser)) {
              window.caches.delete(cacheName)
            }
          })
        }).catch(console.warn)
      }
      
      logDebugInfo(`Cleared session data for user: ${currentUser}`)
    } else {
      // Clear all session data if no specific user
      sessionStorage.clear()
      localStorage.clear()
      logDebugInfo('Cleared all session data')
    }
  }, [user, logDebugInfo])

  // Enhanced user session isolation
  const createIsolatedSession = useCallback((authUser: User) => {
    const username = (authUser.user_metadata?.username || authUser.email!.split('@')[0]).toLowerCase()
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`
    const userSessionKey = `learn2go-${username}-session`
    
    // Create isolated session data
    const sessionData = {
      username,
      email: authUser.email!,
      sessionId,
      timestamp: Date.now(),
      isolated: true,
      country: authUser.user_metadata?.country || 'US',
      language: authUser.user_metadata?.language || 'en'
    }
    
    // Store in user-specific session storage
    sessionStorage.setItem(userSessionKey, JSON.stringify(sessionData))
    sessionStorage.setItem('learn2go-current-user', username)
    
    // Store session token with user isolation
    localStorage.setItem(`learn2go-${username}-token`, sessionId)
    
    logDebugInfo(`Created isolated session for user: ${username}`)
    return sessionData
  }, [logDebugInfo])

  const syncUserProfile = useCallback(async (authUser: User) => {
    try {
      const username = (authUser.user_metadata?.username || authUser.email!.split('@')[0]).toLowerCase()
      const email = authUser.email!
      const country = authUser.user_metadata?.country || 'US'
      const language = authUser.user_metadata?.language || 'en'

      // Create isolated session
      createIsolatedSession(authUser)

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
        // Update existing profile with session isolation
        const { error: updateError } = await supabase
          .from('users')
          .update({
            last_active: new Date().toISOString(),
            session_start: new Date().toISOString(),
            current_page: window.location.pathname
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
            current_page: window.location.pathname
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
  }, [logDebugInfo, createIsolatedSession])

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

      if (error) {
        logDebugInfo('Username availability check failed', error)
        return { available: false, message: 'Error checking username availability' }
      }

      return { available: true, message: 'Username is available!' }
    } catch (error) {
      logDebugInfo('Username availability check failed', error)
      return { available: false, message: 'Error checking username availability' }
    }
  }, [logDebugInfo])

  // STABLE: Initialize auth state with enhanced session isolation and no blinking
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        logDebugInfo('Starting stable auth initialization with session isolation')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          logDebugInfo('Error getting session', error)
          clearUserSessionData()
        }

        if (session?.user) {
          logDebugInfo('Session found with isolation', { username: session.user.user_metadata?.username })
          
          // Verify session isolation
          const currentUser = session.user.user_metadata?.username || session.user.email?.split('@')[0]
          const storedUser = sessionStorage.getItem('learn2go-current-user')
          
          if (storedUser && storedUser !== currentUser?.toLowerCase()) {
            // Different user detected - clear previous session
            logDebugInfo('Different user detected, clearing previous session')
            clearUserSessionData(storedUser)
          }
          
          setSession(session)
          setUser(session.user)
          syncUserProfile(session.user).catch(console.warn)
        } else {
          logDebugInfo('No session found')
          setSession(null)
          setUser(null)
          clearUserSessionData()
        }
      } catch (error) {
        logDebugInfo('Exception during auth initialization', error)
        if (mounted) {
          setSession(null)
          setUser(null)
          clearUserSessionData()
        }
      } finally {
        if (mounted) {
          setInitialized(true)
          // STABLE: Set loading to false immediately after initialization
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Enhanced auth state listener with session isolation
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      logDebugInfo(`Auth state changed with isolation: ${event}`)
      
      setDebugInfo(prev => ({
        ...prev,
        authStateChanges: prev.authStateChanges + 1
      }))

      if (event === 'SIGNED_IN' && session?.user) {
        // Ensure session isolation on sign in
        const currentUser = session.user.user_metadata?.username || session.user.email?.split('@')[0]
        const storedUser = sessionStorage.getItem('learn2go-current-user')
        
        if (storedUser && storedUser !== currentUser?.toLowerCase()) {
          clearUserSessionData(storedUser)
        }
        
        setSession(session)
        setUser(session.user)
        syncUserProfile(session.user).catch(console.warn)
      }

      if (event === 'SIGNED_OUT') {
        logDebugInfo('User signed out with session cleanup')
        const currentUser = user?.user_metadata?.username || user?.email?.split('@')[0]
        setSession(null)
        setUser(null)
        clearUserSessionData(currentUser)
      }

      if (event === 'TOKEN_REFRESHED' && session?.user) {
        logDebugInfo('Token refreshed with session isolation')
        setSession(session)
        setUser(session.user)
      }

      // STABLE: Only set loading to false if not already initialized
      if (initialized) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
      logDebugInfo('Auth provider cleanup completed')
    }
  }, [logDebugInfo, clearUserSessionData, syncUserProfile, user, initialized])

  const signIn = async (username: string) => {
    try {
      const normalizedUsername = username.toLowerCase().trim()
      logDebugInfo(`Attempting secure sign in with isolation for username: ${normalizedUsername}`)
      
      // Clear any existing session data before sign in
      clearUserSessionData()
      
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
      logDebugInfo(`Attempting secure sign up with isolation for username: ${normalizedUsername}`)
      
      // Clear any existing session data before sign up
      clearUserSessionData()
      
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
      
      // Clear state immediately
      setSession(null)
      setUser(null)
      
      // Clear user-specific session data with enhanced isolation
      clearUserSessionData(currentUsername)
      
      // Background cleanup (non-blocking)
      supabase.auth.signOut().catch(console.warn)
      
      logDebugInfo('Secure logout completed with session isolation')
      return { success: true }
      
    } catch (error) {
      logDebugInfo('Exception during logout', error)
      
      // Force clear state even on error
      setSession(null)
      setUser(null)
      clearUserSessionData()
      
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