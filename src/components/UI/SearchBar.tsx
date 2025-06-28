import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Filter, Clock } from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  description: string
  type: 'lesson' | 'quiz' | 'game'
  category: string
}

interface SearchBarProps {
  placeholder?: string
  onSearch: (query: string, filters: string[]) => void
  results?: SearchResult[]
  loading?: boolean
  recentSearches?: string[]
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search lessons, quizzes, and games...",
  onSearch,
  results = [],
  loading = false,
  recentSearches = []
}) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const filters = [
    { id: 'lesson', label: 'Lessons', color: 'bg-blue-100 text-blue-800' },
    { id: 'quiz', label: 'Quizzes', color: 'bg-green-100 text-green-800' },
    { id: 'game', label: 'Games', color: 'bg-purple-100 text-purple-800' },
    { id: 'beginner', label: 'Beginner', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'advanced', label: 'Advanced', color: 'bg-red-100 text-red-800' }
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowFilters(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    onSearch(searchQuery, selectedFilters)
    if (searchQuery.trim()) {
      setIsOpen(true)
    }
  }

  const toggleFilter = (filterId: string) => {
    const newFilters = selectedFilters.includes(filterId)
      ? selectedFilters.filter(f => f !== filterId)
      : [...selectedFilters, filterId]
    
    setSelectedFilters(newFilters)
    onSearch(query, newFilters)
  }

  const clearSearch = () => {
    setQuery('')
    setSelectedFilters([])
    onSearch('', [])
    setIsOpen(false)
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <Search className="w-5 h-5 text-neutral-400" />
        </div>
        
        <motion.input
          whileFocus={{ scale: 1.01 }}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-20 py-4 text-lg border-2 border-neutral-200 rounded-2xl focus:border-primary-500 focus:outline-none transition-all duration-200 bg-white shadow-sm"
        />
        
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {query && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={clearSearch}
              className="p-1 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters || selectedFilters.length > 0
                ? 'bg-primary-100 text-primary-600'
                : 'hover:bg-neutral-100 text-neutral-400'
            }`}
          >
            <Filter className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Active Filters */}
      <AnimatePresence>
        {selectedFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 mt-3"
          >
            {selectedFilters.map(filterId => {
              const filter = filters.find(f => f.id === filterId)
              return filter ? (
                <motion.span
                  key={filterId}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${filter.color}`}
                >
                  {filter.label}
                  <button
                    onClick={() => toggleFilter(filterId)}
                    className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              ) : null
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 p-4 bg-white border border-neutral-200 rounded-xl shadow-lg z-50"
          >
            <h3 className="text-sm font-medium text-neutral-700 mb-3">Filter by:</h3>
            <div className="flex flex-wrap gap-2">
              {filters.map(filter => (
                <motion.button
                  key={filter.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleFilter(filter.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedFilters.includes(filter.id)
                      ? filter.color
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {filter.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results */}
      <AnimatePresence>
        {isOpen && (query || recentSearches.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-xl shadow-xl z-40 max-h-96 overflow-y-auto"
          >
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                <p className="text-neutral-500 mt-2">Searching...</p>
              </div>
            ) : query && results.length > 0 ? (
              <div className="p-2">
                <p className="text-sm text-neutral-500 px-3 py-2">
                  {results.length} result{results.length !== 1 ? 's' : ''} found
                </p>
                {results.map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 hover:bg-neutral-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-neutral-800">{result.title}</h4>
                        <p className="text-sm text-neutral-600 mt-1">{result.description}</p>
                      </div>
                      <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                        result.type === 'lesson' ? 'bg-blue-100 text-blue-800' :
                        result.type === 'quiz' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {result.type}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : query && results.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-neutral-500">No results found for "{query}"</p>
                <p className="text-sm text-neutral-400 mt-1">Try adjusting your search or filters</p>
              </div>
            ) : recentSearches.length > 0 ? (
              <div className="p-2">
                <p className="text-sm text-neutral-500 px-3 py-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent searches
                </p>
                {recentSearches.map((search, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSearch(search)}
                    className="w-full text-left p-3 hover:bg-neutral-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Search className="w-4 h-4 text-neutral-400" />
                      <span className="text-neutral-700">{search}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SearchBar