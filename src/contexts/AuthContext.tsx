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

  // Clear session data completely with user-specific isolation
  const clearSessionData = useCallback((specificUser?: string) => {
    if (specificUser) {
      // Clear only data for specific user
      const userPrefix = `learn2go-${specificUser}-`
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(userPrefix)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Clear session storage for this user
      const sessionKeys = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && key.startsWith(userPrefix)) {
          sessionKeys.push(key)
        }
      }
      sessionKeys.forEach(key => sessionStorage.removeItem(key))
    } else {
      // Clear all session data
      sessionStorage.clear()
      localStorage.removeItem('learn2go-session')
      localStorage.removeItem('learn2go-user')
      
      // Clear any other app-specific storage
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('learn2go-')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
  }, [])

  const syncUserProfile = useCallback(async (authUser: User) => {
    try {
      const username = (authUser.user_metadata?.username || authUser.email!.split('@')[0]).toLowerCase()
      const email = authUser.email!
      const country = authUser.user_metadata?.country || 'US'
      const language = authUser.user_metadata?.language || 'en'

      // Store user-specific session data
      const userSessionKey = `learn2go-${username}-session`
      const userDataKey = `learn2go-${username}-data`
      
      sessionStorage.setItem(userSessionKey, JSON.stringify({
        username,
        email,
        timestamp: Date.now()
      }))
      
      localStorage.setItem(userDataKey, JSON.stringify({
        username,
        country,
        language,
        lastLogin: new Date().toISOString()
      }))

      // Check if user profile exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('username, email')
        .eq('username', username)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
        logDebugInfo('Error checking existing user profile', checkError)
        return
      }

      if (existingUser) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('users')
          .update({
            last_active: new Date().toISOString(),
            session_start: new Date().toISOString(),
          })
          .eq('username', username)

        if (updateError) {
          logDebugInfo('Error updating user profile', updateError)
        } else {
          logDebugInfo('User profile updated successfully')
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
          })

        if (insertError) {
          logDebugInfo('Error creating user profile', insertError)
        } else {
          logDebugInfo('User profile created successfully')
        }
      }
    } catch (error) {
      logDebugInfo('Exception during user profile sync', error)
    }
  }, [logDebugInfo])

  const updateUserActivity = useCallback(async (authUser: User) => {
    try {
      const username = (authUser.user_metadata?.username || authUser.email!.split('@')[0]).toLowerCase()
      
      const { error } = await supabase
        .from('users')
        .upsert({
          username,
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
      // Check if username exists in public.users table
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', normalizedUsername)
        .maybeSingle()

      // If data exists, username is taken
      if (data) {
        return { available: false, message: 'Username is already taken' }
      }

      // If there's an error, it's a real failure
      if (error && error.code !== 'PGRST116') {
        logDebugInfo('Username availability check failed', error)
        return { available: false, message: 'Error checking username availability' }
      }

      // Check if the derived email already exists in Supabase auth.users
      // We do this by attempting a "dry run" sign-in with a dummy password
      const tempEmail = `${normalizedUsername}@learn2go.local`
      const dummyPassword = 'dummy_password_for_check'
      
      try {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: tempEmail,
          password: dummyPassword
        })

        // If we get invalid_credentials error, it means the email exists but password is wrong
        // This indicates the username is already taken in the auth system
        if (authError && (
          authError.message?.toLowerCase().includes('invalid login credentials') ||
          authError.message?.toLowerCase().includes('invalid_credentials') ||
          authError.code === 'invalid_credentials'
        )) {
          return { available: false, message: 'Username is already registered. Please try signing in instead.' }
        }

        // Any other auth error (like network issues) should not block availability check
        // We'll assume the username is available if we can't verify otherwise
      } catch (authCheckError) {
        // Network or other errors during auth check - don't block availability
        logDebugInfo('Auth availability check failed, proceeding with availability', authCheckError)
      }

      // If both checks pass, username is available
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

    // Auth state listener
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
        syncUserProfile(session.user).catch(console.warn)
      }

      if (event === 'SIGNED_OUT') {
        logDebugInfo('User signed out')
        setSession(null)
        setUser(null)
        clearSessionData()
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
  }, [logDebugInfo, clearSessionData, syncUserProfile])

  const signIn = async (username: string) => {
    try {
      const normalizedUsername = username.toLowerCase().trim()
      logDebugInfo(`Attempting sign in for username: ${normalizedUsername}`)
      
      // Clear any existing session data
      clearSessionData()
      
      // First, check if the username exists in our users table
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('username, email')
        .eq('username', normalizedUsername)
        .maybeSingle()

      if (userCheckError && userCheckError.code !== 'PGRST116') {
        logDebugInfo('Error checking user existence', userCheckError)
        return { 
          data: null, 
          error: { 
            message: 'Error checking user account. Please try again.',
            code: 'user_check_error'
          } 
        }
      }

      // If user doesn't exist in our users table, provide specific guidance
      if (!existingUser) {
        logDebugInfo(`Username ${normalizedUsername} not found in users table`)
        return { 
          data: null, 
          error: { 
            message: 'Username not found. Please check your username or sign up for a new account.',
            code: 'username_not_found'
          } 
        }
      }

      // User exists, proceed with authentication
      const tempEmail = `${normalizedUsername}@learn2go.local`
      const tempPassword = `${normalizedUsername}_temp_pass_123`
      
      // Attempt authentication with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: tempEmail, 
        password: tempPassword 
      })

      if (error) {
        logDebugInfo('Sign in error', error)
        
        // Enhanced error handling with updated error codes
        if (error.message?.toLowerCase().includes('invalid login credentials') ||
            error.message?.toLowerCase().includes('invalid_credentials') ||
            error.code === 'invalid_credentials' ||
            error.status === 400) {
          return { 
            data: null, 
            error: { 
              message: 'Authentication failed. There may be an issue with your account. Please try signing up again or contact support.',
              code: 'auth_mismatch'
            } 
          }
        }
        
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          return { 
            data: null, 
            error: { 
              message: 'Please verify your email address before signing in.',
              code: 'email_not_confirmed'
            } 
          }
        }

        if (error.message?.toLowerCase().includes('too many requests')) {
          return { 
            data: null, 
            error: { 
              message: 'Too many login attempts. Please try again later.',
              code: 'rate_limit'
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
        logDebugInfo('Sign in successful', { username: normalizedUsername })
        
        // Sync user profile after successful authentication
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
      
      if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
        return { 
          data: null, 
          error: { 
            message: 'Network error. Please check your connection and try again.',
            code: 'network_error'
          } 
        }
      }
      
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
          emailRedirectTo: undefined // Disable email confirmation
        }
      })

      if (error) {
        logDebugInfo('Sign up error', error)
        
        // Handle specific signup errors with improved invalid_credentials handling
        if (error.message?.toLowerCase().includes('user already registered')) {
          return { 
            data: null, 
            error: { 
              message: 'This username is already registered. Please try signing in instead.',
              code: 'user_exists'
            } 
          }
        }

        // Handle invalid_credentials error during signup
        if (error.message?.toLowerCase().includes('invalid login credentials') ||
            error.message?.toLowerCase().includes('invalid_credentials') ||
            error.code === 'invalid_credentials') {
          return { 
            data: null, 
            error: { 
              message: 'This username is already registered. Please try signing in instead.',
              code: 'user_exists'
            } 
          }
        }
        
        return { 
          data: null, 
          error: { 
            message: error.message || 'An error occurred during sign up. Please try again.',
            code: error.code || 'signup_error'
          } 
        }
      }

      // Critical validation: Ensure user was actually created
      if (!data.user) {
        logDebugInfo('Sign up failed: User creation returned null despite no error')
        return { 
          data: null, 
          error: { 
            message: 'Account creation failed unexpectedly. Please try again or contact support if the issue persists.',
            code: 'user_creation_failed'
          } 
        }
      }

      logDebugInfo('Creating user profile in database')
      const { error: profileError } = await supabase.from('users').insert({
        username: normalizedUsername,
        email: tempEmail,
        country: country,
        language: language,
      })

      if (profileError) {
        logDebugInfo('Error creating user profile', profileError)
        // Don't fail the signup if profile creation fails, but log it
      }
      
      logDebugInfo('Sign up successful', { username: normalizedUsername })
      
      // Return success with redirect flag
      return { 
        data: { 
          ...data, 
          shouldRedirectToLogin: true 
        }, 
        error: null 
      }

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
      logDebugInfo('Starting secure logout')
      
      const currentUsername = user?.user_metadata?.username || user?.email?.split('@')[0]
      
      // Clear state immediately
      setSession(null)
      setUser(null)
      
      // Clear user-specific session data
      if (currentUsername) {
        clearSessionData(currentUsername)
      } else {
        clearSessionData()
      }
      
      // Background cleanup (non-blocking)
      supabase.auth.signOut().catch(console.warn)
      
      logDebugInfo('Secure logout completed')
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