import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import TrafficLightGame from './TrafficLightGame'
import PedestrianCrossingGame from './PedestrianCrossingGame'
import ParkingGame from './ParkingGame'
import SpeedLimitGame from './SpeedLimitGame'
import { Play, Info, HelpCircle, AlertTriangle } from 'lucide-react'

interface GameSelectorProps {
  lessonId: string
  lessonTitle: string
  country: string
  language: string
  onComplete: (score: number) => void
  theme: {
    primaryColor: string
    secondaryColor: string
  }
}

const GameSelector: React.FC<GameSelectorProps> = ({
  lessonId,
  lessonTitle,
  country,
  language,
  onComplete,
  theme
}) => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [showInstructions, setShowInstructions] = useState(true)
  const [showHelp, setShowHelp] = useState(false)

  // Determine which game to show based on lesson content
  const getGameType = () => {
    const title = lessonTitle.toLowerCase()
    
    if (title.includes('traffic light') || title.includes('signal') || title.includes('intersection')) {
      return 'traffic-light'
    }
    
    if (title.includes('pedestrian') || title.includes('crosswalk') || title.includes('crossing')) {
      return 'pedestrian'
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
      return 'speed-limit'
    } else {
      return 'pedestrian'
    }
  }

  const gameType = getGameType()

  const gameOptions = [
    {
      id: 'traffic-light',
      name: 'Traffic Light Control',
      description: 'Manage traffic flow at an intersection with changing traffic lights',
      icon: '🚦',
      controls: [
        'Watch vehicles approach the intersection',
        'Vehicles should stop on red and yellow lights',
        'Earn points for each vehicle that stops properly',
        'Lose points for traffic violations'
      ]
    },
    {
      id: 'pedestrian',
      name: 'Pedestrian Crossing Safety',
      description: 'Help pedestrians cross safely at the crosswalk',
      icon: '🚶',
      controls: [
        'Pedestrians will wait at crosswalks',
        'They should cross during WALK signals',
        'Vehicles must stop for crossing pedestrians',
        'Earn points for safe crossings'
      ]
    },
    {
      id: 'parking',
      name: 'Parking Master',
      description: 'Master different parking techniques',
      icon: '🅿️',
      controls: [
        '↑/W - Drive forward',
        '↓/S - Reverse',
        '←/A - Turn left',
        '→/D - Turn right',
        'Park accurately in the designated space'
      ]
    },
    {
      id: 'speed-limit',
      name: 'Speed Limit Challenge',
      description: 'Drive through different road segments maintaining proper speeds',
      icon: '🚗',
      controls: [
        '↑/W - Accelerate',
        '↓/S - Brake',
        'Follow posted speed limits',
        'Adapt to changing conditions',
        'Watch for speed cameras'
      ]
    }
  ]

  const currentGame = gameOptions.find(game => game.id === gameType)

  const handleStartGame = () => {
    setShowInstructions(false)
    setSelectedGame(gameType)
  }

  const renderGame = () => {
    switch (selectedGame) {
      case 'traffic-light':
        return <TrafficLightGame onComplete={onComplete} theme={theme} />
      case 'pedestrian':
        return <PedestrianCrossingGame onComplete={onComplete} theme={theme} />
      case 'parking':
        return <ParkingGame onComplete={onComplete} theme={theme} />
      case 'speed-limit':
        return <SpeedLimitGame onComplete={onComplete} theme={theme} />
      default:
        return null
    }
  }

  if (!showInstructions && selectedGame) {
    return renderGame()
  }

  return (
    <div className="text-center p-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="text-6xl mb-6"
      >
        {currentGame?.icon || '🎮'}
      </motion.div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">{currentGame?.name || 'Interactive Game'}</h2>
      <p className="text-gray-600 mb-6 text-lg leading-relaxed">
        {currentGame?.description || 'Apply what you\'ve learned in this engaging traffic safety game!'}
      </p>
      
      <div className="bg-blue-50 rounded-2xl p-6 mb-6 border border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-blue-900">How to Play:</h3>
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
        <ul className="text-blue-800 text-left space-y-2">
          {currentGame?.controls.map((instruction, index) => (
            <li key={index} className="flex items-start space-x-2">
              <span className="text-blue-500">•</span>
              <span>{instruction}</span>
            </li>
          ))}
        </ul>
        
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-blue-200"
          >
            <div className="flex items-start space-x-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-blue-700">
                This game uses keyboard controls. Make sure your keyboard is accessible and working properly.
                If you're on a mobile device, you may need to use a physical keyboard or try a different device.
              </p>
            </div>
          </motion.div>
        )}
      </div>
      
      <motion.button
        onClick={handleStartGame}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="text-white px-8 py-3 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl flex items-center space-x-2 mx-auto"
        style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
      >
        <Play className="h-5 w-5" />
        <span>Start Game</span>
      </motion.button>
      
      <p className="mt-4 text-sm text-gray-500">
        This game is designed to reinforce the concepts from "{lessonTitle}" that you just completed.
      </p>
    </div>
  )
}

export default GameSelector