import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Trophy, RotateCcw, Play, AlertTriangle, CheckCircle, XCircle, ArrowRight } from 'lucide-react'

interface EmergencyResponseGameProps {
  onComplete: (score: number) => void
  theme: {
    primaryColor: string
    secondaryColor: string
  }
}

interface Scenario {
  id: string
  situation: string
  image?: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  timeLimit: number
}

const EmergencyResponseGame: React.FC<EmergencyResponseGameProps> = ({ onComplete, theme }) => {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting')
  const [currentScenario, setCurrentScenario] = useState(0)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [correctResponses, setCorrectResponses] = useState(0)
  const [responseTime, setResponseTime] = useState<number[]>([])

  // Scenarios based on emergency response situations
  const scenarios: Scenario[] = [
    {
      id: 'accident',
      situation: 'You witness a car accident on the highway',
      image: 'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=800',
      question: 'What should you do first?',
      options: [
        'Stop immediately in the middle of the road to help',
        'Call emergency services and pull over safely',
        'Drive around the accident and continue your journey',
        'Take photos for insurance purposes'
      ],
      correctIndex: 1,
      explanation: 'Safety first! Pull over safely, then call emergency services. Never stop in the middle of the road as this could cause another accident.',
      timeLimit: 15
    },
    {
      id: 'breakdown',
      situation: 'Your car breaks down on a busy road',
      image: 'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=800',
      question: 'What is the correct procedure?',
      options: [
        'Turn on hazard lights, move to the shoulder if possible, and call for help',
        'Leave your car where it stopped and walk to get help',
        'Try to fix the car while in the traffic lane',
        'Wave down another driver to give you a push'
      ],
      correctIndex: 0,
      explanation: 'Turn on hazard lights immediately to warn other drivers, move to the shoulder if possible to avoid blocking traffic, and call for roadside assistance.',
      timeLimit: 15
    },
    {
      id: 'fire',
      situation: 'You notice smoke coming from under your hood while driving',
      image: 'https://images.pexels.com/photos/163016/crash-test-collision-60-km-h-distraction-163016.jpeg?auto=compress&cs=tinysrgb&w=800',
      question: 'What should you do?',
      options: [
        'Continue driving to the nearest service station',
        'Open the hood immediately to check the source',
        'Pull over safely, turn off the engine, and exit the vehicle',
        'Pour water on the engine'
      ],
      correctIndex: 2,
      explanation: 'Pull over safely, turn off the engine to cut fuel supply, and exit the vehicle. Stay away from the vehicle and call for help. Never open a hot hood or continue driving.',
      timeLimit: 12
    },
    {
      id: 'flood',
      situation: 'You encounter a flooded road ahead',
      image: 'https://images.pexels.com/photos/1446076/pexels-photo-1446076.jpeg?auto=compress&cs=tinysrgb&w=800',
      question: 'What is the safest action?',
      options: [
        'Drive through slowly in first gear',
        'Turn around and find an alternative route',
        'Check the depth by walking through first',
        'Follow another vehicle that made it through'
      ],
      correctIndex: 1,
      explanation: 'Never drive through flooded roads - just 6 inches of water can cause loss of control or engine stalling. Turn around and find an alternative route.',
      timeLimit: 10
    },
    {
      id: 'medical',
      situation: 'A passenger in your car has a medical emergency',
      image: 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=800',
      question: 'What should you do?',
      options: [
        'Speed to the nearest hospital',
        'Pull over safely, call emergency services, and follow their instructions',
        'Continue driving normally to avoid stress',
        'Give them medication from your first aid kit'
      ],
      correctIndex: 1,
      explanation: 'Pull over safely to focus on the emergency. Call emergency services immediately and follow their instructions. Speeding could cause an accident and worsen the situation.',
      timeLimit: 15
    }
  ]

  // Timer effect
  useEffect(() => {
    if (gameState !== 'playing' || showResult) return
    
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showResult) {
      handleTimeUp()
    }
  }, [timeLeft, gameState, showResult])

  const handleTimeUp = () => {
    setShowResult(true)
    setResponseTime(prev => [...prev, scenarios[currentScenario].timeLimit])
  }

  const startGame = () => {
    setGameState('playing')
    setCurrentScenario(0)
    setScore(0)
    setCorrectResponses(0)
    setResponseTime([])
    setTimeLeft(scenarios[0].timeLimit)
    setSelectedOption(null)
    setShowResult(false)
  }

  const handleOptionSelect = (index: number) => {
    if (showResult) return
    
    setSelectedOption(index)
    setShowResult(true)
    
    const timeTaken = scenarios[currentScenario].timeLimit - timeLeft
    setResponseTime(prev => [...prev, timeTaken])
    
    if (index === scenarios[currentScenario].correctIndex) {
      // Calculate score based on speed and correctness
      const timeBonus = Math.max(0, 10 - Math.floor(timeTaken / 2))
      const pointsEarned = 20 + timeBonus
      
      setScore(prev => prev + pointsEarned)
      setCorrectResponses(prev => prev + 1)
    }
  }

  const handleNextScenario = () => {
    if (currentScenario < scenarios.length - 1) {
      setCurrentScenario(prev => prev + 1)
      setSelectedOption(null)
      setShowResult(false)
      setTimeLeft(scenarios[currentScenario + 1].timeLimit)
    } else {
      setGameState('finished')
    }
  }

  const restartGame = () => {
    setGameState('waiting')
  }

  const finishGame = () => {
    const maxPossibleScore = scenarios.length * 30 // 20 points + max 10 time bonus per scenario
    const percentage = Math.min(100, Math.max(0, Math.round((score / maxPossibleScore) * 100)))
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
          🚨
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Emergency Response Training</h2>
        <p className="text-gray-600 mb-6 text-lg leading-relaxed">
          Test your knowledge of how to respond to emergency situations on the road. 
          Quick thinking and correct actions can save lives in critical moments!
        </p>
        <div className="bg-blue-50 rounded-2xl p-6 mb-6 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-3">How to Play:</h3>
          <ul className="text-blue-800 text-left space-y-2">
            <li>• You'll face 5 emergency scenarios</li>
            <li>• Each scenario has a time limit</li>
            <li>• Select the best response for each situation</li>
            <li>• Earn points for correct answers and quick responses</li>
            <li>• Learn the proper emergency protocols</li>
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
          <span>Start Emergency Training</span>
        </motion.button>
      </div>
    )
  }

  if (gameState === 'finished') {
    const percentage = Math.min(100, Math.max(0, Math.round((score / (scenarios.length * 30)) * 100)))
    const avgResponseTime = responseTime.reduce((sum, time) => sum + time, 0) / responseTime.length
    
    return (
      <div className="text-center p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-6xl mb-6"
        >
          {percentage >= 80 ? '🏆' : percentage >= 60 ? '🌟' : '👍'}
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Training Complete!</h2>
        <div className="grid grid-cols-2 gap-4 mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">{correctResponses}</div>
            <div className="text-sm text-gray-600">Correct Responses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{Math.round(avgResponseTime)}s</div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">{score}</div>
            <div className="text-sm text-gray-600">Total Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600 mb-1">{percentage}%</div>
            <div className="text-sm text-gray-600">Performance</div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-2xl p-6 mb-6 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-3">Emergency Response Assessment:</h3>
          <p className="text-blue-800 mb-4">
            {percentage >= 80 
              ? "Excellent! You demonstrated strong knowledge of emergency procedures. Your quick and accurate responses would help save lives in real emergencies."
              : percentage >= 60 
              ? "Good job! You have a solid understanding of emergency procedures, but there's room for improvement in response time and decision-making."
              : "You've completed the training, but should review emergency procedures more carefully. In emergencies, making the right decisions quickly is crucial."}
          </p>
          <div className="text-sm text-blue-700">
            Remember: In real emergencies, always prioritize safety, call for professional help, and stay calm.
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={restartGame}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Train Again</span>
          </button>
          <button
            onClick={finishGame}
            className="flex items-center space-x-2 px-6 py-3 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
          >
            <Trophy className="h-4 w-4" />
            <span>Complete Training</span>
          </button>
        </div>
      </div>
    )
  }

  const scenario = scenarios[currentScenario]

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
            <div className="text-2xl font-bold text-green-600">{correctResponses}</div>
            <div className="text-sm text-gray-600">Correct</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{currentScenario + 1}/{scenarios.length}</div>
            <div className="text-sm text-gray-600">Scenario</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-gray-600" />
          <div className={`text-lg font-bold ${timeLeft <= 5 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <motion.div
          className="h-2 rounded-full transition-all duration-300"
          style={{ 
            width: `${((currentScenario + 1) / scenarios.length) * 100}%`,
            background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.secondaryColor})`
          }}
          initial={{ width: 0 }}
          animate={{ width: `${((currentScenario + 1) / scenarios.length) * 100}%` }}
        />
      </div>

      {/* Scenario Card */}
      <motion.div
        key={currentScenario}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100"
      >
        {/* Emergency Situation */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div className="text-lg font-bold text-red-600">Emergency Situation:</div>
          </div>
          <div className="text-xl text-gray-800 font-medium">{scenario.situation}</div>
        </div>

        {/* Scenario Image */}
        {scenario.image && (
          <div className="mb-6">
            <img
              src={scenario.image}
              alt={`Emergency scenario: ${scenario.situation}`}
              className="w-full h-64 object-cover rounded-xl"
            />
          </div>
        )}

        {/* Question */}
        <h3 className="text-2xl font-semibold text-gray-900 mb-6">{scenario.question}</h3>

        {/* Options */}
        <div className="space-y-3">
          {scenario.options.map((option, index) => (
            <motion.button
              key={index}
              onClick={() => handleOptionSelect(index)}
              disabled={showResult}
              whileHover={!showResult ? { scale: 1.02 } : {}}
              whileTap={!showResult ? { scale: 0.98 } : {}}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                showResult
                  ? index === scenario.correctIndex
                    ? 'border-green-500 bg-green-50 text-green-900'
                    : index === selectedOption
                    ? 'border-red-500 bg-red-50 text-red-900'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                  : selectedOption === index
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  showResult
                    ? index === scenario.correctIndex
                      ? 'border-green-500 bg-green-500'
                      : index === selectedOption
                      ? 'border-red-500 bg-red-500'
                      : 'border-gray-300'
                    : selectedOption === index
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {showResult && index === scenario.correctIndex && (
                    <CheckCircle className="h-4 w-4 text-white" />
                  )}
                  {showResult && index === selectedOption && index !== scenario.correctIndex && (
                    <XCircle className="h-4 w-4 text-white" />
                  )}
                  {!showResult && selectedOption === index && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span className="font-medium">{option}</span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Explanation */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mt-6 p-4 rounded-xl ${
                selectedOption === scenario.correctIndex
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex items-start space-x-2">
                {selectedOption === scenario.correctIndex ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                )}
                <div>
                  <div className={`font-medium mb-1 ${
                    selectedOption === scenario.correctIndex ? 'text-green-800' : 'text-blue-800'
                  }`}>
                    {selectedOption === scenario.correctIndex ? 'Correct Response!' : 'Important Safety Information:'}
                  </div>
                  <div className={`text-sm ${
                    selectedOption === scenario.correctIndex ? 'text-green-700' : 'text-blue-700'
                  }`}>
                    {scenario.explanation}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Next Button */}
      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <button
            onClick={handleNextScenario}
            className="text-white px-8 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto"
            style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
          >
            <span>
              {currentScenario < scenarios.length - 1 ? 'Next Scenario' : 'Complete Training'}
            </span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </motion.div>
      )}
    </div>
  )
}

export default EmergencyResponseGame