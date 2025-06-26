import React, { useState, useEffect, useRef } from 'react'
import { Volume2, VolumeX, Pause, Play, RotateCcw, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface VoiceoverPlayerProps {
  text: string
  language: string
  autoPlay?: boolean
  className?: string
  showControls?: boolean
  naturalTone?: boolean
}

const VoiceoverPlayer: React.FC<VoiceoverPlayerProps> = ({
  text,
  language,
  autoPlay = false,
  className = '',
  showControls = true,
  naturalTone = true
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [rate, setRate] = useState(0.8)
  const [pitch, setPitch] = useState(1)
  const [volume, setVolume] = useState(0.8)
  const [showSettings, setShowSettings] = useState(false)
  const [progress, setProgress] = useState(0)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)

  // Enhanced language mapping with natural voice preferences
  const languageMap: Record<string, { code: string; preferredVoices: string[] }> = {
    'en': { 
      code: 'en-US', 
      preferredVoices: ['Samantha', 'Alex', 'Victoria', 'Google US English', 'Microsoft Zira', 'Microsoft David']
    },
    'hi': { 
      code: 'hi-IN', 
      preferredVoices: ['Google हिन्दी', 'Microsoft Hemant', 'Microsoft Kalpana']
    },
    'te': { 
      code: 'te-IN', 
      preferredVoices: ['Google తెలుగు', 'Microsoft Heera']
    },
    'ta': { 
      code: 'ta-IN', 
      preferredVoices: ['Google தமிழ்', 'Microsoft Valluvar']
    },
    'bn': { 
      code: 'bn-IN', 
      preferredVoices: ['Google বাংলা', 'Microsoft Bashkar']
    },
    'mr': { 
      code: 'mr-IN', 
      preferredVoices: ['Google मराठी', 'Microsoft Manohar']
    },
    'gu': { 
      code: 'gu-IN', 
      preferredVoices: ['Google ગુજરાતી', 'Microsoft Dhwani']
    },
    'kn': { 
      code: 'kn-IN', 
      preferredVoices: ['Google ಕನ್ನಡ', 'Microsoft Chitra']
    },
    'ml': { 
      code: 'ml-IN', 
      preferredVoices: ['Google മലയാളം', 'Microsoft Midhun']
    },
    'pa': { 
      code: 'pa-IN', 
      preferredVoices: ['Google ਪੰਜਾਬੀ', 'Microsoft Amrit']
    },
    'es': { 
      code: 'es-ES', 
      preferredVoices: ['Google español', 'Microsoft Helena', 'Microsoft Pablo']
    },
    'fr': { 
      code: 'fr-FR', 
      preferredVoices: ['Google français', 'Microsoft Hortense', 'Microsoft Paul']
    },
    'de': { 
      code: 'de-DE', 
      preferredVoices: ['Google Deutsch', 'Microsoft Hedda', 'Microsoft Stefan']
    },
    'pt': { 
      code: 'pt-BR', 
      preferredVoices: ['Google português do Brasil', 'Microsoft Maria', 'Microsoft Daniel']
    },
    'zh': { 
      code: 'zh-CN', 
      preferredVoices: ['Google 普通话（中国大陆）', 'Microsoft Huihui', 'Microsoft Kangkang']
    },
    'ja': { 
      code: 'ja-JP', 
      preferredVoices: ['Google 日本語', 'Microsoft Haruka', 'Microsoft Ichiro']
    }
  }

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices()
      setVoices(availableVoices)
      
      // Find the best voice for the current language
      const langConfig = languageMap[language] || languageMap['en']
      const bestVoice = findBestVoice(availableVoices, langConfig)
      setSelectedVoice(bestVoice)
    }

    loadVoices()
    speechSynthesis.addEventListener('voiceschanged', loadVoices)
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices)
    }
  }, [language])

  const findBestVoice = (availableVoices: SpeechSynthesisVoice[], langConfig: { code: string; preferredVoices: string[] }) => {
    // First, try to find preferred voices
    for (const preferredName of langConfig.preferredVoices) {
      const voice = availableVoices.find(v => 
        v.name.includes(preferredName) || v.name.toLowerCase().includes(preferredName.toLowerCase())
      )
      if (voice) return voice
    }

    // Fallback to any voice matching the language code
    const fallbackVoice = availableVoices.find(v => v.lang.startsWith(langConfig.code.split('-')[0]))
    
    // Final fallback to default voice
    return fallbackVoice || availableVoices[0] || null
  }

  const createUtterance = () => {
    if (!('speechSynthesis' in window)) return null

    const newUtterance = new SpeechSynthesisUtterance(text)
    const langConfig = languageMap[language] || languageMap['en']
    
    newUtterance.lang = langConfig.code
    newUtterance.rate = naturalTone ? Math.max(0.7, rate) : rate
    newUtterance.pitch = naturalTone ? Math.min(1.2, pitch) : pitch
    newUtterance.volume = volume
    
    if (selectedVoice) {
      newUtterance.voice = selectedVoice
    }
    
    // Enhanced event handlers
    newUtterance.onstart = () => {
      setIsPlaying(true)
      setIsPaused(false)
      setProgress(0)
      startProgressTracking()
    }
    
    newUtterance.onend = () => {
      setIsPlaying(false)
      setIsPaused(false)
      setProgress(100)
      stopProgressTracking()
    }
    
    newUtterance.onpause = () => {
      setIsPaused(true)
      stopProgressTracking()
    }
    
    newUtterance.onresume = () => {
      setIsPaused(false)
      startProgressTracking()
    }

    newUtterance.onerror = (event) => {
      console.error('Speech synthesis error:', event)
      setIsPlaying(false)
      setIsPaused(false)
      stopProgressTracking()
    }
    
    return newUtterance
  }

  const startProgressTracking = () => {
    const estimatedDuration = text.length * 100 // Rough estimate
    const updateInterval = estimatedDuration / 100
    
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          return prev
        }
        return prev + 1
      })
    }, updateInterval)
  }

  const stopProgressTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
      progressInterval.current = null
    }
  }

  useEffect(() => {
    const newUtterance = createUtterance()
    setUtterance(newUtterance)
    
    if (autoPlay && newUtterance) {
      speechSynthesis.speak(newUtterance)
    }
    
    return () => {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel()
      }
      stopProgressTracking()
    }
  }, [text, language, selectedVoice, rate, pitch, volume, autoPlay])

  const handlePlay = () => {
    if (!utterance) return
    
    if (isPlaying && !isPaused) {
      speechSynthesis.pause()
    } else if (isPaused) {
      speechSynthesis.resume()
    } else {
      // Create new utterance for fresh playback
      const newUtterance = createUtterance()
      if (newUtterance) {
        setUtterance(newUtterance)
        speechSynthesis.speak(newUtterance)
      }
    }
  }

  const handleStop = () => {
    speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    setProgress(0)
    stopProgressTracking()
  }

  const handleRestart = () => {
    speechSynthesis.cancel()
    setProgress(0)
    const newUtterance = createUtterance()
    if (newUtterance) {
      setUtterance(newUtterance)
      speechSynthesis.speak(newUtterance)
    }
  }

  if (!('speechSynthesis' in window)) {
    return null
  }

  return (
    <div className={`${className}`}>
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
        {/* Main Controls */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <motion.button
              onClick={handlePlay}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md"
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
            </motion.button>
            
            {isPlaying && (
              <motion.button
                onClick={handleStop}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
                title="Stop"
              >
                <VolumeX className="h-4 w-4" />
              </motion.button>
            )}

            <motion.button
              onClick={handleRestart}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
              title="Restart"
            >
              <RotateCcw className="h-4 w-4" />
            </motion.button>
          </div>

          {showControls && (
            <motion.button
              onClick={() => setShowSettings(!showSettings)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors duration-200"
              title="Voice Settings"
            >
              <Settings className="h-4 w-4" />
            </motion.button>
          )}
        </div>

        {/* Progress Bar */}
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3"
          >
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Playing...</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
          </motion.div>
        )}

        {/* Voice Activity Indicator */}
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2 text-blue-600"
          >
            <Volume2 className="h-4 w-4" />
            <div className="flex space-x-1">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 h-4 bg-blue-400 rounded"
                  animate={{
                    scaleY: [1, 2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                />
              ))}
            </div>
            <span className="text-sm font-medium">
              {selectedVoice?.name || 'Default Voice'}
            </span>
          </motion.div>
        )}

        {/* Advanced Settings */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="space-y-4">
                {/* Voice Selection */}
                {voices.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Voice ({voices.length} available)
                    </label>
                    <select
                      value={selectedVoice?.name || ''}
                      onChange={(e) => {
                        const voice = voices.find(v => v.name === e.target.value)
                        setSelectedVoice(voice || null)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {voices
                        .filter(voice => {
                          const langConfig = languageMap[language] || languageMap['en']
                          return voice.lang.startsWith(langConfig.code.split('-')[0])
                        })
                        .map((voice) => (
                          <option key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Rate Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Speed: {rate.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Pitch Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pitch: {pitch.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={pitch}
                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Volume Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volume: {Math.round(volume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default VoiceoverPlayer