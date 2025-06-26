import React, { useState, useEffect } from 'react'
import { Volume2, VolumeX, Pause, Play } from 'lucide-react'

interface VoiceoverPlayerProps {
  text: string
  language: string
  autoPlay?: boolean
  className?: string
}

const VoiceoverPlayer: React.FC<VoiceoverPlayerProps> = ({
  text,
  language,
  autoPlay = false,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const newUtterance = new SpeechSynthesisUtterance(text)
      
      // Set language based on user preference
      const languageMap: Record<string, string> = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'te': 'te-IN',
        'ta': 'ta-IN',
        'bn': 'bn-IN',
        'mr': 'mr-IN',
        'gu': 'gu-IN',
        'kn': 'kn-IN',
        'ml': 'ml-IN',
        'pa': 'pa-IN',
        'es': 'es-ES',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'pt': 'pt-BR',
        'zh': 'zh-CN',
        'ja': 'ja-JP'
      }
      
      newUtterance.lang = languageMap[language] || 'en-US'
      newUtterance.rate = 0.8
      newUtterance.pitch = 1
      newUtterance.volume = 0.8
      
      newUtterance.onstart = () => {
        setIsPlaying(true)
        setIsPaused(false)
      }
      
      newUtterance.onend = () => {
        setIsPlaying(false)
        setIsPaused(false)
      }
      
      newUtterance.onpause = () => {
        setIsPaused(true)
      }
      
      newUtterance.onresume = () => {
        setIsPaused(false)
      }
      
      setUtterance(newUtterance)
      
      if (autoPlay) {
        speechSynthesis.speak(newUtterance)
      }
    }
    
    return () => {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel()
      }
    }
  }, [text, language, autoPlay])

  const handlePlay = () => {
    if (!utterance) return
    
    if (isPlaying && !isPaused) {
      speechSynthesis.pause()
    } else if (isPaused) {
      speechSynthesis.resume()
    } else {
      speechSynthesis.speak(utterance)
    }
  }

  const handleStop = () => {
    speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
  }

  if (!('speechSynthesis' in window)) {
    return null // Don't render if speech synthesis is not supported
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={handlePlay}
        className="flex items-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors duration-200"
        title={isPlaying && !isPaused ? 'Pause' : 'Play'}
      >
        {isPlaying && !isPaused ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">
          {isPlaying && !isPaused ? 'Pause' : isPaused ? 'Resume' : 'Listen'}
        </span>
      </button>
      
      {isPlaying && (
        <button
          onClick={handleStop}
          className="flex items-center space-x-1 px-2 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors duration-200"
          title="Stop"
        >
          <VolumeX className="h-4 w-4" />
        </button>
      )}
      
      {isPlaying && (
        <div className="flex items-center space-x-1 text-blue-600">
          <Volume2 className="h-4 w-4" />
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-4 bg-blue-400 rounded animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceoverPlayer