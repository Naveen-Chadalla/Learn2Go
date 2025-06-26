import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Globe, ChevronDown, Search, MapPin } from 'lucide-react'
import { countries, Country, Language, detectUserCountry, getCountryByCode } from '../types/countries'

interface CountryLanguageSelectorProps {
  onSelectionChange: (country: string, language: string) => void
  initialCountry?: string
  initialLanguage?: string
  disabled?: boolean
}

const CountryLanguageSelector: React.FC<CountryLanguageSelectorProps> = ({
  onSelectionChange,
  initialCountry,
  initialLanguage,
  disabled = false
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>(initialCountry || detectUserCountry())
  const [selectedLanguage, setSelectedLanguage] = useState<string>(initialLanguage || 'en')
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([])
  const [countrySearch, setCountrySearch] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [detectedLocation, setDetectedLocation] = useState<string>('')

  // Detect user's location on component mount
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/')
        const data = await response.json()
        if (data.country_code) {
          const detectedCountry = getCountryByCode(data.country_code.toUpperCase())
          if (detectedCountry) {
            setDetectedLocation(`${detectedCountry.flag} ${detectedCountry.name}`)
            if (!initialCountry) {
              setSelectedCountry(data.country_code.toUpperCase())
            }
          }
        }
      } catch (error) {
        console.warn('Could not detect location:', error)
      }
    }
    
    detectLocation()
  }, [initialCountry])

  useEffect(() => {
    const country = getCountryByCode(selectedCountry)
    if (country) {
      setAvailableLanguages(country.languages)
      
      // If current language is not available in selected country, default to English or first available
      const isLanguageAvailable = country.languages.some(lang => lang.code === selectedLanguage)
      if (!isLanguageAvailable) {
        const englishLang = country.languages.find(lang => lang.code === 'en')
        const newLanguage = englishLang ? 'en' : country.languages[0].code
        setSelectedLanguage(newLanguage)
        onSelectionChange(selectedCountry, newLanguage)
      } else {
        onSelectionChange(selectedCountry, selectedLanguage)
      }
    }
  }, [selectedCountry, selectedLanguage, onSelectionChange])

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode)
    setShowCountryDropdown(false)
    setCountrySearch('')
    const country = getCountryByCode(countryCode)
    if (country) {
      // Default to English if available, otherwise first language
      const englishLang = country.languages.find(lang => lang.code === 'en')
      const defaultLanguage = englishLang ? 'en' : country.languages[0].code
      setSelectedLanguage(defaultLanguage)
    }
  }

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode)
  }

  const selectedCountryData = getCountryByCode(selectedCountry)
  
  // Filter countries based on search
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.code.toLowerCase().includes(countrySearch.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-6">
      {/* Location Detection Display */}
      {detectedLocation && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center space-x-2"
        >
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            Detected location: <span className="font-medium">{detectedLocation}</span>
          </span>
        </motion.div>
      )}

      {/* Country Selection with Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Globe className="inline h-4 w-4 mr-1" />
          Select Your Country
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
            disabled={disabled}
            className="appearance-none relative block w-full pl-4 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-left"
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{selectedCountryData?.flag}</span>
              <span>{selectedCountryData?.name}</span>
            </div>
          </button>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
          </div>
          
          {/* Country Dropdown */}
          {showCountryDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-hidden"
            >
              {/* Search Input */}
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Country List */}
              <div className="max-h-40 overflow-y-auto">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleCountryChange(country.code)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 transition-colors ${
                      selectedCountry === country.code ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                    }`}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="font-medium">{country.name}</span>
                    <span className="text-sm text-gray-500">({country.code})</span>
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <div className="px-4 py-3 text-gray-500 text-center">
                    No countries found
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Language Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Your Language
        </label>
        <div className="grid grid-cols-1 gap-2">
          {availableLanguages.map((language) => (
            <motion.button
              key={language.code}
              type="button"
              onClick={() => handleLanguageChange(language.code)}
              disabled={disabled}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative block w-full p-4 border-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedLanguage === language.code
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedLanguage === language.code
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedLanguage === language.code && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{language.nativeName}</div>
                    <div className="text-sm text-gray-500">{language.name}</div>
                  </div>
                </div>
                {language.code === 'en' && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Default
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
        
        {selectedCountryData && (
          <p className="mt-3 text-sm text-gray-500">
            Available languages for {selectedCountryData.flag} {selectedCountryData.name}
          </p>
        )}
      </div>

      {/* Selection Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-4"
      >
        <div className="flex items-center space-x-2 text-blue-800 mb-3">
          <Globe className="h-5 w-5" />
          <span className="font-medium">Your Learning Configuration:</span>
        </div>
        <div className="space-y-2 text-blue-700">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Country:</span> 
            <span className="text-lg">{selectedCountryData?.flag}</span>
            <span>{selectedCountryData?.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">Language:</span> 
            <span>{availableLanguages.find(lang => lang.code === selectedLanguage)?.nativeName}</span>
            <span className="text-sm">({availableLanguages.find(lang => lang.code === selectedLanguage)?.name})</span>
          </div>
        </div>
        <div className="mt-3 p-3 bg-white/50 rounded-lg">
          <p className="text-sm text-blue-600">
            ✨ Content will be customized for {selectedCountryData?.name}'s traffic rules and displayed in your selected language with culturally appropriate examples and images.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default CountryLanguageSelector