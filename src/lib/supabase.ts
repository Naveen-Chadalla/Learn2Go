import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if we're in development mode with placeholder values
const isPlaceholderConfig = 
  !supabaseUrl || 
  supabaseUrl === 'your_supabase_url_here' ||
  !supabaseAnonKey || 
  supabaseAnonKey === 'your_supabase_anon_key_here'

// Enhanced validation for environment variables
const validateSupabaseConfig = () => {
  if (isPlaceholderConfig) {
    console.warn(
      '⚠️  Supabase is not configured. Running in development mode.\n\n' +
      'To connect to Supabase:\n' +
      '1. Go to your Supabase project dashboard\n' +
      '2. Navigate to Settings > API\n' +
      '3. Copy your Project URL and anon key\n' +
      '4. Update your .env file with:\n' +
      '   VITE_SUPABASE_URL=https://your-project-id.supabase.co\n' +
      '   VITE_SUPABASE_ANON_KEY=your-anon-key\n' +
      '5. Restart your development server'
    )
    return false
  }

  // Validate URL format
  try {
    const url = new URL(supabaseUrl)
    if (!url.hostname.includes('supabase.co') && !url.hostname.includes('localhost')) {
      throw new Error('Invalid Supabase URL format')
    }
  } catch (error) {
    throw new Error(
      `❌ Invalid VITE_SUPABASE_URL format: ${supabaseUrl}\n\n` +
      'The URL should look like: https://your-project-id.supabase.co\n' +
      'Please check your .env file and ensure the URL is complete and correct.'
    )
  }

  // Validate key format (basic check)
  if (supabaseAnonKey.length < 100) {
    throw new Error(
      '❌ VITE_SUPABASE_ANON_KEY appears to be invalid.\n\n' +
      'The anonymous key should be a long JWT token.\n' +
      'Please verify you copied the complete key from your Supabase dashboard.'
    )
  }

  return true
}

// Validate configuration
const isConfigValid = validateSupabaseConfig()

// Create Supabase client with fallback for development
export const supabase = isConfigValid 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'X-Client-Info': 'learning-app'
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : createClient(
      'https://placeholder.supabase.co', 
      'placeholder-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    )

// Enhanced connection test function with better error handling
export const testSupabaseConnection = async () => {
  if (!isConfigValid) {
    console.log('⚠️  Supabase not configured - skipping connection test')
    return false
  }

  try {
    console.log('🔄 Testing Supabase connection...')
    
    const { data, error } = await supabase
      .from('lessons')
      .select('count')
      .limit(1)
      .single()
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error)
      
      // Provide specific error guidance
      if (error.message.includes('Failed to fetch')) {
        console.error(
          '🔧 Connection Error: Unable to reach Supabase.\n' +
          'Please check:\n' +
          '1. Your internet connection\n' +
          '2. VITE_SUPABASE_URL is correct\n' +
          '3. Your Supabase project is active'
        )
      } else if (error.message.includes('JWT')) {
        console.error(
          '🔧 Authentication Error: Invalid API key.\n' +
          'Please verify VITE_SUPABASE_ANON_KEY is correct.'
        )
      }
      
      return false
    }
    
    console.log('✅ Supabase connection test successful')
    return true
  } catch (err) {
    console.error('❌ Supabase connection test error:', err)
    
    if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
      console.error(
        '🔧 Network Error: Cannot connect to Supabase.\n' +
        'This usually means:\n' +
        '1. Invalid or incomplete VITE_SUPABASE_URL\n' +
        '2. Network connectivity issues\n' +
        '3. Supabase service is down\n\n' +
        'Current URL:', supabaseUrl
      )
    }
    
    return false
  }
}

