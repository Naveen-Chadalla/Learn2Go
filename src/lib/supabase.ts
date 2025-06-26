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

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
        }
        Insert: {
          id?: string
          username: string
          lesson_id: string
          completed?: boolean
          score?: number
          completed_at?: string
        }
        Update: {
          id?: string
          username?: string
          lesson_id?: string
          completed?: boolean
          score?: number
          completed_at?: string
        }
      }
    }
  }
}