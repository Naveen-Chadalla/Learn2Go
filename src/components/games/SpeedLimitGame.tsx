import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gauge, Clock, Trophy, RotateCcw, Play, Pause, AlertTriangle, HelpCircle, Camera } from 'lucide-react'

interface SpeedLimitGameProps {
  onComplete: (score: number) => void
  theme: {
    primaryColor: string
    secondaryColor: string
  }
}

interface RoadSegment {
  id: string
  speedLimit: number
  length: number
  type: 'city' | 'highway' | 'school' | 'residential'
  weather: 'clear' | 'rain' | 'fog'
  hazards: string[]
}

interface SpeedCamera {
  position: number
  active: boolean
  triggered: boolean
}

const SpeedLimitGame: React.FC<SpeedLimitGameProps> = ({ onComplete, theme }) => {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'paused' | 'finished'>('waiting')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const [targetSpeed, setTargetSpeed] = useState(30)
  const [position, setPosition] = useState(0)
  const [currentSegment, setCurrentSegment] = useState(0)
  const [violations, setViolations] = useState(0)
  const [perfectSections, setPerfectSections] = useState(0)
  const [speedCameras, setSpeedCameras] = useState<SpeedCamera[]>([])
  const [fuelEfficiency, setFuelEfficiency] = useState(100)
  const [isAccelerating, setIsAccelerating] = useState(false)
  const [isBraking, setIsBraking] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [touchControls, setTouchControls] = useState(false)
  const gameAreaRef = useRef<HTMLDivElement>(null)

  // Check if user is on mobile
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    setTouchControls(isMobile)
  }, [])

  const roadSegments: RoadSegment[] = [
    {
      id: 'city1',
      speedLimit: 30,
      length: 200,
      type: 'city',
      weather: 'clear',
      hazards: ['pedestrians', 'traffic lights']
    },
    {
      id: 'school',
      speedLimit: 20,
      length: 150,
      type: 'school',
      weather: 'clear',
      hazards: ['children', 'school bus']
    },
    {
      id: 'residential',
      speedLimit: 25,
      length: 180,
      type: 'residential',
      weather: 'rain',
      hazards: ['parked cars', 'driveways']
    },
    {
      id: 'highway',
      speedLimit: 60,
      length: 300,
      type: 'highway',
      weather: 'clear',
      hazards: ['merging traffic']
    },
    {
      id: 'city2',
      speedLimit: 35,
      length: 200,
      type: 'city',
      weather: 'fog',
      hazards: ['reduced visibility', 'intersections']
    }
  ]

  // Initialize speed cameras
  useEffect(() => {
    const cameras: SpeedCamera[] = []
    let totalDistance = 0
    
    roadSegments.forEach((segment, index) => {
      if (Math.random() < 0.6) { // 60% chance of camera in segment
        cameras.push({
          position: totalDistance + segment.length * 0.7,
          active: true,
          triggered: false
        })
      }
      totalDistance += segment.length
    })
    
    setSpeedCameras(cameras)
  }, [])

  // Speed control with keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          setIsAccelerating(true)
          break
        case 'arrowdown':
        case 's':
          setIsBraking(true)
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          setIsAccelerating(false)
          break
        case 'arrowdown':
        case 's':
          setIsBraking(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Touch controls
  const handleTouchAccelerate = (isPressed: boolean) => {
    if (touchControls && gameState === 'playing') {
      setIsAccelerating(isPressed)
    }
  }

  const handleTouchBrake = (isPressed: boolean) => {
    if (touchControls && gameState === 'playing') {
      setIsBraking(isPressed)
    }
  }

  // Speed and movement logic
  useEffect(() => {
    if (gameState !== 'playing') return

    const gameLoop = setInterval(() => {
      setCurrentSpeed(prev => {
        let newSpeed = prev

        if (isAccelerating) {
          newSpeed = Math.min(prev + 2, 80)
        } else if (isBraking) {
          newSpeed = Math.max(prev - 3, 0)
        } else {
          // Natural deceleration
          newSpeed = Math.max(prev - 0.5, 0)
        }

        return newSpeed
      })

      setPosition(prev => prev + currentSpeed * 0.1)

      // Update fuel efficiency based on speed management
      setFuelEfficiency(prev => {
        const segment = roadSegments[currentSegment]
        const speedDiff = Math.abs(currentSpeed - segment.speedLimit)
        
        if (speedDiff <= 5) {
          return Math.min(prev + 0.1, 100) // Good driving
        } else {
          return Math.max(prev - 0.2, 0) // Poor efficiency
        }
      })

      // Check for speed violations
      const segment = roadSegments[currentSegment]
      if (currentSpeed > segment.speedLimit + 5) {
        setViolations(v => v + 1)
        setScore(s => Math.max(0, s - 2))
      } else if (Math.abs(currentSpeed - segment.speedLimit) <= 2) {
        setScore(s => s + 1) // Reward for good speed management
      }

      // Check speed cameras
      speedCameras.forEach((camera, index) => {
        if (!camera.triggered && Math.abs(position - camera.position) < 5) {
          if (currentSpeed > roadSegments[currentSegment].speedLimit + 3) {
            setSpeedCameras(prev => 
              prev.map((cam, i) => 
                i === index ? { ...cam, triggered: true } : cam
              )
            )
            setViolations(v => v + 1)
            setScore(s => Math.max(0, s - 15)) // Heavy penalty for camera violations
          }
        }
      })
    }, 100)

    return () => clearInterval(gameLoop)
  }, [gameState, currentSpeed, isAccelerating, isBraking, position, currentSegment, speedCameras])

  // Update current segment
  useEffect(() => {
    let totalDistance = 0
    let newSegment = 0
    
    for (let i = 0; i < roadSegments.length; i++) {
      if (position < totalDistance + roadSegments[i].length) {
        newSegment = i
        break
      }
      totalDistance += roadSegments[i].length
    }
    
    if (newSegment !== currentSegment) {
      setCurrentSegment(newSegment)
      setTargetSpeed(roadSegments[newSegment].speedLimit)
      
      // Award points for completing segment within speed limits
      if (violations === 0) {
        setPerfectSections(p => p + 1)
        setScore(s => s + 20)
      }
    }

    // Check if game is complete
    const totalLength = roadSegments.reduce((sum, segment) => sum + segment.length, 0)
    if (position >= totalLength) {
      setGameState('finished')
    }
  }, [position, currentSegment, violations])

  // Game timer
  useEffect(() => {
    if (gameState !== 'playing') return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('finished')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState])

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setTimeLeft(30)
    setCurrentSpeed(0)
    setPosition(0)
    setCurrentSegment(0)
    setViolations(0)
    setPerfectSections(0)
    setFuelEfficiency(100)
    setTargetSpeed(roadSegments[0].speedLimit)
  }

  const pauseGame = () => {
    setGameState(gameState === 'paused' ? 'playing' : 'paused')
  }

  const restartGame = () => {
    setGameState('waiting')
  }

  const finishGame = () => {
    const efficiencyBonus = Math.floor(fuelEfficiency / 10) * 5
    const finalScore = Math.max(0, score + efficiencyBonus - (violations * 10))
    const percentage = Math.min(100, Math.max(0, (finalScore / 300) * 100))
    onComplete(percentage)
  }

  const getSegmentColor = (type: string) => {
    switch (type) {
      case 'school': return 'bg-yellow-200 border-yellow-400'
      case 'highway': return 'bg-blue-200 border-blue-400'
      case 'residential': return 'bg-green-200 border-green-400'
      default: return 'bg-gray-200 border-gray-400'
    }
  }

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'rain': return '🌧️'
      case 'fog': return '🌫️'
      default: return '☀️'
    }
  }

  const getSpeedColor = () => {
    const segment = roadSegments[currentSegment]
    const diff = currentSpeed - segment.speedLimit
    
    if (diff > 10) return 'text-red-600'
    if (diff > 5) return 'text-orange-600'
    if (Math.abs(diff) <= 2) return 'text-green-600'
    return 'text-gray-900'
  }

  if (gameState === 'waiting') {
    return (
      <div className="text-center p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-6xl mb-6"
        >
          🚗💨
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Speed Limit Challenge</h2>
        <p className="text-gray-600 mb-6 text-lg leading-relaxed">
          Drive through different road segments while maintaining appropriate speeds. 
          Watch for speed cameras, weather conditions, and changing speed limits!
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
            <li>• Use ↑/W to accelerate, ↓/S to brake</li>
            <li>• Follow speed limits for each road type</li>
            <li>• Watch for speed cameras (📷)</li>
            <li>• Adapt to weather conditions</li>
            <li>• Maintain good fuel efficiency</li>
            <li>• Avoid speeding violations</li>
            {touchControls && (
              <>
                <li className="font-medium">• Tap top half of screen to accelerate</li>
                <li className="font-medium">• Tap bottom half of screen to brake</li>
              </>
            )}
          </ul>
          
          {showHelp && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-blue-200"
            >
              <div className="flex items-start space-x-2 text-sm">
                <Camera className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-blue-700">
                  <strong>Speed Camera Alert:</strong> Speed cameras will flash if you're speeding when you pass them. 
                  These violations result in heavy point penalties, so watch your speed carefully!
                </p>
              </div>
            </motion.div>
          )}
        </div>
        <motion.button
          onClick={startGame}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="text-white px-8 py-3 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl flex items-center space-x-2 mx-auto"
          style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
        >
          <Play className="h-5 w-5" />
          <span>Start Driving</span>
        </motion.button>
      </div>
    )
  }

  if (gameState === 'finished') {
    const efficiencyBonus = Math.floor(fuelEfficiency / 10) * 5
    const finalScore = Math.max(0, score + efficiencyBonus - (violations * 10))
    const percentage = Math.min(100, Math.max(0, (finalScore / 300) * 100))
    
    return (
      <div className="text-center p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-6xl mb-6"
        >
          {percentage >= 80 ? '🏆' : percentage >= 60 ? '🌟' : '👍'}
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Drive Complete!</h2>
        <div className="grid grid-cols-2 gap-4 mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">{perfectSections}</div>
            <div className="text-sm text-gray-600">Perfect Sections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{Math.round(fuelEfficiency)}%</div>
            <div className="text-sm text-gray-600">Fuel Efficiency</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">{violations}</div>
            <div className="text-sm text-gray-600">Violations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">{percentage}%</div>
            <div className="text-sm text-gray-600">Driving Score</div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-2xl p-6 mb-6 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-2">Speed Management Assessment:</h3>
          <p className="text-blue-800 text-sm">
            {percentage >= 80 
              ? "Excellent speed management! You adapted well to different road conditions and speed limits, maintaining safety and efficiency."
              : percentage >= 60 
              ? "Good driving. Remember that speed limits are set for safety reasons and should be followed in all conditions."
              : "Your speed management needs improvement. Always follow posted speed limits and adjust for weather and road conditions."}
          </p>
        </div>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={restartGame}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Drive Again</span>
          </button>
          <button
            onClick={finishGame}
            className="flex items-center space-x-2 px-6 py-3 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
          >
            <Trophy className="h-4 w-4" />
            <span>Continue</span>
          </button>
        </div>
      </div>
    )
  }

  const segment = roadSegments[currentSegment]
  const totalLength = roadSegments.reduce((sum, seg) => sum + seg.length, 0)
  const progressPercentage = (position / totalLength) * 100

  return (
    <div className="max-w-4xl mx-auto">
      {/* Game HUD */}
      <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{score}</div>
            <div className="text-sm text-gray-600">Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{perfectSections}</div>
            <div className="text-sm text-gray-600">Perfect</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{violations}</div>
            <div className="text-sm text-gray-600">Violations</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <span className="text-lg font-bold text-gray-900">{timeLeft}s</span>
          </div>
          <button
            onClick={pauseGame}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {gameState === 'paused' ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Speedometer */}
      <div className="mb-6 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Gauge className="h-8 w-8 text-blue-600" />
            <div>
              <div className={`text-4xl font-bold ${getSpeedColor()}`}>
                {Math.round(currentSpeed)}
              </div>
              <div className="text-sm text-gray-600">mph</div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{segment.speedLimit}</div>
            <div className="text-sm text-gray-600">Speed Limit</div>
          </div>
        </div>
        
        {/* Speed bar */}
        <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-200"
            style={{ width: `${Math.min((currentSpeed / 80) * 100, 100)}%` }}
          />
          <div 
            className="absolute top-0 w-1 h-full bg-white border-2 border-gray-800"
            style={{ left: `${(segment.speedLimit / 80) * 100}%` }}
          />
        </div>
      </div>

      {/* Road View */}
      <div 
        ref={gameAreaRef}
        className="relative bg-gray-600 rounded-3xl overflow-hidden shadow-2xl mb-6" 
        style={{ height: '200px' }}
        onTouchStart={(e) => {
          if (!touchControls || gameState !== 'playing') return
          const touch = e.touches[0]
          const rect = e.currentTarget.getBoundingClientRect()
          const y = touch.clientY - rect.top
          
          if (y < rect.height / 2) {
            handleTouchAccelerate(true)
          } else {
            handleTouchBrake(true)
          }
        }}
        onTouchEnd={() => {
          if (touchControls && gameState === 'playing') {
            handleTouchAccelerate(false)
            handleTouchBrake(false)
          }
        }}
      >
        {/* Road surface */}
        <div className="absolute inset-0 bg-gray-600">
          {/* Road markings */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-yellow-400 transform -translate-y-1/2"></div>
          
          {/* Current segment indicator */}
          <div className={`absolute inset-0 ${getSegmentColor(segment.type)} opacity-30`} />
        </div>

        {/* Speed cameras */}
        {speedCameras.map((camera, index) => {
          const cameraPosition = ((camera.position - position + 50) / 100) * 100
          if (cameraPosition > -10 && cameraPosition < 110) {
            return (
              <div
                key={index}
                className={`absolute top-4 text-2xl ${camera.triggered ? 'animate-pulse' : ''}`}
                style={{ left: `${cameraPosition}%` }}
              >
                {camera.triggered ? '📸' : '📷'}
              </div>
            )
          }
          return null
        })}

        {/* Player car */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl">
          🚗
        </div>

        {/* Weather overlay */}
        {segment.weather !== 'clear' && (
          <div className="absolute inset-0 bg-blue-900 opacity-20" />
        )}

        {/* Speed limit sign */}
        <div className="absolute top-4 right-4 w-12 h-12 bg-white rounded-full border-4 border-red-600 flex items-center justify-center font-bold text-lg">
          {segment.speedLimit}
        </div>

        {/* Touch control indicators */}
        {touchControls && (
          <>
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-green-500 opacity-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-red-500 opacity-10 pointer-events-none"></div>
            <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold opacity-70">
              TAP TO ACCELERATE
            </div>
            <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 translate-y-1/2 text-white text-xs font-bold opacity-70">
              TAP TO BRAKE
            </div>
          </>
        )}

        {/* Pause Overlay */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
            <div className="bg-white rounded-2xl p-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Game Paused</h3>
              <button
                onClick={pauseGame}
                className="text-white px-6 py-2 rounded-xl"
                style={{ background: theme.primaryColor }}
              >
                Resume
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Progress and Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-blue-900">Current Segment</h3>
            <span className="text-lg">{getWeatherIcon(segment.weather)}</span>
          </div>
          <div className="text-blue-800 text-sm space-y-1">
            <div>Type: {segment.type.charAt(0).toUpperCase() + segment.type.slice(1)}</div>
            <div>Speed Limit: {segment.speedLimit} mph</div>
            <div>Weather: {segment.weather.charAt(0).toUpperCase() + segment.weather.slice(1)}</div>
            <div>Hazards: {segment.hazards.join(', ')}</div>
          </div>
        </div>
        
        <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
          <h3 className="font-bold text-green-900 mb-2">Performance</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-green-800 text-sm">
              <span>Progress:</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-green-800 text-sm">
              <span>Fuel Efficiency:</span>
              <span>{Math.round(fuelEfficiency)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls reminder */}
      <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
        <p className="text-gray-600 text-sm">
          {touchControls 
            ? "Tap top half to accelerate, bottom half to brake" 
            : "Use ↑/W to accelerate, ↓/S to brake"} | Current: {segment.type} zone - {segment.speedLimit} mph limit
        </p>
      </div>
    </div>
  )
}

export default SpeedLimitGame