import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { RefreshCw } from 'lucide-react'

interface TaglineProps {
  className?: string
  showRefreshButton?: boolean
  autoRefresh?: boolean
  size?: 'small' | 'medium' | 'large'
}

const DynamicTagline: React.FC<TaglineProps> = ({ 
  className = '', 
  showRefreshButton = false,
  autoRefresh = true,
  size = 'medium'
}) => {
  const { user } = useAuth()
  const { data } = useData()
  const [currentTagline, setCurrentTagline] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const userLanguage = data.userProfile?.language || user?.user_metadata?.language || 'en'
  const userCountry = data.userProfile?.country || user?.user_metadata?.country || 'US'

  // Comprehensive tagline database with translations
  const taglines = {
    en: [
      "Learn the rules. Own the road.",
      "Your journey to safer roads starts here.",
      "One app. Every road rule. For everyone.",
      "Drive smart. Stay safe. Learn2Go.",
      "Safety in your language, rules for your road.",
      "Global learning. Local driving.",
      "From classroom to crosswalk—Learn2Go guides the way.",
      "Learn. Play. Drive responsibly.",
      "Red lights. Green minds.",
      "Changing road behavior, one lesson at a time.",
      "Knowledge is your best co-pilot.",
      "Every lesson saves lives.",
      "Master the road, protect the journey.",
      "Smart drivers start with smart learning.",
      "Your safety education, personalized.",
      "Building safer roads through better drivers.",
      "Traffic rules made simple, safety made certain.",
      "Learn today, drive safely forever.",
      "Empowering drivers, protecting communities.",
      "Where road safety meets modern learning."
    ],
    hi: [
      "नियम सीखें। सड़क पर राज करें।",
      "सुरक्षित सड़कों की आपकी यात्रा यहाँ से शुरू होती है।",
      "एक ऐप। हर सड़क नियम। सभी के लिए।",
      "स्मार्ट ड्राइव करें। सुरक्षित रहें। Learn2Go।",
      "आपकी भाषा में सुरक्षा, आपकी सड़क के नियम।",
      "वैश्विक शिक्षा। स्थानीय ड्राइविंग।",
      "कक्षा से क्रॉसवॉक तक—Learn2Go रास्ता दिखाता है।",
      "सीखें। खेलें। जिम्मेदारी से गाड़ी चलाएं।",
      "लाल बत्ती। हरे दिमाग।",
      "एक समय में एक पाठ, सड़क व्यवहार बदलना।",
      "ज्ञान आपका सबसे अच्छा सह-चालक है।",
      "हर पाठ जीवन बचाता है।",
      "सड़क में महारत हासिल करें, यात्रा की रक्षा करें।",
      "स्मार्ट ड्राइवर स्मार्ट सीखने से शुरू करते हैं।",
      "आपकी सुरक्षा शिक्षा, व्यक्तिगत।"
    ],
    te: [
      "నియమాలు నేర్చుకోండి। రోడ్డుపై రాజ్యం చేయండి।",
      "సురక్షితమైన రోడ్లకు మీ ప్రయాణం ఇక్కడ మొదలవుతుంది।",
      "ఒక యాప్. ప్రతి రోడ్డు నియమం. అందరికోసం।",
      "స్మార్ట్‌గా డ్రైవ్ చేయండి। సురక్షితంగా ఉండండి। Learn2Go.",
      "మీ భాషలో భద్రత, మీ రోడ్డు నియమాలు।",
      "గ్లోబల్ లెర్నింగ్. లోకల్ డ్రైవింగ్.",
      "క్లాస్‌రూమ్ నుండి క్రాస్‌వాక్ వరకు—Learn2Go మార్గం చూపుతుంది।",
      "నేర్చుకోండి. ఆడండి. బాధ్యతగా డ్రైవ్ చేయండి।",
      "ఎరుపు లైట్లు. ఆకుపచ్చ మనసులు।",
      "ఒక సమయంలో ఒక పాఠం, రోడ్డు ప్రవర్తనను మార్చడం।",
      "జ్ఞానం మీ అత్యుత్తమ సహ-పైలట్.",
      "ప్రతి పాఠం జీవితాలను కాపాడుతుంది।",
      "రోడ్డులో నైపుణ్యం సాధించండి, ప్రయాణాన్ని రక్షించండి।",
      "స్మార్ట్ డ్రైవర్లు స్మార్ట్ లెర్నింగ్‌తో మొదలవుతారు।",
      "మీ భద్రతా విద్య, వ్యక్తిగతీకరించబడింది।"
    ],
    es: [
      "Aprende las reglas. Domina la carretera.",
      "Tu viaje hacia carreteras más seguras comienza aquí.",
      "Una app. Todas las reglas de tráfico. Para todos.",
      "Conduce inteligente. Mantente seguro. Learn2Go.",
      "Seguridad en tu idioma, reglas para tu carretera.",
      "Aprendizaje global. Conducción local.",
      "Del aula al cruce peatonal—Learn2Go te guía.",
      "Aprende. Juega. Conduce responsablemente.",
      "Luces rojas. Mentes verdes.",
      "Cambiando el comportamiento vial, una lección a la vez.",
      "El conocimiento es tu mejor copiloto.",
      "Cada lección salva vidas.",
      "Domina la carretera, protege el viaje.",
      "Los conductores inteligentes comienzan con aprendizaje inteligente.",
      "Tu educación en seguridad, personalizada."
    ],
    fr: [
      "Apprenez les règles. Maîtrisez la route.",
      "Votre voyage vers des routes plus sûres commence ici.",
      "Une app. Toutes les règles de circulation. Pour tous.",
      "Conduisez intelligemment. Restez en sécurité. Learn2Go.",
      "Sécurité dans votre langue, règles pour votre route.",
      "Apprentissage mondial. Conduite locale.",
      "De la salle de classe au passage piéton—Learn2Go vous guide.",
      "Apprenez. Jouez. Conduisez de manière responsable.",
      "Feux rouges. Esprits verts.",
      "Changer le comportement routier, une leçon à la fois.",
      "La connaissance est votre meilleur copilote.",
      "Chaque leçon sauve des vies.",
      "Maîtrisez la route, protégez le voyage.",
      "Les conducteurs intelligents commencent par un apprentissage intelligent.",
      "Votre éducation à la sécurité, personnalisée."
    ],
    de: [
      "Lerne die Regeln. Beherrsche die Straße.",
      "Deine Reise zu sichereren Straßen beginnt hier.",
      "Eine App. Jede Verkehrsregel. Für alle.",
      "Fahre klug. Bleibe sicher. Learn2Go.",
      "Sicherheit in deiner Sprache, Regeln für deine Straße.",
      "Globales Lernen. Lokales Fahren.",
      "Vom Klassenzimmer zum Zebrastreifen—Learn2Go zeigt den Weg.",
      "Lerne. Spiele. Fahre verantwortungsbewusst.",
      "Rote Ampeln. Grüne Köpfe.",
      "Verkehrsverhalten ändern, eine Lektion nach der anderen.",
      "Wissen ist dein bester Beifahrer.",
      "Jede Lektion rettet Leben.",
      "Beherrsche die Straße, schütze die Reise.",
      "Kluge Fahrer beginnen mit klugen Lernen.",
      "Deine Sicherheitsbildung, personalisiert."
    ],
    pt: [
      "Aprenda as regras. Domine a estrada.",
      "Sua jornada para estradas mais seguras começa aqui.",
      "Um app. Todas as regras de trânsito. Para todos.",
      "Dirija inteligente. Mantenha-se seguro. Learn2Go.",
      "Segurança no seu idioma, regras para sua estrada.",
      "Aprendizado global. Direção local.",
      "Da sala de aula à faixa de pedestres—Learn2Go guia o caminho.",
      "Aprenda. Jogue. Dirija responsavelmente.",
      "Semáforos vermelhos. Mentes verdes.",
      "Mudando comportamento no trânsito, uma lição por vez.",
      "Conhecimento é seu melhor copiloto.",
      "Cada lição salva vidas.",
      "Domine a estrada, proteja a jornada.",
      "Motoristas inteligentes começam com aprendizado inteligente.",
      "Sua educação em segurança, personalizada."
    ],
    ja: [
      "ルールを学ぶ。道路を制する。",
      "より安全な道路への旅がここから始まります。",
      "1つのアプリ。すべての交通ルール。みんなのために。",
      "スマートに運転。安全を保つ。Learn2Go。",
      "あなたの言語での安全、あなたの道路のルール。",
      "グローバル学習。ローカル運転。",
      "教室から横断歩道まで—Learn2Goが道を示します。",
      "学ぶ。遊ぶ。責任を持って運転する。",
      "赤信号。緑の心。",
      "一度に一つのレッスンで道路行動を変える。",
      "知識はあなたの最高の副操縦士です。",
      "すべてのレッスンが命を救います。",
      "道路をマスターし、旅を守る。",
      "スマートドライバーはスマート学習から始まります。",
      "あなたの安全教育、パーソナライズされた。"
    ],
    zh: [
      "学习规则。掌控道路。",
      "您通往更安全道路的旅程从这里开始。",
      "一个应用。每条交通规则。为每个人。",
      "智能驾驶。保持安全。Learn2Go。",
      "用您的语言确保安全，为您的道路制定规则。",
      "全球学习。本地驾驶。",
      "从教室到人行横道—Learn2Go指引道路。",
      "学习。游戏。负责任地驾驶。",
      "红灯。绿色思维。",
      "一次一课改变道路行为。",
      "知识是您最好的副驾驶。",
      "每一课都拯救生命。",
      "掌握道路，保护旅程。",
      "聪明的司机从聪明的学习开始。",
      "您的安全教育，个性化。"
    ]
  }

  // Get country-specific taglines if available
  const getLocalizedTaglines = () => {
    const languageTaglines = taglines[userLanguage as keyof typeof taglines] || taglines.en
    
    // Add country-specific variations
    const countrySpecificTaglines = []
    
    if (userCountry === 'IN') {
      countrySpecificTaglines.push(
        userLanguage === 'hi' ? "भारत की सड़कों के लिए भारतीय नियम।" : "Indian rules for Indian roads.",
        userLanguage === 'hi' ? "सुरक्षित भारत, स्मार्ट ड्राइवर।" : "Safe India, Smart Drivers.",
        userLanguage === 'te' ? "భారతీయ రోడ్లకు భారతీయ నియమాలు।" : "Indian rules for Indian roads."
      )
    } else if (userCountry === 'US') {
      countrySpecificTaglines.push(
        "American roads, American rules, global safety.",
        "From coast to coast, safety first.",
        "United in safety, diverse in learning."
      )
    } else if (userCountry === 'GB') {
      countrySpecificTaglines.push(
        "British roads, brilliant drivers.",
        "Keep left, think right, drive safe.",
        "From London to Edinburgh, safety matters."
      )
    }

    return [...languageTaglines, ...countrySpecificTaglines]
  }

  const selectRandomTagline = () => {
    const availableTaglines = getLocalizedTaglines()
    const randomIndex = Math.floor(Math.random() * availableTaglines.length)
    return availableTaglines[randomIndex]
  }

  const refreshTagline = async () => {
    setIsRefreshing(true)
    
    // Add a small delay for smooth animation
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const newTagline = selectRandomTagline()
    setCurrentTagline(newTagline)
    setIsRefreshing(false)
  }

  // Initialize tagline on component mount and when user data changes
  useEffect(() => {
    if (userLanguage && userCountry) {
      const initialTagline = selectRandomTagline()
      setCurrentTagline(initialTagline)
    }
  }, [userLanguage, userCountry])

  // Auto-refresh on page load/refresh
  useEffect(() => {
    if (autoRefresh && currentTagline) {
      refreshTagline()
    }
  }, [autoRefresh])

  // Size configurations
  const sizeConfig = {
    small: {
      text: 'text-sm',
      container: 'py-2 px-3',
      icon: 'h-3 w-3'
    },
    medium: {
      text: 'text-base',
      container: 'py-3 px-4',
      icon: 'h-4 w-4'
    },
    large: {
      text: 'text-lg',
      container: 'py-4 px-6',
      icon: 'h-5 w-5'
    }
  }

  const config = sizeConfig[size]

  if (!currentTagline) {
    return null
  }

  return (
    <div className={`${className}`}>
      <div className={`bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl ${config.container} flex items-center justify-between shadow-sm`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTagline}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <p className={`${config.text} font-medium text-blue-900 text-center`}>
              {currentTagline}
            </p>
          </motion.div>
        </AnimatePresence>
        
        {showRefreshButton && (
          <motion.button
            onClick={refreshTagline}
            disabled={isRefreshing}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="ml-3 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200 disabled:opacity-50"
            title="Get new tagline"
          >
            <RefreshCw className={`${config.icon} ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        )}
      </div>
    </div>
  )
}

export default DynamicTagline