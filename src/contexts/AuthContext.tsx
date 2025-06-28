import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

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

  // Clear session data with user isolation
  const clearSessionData = useCallback((specificUser?: string) => {
    const sessionId = Date.now().toString()
    
    if (specificUser) {
      const userPrefix = `learn2go-${specificUser}-`
      const keysToRemove = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(userPrefix)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      const sessionKeys = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && key.startsWith(userPrefix)) {
          sessionKeys.push(key)
        }
      }
      sessionKeys.forEach(key => sessionStorage.removeItem(key))
    } else {
      sessionStorage.clear()
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('learn2go-')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
    
    sessionStorage.setItem('learn2go-session-id', sessionId)
  }, [])

  // Demo mode authentication for when Supabase is not configured
  const demoSignIn = useCallback(async (username: string) => {
    const normalizedUsername = username.toLowerCase().trim()
    
    // Create a demo user object
    const demoUser = {
      id: `demo-${normalizedUsername}`,
      email: `${normalizedUsername}@learn2go.demo`,
      user_metadata: {
        username: normalizedUsername,
        country: 'US',
        language: 'en'
      },
      created_at: new Date().toISOString()
    } as User

    const demoSession = {
      user: demoUser,
      access_token: 'demo-token',
      refresh_token: 'demo-refresh',
      expires_in: 3600,
      token_type: 'bearer'
    } as Session

    setUser(demoUser)
    setSession(demoSession)
    
    // Store demo session
    localStorage.setItem(`learn2go-${normalizedUsername}-demo`, JSON.stringify({
      user: demoUser,
      session: demoSession,
      timestamp: Date.now()
    }))

    return { data: { user: demoUser, session: demoSession }, error: null }
  }, [])

  const demoSignUp = useCallback(async (username: string, country: string, language: string) => {
    const normalizedUsername = username.toLowerCase().trim()
    
    // Check if demo user already exists
    const existingDemo = localStorage.getItem(`learn2go-${normalizedUsername}-demo`)
    if (existingDemo) {
      return { 
        data: null, 
        error: { 
          message: 'Username already exists in demo mode. Try signing in instead.',
          code: 'user_exists'
        } 
      }
    }

    const demoUser = {
      id: `demo-${normalizedUsername}`,
      email: `${normalizedUsername}@learn2go.demo`,
      user_metadata: {
        username: normalizedUsername,
        country,
        language
      },
      created_at: new Date().toISOString()
    } as User

    const demoSession = {
      user: demoUser,
      access_token: 'demo-token',
      refresh_token: 'demo-refresh',
      expires_in: 3600,
      token_type: 'bearer'
    } as Session

    setUser(demoUser)
    setSession(demoSession)
    
    localStorage.setItem(`learn2go-${normalizedUsername}-demo`, JSON.stringify({
      user: demoUser,
      session: demoSession,
      timestamp: Date.now()
    }))

    return { data: { user: demoUser, session: demoSession }, error: null }
  }, [])

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

    if (!isSupabaseConfigured) {
      // Demo mode - check localStorage
      const existingDemo = localStorage.getItem(`learn2go-${normalizedUsername}-demo`)
      if (existingDemo) {
        return { available: false, message: 'Username is already taken' }
      }
      return { available: true, message: 'Username is available!' }
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

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        logDebugInfo('Starting auth initialization')
        
        if (!isSupabaseConfigured) {
          logDebugInfo('Running in demo mode - Supabase not configured')
          setLoading(false)
          return
        }

        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          logDebugInfo('Error getting session', error)
          clearSessionData()
        }

        if (session?.user) {
          logDebugInfo('Session found', { username: session.user.user_metadata?.username })
          setSession(session)
          setUser(session.user)
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
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Only set up auth listener if Supabase is configured
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return

        logDebugInfo(`Auth state changed: ${event}`)
        
        setDebugInfo(prev => ({
          ...prev,
          authStateChanges: prev.authStateChanges + 1
        }))

        if (event === 'SIGNED_IN' && session?.user) {
          setSession(session)
          setUser(session.user)
        }

        if (event === 'SIGNED_OUT') {
          const currentUsername = user?.user_metadata?.username || user?.email?.split('@')[0]
          logDebugInfo('User signed out')
          setSession(null)
          setUser(null)
          clearSessionData(currentUsername)
        }

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          logDebugInfo('Token refreshed')
          setSession(session)
          setUser(session.user)
        }

        setLoading(false)
      })

      return () => {
        mounted = false
        subscription.unsubscribe()
        logDebugInfo('Auth provider cleanup completed')
      }
    }

    return () => {
      mounted = false
    }
  }, [logDebugInfo, clearSessionData, user])

  const signIn = async (username: string) => {
    try {
      const normalizedUsername = username.toLowerCase().trim()
      logDebugInfo(`Attempting sign in for username: ${normalizedUsername}`)
      
      clearSessionData()

      if (!isSupabaseConfigured) {
        logDebugInfo('Using demo mode authentication')
        return await demoSignIn(normalizedUsername)
      }
      
      const tempEmail = `${normalizedUsername}@learn2go.local`
      const tempPassword = `${normalizedUsername}_temp_pass_123`
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: tempEmail, 
        password: tempPassword 
      })

      if (error) {
        logDebugInfo('Sign in error', error)
        return { 
          data: null, 
          error: { 
            message: 'Invalid username or the account may not exist. Please check your username or sign up for a new account.',
            code: 'invalid_credentials'
          } 
        }
      }

      if (data?.user) {
        logDebugInfo('Sign in successful', { username: normalizedUsername })
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
      logDebugInfo(`Attempting sign up for username: ${normalizedUsername}`)
      
      clearSessionData()

      if (!isSupabaseConfigured) {
        logDebugInfo('Using demo mode registration')
        return await demoSignUp(normalizedUsername, country, language)
      }
      
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
        logDebugInfo('Sign up successful', { username: normalizedUsername })
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
      logDebugInfo('Starting logout')
      
      const currentUsername = user?.user_metadata?.username || user?.email?.split('@')[0]
      
      setSession(null)
      setUser(null)
      
      if (currentUsername) {
        clearSessionData(currentUsername)
      } else {
        clearSessionData()
      }
      
      if (isSupabaseConfigured) {
        supabase.auth.signOut().catch(console.warn)
      }
      
      logDebugInfo('Logout completed')
      return { success: true }
      
    } catch (error) {
      logDebugInfo('Exception during logout', error)
      
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