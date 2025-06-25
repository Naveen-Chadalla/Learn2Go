import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Globe, ChevronDown } from 'lucide-react'
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

  return (
    <div className="space-y-6">
      {/* Country Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Globe className="inline h-4 w-4 mr-1" />
          Select Your Country
        </label>
        <div className="relative">
          <select
            value={selectedCountry}
            onChange={(e) => handleCountryChange(e.target.value)}
            disabled={disabled}
            className="appearance-none relative block w-full pl-4 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Language Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Your Language
        </label>
        <div className="relative">
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={disabled || availableLanguages.length === 0}
            className="appearance-none relative block w-full pl-4 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {availableLanguages.map((language) => (
              <option key={language.code} value={language.code}>
                {language.nativeName} ({language.name})
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        {selectedCountryData && (
          <p className="mt-2 text-sm text-gray-500">
            Available languages for {selectedCountryData.flag} {selectedCountryData.name}
          </p>
        )}
      </div>

      {/* Selection Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-4"
      >
        <div className="flex items-center space-x-2 text-blue-800">
          <Globe className="h-5 w-5" />
          <span className="font-medium">Your Selection:</span>
        </div>
        <div className="mt-2 text-blue-700">
          <p>
            <span className="font-medium">Country:</span> {selectedCountryData?.flag} {selectedCountryData?.name}
          </p>
          <p>
            <span className="font-medium">Language:</span> {availableLanguages.find(lang => lang.code === selectedLanguage)?.nativeName}
          </p>
        </div>
        <p className="mt-2 text-sm text-blue-600">
          Content will be customized for your country's traffic rules and displayed in your selected language.
        </p>
      </motion.div>
    </div>
  )
}

export default CountryLanguageSelector