import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Car, Clock, Trophy, RotateCcw, Play, Pause, Navigation, HelpCircle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react'

interface ParkingGameProps {
  onComplete: (score: number) => void
  theme: {
    primaryColor: string
    secondaryColor: string
  }
}

interface PlayerCar {
  x: number
  y: number
  angle: number
  speed: number
  isParking: boolean
  isParked: boolean
}

interface ParkingSpot {
  id: string
  x: number
  y: number
  width: number
  height: number
  occupied: boolean
  target: boolean
  angle: number
}

interface Obstacle {
  x: number
  y: number
  width: number
  height: number
  type: 'car' | 'cone' | 'pole'
}

const ParkingGame: React.FC<ParkingGameProps> = ({ onComplete, theme }) => {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'paused' | 'finished'>('waiting')
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [attempts, setAttempts] = useState(0)
  const [playerCar, setPlayerCar] = useState<PlayerCar>({
    x: 50,
    y: 200,
    angle: 0,
    speed: 0,
    isParking: false,
    isParked: false
  })
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([])
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [keys, setKeys] = useState<{[key: string]: boolean}>({})
  const [collisions, setCollisions] = useState(0)
  const [perfectParks, setPerfectParks] = useState(0)
  const [showHelp, setShowHelp] = useState(false)
  const [touchControls, setTouchControls] = useState(false)
  const gameAreaRef = useRef<HTMLDivElement>(null)

  // Check if user is on mobile
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    setTouchControls(isMobile)
  }, [])

  // Initialize level
  const initializeLevel = useCallback((levelNum: number) => {
    const spots: ParkingSpot[] = []
    const obs: Obstacle[] = []

    if (levelNum === 1) {
      // Parallel parking
      spots.push({
        id: 'target',
        x: 200,
        y: 150,
        width: 80,
        height: 40,
        occupied: false,
        target: true,
        angle: 0
      })
      
      // Parked cars
      obs.push(
        { x: 120, y: 150, width: 70, height: 35, type: 'car' },
        { x: 290, y: 150, width: 70, height: 35, type: 'car' }
      )
    } else if (levelNum === 2) {
      // Perpendicular parking
      spots.push({
        id: 'target',
        x: 250,
        y: 100,
        width: 40,
        height: 80,
        occupied: false,
        target: true,
        angle: 90
      })
      
      // Parked cars and obstacles
      obs.push(
        { x: 200, y: 100, width: 35, height: 70, type: 'car' },
        { x: 300, y: 100, width: 35, height: 70, type: 'car' },
        { x: 150, y: 250, width: 10, height: 10, type: 'cone' },
        { x: 350, y: 250, width: 10, height: 10, type: 'cone' }
      )
    } else {
      // Angled parking
      spots.push({
        id: 'target',
        x: 220,
        y: 120,
        width: 60,
        height: 50,
        occupied: false,
        target: true,
        angle: 45
      })
      
      obs.push(
        { x: 160, y: 100, width: 50, height: 40, type: 'car' },
        { x: 280, y: 140, width: 50, height: 40, type: 'car' },
        { x: 100, y: 280, width: 8, height: 8, type: 'cone' },
        { x: 380, y: 280, width: 8, height: 8, type: 'cone' },
        { x: 200, y: 50, width: 15, height: 15, type: 'pole' }
      )
    }

    setParkingSpots(spots)
    setObstacles(obs)
    setPlayerCar({
      x: 50,
      y: 200,
      angle: 0,
      speed: 0,
      isParking: false,
      isParked: false
    })
  }, [])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }))
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: false }))
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Touch controls
  const handleTouchControl = (control: 'up' | 'down' | 'left' | 'right', isPressed: boolean) => {
    if (touchControls && gameState === 'playing') {
      const keyMap = {
        up: 'arrowup',
        down: 'arrowdown',
        left: 'arrowleft',
        right: 'arrowright'
      }
      
      setKeys(prev => ({ ...prev, [keyMap[control]]: isPressed }))
    }
  }

  // Car movement
  useEffect(() => {
    if (gameState !== 'playing' || playerCar.isParked) return

    const moveInterval = setInterval(() => {
      setPlayerCar(prev => {
        let newX = prev.x
        let newY = prev.y
        let newAngle = prev.angle
        let newSpeed = prev.speed

        // Handle input
        if (keys['arrowup'] || keys['w']) {
          newSpeed = Math.min(newSpeed + 0.5, 3)
        } else if (keys['arrowdown'] || keys['s']) {
          newSpeed = Math.max(newSpeed - 0.5, -2)
        } else {
          newSpeed *= 0.9 // Friction
        }

        if (Math.abs(newSpeed) > 0.1) {
          if (keys['arrowleft'] || keys['a']) {
            newAngle -= 3 * (newSpeed > 0 ? 1 : -1)
          }
          if (keys['arrowright'] || keys['d']) {
            newAngle += 3 * (newSpeed > 0 ? 1 : -1)
          }
        }

        // Move car
        const radians = (newAngle * Math.PI) / 180
        newX += Math.cos(radians) * newSpeed
        newY += Math.sin(radians) * newSpeed

        // Boundary checking
        newX = Math.max(20, Math.min(380, newX))
        newY = Math.max(20, Math.min(280, newY))

        // Collision detection
        const carBounds = {
          x: newX - 15,
          y: newY - 10,
          width: 30,
          height: 20
        }

        let collision = false
        obstacles.forEach(obstacle => {
          if (
            carBounds.x < obstacle.x + obstacle.width &&
            carBounds.x + carBounds.width > obstacle.x &&
            carBounds.y < obstacle.y + obstacle.height &&
            carBounds.y + carBounds.height > obstacle.y
          ) {
            collision = true
          }
        })

        if (collision) {
          setCollisions(c => c + 1)
          setScore(s => Math.max(0, s - 5))
          return prev // Don't move if collision
        }

        // Check if in parking spot
        const targetSpot = parkingSpots.find(spot => spot.target)
        if (targetSpot) {
          const inSpot = 
            newX > targetSpot.x - 10 &&
            newX < targetSpot.x + targetSpot.width + 10 &&
            newY > targetSpot.y - 10 &&
            newY < targetSpot.y + targetSpot.height + 10

          if (inSpot && Math.abs(newSpeed) < 0.5) {
            // Check parking accuracy
            const centerX = targetSpot.x + targetSpot.width / 2
            const centerY = targetSpot.y + targetSpot.height / 2
            const distance = Math.sqrt(
              Math.pow(newX - centerX, 2) + Math.pow(newY - centerY, 2)
            )
            
            const angleDiff = Math.abs(newAngle - targetSpot.angle)
            const normalizedAngleDiff = Math.min(angleDiff, 360 - angleDiff)

            if (distance < 15 && normalizedAngleDiff < 15) {
              // Perfect parking
              const bonus = distance < 5 && normalizedAngleDiff < 5 ? 50 : 30
              setScore(s => s + bonus)
              setPerfectParks(p => p + 1)
              
              return {
                ...prev,
                x: newX,
                y: newY,
                angle: newAngle,
                speed: 0,
                isParked: true
              }
            }
          }
        }

        return {
          ...prev,
          x: newX,
          y: newY,
          angle: newAngle,
          speed: newSpeed
        }
      })
    }, 50)

    return () => clearInterval(moveInterval)
  }, [gameState, keys, obstacles, parkingSpots, playerCar.isParked])

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

  // Check for level completion
  useEffect(() => {
    if (playerCar.isParked && gameState === 'playing') {
      setTimeout(() => {
        if (level < 3) {
          setLevel(l => l + 1)
          setAttempts(0)
          setTimeLeft(30)
          initializeLevel(level + 1)
        } else {
          setGameState('finished')
        }
      }, 2000)
    }
  }, [playerCar.isParked, gameState, level, initializeLevel])

  const startGame = () => {
    setGameState('playing')
    setLevel(1)
    setScore(0)
    setTimeLeft(30)
    setAttempts(0)
    setCollisions(0)
    setPerfectParks(0)
    initializeLevel(1)
  }

  const pauseGame = () => {
    setGameState(gameState === 'paused' ? 'playing' : 'paused')
  }

  const restartGame = () => {
    setGameState('waiting')
  }

  const finishGame = () => {
    const finalScore = Math.max(0, score - (collisions * 5))
    const percentage = Math.min(100, Math.max(0, (finalScore / 200) * 100))
    onComplete(percentage)
  }

  const resetPosition = () => {
    setPlayerCar({
      x: 50,
      y: 200,
      angle: 0,
      speed: 0,
      isParking: false,
      isParked: false
    })
    setAttempts(a => a + 1)
    setScore(s => Math.max(0, s - 10))
  }

  const getObstacleEmoji = (type: string) => {
    switch (type) {
      case 'car': return '🚗'
      case 'cone': return '🚧'
      case 'pole': return '🚏'
      default: return '⬛'
    }
  }

  const getLevelName = (levelNum: number) => {
    switch (levelNum) {
      case 1: return 'Parallel Parking'
      case 2: return 'Perpendicular Parking'
      case 3: return 'Angled Parking'
      default: return 'Parking Challenge'
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
          🅿️
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Parking Master</h2>
        <p className="text-gray-600 mb-6 text-lg leading-relaxed">
          Master different parking techniques! Navigate through 3 challenging levels: 
          parallel, perpendicular, and angled parking. Avoid obstacles and park accurately!
        </p>
        <div className="bg-blue-50 rounded-2xl p-6 mb-6 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-blue-900">Controls:</h3>
            <button 
              onClick={() => setShowHelp(!showHelp)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-blue-800 text-sm">
            <div>
              <div className="font-medium">Movement:</div>
              <div>↑/W - Forward</div>
              <div>↓/S - Reverse</div>
            </div>
            <div>
              <div className="font-medium">Steering:</div>
              <div>←/A - Turn Left</div>
              <div>→/D - Turn Right</div>
            </div>
          </div>
          
          {showHelp && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-blue-200"
            >
              <div className="text-blue-700 text-sm">
                <p className="mb-2">
                  <strong>Parking Tips:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>For parallel parking, position yourself next to the front car, then reverse at an angle</li>
                  <li>For perpendicular parking, approach at a right angle and align with the space</li>
                  <li>For angled parking, follow the angle of the space and pull in smoothly</li>
                  <li>Always check your surroundings for obstacles</li>
                  <li>Slow and steady wins the race - take your time!</li>
                </ul>
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
          <span>Start Parking</span>
        </motion.button>
      </div>
    )
  }

  if (gameState === 'finished') {
    const finalScore = Math.max(0, score - (collisions * 5))
    const percentage = Math.min(100, Math.max(0, (finalScore / 200) * 100))
    
    return (
      <div className="text-center p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-6xl mb-6"
        >
          {percentage >= 80 ? '🏆' : percentage >= 60 ? '🌟' : '👍'}
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Parking Complete!</h2>
        <div className="grid grid-cols-2 gap-4 mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">{level}</div>
            <div className="text-sm text-gray-600">Levels Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{perfectParks}</div>
            <div className="text-sm text-gray-600">Perfect Parks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">{collisions}</div>
            <div className="text-sm text-gray-600">Collisions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">{percentage}%</div>
            <div className="text-sm text-gray-600">Skill Score</div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-2xl p-6 mb-6 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-2">Parking Mastery Assessment:</h3>
          <p className="text-blue-800 text-sm">
            {percentage >= 80 
              ? "Excellent parking skills! You've mastered different parking techniques with precision and care."
              : percentage >= 60 
              ? "Good parking skills. With more practice, you'll become even more confident with all parking types."
              : "You've completed the parking challenges, but could use more practice. Remember to approach slowly and check your surroundings."}
          </p>
        </div>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={restartGame}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
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
            <div className="text-2xl font-bold text-blue-600">{level}</div>
            <div className="text-sm text-gray-600">Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{collisions}</div>
            <div className="text-sm text-gray-600">Collisions</div>
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
        className="relative bg-gray-300 rounded-3xl overflow-hidden shadow-2xl" 
        style={{ height: '400px' }}
      >
        {/* Parking lot surface */}
        <div className="absolute inset-0 bg-gray-300">
          {/* Parking space markings */}
          {parkingSpots.map(spot => (
            <div
              key={spot.id}
              className={`absolute border-4 ${spot.target ? 'border-green-500 bg-green-100' : 'border-white'}`}
              style={{
                left: spot.x,
                top: spot.y,
                width: spot.width,
                height: spot.height,
                transform: `rotate(${spot.angle}deg)`,
                transformOrigin: 'center'
              }}
            >
              {spot.target && (
                <div className="absolute inset-0 flex items-center justify-center text-green-700 font-bold text-xs">
                  PARK HERE
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Obstacles */}
        {obstacles.map((obstacle, index) => (
          <div
            key={index}
            className="absolute flex items-center justify-center text-lg"
            style={{
              left: obstacle.x,
              top: obstacle.y,
              width: obstacle.width,
              height: obstacle.height
            }}
          >
            {getObstacleEmoji(obstacle.type)}
          </div>
        ))}

        {/* Player Car */}
        <motion.div
          className="absolute z-20 flex items-center justify-center"
          style={{
            left: playerCar.x - 15,
            top: playerCar.y - 10,
            width: 30,
            height: 20,
            transform: `rotate(${playerCar.angle}deg)`,
            transformOrigin: 'center'
          }}
          animate={{
            scale: playerCar.isParked ? [1, 1.2, 1] : 1
          }}
          transition={{ duration: 0.5 }}
        >
          <div className={`w-full h-full rounded-lg flex items-center justify-center text-lg ${
            playerCar.isParked ? 'bg-green-500' : 'bg-blue-500'
          } shadow-lg`}>
            🚙
          </div>
        </motion.div>

        {/* Success message */}
        {playerCar.isParked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center z-30"
          >
            <div className="bg-green-500 text-white px-6 py-3 rounded-2xl font-bold text-lg shadow-xl">
              🎉 Perfect Parking! 🎉
            </div>
          </motion.div>
        )}

        {/* Touch Controls */}
        {touchControls && gameState === 'playing' && !playerCar.isParked && (
          <div className="absolute bottom-4 right-4 z-30 grid grid-cols-3 gap-2">
            <div className="col-start-2">
              <button
                onTouchStart={() => handleTouchControl('up', true)}
                onTouchEnd={() => handleTouchControl('up', false)}
                className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center shadow-lg active:bg-gray-200"
              >
                <ArrowUp className="h-6 w-6 text-gray-700" />
              </button>
            </div>
            <div className="col-start-1 col-end-2">
              <button
                onTouchStart={() => handleTouchControl('left', true)}
                onTouchEnd={() => handleTouchControl('left', false)}
                className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center shadow-lg active:bg-gray-200"
              >
                <ArrowLeft className="h-6 w-6 text-gray-700" />
              </button>
            </div>
            <div className="col-start-2 col-end-3">
              <button
                onTouchStart={() => handleTouchControl('down', true)}
                onTouchEnd={() => handleTouchControl('down', false)}
                className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center shadow-lg active:bg-gray-200"
              >
                <ArrowDown className="h-6 w-6 text-gray-700" />
              </button>
            </div>
            <div className="col-start-3 col-end-4">
              <button
                onTouchStart={() => handleTouchControl('right', true)}
                onTouchEnd={() => handleTouchControl('right', false)}
                className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center shadow-lg active:bg-gray-200"
              >
                <ArrowRight className="h-6 w-6 text-gray-700" />
              </button>
            </div>
          </div>
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

      {/* Game Instructions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-2">Level: {getLevelName(level)}</h3>
          <p className="text-blue-800 text-sm">
            {level === 1 && "Park between the two cars. Approach slowly and align carefully."}
            {level === 2 && "Back into the perpendicular space. Use your mirrors and go slow."}
            {level === 3 && "Navigate into the angled space. Watch for obstacles and poles."}
          </p>
        </div>
        
        <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-green-900">Quick Actions</h3>
            <button
              onClick={resetPosition}
              className="text-green-700 hover:text-green-900 text-sm font-medium"
            >
              Reset Position (-10 pts)
            </button>
          </div>
          <p className="text-green-800 text-sm mt-2">
            Attempts: {attempts} | {touchControls ? "Use on-screen controls" : "Use arrow keys or WASD"} to control your car
          </p>
        </div>
      </div>
    </div>
  )
}

export default ParkingGame