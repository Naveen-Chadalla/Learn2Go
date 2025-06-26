import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Trophy, Star, RotateCcw, ArrowRight } from 'lucide-react'

interface GameQuestion {
  id: string
  scenario: string
  image?: string
  question: string
  options: string[]
  correct: number
  explanation: string
  points: number
}

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
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isTimerActive, setIsTimerActive] = useState(true)

  // Generate game questions based on lesson content
  const getGameQuestions = (): GameQuestion[] => {
    const baseQuestions: GameQuestion[] = [
      {
        id: '1',
        scenario: 'You are driving and approach a yellow traffic light',
        image: 'https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=400',
        question: 'What should you do?',
        options: [
          'Speed up to get through quickly',
          'Prepare to stop safely',
          'Honk your horn',
          'Change lanes immediately'
        ],
        correct: 1,
        explanation: 'Yellow light means prepare to stop. You should slow down and prepare to stop safely unless you are too close to stop safely.',
        points: 10
      },
      {
        id: '2',
        scenario: 'A pedestrian is waiting at a crosswalk',
        image: 'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=400',
        question: 'What is your responsibility as a driver?',
        options: [
          'Continue driving if they haven\'t started crossing',
          'Yield and let them cross safely',
          'Honk to let them know you\'re coming',
          'Speed up to pass before they cross'
        ],
        correct: 1,
        explanation: 'Always yield to pedestrians at crosswalks. Their safety is your responsibility as a driver.',
        points: 15
      },
      {
        id: '3',
        scenario: 'You see a stop sign ahead',
        image: 'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=400',
        question: 'What must you do?',
        options: [
          'Slow down and proceed if clear',
          'Come to a complete stop',
          'Stop only if other cars are present',
          'Yield to traffic and continue'
        ],
        correct: 1,
        explanation: 'You must come to a complete stop at every stop sign, regardless of traffic conditions.',
        points: 10
      }
    ]

    // Add country-specific questions
    if (country === 'IN') {
      baseQuestions.push({
        id: '4',
        scenario: 'You are riding a two-wheeler in India',
        question: 'What safety equipment is mandatory?',
        options: [
          'Only a helmet for the driver',
          'Helmet for both driver and passenger',
          'Reflective vest only',
          'No specific requirements'
        ],
        correct: 1,
        explanation: 'In India, helmets are mandatory for both the driver and passenger on two-wheelers.',
        points: 15
      })
    }

    if (country === 'US') {
      baseQuestions.push({
        id: '4',
        scenario: 'You approach a four-way stop in the US',
        question: 'Who has the right of way?',
        options: [
          'The largest vehicle',
          'The vehicle that arrived first',
          'Vehicles going straight always',
          'The vehicle on the right'
        ],
        correct: 1,
        explanation: 'At a four-way stop, the vehicle that arrives first has the right of way. If vehicles arrive simultaneously, the vehicle on the right goes first.',
        points: 15
      })
    }

    return baseQuestions
  }

  const questions = getGameQuestions()

  // Timer effect
  useEffect(() => {
    if (isTimerActive && timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showResult) {
      handleTimeUp()
    }
  }, [timeLeft, isTimerActive, showResult])

  const handleTimeUp = () => {
    setSelectedAnswer(null)
    setShowResult(true)
    setIsTimerActive(false)
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return
    
    setSelectedAnswer(answerIndex)
    setShowResult(true)
    setIsTimerActive(false)
    
    if (answerIndex === questions[currentQuestion].correct) {
      setScore(score + questions[currentQuestion].points)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setTimeLeft(30)
      setIsTimerActive(true)
    } else {
      setGameCompleted(true)
      onComplete(score)
    }
  }

  const handleRestart = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setGameCompleted(false)
    setTimeLeft(30)
    setIsTimerActive(true)
  }

  if (gameCompleted) {
    const finalScore = Math.round((score / (questions.length * 15)) * 100)
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="text-6xl mb-6"
        >
          {finalScore >= 80 ? '🏆' : finalScore >= 60 ? '🌟' : '👍'}
        </motion.div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Game Complete!</h2>
        <p className="text-lg text-gray-600 mb-6">
          You scored {score} points ({finalScore}%)
        </p>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleRestart}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Play Again</span>
          </button>
          
          <button
            onClick={() => onComplete(finalScore)}
            className="flex items-center space-x-2 px-6 py-3 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
          >
            <span>Continue</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    )
  }

  const currentQ = questions[currentQuestion]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Game Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium text-gray-600">
            Question {currentQuestion + 1} of {questions.length}
          </div>
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">{score} points</span>
          </div>
        </div>
        
        {/* Timer */}
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
          timeLeft <= 10 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
        }`}>
          <div className="text-sm font-medium">{timeLeft}s</div>
          <div className={`w-2 h-2 rounded-full ${timeLeft <= 10 ? 'bg-red-500' : 'bg-blue-500'} ${
            isTimerActive ? 'animate-pulse' : ''
          }`}></div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{ 
            width: `${((currentQuestion + 1) / questions.length) * 100}%`,
            background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.secondaryColor})`
          }}
        ></div>
      </div>

      {/* Question Card */}
      <motion.div
        key={currentQuestion}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6 mb-6"
      >
        {/* Scenario */}
        <div className="mb-4">
          <div className="text-sm font-medium text-blue-600 mb-2">Scenario:</div>
          <div className="text-gray-700">{currentQ.scenario}</div>
        </div>

        {/* Image */}
        {currentQ.image && (
          <div className="mb-6">
            <img
              src={currentQ.image}
              alt="Traffic scenario"
              className="w-full h-48 object-cover rounded-xl"
            />
          </div>
        )}

        {/* Question */}
        <h3 className="text-xl font-semibold text-gray-900 mb-6">{currentQ.question}</h3>

        {/* Options */}
        <div className="space-y-3">
          {currentQ.options.map((option, index) => (
            <motion.button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={showResult}
              whileHover={!showResult ? { scale: 1.02 } : {}}
              whileTap={!showResult ? { scale: 0.98 } : {}}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                showResult
                  ? index === currentQ.correct
                    ? 'border-green-500 bg-green-50 text-green-900'
                    : index === selectedAnswer && index !== currentQ.correct
                    ? 'border-red-500 bg-red-50 text-red-900'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                  : selectedAnswer === index
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  showResult
                    ? index === currentQ.correct
                      ? 'border-green-500 bg-green-500'
                      : index === selectedAnswer && index !== currentQ.correct
                      ? 'border-red-500 bg-red-500'
                      : 'border-gray-300'
                    : selectedAnswer === index
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {showResult && index === currentQ.correct && (
                    <CheckCircle className="h-4 w-4 text-white" />
                  )}
                  {showResult && index === selectedAnswer && index !== currentQ.correct && (
                    <XCircle className="h-4 w-4 text-white" />
                  )}
                  {!showResult && selectedAnswer === index && (
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
                selectedAnswer === currentQ.correct
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex items-start space-x-2">
                {selectedAnswer === currentQ.correct ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                )}
                <div>
                  <div className={`font-medium mb-1 ${
                    selectedAnswer === currentQ.correct ? 'text-green-800' : 'text-blue-800'
                  }`}>
                    {selectedAnswer === currentQ.correct ? 'Correct!' : 'Learn More:'}
                  </div>
                  <div className={`text-sm ${
                    selectedAnswer === currentQ.correct ? 'text-green-700' : 'text-blue-700'
                  }`}>
                    {currentQ.explanation}
                  </div>
                  {selectedAnswer === currentQ.correct && (
                    <div className="flex items-center space-x-1 mt-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-green-700">
                        +{currentQ.points} points
                      </span>
                    </div>
                  )}
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
            onClick={handleNextQuestion}
            className="text-white px-8 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto"
            style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
          >
            <span>
              {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Game'}
            </span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </motion.div>
      )}
    </div>
  )
}

export default InteractiveGame