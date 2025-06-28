import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TrafficLightGame from './TrafficLightGame'
import PedestrianCrossingGame from './PedestrianCrossingGame'
import ParkingGame from './ParkingGame'
import SpeedLimitGame from './SpeedLimitGame'
import EmergencyResponseGame from './EmergencyResponseGame'
import { Play, HelpCircle, AlertTriangle, Gamepad, Keyboard, Smartphone, Info } from 'lucide-react'

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
  const [isMobile, setIsMobile] = useState(false)

  // Check if user is on mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Determine which game to show based on lesson content
  const getGameType = () => {
    const title = lessonTitle.toLowerCase()
    const id = lessonId.toLowerCase()
    
    if (title.includes('traffic light') || title.includes('signal') || id.includes('signal') || title.includes('intersection')) {
      return 'traffic-light'
    }
    
    if (title.includes('pedestrian') || title.includes('crosswalk') || id.includes('cross') || title.includes('crossing')) {
      return 'pedestrian'
    }
    
    if (title.includes('parking') || title.includes('park') || id.includes('park')) {
      return 'parking'
    }
    
    if (title.includes('speed') || title.includes('limit') || id.includes('speed') || title.includes('highway')) {
      return 'speed-limit'
    }
    
    if (title.includes('emergency') || title.includes('accident') || id.includes('emergency')) {
      return 'emergency'
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
      ],
      mobileControls: [
        'Tap the traffic light to change signals',
        'Swipe to view different parts of the intersection'
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
      ],
      mobileControls: [
        'Tap the crosswalk signal to change it',
        'Tap pedestrians to guide them'
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
      ],
      mobileControls: [
        'Use on-screen controls to drive',
        'Tap direction buttons to steer'
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
      ],
      mobileControls: [
        'Tap top of screen to accelerate',
        'Tap bottom of screen to brake'
      ]
    },
    {
      id: 'emergency',
      name: 'Emergency Response',
      description: 'React correctly to emergency situations on the road',
      icon: '🚨',
      controls: [
        'Use arrow keys to select responses',
        'React quickly to emergency scenarios',
        'Choose the safest action for each situation',
        'Learn proper emergency protocols'
      ],
      mobileControls: [
        'Tap response options to select',
        'Swipe between scenarios'
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
      case 'emergency':
        return <EmergencyResponseGame onComplete={onComplete} theme={theme} />
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
          <div className="flex items-center space-x-2">
            <Gamepad className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-blue-900">How to Play:</h3>
          </div>
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Keyboard className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800">Keyboard Controls:</span>
          </div>
          <ul className="text-blue-800 text-left space-y-2 pl-6">
            {currentGame?.controls.map((instruction, index) => (
              <li key={index} className="list-disc">
                <span>{instruction}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {currentGame?.mobileControls && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Smartphone className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Mobile Controls:</span>
            </div>
            <ul className="text-blue-800 text-left space-y-2 pl-6">
              {currentGame.mobileControls.map((instruction, index) => (
                <li key={index} className="list-disc">
                  <span>{instruction}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {isMobile && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-700 text-sm">
                This game works best with a keyboard. Some features may be limited on mobile devices.
              </p>
            </div>
          </div>
        )}
        
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-blue-200"
          >
            <div className="flex items-start space-x-2">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-blue-700 text-sm">
                <p className="mb-2">
                  <strong>Game Tips:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>This game is designed to reinforce the concepts from "{lessonTitle}"</li>
                  <li>Focus on safety principles rather than just scoring points</li>
                  <li>If you're struggling, try slowing down and observing patterns</li>
                  <li>You can retry the game as many times as needed</li>
                </ul>
              </div>
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