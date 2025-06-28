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