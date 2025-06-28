import React from 'react'
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