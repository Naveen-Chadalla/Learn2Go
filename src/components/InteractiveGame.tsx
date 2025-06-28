import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Trophy, Star, RotateCcw, ArrowRight, HelpCircle } from 'lucide-react'
import GameSelector from './games/GameSelector'
import GameInstructions from './GameInstructions'

interface InteractiveGameProps {
  lessonId: string
  country: string
  language: string
  onComplete: (score: number) => void
  theme: {
    primaryColor: string
    secondaryColor: string
  }
}

const InteractiveGame: React.FC<InteractiveGameProps> = ({
  lessonId,
  country,
  language,
  onComplete,
  theme
}) => {
  const [showInstructions, setShowInstructions] = useState(true)
  const [gameStarted, setGameStarted] = useState(false)
  
  // Get lesson title from context or props
  // For now, we'll determine the game type based on lesson ID or use a default
  const getLessonTitle = () => {
    // This could be passed as a prop or retrieved from context
    // For now, we'll use a simple mapping based on lesson ID
    const lessonTitles: Record<string, string> = {
      'traffic-signals': 'Traffic Signals and Lights',
      'pedestrian-safety': 'Pedestrian Safety and Crosswalks',
      'parking-rules': 'Parking Rules and Techniques',
      'speed-limits': 'Speed Limits and Highway Safety'
    }
    
    // Check if the lessonId contains any of our keywords
    if (lessonId.includes('traffic') || lessonId.includes('signal')) {
      return 'Traffic Signals and Lights'
    }
    
    if (lessonId.includes('pedestrian') || lessonId.includes('cross')) {
      return 'Pedestrian Safety and Crosswalks'
    }
    
    if (lessonId.includes('park')) {
      return 'Parking Rules and Techniques'
    }
    
    if (lessonId.includes('speed') || lessonId.includes('highway')) {
      return 'Speed Limits and Highway Safety'
    }
    
    return lessonTitles[lessonId] || 'Traffic Safety'
  }

  const handleStartGame = () => {
    setShowInstructions(false)
    setGameStarted(true)
  }

  const handleShowInstructions = () => {
    setShowInstructions(true)
  }

  const handleGameComplete = (score: number) => {
    onComplete(score)
  }

  // Determine game type based on lesson content
  const getGameType = () => {
    const title = getLessonTitle().toLowerCase()
    
    if (title.includes('traffic light') || title.includes('signal') || title.includes('intersection')) {
      return 'traffic-light'
    }
    
    if (title.includes('pedestrian') || title.includes('crosswalk') || title.includes('crossing')) {
      return 'pedestrian-crossing'
    }
    
    if (title.includes('parking') || title.includes('park')) {
      return 'parking'
    }
    
    if (title.includes('speed') || title.includes('limit') || title.includes('highway')) {
      return 'speed-limit'
    }
    
    // Default game based on country or general traffic safety
    if (country === 'IN') {
      return 'traffic-light'
    } else if (country === 'US') {
      return 'parking'
    } else {
      return 'pedestrian-crossing'
    }
  }

  if (showInstructions) {
    return (
      <div className="text-center p-8">
        <GameInstructions 
          gameType={getGameType() as any}
          onClose={handleStartGame}
          theme={theme}
        />
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Help Button */}
      <motion.button
        onClick={handleShowInstructions}
        whileHover={{ scale: 1.1, rotate: 10 }}
        whileTap={{ scale: 0.9 }}
        className="absolute top-2 right-2 z-50 bg-white rounded-full p-3 shadow-lg border border-gray-200"
        style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
      >
        <HelpCircle className="h-6 w-6 text-white" />
      </motion.button>

      {/* Game Component */}
      <GameSelector
        lessonId={lessonId}
        lessonTitle={getLessonTitle()}
        country={country}
        language={language}
        onComplete={handleGameComplete}
        theme={theme}
      />
    </div>
  )
}

export default InteractiveGame