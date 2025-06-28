import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { 
  BookOpen, 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Save, 
  Globe, 
  Layers, 
  Eye, 
  EyeOff, 
  Copy, 
  FileUp, 
  Download, 
  HelpCircle,
  Brain,
  Gamepad2,
  Image
} from 'lucide-react'

interface Lesson {
  id: string
  title: string
  description: string
  content: string
  level: number
  order: number
  category: string
  quiz_questions: QuizQuestion[]
  country: string
  language: string
  created_at: string
}

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct_answer: number
  explanation: string
}

type ContentTab = 'lessons' | 'quizzes' | 'games' | 'media'

const AdminContentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ContentTab>('lessons')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editedLesson, setEditedLesson] = useState<Partial<Lesson>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [countryFilter, setCountryFilter] = useState<string>('')
  const [languageFilter, setLanguageFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [levelFilter, setLevelFilter] = useState<string>('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [availableCountries, setAvailableCountries] = useState<{code: string, name: string}[]>([])
  const [availableLanguages, setAvailableLanguages] = useState<{code: string, name: string}[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  // Fetch lessons
  const fetchLessons = useCallback(async () => {
    setRefreshing(true)
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('level', { ascending: true })
        .order('order', { ascending: true })

      if (error) throw error
      
      setLessons(data || [])
      setFilteredLessons(data || [])
      
      // Extract unique countries, languages, and categories
      const countries = [...new Set(data?.map(lesson => lesson.country) || [])]
        .filter(Boolean)
        .map(code => {
          const countryNames: Record<string, string> = {
            'US': 'United States',
            'IN': 'India',
            'GB': 'United Kingdom',
            'CA': 'Canada',
            'AU': 'Australia',
            'DE': 'Germany',
            'FR': 'France',
            'ES': 'Spain',
            'JP': 'Japan',
            'BR': 'Brazil',
            'MX': 'Mexico',
            'CN': 'China'
          }
          return { code, name: countryNames[code] || code }
        })
      
      const languages = [...new Set(data?.map(lesson => lesson.language) || [])]
        .filter(Boolean)
        .map(code => {
          const languageNames: Record<string, string> = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'hi': 'Hindi',
            'te': 'Telugu',
            'ta': 'Tamil',
            'bn': 'Bengali',
            'ja': 'Japanese',
            'zh': 'Chinese',
            'pt': 'Portuguese'
          }
          return { code, name: languageNames[code] || code }
        })
      
      const categories = [...new Set(data?.map(lesson => lesson.category) || [])]
        .filter(Boolean)
      
      setAvailableCountries(countries)
      setAvailableLanguages(languages)
      setAvailableCategories(categories)
    } catch (error) {
      console.error('Error fetching lessons:', error)
      setActionError('Failed to load lessons. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial data load
  useEffect(() => {
    fetchLessons()
  }, [fetchLessons])

  // Apply filters and search
  useEffect(() => {
    let result = [...lessons]
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(lesson => 
        lesson.title.toLowerCase().includes(term) || 
        lesson.description.toLowerCase().includes(term) ||
        lesson.content.toLowerCase().includes(term)
      )
    }
    
    // Apply country filter
    if (countryFilter) {
      result = result.filter(lesson => lesson.country === countryFilter)
    }
    
    // Apply language filter
    if (languageFilter) {
      result = result.filter(lesson => lesson.language === languageFilter)
    }
    
    // Apply category filter
    if (categoryFilter) {
      result = result.filter(lesson => lesson.category === categoryFilter)
    }
    
    // Apply level filter
    if (levelFilter) {
      result = result.filter(lesson => lesson.level === parseInt(levelFilter))
    }
    
    setFilteredLessons(result)
  }, [lessons, searchTerm, countryFilter, languageFilter, categoryFilter, levelFilter])

  // Create new lesson
  const createNewLesson = () => {
    const newLesson: Partial<Lesson> = {
      title: 'New Lesson',
      description: 'Enter lesson description here',
      content: 'Enter lesson content here',
      level: 1,
      order: lessons.length + 1,
      category: 'general',
      quiz_questions: [
        {
          id: `q-${Date.now()}-1`,
          question: 'Enter your first question here',
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          correct_answer: 0,
          explanation: 'Explanation for the correct answer'
        }
      ],
      country: 'US',
      language: 'en'
    }
    
    setEditedLesson(newLesson)
    setIsCreatingNew(true)
    setEditMode(true)
    setSelectedLesson(null)
  }

  // Save lesson
  const saveLesson = async () => {
    try {
      if (!editedLesson.title || !editedLesson.content) {
        setActionError('Title and content are required')
        return
      }
      
      if (isCreatingNew) {
        // Create new lesson
        const { data, error } = await supabase
          .from('lessons')
          .insert({
            title: editedLesson.title,
            description: editedLesson.description,
            content: editedLesson.content,
            level: editedLesson.level || 1,
            order: editedLesson.order || lessons.length + 1,
            category: editedLesson.category || 'general',
            quiz_questions: editedLesson.quiz_questions || [],
            country: editedLesson.country || 'US',
            language: editedLesson.language || 'en'
          })
          .select()

        if (error) throw error
        
        setActionSuccess('Lesson created successfully')
        setIsCreatingNew(false)
        setEditMode(false)
        
        if (data && data[0]) {
          setSelectedLesson(data[0] as Lesson)
        }
      } else if (selectedLesson) {
        // Update existing lesson
        const { error } = await supabase
          .from('lessons')
          .update({
            title: editedLesson.title,
            description: editedLesson.description,
            content: editedLesson.content,
            level: editedLesson.level,
            order: editedLesson.order,
            category: editedLesson.category,
            quiz_questions: editedLesson.quiz_questions,
            country: editedLesson.country,
            language: editedLesson.language
          })
          .eq('id', selectedLesson.id)

        if (error) throw error
        
        setActionSuccess('Lesson updated successfully')
        setEditMode(false)
        
        // Refresh the selected lesson
        const { data } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', selectedLesson.id)
          .single()
        
        if (data) {
          setSelectedLesson(data as Lesson)
        }
      }
      
      // Refresh lessons
      fetchLessons()
      
      // Clear success message after 3 seconds
      setTimeout(() => setActionSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error saving lesson:', error)
      setActionError(`Failed to save lesson: ${error.message || 'Unknown error'}`)
      
      // Clear error message after 5 seconds
      setTimeout(() => setActionError(null), 5000)
    }
  }

  // Delete lesson
  const handleDeleteLesson = async (id: string) => {
    try {
      // Delete lesson
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id)

      if (error) throw error

      setDeleteConfirm(null)
      setActionSuccess('Lesson deleted successfully')
      
      // Refresh lessons
      fetchLessons()
      
      // Clear selected lesson if it was deleted
      if (selectedLesson && selectedLesson.id === id) {
        setSelectedLesson(null)
        setEditMode(false)
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setActionSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error deleting lesson:', error)
      setActionError(`Failed to delete lesson: ${error.message || 'Unknown error'}`)
      
      // Clear error message after 5 seconds
      setTimeout(() => setActionError(null), 5000)
    }
  }

  // Edit lesson
  const editLesson = (lesson: Lesson) => {
    setEditedLesson({ ...lesson })
    setEditMode(true)
    setIsCreatingNew(false)
  }

  // Cancel edit
  const cancelEdit = () => {
    setEditMode(false)
    setIsCreatingNew(false)
    setEditedLesson({})
  }

  // Handle quiz question changes
  const handleQuizQuestionChange = (index: number, field: string, value: any) => {
    if (!editedLesson.quiz_questions) return
    
    const updatedQuestions = [...editedLesson.quiz_questions]
    
    if (field === 'options') {
      updatedQuestions[index].options = value
    } else {
      (updatedQuestions[index] as any)[field] = value
    }
    
    setEditedLesson({
      ...editedLesson,
      quiz_questions: updatedQuestions
    })
  }

  // Add quiz question
  const addQuizQuestion = () => {
    if (!editedLesson.quiz_questions) return
    
    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: 'Enter your question here',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correct_answer: 0,
      explanation: 'Explanation for the correct answer'
    }
    
    setEditedLesson({
      ...editedLesson,
      quiz_questions: [...editedLesson.quiz_questions, newQuestion]
    })
  }

  // Remove quiz question
  const removeQuizQuestion = (index: number) => {
    if (!editedLesson.quiz_questions) return
    
    const updatedQuestions = [...editedLesson.quiz_questions]
    updatedQuestions.splice(index, 1)
    
    setEditedLesson({
      ...editedLesson,
      quiz_questions: updatedQuestions
    })
  }

  // Duplicate lesson
  const duplicateLesson = async (lesson: Lesson) => {
    try {
      const duplicatedLesson = {
        ...lesson,
        title: `${lesson.title} (Copy)`,
        order: lesson.order + 0.1
      }
      
      // Remove id to create a new record
      delete (duplicatedLesson as any).id
      delete (duplicatedLesson as any).created_at
      
      const { data, error } = await supabase
        .from('lessons')
        .insert(duplicatedLesson)
        .select()

      if (error) throw error
      
      setActionSuccess('Lesson duplicated successfully')
      
      // Refresh lessons
      fetchLessons()
      
      // Select the new lesson
      if (data && data[0]) {
        setSelectedLesson(data[0] as Lesson)
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setActionSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error duplicating lesson:', error)
      setActionError(`Failed to duplicate lesson: ${error.message || 'Unknown error'}`)
      
      // Clear error message after 5 seconds
      setTimeout(() => setActionError(null), 5000)
    }
  }

  // Export lessons as JSON
  const exportLessons = () => {
    const dataStr = JSON.stringify(lessons, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
    
    const exportFileDefaultName = `learn2go_lessons_${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('')
    setCountryFilter('')
    setLanguageFilter('')
    setCategoryFilter('')
    setLevelFilter('')
    setFilteredLessons(lessons)
  }

  // Get country flag
  const getCountryFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      'US': '🇺🇸',
      'IN': '🇮🇳',
      'GB': '🇬🇧',
      'CA': '🇨🇦',
      'AU': '🇦🇺',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'ES': '🇪🇸',
      'JP': '🇯🇵',
      'BR': '🇧🇷',
      'MX': '🇲🇽',
      'CN': '🇨🇳'
    }
    return flags[countryCode] || '🌍'
  }

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <FileText className="h-8 w-8 text-green-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                Content Management
              </h2>
            </div>
            <p className="text-gray-600">
              Create, edit, and manage educational content
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchLessons}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
            
            <button
              onClick={exportLessons}
              className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
            
            <button
              onClick={createNewLesson}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">New Lesson</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center space-x-2"
          >
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </motion.div>
        )}
        
        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2"
          >
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>{actionError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8"
      >
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('lessons')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'lessons' 
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50' 
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50/50'
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span>Lessons</span>
          </button>
          
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'quizzes' 
                ? 'text-yellow-600 border-b-2 border-yellow-600 bg-yellow-50' 
                : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50/50'
            }`}
          >
            <Brain className="h-5 w-5" />
            <span>Quizzes</span>
          </button>
          
          <button
            onClick={() => setActiveTab('games')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'games' 
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' 
                : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/50'
            }`}
          >
            <Gamepad2 className="h-5 w-5" />
            <span>Games</span>
          </button>
          
          <button
            onClick={() => setActiveTab('media')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'media' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'
            }`}
          >
            <Image className="h-5 w-5" />
            <span>Media</span>
          </button>
        </div>
      </motion.div>

      {/* Filters and Search */}
      {activeTab === 'lessons' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search lessons..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              {/* Country Filter */}
              <div className="relative">
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="appearance-none block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All Countries</option>
                  {availableCountries.map(country => (
                    <option key={country.code} value={country.code}>
                      {getCountryFlag(country.code)} {country.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              {/* Language Filter */}
              <div className="relative">
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="appearance-none block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All Languages</option>
                  {availableLanguages.map(language => (
                    <option key={language.code} value={language.code}>
                      {language.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              {/* Category Filter */}
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {availableCategories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Layers className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              {/* Level Filter */}
              <div className="relative">
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="appearance-none block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All Levels</option>
                  {[1, 2, 3, 4, 5].map(level => (
                    <option key={level} value={level.toString()}>
                      Level {level}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Layers className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <X className="h-4 w-4" />
                <span className="text-sm font-medium">Clear</span>
              </button>
            </div>
          </div>
          
          {/* Filter Stats */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredLessons.length} of {lessons.length} lessons
            {countryFilter && ` in ${getCountryFlag(countryFilter)} ${availableCountries.find(c => c.code === countryFilter)?.name || countryFilter}`}
            {languageFilter && ` in ${availableLanguages.find(l => l.code === languageFilter)?.name || languageFilter}`}
            {categoryFilter && ` in category "${categoryFilter}"`}
            {levelFilter && ` at level ${levelFilter}`}
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        </motion.div>
      )}

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'lessons' && (
          <motion.div
            key="lessons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Lesson List */}
            <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Lessons</h3>
                  <div className="text-sm text-gray-600">
                    {filteredLessons.length} {filteredLessons.length === 1 ? 'lesson' : 'lessons'}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading lessons...</p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[600px]">
                  {filteredLessons.length === 0 ? (
                    <div className="p-6 text-center">
                      <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No lessons found</h4>
                      <p className="text-gray-600">Try adjusting your filters or create a new lesson</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {filteredLessons.map((lesson, index) => (
                        <motion.li
                          key={lesson.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * index, duration: 0.2 }}
                          className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                            selectedLesson?.id === lesson.id ? 'bg-green-50 border-l-4 border-green-500' : ''
                          }`}
                          onClick={() => {
                            setSelectedLesson(lesson)
                            setEditMode(false)
                            setIsCreatingNew(false)
                          }}
                        >
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {lesson.title}
                                  </p>
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                                    Level {lesson.level}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500 truncate">
                                  {lesson.description.substring(0, 60)}...
                                </p>
                                <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                                  <span>{getCountryFlag(lesson.country)}</span>
                                  <span>{lesson.language.toUpperCase()}</span>
                                  <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                                    {lesson.category}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-shrink-0 ml-2">
                                <div className="flex flex-col items-end">
                                  <div className="text-xs text-gray-500">
                                    {lesson.quiz_questions?.length || 0} questions
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Order: {lesson.order}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Lesson Details / Editor */}
            <div className="lg:col-span-2">
              {isCreatingNew || (editMode && selectedLesson) ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">
                        {isCreatingNew ? 'Create New Lesson' : 'Edit Lesson'}
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={cancelEdit}
                          className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                        <button
                          onClick={saveLesson}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          <Save className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={editedLesson.title || ''}
                          onChange={(e) => setEditedLesson({ ...editedLesson, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={editedLesson.description || ''}
                          onChange={(e) => setEditedLesson({ ...editedLesson, description: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Level
                          </label>
                          <select
                            value={editedLesson.level || 1}
                            onChange={(e) => setEditedLesson({ ...editedLesson, level: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            {[1, 2, 3, 4, 5].map(level => (
                              <option key={level} value={level}>
                                Level {level}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Order
                          </label>
                          <input
                            type="number"
                            value={editedLesson.order || 1}
                            onChange={(e) => setEditedLesson({ ...editedLesson, order: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Country
                          </label>
                          <select
                            value={editedLesson.country || 'US'}
                            onChange={(e) => setEditedLesson({ ...editedLesson, country: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            {availableCountries.map(country => (
                              <option key={country.code} value={country.code}>
                                {getCountryFlag(country.code)} {country.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Language
                          </label>
                          <select
                            value={editedLesson.language || 'en'}
                            onChange={(e) => setEditedLesson({ ...editedLesson, language: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            {availableLanguages.map(language => (
                              <option key={language.code} value={language.code}>
                                {language.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <input
                          type="text"
                          value={editedLesson.category || ''}
                          onChange={(e) => setEditedLesson({ ...editedLesson, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          list="categories"
                        />
                        <datalist id="categories">
                          {availableCategories.map(category => (
                            <option key={category} value={category} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Content
                      </label>
                      <textarea
                        value={editedLesson.content || ''}
                        onChange={(e) => setEditedLesson({ ...editedLesson, content: e.target.value })}
                        rows={10}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                      />
                    </div>

                    {/* Quiz Questions */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Quiz Questions
                        </label>
                        <button
                          onClick={addQuizQuestion}
                          className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-800"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add Question</span>
                        </button>
                      </div>
                      
                      {editedLesson.quiz_questions?.map((question, index) => (
                        <div key={question.id} className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                            <button
                              onClick={() => removeQuizQuestion(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Question
                              </label>
                              <input
                                type="text"
                                value={question.question}
                                onChange={(e) => handleQuizQuestionChange(index, 'question', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Options (one per line)
                              </label>
                              <textarea
                                value={question.options.join('\n')}
                                onChange={(e) => handleQuizQuestionChange(index, 'options', e.target.value.split('\n'))}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Correct Answer (0-based index)
                              </label>
                              <select
                                value={question.correct_answer}
                                onChange={(e) => handleQuizQuestionChange(index, 'correct_answer', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              >
                                {question.options.map((_, optionIndex) => (
                                  <option key={optionIndex} value={optionIndex}>
                                    Option {optionIndex + 1}: {question.options[optionIndex].substring(0, 30)}
                                    {question.options[optionIndex].length > 30 ? '...' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Explanation
                              </label>
                              <textarea
                                value={question.explanation}
                                onChange={(e) => handleQuizQuestionChange(index, 'explanation', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {(!editedLesson.quiz_questions || editedLesson.quiz_questions.length === 0) && (
                        <div className="text-center py-4 bg-gray-50 rounded-xl">
                          <p className="text-gray-500">No quiz questions yet</p>
                          <button
                            onClick={addQuizQuestion}
                            className="mt-2 text-sm text-green-600 hover:text-green-800"
                          >
                            Add your first question
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between">
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveLesson}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        {isCreatingNew ? 'Create Lesson' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : selectedLesson ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedLesson.title}
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowPreview(!showPreview)}
                          className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                          title={showPreview ? 'Hide Preview' : 'Show Preview'}
                        >
                          {showPreview ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                        <button
                          onClick={() => duplicateLesson(selectedLesson)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Duplicate Lesson"
                        >
                          <Copy className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => editLesson(selectedLesson)}
                          className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors"
                          title="Edit Lesson"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        {selectedLesson.id !== 'hari-admin-lesson' && (
                          <button
                            onClick={() => setDeleteConfirm(selectedLesson.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Delete Lesson"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {showPreview ? (
                    <div className="p-6">
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedLesson.title}</h2>
                        <p className="text-gray-600">{selectedLesson.description}</p>
                      </div>
                      
                      <div className="prose max-w-none mb-6">
                        <div className="text-gray-800 whitespace-pre-wrap">
                          {selectedLesson.content}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Quiz Questions</h3>
                        {selectedLesson.quiz_questions?.map((question, index) => (
                          <div key={index} className="mb-6 last:mb-0">
                            <div className="font-medium text-gray-900 mb-2">
                              {index + 1}. {question.question}
                            </div>
                            <ul className="space-y-2 mb-4">
                              {question.options.map((option, optionIndex) => (
                                <li key={optionIndex} className="flex items-center space-x-2">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                    optionIndex === question.correct_answer
                                      ? 'bg-green-500 text-white'
                                      : 'bg-gray-200'
                                  }`}>
                                    {optionIndex === question.correct_answer && (
                                      <CheckCircle className="h-3 w-3" />
                                    )}
                                  </div>
                                  <span className={optionIndex === question.correct_answer ? 'font-medium' : ''}>
                                    {option}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                              <span className="font-medium">Explanation:</span> {question.explanation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="text-sm font-medium text-gray-700 mb-2">Basic Information</div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">ID:</span>
                              <span className="text-sm text-gray-900">{selectedLesson.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Level:</span>
                              <span className="text-sm text-gray-900">{selectedLesson.level}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Order:</span>
                              <span className="text-sm text-gray-900">{selectedLesson.order}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Category:</span>
                              <span className="text-sm text-gray-900">{selectedLesson.category}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="text-sm font-medium text-gray-700 mb-2">Localization</div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Country:</span>
                              <span className="text-sm text-gray-900">
                                {getCountryFlag(selectedLesson.country)} {selectedLesson.country}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Language:</span>
                              <span className="text-sm text-gray-900">
                                {availableLanguages.find(l => l.code === selectedLesson.language)?.name || selectedLesson.language}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Created:</span>
                              <span className="text-sm text-gray-900">
                                {formatDate(selectedLesson.created_at)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Quiz Questions:</span>
                              <span className="text-sm text-gray-900">
                                {selectedLesson.quiz_questions?.length || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <div className="text-sm font-medium text-gray-700 mb-2">Description</div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-sm text-gray-900">{selectedLesson.description}</p>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <div className="text-sm font-medium text-gray-700 mb-2">Content Preview</div>
                        <div className="bg-gray-50 rounded-xl p-4 max-h-40 overflow-y-auto">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {selectedLesson.content.substring(0, 500)}
                            {selectedLesson.content.length > 500 ? '...' : ''}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Quiz Questions</div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          {selectedLesson.quiz_questions?.length > 0 ? (
                            <div className="space-y-4">
                              {selectedLesson.quiz_questions.map((question, index) => (
                                <div key={index} className="text-sm">
                                  <div className="font-medium text-gray-900 mb-1">
                                    {index + 1}. {question.question}
                                  </div>
                                  <div className="text-gray-600">
                                    {question.options.length} options, correct: #{question.correct_answer + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No quiz questions available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                  <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Lesson</h3>
                  <p className="text-gray-600 mb-6">
                    Click on a lesson from the list to view details or create a new lesson.
                  </p>
                  <button
                    onClick={createNewLesson}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Create New Lesson</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'quizzes' && (
          <motion.div
            key="quizzes"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center"
          >
            <Brain className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Quiz Management</h3>
            <p className="text-gray-600 mb-6">
              Quizzes are managed as part of lessons. Select a lesson to edit its quiz questions.
            </p>
            <button
              onClick={() => setActiveTab('lessons')}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors"
            >
              <BookOpen className="h-5 w-5" />
              <span>Go to Lessons</span>
            </button>
          </motion.div>
        )}

        {activeTab === 'games' && (
          <motion.div
            key="games"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center"
          >
            <Gamepad2 className="h-16 w-16 text-purple-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Game Management</h3>
            <p className="text-gray-600 mb-6">
              Interactive games are automatically generated based on lesson content. 
              The system creates appropriate games for each lesson topic.
            </p>
            <div className="bg-purple-50 rounded-xl p-6 max-w-md mx-auto text-left">
              <div className="flex items-center space-x-2 mb-3">
                <HelpCircle className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium text-purple-800">How Games Work</h4>
              </div>
              <ul className="space-y-2 text-sm text-purple-700">
                <li className="flex items-start space-x-2">
                  <div className="min-w-4 mt-0.5">•</div>
                  <span>Games are dynamically generated based on lesson topics</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="min-w-4 mt-0.5">•</div>
                  <span>Traffic light lessons get intersection control games</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="min-w-4 mt-0.5">•</div>
                  <span>Pedestrian safety lessons get crosswalk games</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="min-w-4 mt-0.5">•</div>
                  <span>Speed limit lessons get driving simulation games</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="min-w-4 mt-0.5">•</div>
                  <span>To modify games, update the lesson content and topic</span>
                </li>
              </ul>
            </div>
          </motion.div>
        )}

        {activeTab === 'media' && (
          <motion.div
            key="media"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center"
          >
            <Image className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Media Management</h3>
            <p className="text-gray-600 mb-6">
              Learn2Go uses external media from Pexels for images. No media uploads are required.
            </p>
            <div className="bg-blue-50 rounded-xl p-6 max-w-md mx-auto text-left">
              <div className="flex items-center space-x-2 mb-3">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-800">About Media Usage</h4>
              </div>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start space-x-2">
                  <div className="min-w-4 mt-0.5">•</div>
                  <span>Images are automatically sourced from Pexels based on lesson content</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="min-w-4 mt-0.5">•</div>
                  <span>Country-specific images are selected when available</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="min-w-4 mt-0.5">•</div>
                  <span>Topic-specific images are matched to lesson content</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="min-w-4 mt-0.5">•</div>
                  <span>All images are properly licensed for educational use</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="min-w-4 mt-0.5">•</div>
                  <span>To change images, modify lesson topics and keywords</span>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Deletion</h3>
                <p className="text-gray-600">
                  Are you sure you want to delete this lesson? This action cannot be undone and will remove all associated quiz questions.
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteLesson(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  Delete Lesson
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminContentManagement