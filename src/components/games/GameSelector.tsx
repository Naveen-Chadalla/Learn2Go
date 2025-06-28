import React from 'react'
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
  const getGameForLesson = () => {
    const title = lessonTitle.toLowerCase()
    
    if (title.includes('traffic light') || title.includes('signal') || title.includes('intersection')) {
      return <TrafficLightGame onComplete={onComplete} theme={theme} />
    }
    
    if (title.includes('pedestrian') || title.includes('crosswalk') || title.includes('crossing')) {
      return <PedestrianCrossingGame onComplete={onComplete} theme={theme} />
    }
    
    if (title.includes('parking') || title.includes('park')) {
      return <ParkingGame onComplete={onComplete} theme={theme} />
    }
    
    if (title.includes('speed') || title.includes('limit') || title.includes('highway')) {
      return <SpeedLimitGame onComplete={onComplete} theme={theme} />
    }
    
    // Default game based on country or general traffic safety
    if (country === 'IN') {
      return <TrafficLightGame onComplete={onComplete} theme={theme} />
    } else if (country === 'US') {
      return <ParkingGame onComplete={onComplete} theme={theme} />
    } else {
      return <PedestrianCrossingGame onComplete={onComplete} theme={theme} />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      {getGameForLesson()}
    </motion.div>
  )
}

export default GameSelector