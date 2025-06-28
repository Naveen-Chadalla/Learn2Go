import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Car, Clock, Trophy, RotateCcw, Play, Pause } from 'lucide-react'

interface TrafficLightGameProps {
  onComplete: (score: number) => void
  theme: {
    primaryColor: string
    secondaryColor: string
  }
}

interface Vehicle {
  id: string
  x: number
  y: number
  speed: number
  direction: 'horizontal' | 'vertical'
  type: 'car' | 'truck' | 'bike'
  color: string
}

type LightState = 'red' | 'yellow' | 'green'

const TrafficLightGame: React.FC<TrafficLightGameProps> = ({ onComplete, theme }) => {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'paused' | 'finished'>('waiting')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [lightState, setLightState] = useState<LightState>('red')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [violations, setViolations] = useState(0)
  const [successfulStops, setSuccessfulStops] = useState(0)
  const [gameSpeed, setGameSpeed] = useState(1)

  // Game mechanics
  const spawnVehicle = useCallback(() => {
    const directions = ['horizontal', 'vertical'] as const
    const direction = directions[Math.floor(Math.random() * directions.length)]
    const types = ['car', 'truck', 'bike'] as const
    const type = types[Math.floor(Math.random() * types.length)]
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6']
    
    const newVehicle: Vehicle = {
      id: `vehicle-${Date.now()}-${Math.random()}`,
      x: direction === 'horizontal' ? -50 : Math.random() * 300 + 100,
      y: direction === 'vertical' ? -50 : Math.random() * 300 + 100,
      speed: (Math.random() * 2 + 1) * gameSpeed,
      direction,
      type,
      color: colors[Math.floor(Math.random() * colors.length)]
    }
    
    setVehicles(prev => [...prev, newVehicle])
  }, [gameSpeed])

  // Traffic light cycle
  useEffect(() => {
    if (gameState !== 'playing') return

    const lightCycle = () => {
      setLightState(current => {
        switch (current) {
          case 'red': return 'green'
          case 'green': return 'yellow'
          case 'yellow': return 'red'
          default: return 'red'
        }
      })
    }

    const interval = setInterval(lightCycle, 3000 + Math.random() * 2000) // 3-5 seconds
    return () => clearInterval(interval)
  }, [gameState])

  // Vehicle spawning
  useEffect(() => {
    if (gameState !== 'playing') return

    const spawnInterval = setInterval(() => {
      if (Math.random() < 0.7) { // 70% chance to spawn
        spawnVehicle()
      }
    }, 1500 - (gameSpeed * 200))

    return () => clearInterval(spawnInterval)
  }, [gameState, spawnVehicle, gameSpeed])

  // Vehicle movement and collision detection
  useEffect(() => {
    if (gameState !== 'playing') return

    const moveVehicles = () => {
      setVehicles(prev => {
        return prev.map(vehicle => {
          let newX = vehicle.x
          let newY = vehicle.y
          let shouldStop = false

          // Check if vehicle should stop at traffic light
          if (vehicle.direction === 'horizontal') {
            newX += vehicle.speed
            // Stop zone for horizontal traffic
            if (newX > 180 && newX < 220 && (lightState === 'red' || lightState === 'yellow')) {
              shouldStop = true
              if (newX > 200) {
                // Vehicle ran the light
                setViolations(v => v + 1)
                setScore(s => Math.max(0, s - 10))
              }
            }
          } else {
            newY += vehicle.speed
            // Stop zone for vertical traffic
            if (newY > 180 && newY < 220 && (lightState === 'red' || lightState === 'yellow')) {
              shouldStop = true
              if (newY > 200) {
                // Vehicle ran the light
                setViolations(v => v + 1)
                setScore(s => Math.max(0, s - 10))
              }
            }
          }

          // Award points for proper stopping
          if (shouldStop && ((vehicle.direction === 'horizontal' && newX <= 200) || 
                           (vehicle.direction === 'vertical' && newY <= 200))) {
            setSuccessfulStops(s => s + 1)
            setScore(s => s + 5)
          }

          return {
            ...vehicle,
            x: shouldStop ? vehicle.x : newX,
            y: shouldStop ? vehicle.y : newY
          }
        }).filter(vehicle => 
          vehicle.x < 500 && vehicle.y < 500 && vehicle.x > -100 && vehicle.y > -100
        )
      })
    }

    const interval = setInterval(moveVehicles, 50)
    return () => clearInterval(interval)
  }, [gameState, lightState])

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

  // Increase difficulty over time
  useEffect(() => {
    if (gameState !== 'playing') return

    const difficultyTimer = setInterval(() => {
      setGameSpeed(prev => Math.min(prev + 0.1, 3))
    }, 10000) // Increase every 10 seconds

    return () => clearInterval(difficultyTimer)
  }, [gameState])

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setTimeLeft(60)
    setViolations(0)
    setSuccessfulStops(0)
    setVehicles([])
    setGameSpeed(1)
    setLightState('red')
  }

  const pauseGame = () => {
    setGameState(gameState === 'paused' ? 'playing' : 'paused')
  }

  const restartGame = () => {
    setGameState('waiting')
  }

  const finishGame = () => {
    const finalScore = Math.max(0, score - (violations * 5))
    const percentage = Math.min(100, Math.max(0, (finalScore / 300) * 100))
    onComplete(percentage)
  }

  if (gameState === 'waiting') {
    return (
      <div className="text-center p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-6xl mb-6"
        >
          🚦
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Traffic Light Control</h2>
        <p className="text-gray-600 mb-6 text-lg leading-relaxed">
          Manage traffic flow by controlling when vehicles stop and go at the intersection. 
          Vehicles must stop on red and yellow lights. Earn points for safe traffic management!
        </p>
        <div className="bg-blue-50 rounded-2xl p-6 mb-6 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-3">How to Play:</h3>
          <ul className="text-blue-800 text-left space-y-2">
            <li>• Watch vehicles approach the intersection</li>
            <li>• Vehicles should stop on red and yellow lights</li>
            <li>• Earn +5 points for each vehicle that stops properly</li>
            <li>• Lose -10 points for each traffic violation</li>
            <li>• Game gets faster as time progresses</li>
          </ul>
        </div>
        <motion.button
          onClick={startGame}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="text-white px-8 py-3 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl flex items-center space-x-2 mx-auto"
          style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
        >
          <Play className="h-5 w-5" />
          <span>Start Game</span>
        </motion.button>
      </div>
    )
  }

  if (gameState === 'finished') {
    const finalScore = Math.max(0, score - (violations * 5))
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
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Game Complete!</h2>
        <div className="grid grid-cols-2 gap-4 mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">{finalScore}</div>
            <div className="text-sm text-gray-600">Final Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{successfulStops}</div>
            <div className="text-sm text-gray-600">Safe Stops</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">{violations}</div>
            <div className="text-sm text-gray-600">Violations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">{percentage}%</div>
            <div className="text-sm text-gray-600">Performance</div>
          </div>
        </div>
        <div className="flex justify-center space-x-4">
          <button
            onClick={restartGame}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Play Again</span>
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
            <div className="text-2xl font-bold text-green-600">{successfulStops}</div>
            <div className="text-sm text-gray-600">Safe Stops</div>
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

      {/* Game Area */}
      <div className="relative bg-gray-800 rounded-3xl overflow-hidden shadow-2xl" style={{ height: '400px' }}>
        {/* Road */}
        <div className="absolute inset-0">
          {/* Horizontal road */}
          <div className="absolute top-1/2 left-0 right-0 h-20 bg-gray-600 transform -translate-y-1/2">
            {/* Road markings */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-yellow-400 transform -translate-y-1/2"></div>
          </div>
          
          {/* Vertical road */}
          <div className="absolute left-1/2 top-0 bottom-0 w-20 bg-gray-600 transform -translate-x-1/2">
            {/* Road markings */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-yellow-400 transform -translate-x-1/2"></div>
          </div>
          
          {/* Intersection */}
          <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-gray-600 transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* Traffic Light */}
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-black rounded-lg p-2 shadow-lg">
            <div className={`w-6 h-6 rounded-full mb-1 ${lightState === 'red' ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-red-900'}`}></div>
            <div className={`w-6 h-6 rounded-full mb-1 ${lightState === 'yellow' ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50' : 'bg-yellow-900'}`}></div>
            <div className={`w-6 h-6 rounded-full ${lightState === 'green' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-green-900'}`}></div>
          </div>
        </div>

        {/* Vehicles */}
        <AnimatePresence>
          {vehicles.map(vehicle => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: vehicle.x,
                y: vehicle.y
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute z-10"
              style={{
                transform: `rotate(${vehicle.direction === 'vertical' ? '90deg' : '0deg'})`
              }}
            >
              <div 
                className="w-8 h-6 rounded-lg shadow-lg flex items-center justify-center"
                style={{ backgroundColor: vehicle.color }}
              >
                <Car className="h-4 w-4 text-white" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Stop Lines */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          {/* Horizontal stop lines */}
          <div className="absolute -left-12 -top-10 w-4 h-1 bg-white"></div>
          <div className="absolute -left-12 top-9 w-4 h-1 bg-white"></div>
          <div className="absolute right-8 -top-10 w-4 h-1 bg-white"></div>
          <div className="absolute right-8 top-9 w-4 h-1 bg-white"></div>
          
          {/* Vertical stop lines */}
          <div className="absolute -top-12 -left-10 h-4 w-1 bg-white"></div>
          <div className="absolute -top-12 left-9 h-4 w-1 bg-white"></div>
          <div className="absolute bottom-8 -left-10 h-4 w-1 bg-white"></div>
          <div className="absolute bottom-8 left-9 h-4 w-1 bg-white"></div>
        </div>

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

      {/* Game Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
        <div className="flex items-center space-x-2 mb-2">
          <div className={`w-4 h-4 rounded-full ${lightState === 'red' ? 'bg-red-500' : lightState === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
          <span className="font-bold text-blue-900">
            Current Light: {lightState.toUpperCase()}
          </span>
        </div>
        <p className="text-blue-800 text-sm">
          Vehicles should stop at the white stop lines when the light is red or yellow. 
          Watch for traffic violations and help maintain safe traffic flow!
        </p>
      </div>
    </div>
  )
}

export default TrafficLightGame