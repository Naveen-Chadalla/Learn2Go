import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import GameSelector from './games/GameSelector'

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
  // Get lesson title from lessonId
  const getLessonTitle = () => {
    // Extract topic from lessonId or use a default
    if (lessonId.includes('traffic-signal') || lessonId.includes('light') || lessonId.includes('intersection')) {
      return 'Traffic Signals and Lights'
    } else if (lessonId.includes('pedestrian') || lessonId.includes('cross') || lessonId.includes('walk')) {
      return 'Pedestrian Safety and Crosswalks'
    } else if (lessonId.includes('park')) {
      return 'Parking Rules and Techniques'
    } else if (lessonId.includes('speed') || lessonId.includes('limit') || lessonId.includes('highway')) {
      return 'Speed Limits and Highway Safety'
    } else if (lessonId.includes('emergency') || lessonId.includes('accident')) {
      return 'Emergency Procedures'
    } else {
      return 'Traffic Safety'
    }
  }

  return (
    <GameSelector
      lessonId={lessonId}
      lessonTitle={getLessonTitle()}
      country={country}
      language={language}
      onComplete={onComplete}
      theme={theme}
    />
  )
}

export default InteractiveGame