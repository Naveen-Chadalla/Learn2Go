export interface Country {
  code: string
  name: string
  flag: string
  languages: Language[]
}

export interface Language {
  code: string
  name: string
  nativeName: string
}

export const countries: Country[] = [
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    languages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
      { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
      { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' }
    ]
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    languages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' }
    ]
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    languages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg' },
      { code: 'gd', name: 'Scottish Gaelic', nativeName: 'Gàidhlig' }
    ]
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    languages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'fr', name: 'French', nativeName: 'Français' }
    ]
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    languages: [
      { code: 'en', name: 'English', nativeName: 'English' }
    ]
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    languages: [
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'en', name: 'English', nativeName: 'English' }
    ]
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    languages: [
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'en', name: 'English', nativeName: 'English' }
    ]
  },
  {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    languages: [
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'ca', name: 'Catalan', nativeName: 'Català' },
      { code: 'eu', name: 'Basque', nativeName: 'Euskera' },
      { code: 'en', name: 'English', nativeName: 'English' }
    ]
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    languages: [
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'en', name: 'English', nativeName: 'English' }
    ]
  },
  {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    languages: [
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'en', name: 'English', nativeName: 'English' }
    ]
  },
  {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    languages: [
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'en', name: 'English', nativeName: 'English' }
    ]
  },
  {
    code: 'CN',
    name: 'China',
    flag: '🇨🇳',
    languages: [
      { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文' },
      { code: 'en', name: 'English', nativeName: 'English' }
    ]
  },
  {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    languages: [
      { code: 'it', name: 'Italian', nativeName: 'Italiano' },
      { code: 'en', name: 'English', nativeName: 'English' }
    ]
  },
  {
    code: 'RU',
    name: 'Russia',
    flag: '🇷🇺',
    languages: [
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
      { code: 'en', name: 'English', nativeName: 'English' }
    ]
  },
  {
    code: 'ZA',
    name: 'South Africa',
    flag: '🇿🇦',
    languages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
      { code: 'zu', name: 'Zulu', nativeName: 'isiZulu' }
    ]
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    languages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' }
    ]
  }
]

export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(country => country.code === code)
}

export const getLanguageByCode = (code: string): Language | undefined => {
  for (const country of countries) {
    const language = country.languages.find(lang => lang.code === code)
    if (language) return language
  }
  return undefined
}

export const detectUserCountry = (): string => {
  // Try to detect country from browser locale
  const locale = navigator.language || 'en-US'
  const countryCode = locale.split('-')[1]
  
  if (countryCode && getCountryByCode(countryCode)) {
    return countryCode
  }
  
  // Default fallbacks based on language
  const langCode = locale.split('-')[0].toLowerCase()
  switch (langCode) {
    case 'hi':
    case 'te':
    case 'ta':
    case 'bn':
    case 'kn':
    case 'mr':
    case 'ml':
    case 'gu':
    case 'pa':
      return 'IN'
    case 'es':
      return 'ES'
    case 'fr':
      return 'FR'
    case 'de':
      return 'DE'
    case 'ja':
      return 'JP'
    case 'pt':
      return 'BR'
    case 'zh':
      return 'CN'
    case 'it':
      return 'IT'
    case 'ru':
      return 'RU'
    default:
      return 'US'
  }
}

// Get total number of supported languages
export const getTotalLanguageCount = (): number => {
  const uniqueLanguages = new Set<string>()
  
  countries.forEach(country => {
    country.languages.forEach(language => {
      uniqueLanguages.add(language.code)
    })
  })
  
  return uniqueLanguages.size
}

// Get all unique languages across all countries
export const getAllSupportedLanguages = (): Language[] => {
  const languageMap = new Map<string, Language>()
  
  countries.forEach(country => {
    country.languages.forEach(language => {
      if (!languageMap.has(language.code)) {
        languageMap.set(language.code, language)
      }
    })
  })
  
  return Array.from(languageMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}

// Get user's IP-based location
export const getUserLocationFromIP = async (): Promise<{
  country_code: string;
  country_name: string;
  city: string;
  error?: string;
}> => {
  try {
    const response = await fetch('https://ipapi.co/json/')
    
    if (!response.ok) {
      throw new Error(`Failed to detect location: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error || 'Unknown error detecting location')
    }
    
    return {
      country_code: data.country_code,
      country_name: data.country_name,
      city: data.city
    }
  } catch (error) {
    console.error('Error detecting location:', error)
    return {
      country_code: 'US',
      country_name: 'United States',
      city: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}