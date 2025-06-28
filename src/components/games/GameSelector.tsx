import React, { useState } from 'react'
import { motion } from 'framer-motion'
import TrafficLightGame from './TrafficLightGame'
import PedestrianCrossingGame from './PedestrianCrossingGame'
import ParkingGame from './ParkingGame'
import SpeedLimitGame from './SpeedLimitGame'

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
  // Determine which game to show based on lesson content
  const getGameType = () => {
    const title = lessonTitle.toLowerCase()
    
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
      return 'speed-limit'
    } else {
      return 'pedestrian-crossing'
    }
  }

  const renderGame = () => {
    const gameType = getGameType()
    
    switch (gameType) {
      case 'traffic-light':
        return <TrafficLightGame onComplete={onComplete} theme={theme} />
      case 'pedestrian-crossing':
        return <PedestrianCrossingGame onComplete={onComplete} theme={theme} />
      case 'parking':
        return <ParkingGame onComplete={onComplete} theme={theme} />
      case 'speed-limit':
        return <SpeedLimitGame onComplete={onComplete} theme={theme} />
      default:
        return <TrafficLightGame onComplete={onComplete} theme={theme} />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      {/* Game Component */}
      {renderGame()}
    </motion.div>
  )
}

export default GameSelector