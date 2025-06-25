import React, { createContext, useContext, useState, useEffect } from 'react'

interface LanguageContextType {
  language: string
  setLanguage: (lang: string) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.lessons': 'Lessons',
    'nav.results': 'Results',
    'nav.admin': 'Admin',
    'nav.logout': 'Logout',
    'nav.login': 'Login',
    
    // Home page
    'home.title': 'Welcome to Learn2Go',
    'home.subtitle': 'Master Traffic Rules & Road Safety',
    'home.description': 'Learn traffic rules and road safety through interactive lessons, AI-powered quizzes, and realistic simulations. Make our roads safer for everyone.',
    'home.getStarted': 'Start Learning',
    'home.learnMore': 'Learn More',
    'home.features.title': 'Why Choose Learn2Go?',
    'home.features.interactive': 'Interactive Lessons',
    'home.features.interactive.desc': 'Engage with multimedia content, animations, and real-world traffic scenarios',
    'home.features.progress': 'Progress Tracking',
    'home.features.progress.desc': 'Monitor your learning journey with detailed analytics and safety scores',
    'home.features.multilingual': 'Multilingual Support',
    'home.features.multilingual.desc': 'Learn in your preferred language with voiceovers and translations',
    'home.features.quizzes': 'AI-Powered Quizzes',
    'home.features.quizzes.desc': 'Test your knowledge with smart quizzes and instant feedback on traffic rules',
    
    // Auth
    'auth.login': 'Login',
    'auth.signup': 'Join Learn2Go',
    'auth.username': 'Username',
    'auth.enterUsername': 'Enter your username',
    'auth.noAccount': "New to Learn2Go?",
    'auth.hasAccount': 'Already have an account?',
    'auth.signingIn': 'Signing in...',
    'auth.joiningUp': 'Joining Learn2Go...',
    
    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.progress': 'Your Safety Progress',
    'dashboard.currentLevel': 'Current Level',
    'dashboard.completedLessons': 'Lessons Completed',
    'dashboard.badges': 'Safety Badges',
    'dashboard.continueReading': 'Continue Learning',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.availableLessons': 'Traffic Safety Lessons',
    
    // Lessons
    'lessons.title': 'Traffic Safety Lessons',
    'lessons.level': 'Level',
    'lessons.completed': 'Completed',
    'lessons.start': 'Start Lesson',
    'lessons.continue': 'Continue',
    'lessons.quiz': 'Take Safety Quiz',
    'lessons.nextLesson': 'Next Lesson',
    'lessons.previousLesson': 'Previous Lesson',
    
    // Quiz
    'quiz.title': 'Safety Quiz',
    'quiz.question': 'Question',
    'quiz.submit': 'Submit Answer',
    'quiz.next': 'Next Question',
    'quiz.finish': 'Finish Quiz',
    'quiz.score': 'Your Safety Score',
    'quiz.passed': 'Excellent! You passed the safety test!',
    'quiz.failed': 'Review the lesson and try again to improve your safety knowledge',
    'quiz.retake': 'Retake Quiz',
    