// Export configuration status for components to check
export const isSupabaseConfigured = isConfigValid

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          username: string
          email: string
          created_at: string
          last_active: string
          progress: number
          current_level: number
          badges: string[]
          language: string
          country: string
          session_start: string
          session_end: string
          total_login_count: number
          total_session_time_seconds: number
          current_streak_days: number
          longest_streak_days: number
          last_lesson_completed: string
          current_page: string
          total_quiz_attempts: number
          total_games_played: number
          average_quiz_score: number
          best_quiz_score: number
        }
        Insert: {
          username: string
          email: string
          created_at?: string
          last_active?: string
          progress?: number
          current_level?: number
          badges?: string[]
          language?: string
          country?: string
          session_start?: string
          session_end?: string
          total_login_count?: number
          total_session_time_seconds?: number
          current_streak_days?: number
          longest_streak_days?: number
          last_lesson_completed?: string
          current_page?: string
          total_quiz_attempts?: number
          total_games_played?: number
          average_quiz_score?: number
          best_quiz_score?: number
        }
        Update: {
          username?: string
          email?: string
          created_at?: string
          last_active?: string
          progress?: number
          current_level?: number
          badges?: string[]
          language?: string
          country?: string
          session_start?: string
          session_end?: string
          total_login_count?: number
          total_session_time_seconds?: number
          current_streak_days?: number
          longest_streak_days?: number
          last_lesson_completed?: string
          current_page?: string
          total_quiz_attempts?: number
          total_games_played?: number
          average_quiz_score?: number
          best_quiz_score?: number
        }
      }
      lessons: {
        Row: {
          id: string
          title: string
          description: string
          content: string
          level: number
          order: number
          quiz_questions: any[]
          created_at: string
          category: string
          country: string
          language: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          content: string
          level: number
          order: number
          quiz_questions?: any[]
          created_at?: string
          category?: string
          country?: string
          language?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          content?: string
          level?: number
          order?: number
          quiz_questions?: any[]
          created_at?: string
          category?: string
          country?: string
          language?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          username: string
          lesson_id: string
          completed: boolean
          score: number
          completed_at: string
          attempt_count: number
          time_spent_seconds: number
          started_at: string
          hints_used: number
          difficulty_level: number
        }
        Insert: {
          id?: string
          username: string
          lesson_id: string
          completed?: boolean
          score?: number
          completed_at?: string
          attempt_count?: number
          time_spent_seconds?: number
          started_at?: string
          hints_used?: number
          difficulty_level?: number
        }
        Update: {
          id?: string
          username?: string
          lesson_id?: string
          completed?: boolean
          score?: number
          completed_at?: string
          attempt_count?: number
          time_spent_seconds?: number
          started_at?: string
          hints_used?: number
          difficulty_level?: number
        }
      }
      user_activity_logs: {
        Row: {
          id: string
          username: string
          activity_type: string
          activity_details: any
          timestamp: string
          session_id: string
          ip_address: string
          user_agent: string
          page_url: string
          duration_seconds: number
          score: number
          metadata: any
        }
        Insert: {
          id?: string
          username: string
          activity_type: string
          activity_details?: any
          timestamp?: string
          session_id?: string
          ip_address?: string
          user_agent?: string
          page_url?: string
          duration_seconds?: number
          score?: number
          metadata?: any
        }
        Update: {
          id?: string
          username?: string
          activity_type?: string
          activity_details?: any
          timestamp?: string
          session_id?: string
          ip_address?: string
          user_agent?: string
          page_url?: string
          duration_seconds?: number
          score?: number
          metadata?: any
        }
      }
      user_sessions: {
        Row: {
          id: string
          username: string
          session_token: string
          login_time: string
          logout_time: string
          last_activity: string
          ip_address: string
          user_agent: string
          is_active: boolean
          session_duration_seconds: number
          pages_visited: number
          lessons_completed: number
          quizzes_taken: number
          games_played: number
        }
        Insert: {
          id?: string
          username: string
          session_token: string
          login_time?: string
          logout_time?: string
          last_activity?: string
          ip_address?: string
          user_agent?: string
          is_active?: boolean
          session_duration_seconds?: number
          pages_visited?: number
          lessons_completed?: number
          quizzes_taken?: number
          games_played?: number
        }
        Update: {
          id?: string
          username?: string
          session_token?: string
          login_time?: string
          logout_time?: string
          last_activity?: string
          ip_address?: string
          user_agent?: string
          is_active?: boolean
          session_duration_seconds?: number
          pages_visited?: number
          lessons_completed?: number
          quizzes_taken?: number
          games_played?: number
        }
      }
    }
  }
}