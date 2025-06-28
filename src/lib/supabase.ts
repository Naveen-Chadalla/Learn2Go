import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// More lenient validation for development
if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL is missing. Please check your .env file.')
  // Use a fallback URL to prevent app crash
  const fallbackUrl = 'https://placeholder.supabase.co'
  console.warn(`Using fallback URL: ${fallbackUrl}`)
}

if (!supabaseAnonKey) {
  console.error('VITE_SUPABASE_ANON_KEY is missing. Please check your .env file.')
  // Use a fallback key to prevent app crash
  const fallbackKey = 'placeholder-key'
  console.warn('Using fallback anonymous key')
}

// Create Supabase client with fallbacks to prevent crashes
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false // Disable to prevent URL parsing issues
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
  }
)

// Add connection test function with error handling
export const testSupabaseConnection = async () => {
  try {
    if (!supabaseUrl || !supabaseAnonKey || 
        supabaseUrl.includes('placeholder') || 
        supabaseAnonKey.includes('placeholder')) {
      console.warn('Supabase not properly configured - running in offline mode')
      return false
    }

    const { data, error } = await supabase
      .from('lessons')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection test failed:', error)
      return false
    }
    
    console.log('Supabase connection test successful')
    return true
  } catch (err) {
    console.error('Supabase connection test error:', err)
    return false
  }
}

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