    // Admin
    'admin.title': 'Learn2Go Admin Dashboard',
    'admin.users': 'Learners',
    'admin.analytics': 'Safety Analytics',
    'admin.totalUsers': 'Total Learners',
    'admin.activeUsers': 'Active Learners',
    'admin.completedLessons': 'Completed Lessons',
    'admin.deleteUser': 'Remove Learner',
    'admin.confirmDelete': 'Are you sure you want to remove this learner?',
    'admin.username': 'Username',
    'admin.registeredDate': 'Joined',
    'admin.lastActive': 'Last Active',
    'admin.progress': 'Safety Progress',
    'admin.sessionTime': 'Learning Time',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.close': 'Close',
  },
  te: {
    // Navigation
    'nav.home': 'ముంగిలి',
    'nav.dashboard': 'డాష్‌బోర్డ్',
    'nav.lessons': 'పాఠాలు',
    'nav.results': 'ఫలితాలు',
    'nav.admin': 'అడ్మిన్',
    'nav.logout': 'లాగ్ అవుట్',
    'nav.login': 'లాగిన్',
    
    // Home page
    'home.title': 'Learn2Go కు స్వాగతం',
    'home.subtitle': 'ట్రాఫిక్ నియమాలు & రోడ్ భద్రతను నేర్చుకోండి',
    'home.description': 'ఇంటరాక్టివ్ పాఠాలు, AI-శక్తితో కూడిన క్విజ్‌లు మరియు వాస్తవిక అనుకరణల ద్వారా ట్రాఫిక్ నియమాలు మరియు రోడ్ భద్రతను నేర్చుకోండి। అందరికీ మా రోడ్లను సురక్షితంగా చేద్దాం।',
    'home.getStarted': 'నేర్చుకోవడం ప్రారంభించండి',
    'home.learnMore': 'మరింత తెలుసుకోండి',
    'home.features.title': 'Learn2Go ఎందుకు ఎంచుకోవాలి?',
    'home.features.interactive': 'ఇంటరాక్టివ్ పాఠాలు',
    'home.features.interactive.desc': 'మల్టీమీడియా కంటెంట్, యానిమేషన్లు మరియు వాస్తవ ట్రాఫిక్ పరిస్థితులతో నిమగ్నం కండి',
    'home.features.progress': 'ప్రోగ్రెస్ ట్రాకింగ్',
    'home.features.progress.desc': 'వివరణాత్మక విశ్లేషణలు మరియు భద్రతా స్కోర్‌లతో మీ అభ్యాస ప్రయాణాన్ని పర్యవేక్షించండి',
    'home.features.multilingual': 'బహుభాషా మద్దతు',
    'home.features.multilingual.desc': 'వాయిస్‌ఓవర్లు మరియు అనువాదాలతో మీ ప్రాధాన్య భాషలో నేర్చుకోండి',
    'home.features.quizzes': 'AI-శక్తితో కూడిన క్విజ్‌లు',
    'home.features.quizzes.desc': 'ట్రాఫిక్ నియమాలపై స్మార్ట్ క్విజ్‌లు మరియు తక్షణ ఫీడ్‌బ్యాక్‌తో మీ జ్ఞానాన్ని పరీక్షించండి',
    
    // Auth
    'auth.login': 'లాగిన్',
    'auth.signup': 'Learn2Go లో చేరండి',
    'auth.username': 'వినియోగదారు పేరు',
    'auth.enterUsername': 'మీ వినియోగదారు పేరును నమోదు చేయండి',
    'auth.noAccount': 'Learn2Go కు కొత్తవారా?',
    'auth.hasAccount': 'ఇప్పటికే ఖాతా ఉందా?',
    'auth.signingIn': 'లాగిన్ అవుతోంది...',
    'auth.joiningUp': 'Learn2Go లో చేరుతోంది...',
    
    // Dashboard
    'dashboard.welcome': 'తిరిగి స్వాగతం',
    'dashboard.progress': 'మీ భద్రతా ప్రోగ్రెస్',
    'dashboard.currentLevel': 'ప్రస్తుత స్థాయి',
    'dashboard.completedLessons': 'పూర్తైన పాఠాలు',
    'dashboard.badges': 'భద్రతా బ్యాడ్జ్‌లు',
    'dashboard.continueReading': 'అభ్యాసం కొనసాగించండి',
    'dashboard.recentActivity': 'ఇటీవలి కార్యకలాపాలు',
    'dashboard.availableLessons': 'ట్రాఫిక్ భద్రతా పాఠాలు',
    
    // Common
    'common.loading': 'లోడ్ అవుతోంది...',
    'common.error': 'దోషం',
    'common.success': 'విజయం',
    'common.cancel': 'రద్దు',
    'common.confirm': 'నిర్ధారించు',
    'common.save': 'సేవ్',
    'common.edit': 'సవరించు',
    'common.delete': 'తొలగించు',
    'common.back': 'వెనుకకు',
    'common.next': 'తదుపరి',
    'common.previous': 'మునుపటి',
    'common.close': 'మూసివేయి',
  },
  hi: {
    // Navigation
    'nav.home': 'मुख्य पृष्ठ',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.lessons': 'पाठ',
    'nav.results': 'परिणाम',
    'nav.admin': 'एडमिन',
    'nav.logout': 'लॉग आउट',
    'nav.login': 'लॉगिन',
    
    // Home page
    'home.title': 'Learn2Go में आपका स्वागत है',
    'home.subtitle': 'यातायात नियम और सड़क सुरक्षा सीखें',
    'home.description': 'इंटरैक्टिव पाठों, AI-संचालित क्विज़ और वास्तविक सिमुलेशन के माध्यम से यातायात नियम और सड़क सुरक्षा सीखें। सभी के लिए हमारी सड़कों को सुरक्षित बनाएं।',
    'home.getStarted': 'सीखना शुरू करें',
    'home.learnMore': 'और जानें',
    'home.features.title': 'Learn2Go क्यों चुनें?',
    'home.features.interactive': 'इंटरैक्टिव पाठ',
    'home.features.interactive.desc': 'मल्टीमीडिया सामग्री, एनीमेशन और वास्तविक यातायात स्थितियों के साथ जुड़ें',
    'home.features.progress': 'प्रगति ट्रैकिंग',
    'home.features.progress.desc': 'विस्तृत विश्लेषण और सुरक्षा स्कोर के साथ अपनी सीखने की यात्रा को ट्रैक करें',
    'home.features.multilingual': 'बहुभाषी समर्थन',
    'home.features.multilingual.desc': 'वॉयसओवर और अनुवाद के साथ अपनी पसंदीदा भाषा में सीखें',
    'home.features.quizzes': 'AI-संचालित क्विज़',
    'home.features.quizzes.desc': 'यातायात नियमों पर स्मार्ट क्विज़ और तत्काल फीडबैक के साथ अपने ज्ञान का परीक्षण करें',
    
    // Auth
    'auth.login': 'लॉगिन',
    'auth.signup': 'Learn2Go में शामिल हों',
    'auth.username': 'उपयोगकर्ता नाम',
    'auth.enterUsername': 'अपना उपयोगकर्ता नाम दर्ज करें',
    'auth.noAccount': 'Learn2Go में नए हैं?',
    'auth.hasAccount': 'पहले से खाता है?',
    'auth.signingIn': 'लॉगिन हो रहा है...',
    'auth.joiningUp': 'Learn2Go में शामिल हो रहे हैं...',
    
    // Dashboard
    'dashboard.welcome': 'वापस स्वागत है',
    'dashboard.progress': 'आपकी सुरक्षा प्रगति',
    'dashboard.currentLevel': 'वर्तमान स्तर',
    'dashboard.completedLessons': 'पूर्ण पाठ',
    'dashboard.badges': 'सुरक्षा बैज',
    'dashboard.continueReading': 'सीखना जारी रखें',
    'dashboard.recentActivity': 'हाल की गतिविधि',
    'dashboard.availableLessons': 'यातायात सुरक्षा पाठ',
    
    // Common
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',
    'common.cancel': 'रद्द करें',
    'common.confirm': 'पुष्टि करें',
    'common.save': 'सेव करें',
    'common.edit': 'संपादित करें',
    'common.delete': 'हटाएं',
    'common.back': 'वापस',
    'common.next': 'अगला',
    'common.previous': 'पिछला',
    'common.close': 'बंद करें',
  }
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('learn2go-language')
    if (saved) return saved
    
    // Auto-detect language
    const browserLang = navigator.language.toLowerCase()
    if (browserLang.startsWith('te')) return 'te'
    if (browserLang.startsWith('hi')) return 'hi'
    return 'en'
  })

  useEffect(() => {
    localStorage.setItem('learn2go-language', language)
  }, [language])

  const t = (key: string): string => {
    return translations[language as keyof typeof translations]?.[key as keyof typeof translations.en] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}