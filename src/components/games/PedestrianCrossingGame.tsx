import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Clock, Trophy, RotateCcw, Play, Pause, AlertTriangle, HelpCircle } from 'lucide-react'

interface PedestrianCrossingGameProps {
  onComplete: (score: number) => void
  theme: {
    primaryColor: string
    secondaryColor: string
  }
}

interface Pedestrian {
  id: string
  x: number
  y: number
  targetX: number
  targetY: number
  speed: number
  type: 'adult' | 'child' | 'elderly'
  waiting: boolean
  crossing: boolean
  safe: boolean
  guided: boolean
}

interface Vehicle {
  id: string
  x: number
  y: number
  speed: number
  lane: number
  stopped: boolean
}

const PedestrianCrossingGame: React.FC<PedestrianCrossingGameProps> = ({ onComplete, theme }) => {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'paused' | 'finished'>('waiting')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(90)
  const [pedestrians, setPedestrians] = useState<Pedestrian[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [safeCrossings, setSafeCrossings] = useState(0)
  const [nearMisses, setNearMisses] = useState(0)
  const [accidents, setAccidents] = useState(0)
  const [crosswalkSignal, setCrosswalkSignal] = useState<'walk' | 'dont-walk'>('dont-walk')
  const [showHelp, setShowHelp] = useState(false)
  const [touchControls, setTouchControls] = useState(false)
  const gameAreaRef = useRef<HTMLDivElement>(null)

  // Check if user is on mobile
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    setTouchControls(isMobile)
  }, [])

  const spawnPedestrian = useCallback(() => {
    const types = ['adult', 'child', 'elderly'] as const
    const type = types[Math.floor(Math.random() * types.length)]
    const side = Math.random() < 0.5 ? 'left' : 'right'
    
    const newPedestrian: Pedestrian = {
      id: `pedestrian-${Date.now()}-${Math.random()}`,
      x: side === 'left' ? 50 : 350,
      y: 180 + Math.random() * 40,
      targetX: side === 'left' ? 350 : 50,
      targetY: 180 + Math.random() * 40,
      speed: type === 'child' ? 1.5 : type === 'elderly' ? 0.8 : 1.2,
      type,
      waiting: true,
      crossing: false,
      safe: false,
      guided: false
    }
    
    setPedestrians(prev => [...prev, newPedestrian])
  }, [])

  const spawnVehicle = useCallback(() => {
    const lane = Math.floor(Math.random() * 2) // 0 or 1
    const newVehicle: Vehicle = {
      id: `vehicle-${Date.now()}-${Math.random()}`,
      x: -50,
      y: 160 + (lane * 80),
      speed: 2 + Math.random() * 2,
      lane,
      stopped: false
    }
    
    setVehicles(prev => [...prev, newVehicle])
  }, [])

  // Crosswalk signal cycle
  useEffect(() => {
    if (gameState !== 'playing') return

    const signalCycle = () => {
      setCrosswalkSignal(current => current === 'walk' ? 'dont-walk' : 'walk')
    }

    const interval = setInterval(signalCycle, 8000) // 8 seconds cycle
    return () => clearInterval(interval)
  }, [gameState])

  // Spawn entities
  useEffect(() => {
    if (gameState !== 'playing') return

    const pedestrianInterval = setInterval(() => {
      if (Math.random() < 0.4 && pedestrians.length < 8) {
        spawnPedestrian()
      }
    }, 2000)

    const vehicleInterval = setInterval(() => {
      if (Math.random() < 0.6 && vehicles.length < 6) {
        spawnVehicle()
      }
    }, 3000)

    return () => {
      clearInterval(pedestrianInterval)
      clearInterval(vehicleInterval)
    }
  }, [gameState, spawnPedestrian, spawnVehicle, pedestrians.length, vehicles.length])

  // Game logic
  useEffect(() => {
    if (gameState !== 'playing') return

    const gameLoop = () => {
      // Move vehicles
      setVehicles(prev => {
        return prev.map(vehicle => {
          let newX = vehicle.x + vehicle.speed
          let stopped = false

          // Check if should stop for pedestrians
          const pedestriansInCrossway = pedestrians.some(p => 
            p.crossing && 
            Math.abs(p.y - vehicle.y) < 40 && 
            p.x > 120 && p.x < 280
          )

          if (pedestriansInCrossway && newX > 100 && newX < 150) {
            stopped = true
            newX = vehicle.x // Don't move
            setScore(s => s + 2) // Reward for stopping
          }

          return {
            ...vehicle,
            x: newX,
            stopped
          }
        }).filter(vehicle => vehicle.x < 450)
      })

      // Move pedestrians
      setPedestrians(prev => {
        return prev.map(pedestrian => {
          if (pedestrian.waiting) {
            // Check if should start crossing
            if ((crosswalkSignal === 'walk' && Math.random() < 0.3) || 
                (pedestrian.guided) || 
                (crosswalkSignal === 'dont-walk' && Math.random() < 0.05)) { // Some risk-takers
              return {
                ...pedestrian,
                waiting: false,
                crossing: true,
                guided: false
              }
            }
            return pedestrian
          }

          if (pedestrian.crossing) {
            const dx = pedestrian.targetX - pedestrian.x
            const dy = pedestrian.targetY - pedestrian.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < 5) {
              // Reached destination
              setSafeCrossings(s => s + 1)
              setScore(s => s + 10)
              return {
                ...pedestrian,
                crossing: false,
                safe: true
              }
            }

            // Move towards target
            const moveX = (dx / distance) * pedestrian.speed
            const moveY = (dy / distance) * pedestrian.speed

            return {
              ...pedestrian,
              x: pedestrian.x + moveX,
              y: pedestrian.y + moveY
            }
          }

          return pedestrian
        }).filter(pedestrian => !pedestrian.safe)
      })

      // Check for collisions and near misses
      vehicles.forEach(vehicle => {
        pedestrians.forEach(pedestrian => {
          if (pedestrian.crossing) {
            const distance = Math.sqrt(
              Math.pow(vehicle.x - pedestrian.x, 2) + 
              Math.pow(vehicle.y - pedestrian.y, 2)
            )

            if (distance < 15) {
              // Collision
              setAccidents(a => a + 1)
              setScore(s => Math.max(0, s - 50))
              setPedestrians(prev => prev.filter(p => p.id !== pedestrian.id))
            } else if (distance < 30 && !vehicle.stopped) {
              // Near miss
              setNearMisses(n => n + 1)
              setScore(s => Math.max(0, s - 10))
            }
          }
        })
      })
    }

    const interval = setInterval(gameLoop, 50)
    return () => clearInterval(interval)
  }, [gameState, pedestrians, vehicles, crosswalkSignal])

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

  // Handle touch controls for crosswalk signal
  const handleTouchCrosswalkSignal = () => {
    if (touchControls && gameState === 'playing') {
      setCrosswalkSignal(current => current === 'walk' ? 'dont-walk' : 'walk')
    }
  }

  // Handle touch controls for pedestrians
  const handleTouchPedestrian = (id: string) => {
    if (touchControls && gameState === 'playing') {
      setPedestrians(prev => 
        prev.map(p => 
          p.id === id && p.waiting 
            ? { ...p, guided: true } 
            : p
        )
      )
    }
  }

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setTimeLeft(90)
    setSafeCrossings(0)
    setNearMisses(0)
    setAccidents(0)
    setPedestrians([])
    setVehicles([])
    setCrosswalkSignal('dont-walk')
  }

  const pauseGame = () => {
    setGameState(gameState === 'paused' ? 'playing' : 'paused')
  }

  const restartGame = () => {
    setGameState('waiting')
  }

  const finishGame = () => {
    const finalScore = Math.max(0, score - (accidents * 25) - (nearMisses * 5))
    const percentage = Math.min(100, Math.max(0, (finalScore / 500) * 100))
    onComplete(percentage)
  }

  const getPedestrianEmoji = (type: string) => {
    switch (type) {
      case 'child': return '🧒'
      case 'elderly': return '👴'
      default: return '🚶'
    }
  }

  if (gameState === 'waiting') {
    return (
      <div className="text-center p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-6xl mb-6"
        >
          🚸
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Pedestrian Crossing Safety</h2>
        <p className="text-gray-600 mb-6 text-lg leading-relaxed">
          Help pedestrians cross safely! Watch for crosswalk signals and ensure vehicles 
          stop for pedestrians. Prevent accidents and promote safe crossing behavior.
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
            <li>• Pedestrians will wait at crosswalks</li>
            <li>• They should cross during WALK signals</li>
            <li>• Vehicles must stop for crossing pedestrians</li>
            <li>• Earn +10 points for safe crossings</li>
            <li>• Lose -50 points for accidents</li>
            {touchControls && (
              <>
                <li className="font-medium">• Tap the crosswalk signal to change it</li>
                <li className="font-medium">• Tap waiting pedestrians to guide them</li>
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
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-blue-700">
                  Pay special attention to children and elderly pedestrians who may move at different speeds.
                  Remember that vehicles should always yield to pedestrians in crosswalks!
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
          <span>Start Game</span>
        </motion.button>
      </div>
    )
  }

  if (gameState === 'finished') {
    const finalScore = Math.max(0, score - (accidents * 25) - (nearMisses * 5))
    const percentage = Math.min(100, Math.max(0, (finalScore / 500) * 100))
    
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
            <div className="text-2xl font-bold text-green-600 mb-1">{safeCrossings}</div>
            <div className="text-sm text-gray-600">Safe Crossings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-1">{nearMisses}</div>
            <div className="text-sm text-gray-600">Near Misses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">{accidents}</div>
            <div className="text-sm text-gray-600">Accidents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">{percentage}%</div>
            <div className="text-sm text-gray-600">Safety Score</div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-2xl p-6 mb-6 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-2">Pedestrian Safety Insights:</h3>
          <p className="text-blue-800 text-sm">
            {percentage >= 80 
              ? "Excellent! You prioritized pedestrian safety and prevented accidents. Remember that pedestrians always have the right of way at crosswalks."
              : percentage >= 60 
              ? "Good job helping pedestrians cross safely. Always ensure vehicles yield to pedestrians in crosswalks."
              : "Pedestrian safety needs improvement. Always ensure pedestrians cross at designated crosswalks and when the signal indicates it's safe."}
          </p>
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
            <div className="text-2xl font-bold text-green-600">{safeCrossings}</div>
            <div className="text-sm text-gray-600">Safe Crossings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{accidents}</div>
            <div className="text-sm text-gray-600">Accidents</div>
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
      <div 
        ref={gameAreaRef}
        className="relative bg-gray-700 rounded-3xl overflow-hidden shadow-2xl" 
        style={{ height: '400px' }}
      >
        {/* Road */}
        <div className="absolute inset-0">
          {/* Main road */}
          <div className="absolute top-1/2 left-0 right-0 h-32 bg-gray-600 transform -translate-y-1/2">
            {/* Lane divider */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-yellow-400 transform -translate-y-1/2"></div>
          </div>
          
          {/* Sidewalks */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gray-400"></div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gray-400"></div>
        </div>

        {/* Crosswalk */}
        <div className="absolute top-1/2 left-1/4 right-1/4 transform -translate-y-1/2 z-10">
          <div className="h-32 bg-white opacity-80">
            {/* Crosswalk stripes */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-white h-full"
                style={{
                  left: `${i * 12.5}%`,
                  width: '8%'
                }}
              />
            ))}
          </div>
        </div>

        {/* Crosswalk Signal */}
        <motion.div 
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 cursor-pointer"
          onClick={handleTouchCrosswalkSignal}
          whileHover={{ scale: touchControls ? 1.1 : 1 }}
          whileTap={{ scale: touchControls ? 0.9 : 1 }}
        >
          <div className="bg-black rounded-lg p-2 shadow-lg">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
              crosswalkSignal === 'walk' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {crosswalkSignal === 'walk' ? '🚶' : '🛑'}
            </div>
          </div>
          <div className="text-center mt-1 text-white text-xs font-bold">
            {crosswalkSignal === 'walk' ? 'WALK' : "DON'T WALK"}
          </div>
          {touchControls && (
            <div className="text-white text-xs mt-1 text-center">Tap to change</div>
          )}
        </motion.div>

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
              className="absolute z-15"
            >
              <div className={`w-12 h-6 rounded-lg shadow-lg flex items-center justify-center ${
                vehicle.stopped ? 'bg-red-500' : 'bg-blue-500'
              }`}>
                <span className="text-white text-xs">🚗</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Pedestrians */}
        <AnimatePresence>
          {pedestrians.map(pedestrian => (
            <motion.div
              key={pedestrian.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: pedestrian.x,
                y: pedestrian.y
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute z-20"
              onClick={() => handleTouchPedestrian(pedestrian.id)}
              whileHover={{ scale: touchControls && pedestrian.waiting ? 1.2 : 1 }}
              whileTap={{ scale: touchControls && pedestrian.waiting ? 0.9 : 1 }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                pedestrian.waiting 
                  ? pedestrian.guided 
                    ? 'bg-green-100 animate-pulse' 
                    : 'bg-yellow-100' 
                  : pedestrian.crossing 
                    ? 'bg-blue-100' 
                    : 'bg-green-100'
              }`}>
                {getPedestrianEmoji(pedestrian.type)}
              </div>
              {touchControls && pedestrian.waiting && (
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-white text-[10px] whitespace-nowrap">
                  Tap to guide
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

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

      {/* Game Status */}
      <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-lg ${crosswalkSignal === 'walk' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-bold text-blue-900">
              Crosswalk Signal: {crosswalkSignal === 'walk' ? 'WALK' : "DON'T WALK"}
            </span>
          </div>
          {accidents > 0 && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Safety Alert: {accidents} accidents occurred</span>
            </div>
          )}
        </div>
        <p className="text-blue-800 text-sm mt-2">
          Help pedestrians cross safely! Vehicles should stop when pedestrians are in the crosswalk.
          {touchControls && " Tap pedestrians to guide them and tap the signal to change it."}
        </p>
      </div>
    </div>
  )
}

export default PedestrianCrossingGame