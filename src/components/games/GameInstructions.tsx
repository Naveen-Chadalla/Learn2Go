import React from 'react'
import { motion } from 'framer-motion'
import { Info, Keyboard, MousePointer, Gamepad2 } from 'lucide-react'

interface GameInstructionsProps {
  gameType: 'traffic-light' | 'pedestrian' | 'parking' | 'speed-limit'
  onClose: () => void
}

const GameInstructions: React.FC<GameInstructionsProps> = ({ gameType, onClose }) => {
  const getInstructions = () => {
    switch (gameType) {
      case 'traffic-light':
        return {
          title: 'Traffic Light Control',
          description: 'Manage traffic flow by controlling when vehicles stop and go at the intersection.',
          steps: [
            'Watch vehicles approach the intersection',
            'Vehicles should stop on red and yellow lights',
            'Earn +5 points for each vehicle that stops properly',
            'Lose -10 points for each traffic violation',
            'Game gets faster as time progresses'
          ],
          controls: [
            'No direct controls - observe traffic patterns',
            'Traffic lights change automatically',
            'Your score depends on how well vehicles follow traffic rules'
          ],
          tips: [
            'Pay attention to vehicles approaching from all directions',
            'Anticipate light changes to predict traffic flow',
            'Watch for vehicles that might run red lights'
          ]
        }
      case 'pedestrian':
        return {
          title: 'Pedestrian Crossing Safety',
          description: 'Help pedestrians cross safely at the crosswalk while managing vehicle traffic.',
          steps: [
            'Pedestrians will wait at crosswalks',
            'They should cross during WALK signals',
            'Vehicles must stop for crossing pedestrians',
            'Earn +10 points for safe crossings',
            'Lose -50 points for accidents'
          ],
          controls: [
            'No direct controls - observe crossing patterns',
            'Crosswalk signals change automatically',
            'Your score depends on pedestrian safety'
          ],
          tips: [
            'Watch for different pedestrian types (children move faster, elderly slower)',
            'Be extra cautious during "DON\'T WALK" signals',
            'Prevent vehicles from hitting pedestrians in the crosswalk'
          ]
        }
      case 'parking':
        return {
          title: 'Parking Master',
          description: 'Master different parking techniques including parallel, perpendicular, and angled parking.',
          steps: [
            'Navigate your vehicle to the green parking spot',
            'Align properly within the parking lines',
            'Avoid hitting other vehicles or obstacles',
            'Complete all parking challenges to finish'
          ],
          controls: [
            '↑ or W key: Drive forward',
            '↓ or S key: Reverse',
            '← or A key: Turn left',
            '→ or D key: Turn right'
          ],
          tips: [
            'Approach slowly when near the parking spot',
            'For parallel parking, pull up next to the front car first',
            'Use small steering adjustments for precise control',
            'You can reset your position if you get stuck (with a point penalty)'
          ]
        }
      case 'speed-limit':
        return {
          title: 'Speed Limit Challenge',
          description: 'Drive through different road segments while maintaining appropriate speeds.',
          steps: [
            'Follow the speed limit for each road segment',
            'Adapt to changing conditions (school zones, highways, etc.)',
            'Watch for speed cameras',
            'Maintain good fuel efficiency'
          ],
          controls: [
            '↑ or W key: Accelerate',
            '↓ or S key: Brake',
            'Release keys to coast and gradually slow down'
          ],
          tips: [
            'Watch for speed limit signs at the start of each segment',
            'Slow down in school zones and residential areas',
            'Speed cameras will flash if you're speeding when you pass them',
            'Maintain a steady speed close to the limit for best efficiency'
          ]
        }
      default:
        return {
          title: 'Interactive Game',
          description: 'Apply what you\'ve learned in this engaging traffic safety game!',
          steps: [
            'Follow the on-screen instructions',
            'Complete the objectives to earn points',
            'Avoid making traffic safety violations'
          ],
          controls: [
            'Controls will be shown in-game',
            'Most games use arrow keys or WASD'
          ],
          tips: [
            'Pay attention to the game instructions',
            'Apply the traffic safety concepts you learned in the lesson'
          ]
        }
    }
  }

  const instructions = getInstructions()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 50 }}
        animate={{ y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Info className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{instructions.title} Instructions</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-gray-600 mb-6">{instructions.description}</p>

        <div className="space-y-6">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center space-x-2 mb-3">
              <Gamepad2 className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-blue-900">How to Play</h3>
            </div>
            <ul className="space-y-2 text-blue-800">
              {instructions.steps.map((step, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="font-bold min-w-[20px]">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
            <div className="flex items-center space-x-2 mb-3">
              <Keyboard className="h-5 w-5 text-purple-600" />
              <h3 className="font-bold text-purple-900">Controls</h3>
            </div>
            <ul className="space-y-2 text-purple-800">
              {instructions.controls.map((control, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-purple-500">•</span>
                  <span>{control}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
            <div className="flex items-center space-x-2 mb-3">
              <MousePointer className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold text-amber-900">Pro Tips</h3>
            </div>
            <ul className="space-y-2 text-amber-800">
              {instructions.tips.map((tip, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-amber-500">💡</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
          >
            I'm Ready to Play!
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default GameInstructions