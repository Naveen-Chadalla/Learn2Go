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

  const updateUserActivity = useCallback(async (authUser: User) => {
    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          username: authUser.user_metadata?.username || authUser.email!.split('@')[0],
          email: authUser.email!,
          country: authUser.user_metadata?.country || 'US',
          language: authUser.user_metadata?.language || 'en',
          last_active: new Date().toISOString(),
        })

      if (error) {
        logDebugInfo('Error updating user activity', error)
      }
    } catch (error) {
      logDebugInfo('Exception during user activity update', error)
    }
  }, [logDebugInfo])

  const checkUsernameAvailability = useCallback(async (username: string): Promise<{ available: boolean; message: string }> => {
    if (!username || username.length < 3) {
      return { available: false, message: 'Username must be at least 3 characters long' }
    }

    if (username.length > 20) {
      return { available: false, message: 'Username must be less than 20 characters' }
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { available: false, message: 'Username can only contain letters, numbers, and underscores' }
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .maybeSingle()

      // If data exists, username is taken
      if (data) {
        return { available: false, message: 'Username is already taken' }
      }

      // If there's an error, it's a real failure
      if (error) {
        logDebugInfo('Username availability check failed', error)
        return { available: false, message: 'Error checking username availability' }
      }

      // If both data and error are null, username is available
      return { available: true, message: 'Username is available!' }
    } catch (error) {
      logDebugInfo('Username availability check failed', error)
      return { available: false, message: 'Error checking username availability' }
    }
  }, [logDebugInfo])

  // ULTRA SIMPLIFIED initialization - no complex operations
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        logDebugInfo('Starting auth initialization')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          logDebugInfo('Error getting session', error)
        }

        if (session?.user) {
          logDebugInfo('Session found', { username: session.user.user_metadata?.username })
          setSession(session)
          setUser(session.user)
          updateUserActivity(session.user).catch(console.warn)
        } else {
          logDebugInfo('No session found')
          setSession(null)
          setUser(null)
        }
      } catch (error) {
        logDebugInfo('Exception during auth initialization', error)
        if (mounted) {
          setSession(null)
          setUser(null)
        }
      } finally {
        if (mounted) {
          // ALWAYS set loading to false after 100ms minimum
          setTimeout(() => {
            if (mounted) {
              setLoading(false)
            }
          }, 100)
        }
      }
    }

    initializeAuth()

    // SIMPLIFIED auth state listener
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
        updateUserActivity(session.user).catch(console.warn)
      }

      if (event === 'SIGNED_OUT') {
        logDebugInfo('User signed out')
        setSession(null)
        setUser(null)
      }

      if (event === 'TOKEN_REFRESHED' && session?.user) {
        logDebugInfo('Token refreshed')
        setSession(session)
        setUser(session.user)
      }

      // Ensure loading is false
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
      logDebugInfo('Auth provider cleanup completed')
    }
  }, [updateUserActivity, logDebugInfo])

  const signIn = async (username: string) => {
    try {
      logDebugInfo(`Attempting sign in for username: ${username}`)
      
      const tempEmail = `${username}@learn2go.local`
      const tempPassword = `${username}_temp_pass_123`
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: tempEmail, 
        password: tempPassword 
      })

      if (error && (
        error.message.includes('Invalid login credentials') ||
        error.message.includes('invalid_credentials') ||
        error.code === 'invalid_credentials'
      )) {
        logDebugInfo('User not found during sign in', error)
        return { data: null, error: { message: 'User not found. Please sign up first.' } }
      }

      if (error) {
        logDebugInfo('Sign in error', error)
        return { data: null, error }
      }

      logDebugInfo('Sign in successful', { username })
      return { data, error: null }
    } catch (error) {
      logDebugInfo('Exception during sign in', error)
      return { data: null, error: { message: 'An unexpected error occurred during sign in.' } }
    }
  }

  const signUp = async (username: string, country: string, language: string) => {
    try {
      logDebugInfo(`Attempting sign up for username: ${username}`)
      
      const availability = await checkUsernameAvailability(username)
      if (!availability.available) {
        return { data: null, error: { message: availability.message } }
      }
      
      const tempEmail = `${username}@learn2go.local`
      const tempPassword = `${username}_temp_pass_123`
      
      const { data, error } = await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
        options: {
          data: {
            username: username,
            country: country,
            language: language,
          }
        }
      })

      if (data.user && !error) {
        logDebugInfo('Creating user profile in database')
        const { error: profileError } = await supabase.from('users').insert({
          username: username,
          email: tempEmail,
          country: country,
          language: language,
        })

        if (profileError) {
          logDebugInfo('Error creating user profile', profileError)
        }
      }

      if (error) {
        logDebugInfo('Sign up error', error)
      } else {
        logDebugInfo('Sign up successful', { username })
      }

      return { data, error }
    } catch (error) {
      logDebugInfo('Exception during sign up', error)
      return { data: null, error: { message: 'An unexpected error occurred during sign up.' } }
    }
  }

  const signOut = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      logDebugInfo('Starting instant logout')
      
      // Clear state immediately
      setSession(null)
      setUser(null)
      
      // Background cleanup (non-blocking)
      supabase.auth.signOut().catch(console.warn)
      
      logDebugInfo('Instant logout completed')
      return { success: true }
      
    } catch (error) {
      logDebugInfo('Exception during logout', error)
      
      // Force clear state even on error
      setSession(null)
      setUser(null)
      
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