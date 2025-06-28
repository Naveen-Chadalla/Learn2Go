import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Car, 
  Users, 
  Gauge, 
  ParkingSquare, 
  X, 
  Info, 
  ArrowRight, 
  ArrowLeft, 
  ArrowUp, 
  ArrowDown, 
  Keyboard, 
  AlertTriangle,
  Trophy,
  Clock,
  Target
} from 'lucide-react'

interface GameInstructionsProps {
  gameType?: 'traffic-light' | 'pedestrian-crossing' | 'parking' | 'speed-limit' | null
  onClose: () => void
  theme: {
    primaryColor: string
    secondaryColor: string
  }
}

const GameInstructions: React.FC<GameInstructionsProps> = ({ 
  gameType = null, 
  onClose,
  theme
}) => {
  const [selectedGame, setSelectedGame] = useState<string>(gameType || 'traffic-light')

  const games = [
    {
      id: 'traffic-light',
      name: 'Traffic Light Control',
      icon: <Car className="h-5 w-5" />,
      emoji: '🚦',
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 'pedestrian-crossing',
      name: 'Pedestrian Crossing Safety',
      icon: <Users className="h-5 w-5" />,
      emoji: '🚸',
      color: 'from-green-500 to-teal-600'
    },
    {
      id: 'parking',
      name: 'Parking Master',
      icon: <ParkingSquare className="h-5 w-5" />,
      emoji: '🅿️',
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 'speed-limit',
      name: 'Speed Limit Challenge',
      icon: <Gauge className="h-5 w-5" />,
      emoji: '🚗💨',
      color: 'from-red-500 to-orange-600'
    }
  ]

  const renderGameInstructions = () => {
    switch (selectedGame) {
      case 'traffic-light':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🚦
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Traffic Light Control</h3>
              <p className="text-gray-600">
                Manage traffic flow at an intersection with changing traffic lights.
              </p>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
              <h4 className="font-bold text-blue-900 mb-3 flex items-center">
                <Info className="h-5 w-5 mr-2" />
                How to Play:
              </h4>
              <ul className="space-y-3 text-blue-800">
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>Watch vehicles approach the intersection from different directions</div>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>Vehicles should stop on red and yellow lights</div>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>You earn <span className="font-bold text-green-600">+5 points</span> for each vehicle that stops properly</div>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>You lose <span className="font-bold text-red-600">-10 points</span> for each traffic violation</div>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>The game gets faster as time progresses</div>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>Try to maximize your safety score!</div>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="font-bold text-gray-900 mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Game Duration:
                </div>
                <p className="text-gray-600 text-sm">60 seconds</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="font-bold text-gray-900 mb-2 flex items-center">
                  <Trophy className="h-4 w-4 mr-2" />
                  Success Criteria:
                </div>
                <p className="text-gray-600 text-sm">Minimize violations</p>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-center text-yellow-800 font-medium mb-2">
                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                Safety Tip:
              </div>
              <p className="text-yellow-700 text-sm">
                In real life, always come to a complete stop at red lights and prepare to stop when you see a yellow light.
              </p>
            </div>
          </div>
        )
      
      case 'pedestrian-crossing':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🚸
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pedestrian Crossing Safety</h3>
              <p className="text-gray-600">
                Help pedestrians cross safely at the crosswalk while managing vehicle traffic.
              </p>
            </div>

            <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
              <h4 className="font-bold text-green-900 mb-3 flex items-center">
                <Info className="h-5 w-5 mr-2" />
                How to Play:
              </h4>
              <ul className="space-y-3 text-green-800">
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>Pedestrians will wait at crosswalks and cross during WALK signals</div>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>Vehicles must stop for crossing pedestrians</div>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>You earn <span className="font-bold text-green-600">+10 points</span> for safe crossings</div>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>You lose <span className="font-bold text-red-600">-50 points</span> for accidents</div>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>Watch for different pedestrian types (children, elderly)</div>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>Manage the crosswalk signal timing for optimal safety</div>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="font-bold text-gray-900 mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Game Duration:
                </div>
                <p className="text-gray-600 text-sm">90 seconds</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="font-bold text-gray-900 mb-2 flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Pedestrian Types:
                </div>
                <p className="text-gray-600 text-sm">Adults 🚶, Children 🧒, Elderly 👴</p>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-center text-yellow-800 font-medium mb-2">
                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                Safety Tip:
              </div>
              <p className="text-yellow-700 text-sm">
                Always yield to pedestrians at crosswalks. Make eye contact with drivers before crossing.
              </p>
            </div>
          </div>
        )
      
      case 'parking':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🅿️
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Parking Master</h3>
              <p className="text-gray-600">
                Master three different parking techniques: parallel, perpendicular, and angled parking.
              </p>
            </div>

            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
              <h4 className="font-bold text-purple-900 mb-3 flex items-center">
                <Keyboard className="h-5 w-5 mr-2" />
                Controls:
              </h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/50 p-3 rounded-xl">
                  <div className="font-medium text-purple-900 mb-1">Movement:</div>
                  <div className="flex items-center space-x-2 text-purple-800">
                    <ArrowUp className="h-4 w-4" />
                    <span>or</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">W</span>
                    <span>- Drive forward</span>
                  </div>
                  <div className="flex items-center space-x-2 text-purple-800">
                    <ArrowDown className="h-4 w-4" />
                    <span>or</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">S</span>
                    <span>- Reverse</span>
                  </div>
                </div>
                <div className="bg-white/50 p-3 rounded-xl">
                  <div className="font-medium text-purple-900 mb-1">Steering:</div>
                  <div className="flex items-center space-x-2 text-purple-800">
                    <ArrowLeft className="h-4 w-4" />
                    <span>or</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">A</span>
                    <span>- Turn left</span>
                  </div>
                  <div className="flex items-center space-x-2 text-purple-800">
                    <ArrowRight className="h-4 w-4" />
                    <span>or</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">D</span>
                    <span>- Turn right</span>
                  </div>
                </div>
              </div>
              
              <h4 className="font-bold text-purple-900 mb-3 flex items-center">
                <Info className="h-5 w-5 mr-2" />
                How to Play:
              </h4>
              <ul className="space-y-3 text-purple-800">
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>Navigate your car into the green parking space</div>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>Avoid collisions with other cars and obstacles</div>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>Complete three levels: parallel, perpendicular, and angled parking</div>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>More precise parking earns higher scores</div>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>You can reset your position if you get stuck (with a point penalty)</div>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="font-bold text-gray-900 mb-2 text-center">Level 1</div>
                <p className="text-gray-600 text-sm text-center">Parallel Parking</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="font-bold text-gray-900 mb-2 text-center">Level 2</div>
                <p className="text-gray-600 text-sm text-center">Perpendicular</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="font-bold text-gray-900 mb-2 text-center">Level 3</div>
                <p className="text-gray-600 text-sm text-center">Angled Parking</p>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-center text-yellow-800 font-medium mb-2">
                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                Parking Tip:
              </div>
              <p className="text-yellow-700 text-sm">
                For parallel parking, position your car next to the front vehicle, then reverse while turning the wheel.
              </p>
            </div>
          </div>
        )
      
      case 'speed-limit':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🚗💨
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Speed Limit Challenge</h3>
              <p className="text-gray-600">
                Drive through different road segments while maintaining appropriate speeds.
              </p>
            </div>

            <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
              <h4 className="font-bold text-red-900 mb-3 flex items-center">
                <Keyboard className="h-5 w-5 mr-2" />
                Controls:
              </h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/50 p-3 rounded-xl">
                  <div className="flex items-center space-x-2 text-red-800">
                    <ArrowUp className="h-4 w-4" />
                    <span>or</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">W</span>
                    <span>- Accelerate</span>
                  </div>
                </div>
                <div className="bg-white/50 p-3 rounded-xl">
                  <div className="flex items-center space-x-2 text-red-800">
                    <ArrowDown className="h-4 w-4" />
                    <span>or</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">S</span>
                    <span>- Brake</span>
                  </div>
                </div>
              </div>
              
              <h4 className="font-bold text-red-900 mb-3 flex items-center">
                <Info className="h-5 w-5 mr-2" />
                How to Play:
              </h4>
              <ul className="space-y-3 text-red-800">
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>Maintain the posted speed limit for each road segment</div>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>Adapt to changing conditions (school zones, highways, residential areas)</div>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>Watch for speed cameras 📷 that will penalize you for speeding</div>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>Adjust for weather conditions (rain, fog)</div>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <div>Maintain good fuel efficiency by driving smoothly</div>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="font-bold text-gray-900 mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Game Duration:
                </div>
                <p className="text-gray-600 text-sm">120 seconds</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="font-bold text-gray-900 mb-2 flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Road Types:
                </div>
                <p className="text-gray-600 text-sm">City, Highway, School, Residential</p>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-center text-yellow-800 font-medium mb-2">
                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                Safety Tip:
              </div>
              <p className="text-yellow-700 text-sm">
                Always adjust your speed for weather and road conditions, even if you're under the speed limit.
              </p>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-6xl mb-4"
        >
          🎮
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Interactive Traffic Safety Game</h2>
        <p className="text-gray-600 mb-6">
          Apply what you've learned in this engaging interactive game!
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {games.map(game => (
          <motion.button
            key={game.id}
            onClick={() => setSelectedGame(game.id)}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`p-4 rounded-xl transition-all duration-200 ${
              selectedGame === game.id
                ? `bg-gradient-to-r ${game.color} text-white shadow-lg`
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <span className="text-2xl mb-2">{game.emoji}</span>
              <span className="text-sm font-medium">{game.name}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {renderGameInstructions()}

      <motion.button
        onClick={onClose}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full text-white px-8 py-3 rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-2 font-bold"
        style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
      >
        <span>Start Playing</span>
        <ArrowRight className="h-5 w-5" />
      </motion.button>
    </div>
  )
}

export default GameInstructions