import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface LocalizedLesson {
  id: string
  title: string
  description: string
  content: string
  level: number
  order: number
  category: string
  quiz_questions: any[]
  country: string
  language: string
}

export const useLocalizedContent = () => {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<LocalizedLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [userCountry, setUserCountry] = useState<string>('US')
  const [userLanguage, setUserLanguage] = useState<string>('en')

  useEffect(() => {
    if (user) {
      fetchUserPreferences()
    }
  }, [user])

  useEffect(() => {
    if (userCountry && userLanguage) {
      fetchLocalizedLessons()
    }
  }, [userCountry, userLanguage])

  const fetchUserPreferences = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('users')
        .select('country, language')
        .eq('username', user.user_metadata?.username)
        .single()

      if (error) throw error

      if (data) {
        setUserCountry(data.country || 'US')
        setUserLanguage(data.language || 'en')
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error)
      // Use defaults
      setUserCountry('US')
      setUserLanguage('en')
    }
  }

  const fetchLocalizedLessons = async () => {
    setLoading(true)
    try {
      // First try to get lessons for user's specific country and language
      let { data: localizedLessons, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('country', userCountry)
        .eq('language', userLanguage)
        .order('level', { ascending: true })
        .order('order', { ascending: true })

      if (error) throw error

      // If no localized content found, fall back to English content for the country
      if (!localizedLessons || localizedLessons.length === 0) {
        const { data: countryLessons, error: countryError } = await supabase
          .from('lessons')
          .select('*')
          .eq('country', userCountry)
          .eq('language', 'en')
          .order('level', { ascending: true })
          .order('order', { ascending: true })

        if (countryError) throw countryError
        localizedLessons = countryLessons || []
      }

      // If still no content, fall back to US English content
      if (!localizedLessons || localizedLessons.length === 0) {
        const { data: defaultLessons, error: defaultError } = await supabase
          .from('lessons')
          .select('*')
          .eq('country', 'US')
          .eq('language', 'en')
          .order('level', { ascending: true })
          .order('order', { ascending: true })

        if (defaultError) throw defaultError
        localizedLessons = defaultLessons || []
      }

      setLessons(localizedLessons)
    } catch (error) {
      console.error('Error fetching localized lessons:', error)
      // Fall back to existing lessons without country/language filter
      const { data: fallbackLessons } = await supabase
        .from('lessons')
        .select('*')
        .order('level', { ascending: true })
        .order('order', { ascending: true })

      setLessons(fallbackLessons || [])
    } finally {
      setLoading(false)
    }
  }

  const translateContent = async (content: string, targetLanguage: string): Promise<string> => {
    // This is a placeholder for translation functionality
    // In a real implementation, you would integrate with a translation service like:
    // - Google Translate API
    // - Azure Translator
    // - AWS Translate
    // - Or a custom translation service
    
    if (targetLanguage === 'en') {
      return content // No translation needed for English
    }

    // For now, return the original content with a note
    return `[Content in ${targetLanguage}] ${content}`
  }

  return {
    lessons,
    loading,
    userCountry,
    userLanguage,
    translateContent,
    refreshContent: fetchLocalizedLessons
  }
}