import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here' || !supabaseUrl.startsWith('http')) {
  throw new Error(
    'Missing or invalid VITE_SUPABASE_URL environment variable. ' +
    'Please set it to your actual Supabase project URL in the .env file. ' +
    'Example: https://your-project.supabase.co'
  )
}

if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key_here') {
  throw new Error(
    'Missing or invalid VITE_SUPABASE_ANON_KEY environment variable. ' +
    'Please set it to your actual Supabase anonymous key in the .env file.'
  )
}

// Create Supabase client with better error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

// Add connection test function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('count')
      .limit(1)
      .single()
    
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