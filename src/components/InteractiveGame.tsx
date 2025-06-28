import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Trophy, Star, RotateCcw, ArrowRight, Clock, Target, Zap } from 'lucide-react'

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
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [showExplanation, setShowExplanation] = useState(false)

  // Generate enhanced game questions based on lesson content and country
  const getGameQuestions = (): GameQuestion[] => {
    const baseQuestions: GameQuestion[] = [
      {
        id: '1',
        scenario: 'You are approaching a traffic intersection with a yellow light',
        image: 'https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=400',
        question: 'What is the safest action to take?',
        options: [
          'Speed up to get through quickly',
          'Prepare to stop safely if possible',
          'Honk your horn to warn others',
          'Change lanes immediately'
        ],
        correct: 1,
        explanation: 'Yellow light means prepare to stop. You should slow down and prepare to stop safely unless you are too close to stop safely.',
        points: 15
      },
      {
        id: '2',
        scenario: 'A pedestrian is waiting at a marked crosswalk',
        image: 'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=400',
        question: 'What is your responsibility as a driver?',
        options: [
          'Continue driving if they haven\'t started crossing',
          'Always yield and let them cross safely',
          'Honk to let them know you\'re coming',
          'Speed up to pass before they cross'
        ],
        correct: 1,
        explanation: 'Always yield to pedestrians at crosswalks. Their safety is your responsibility as a driver.',
        points: 20
      },
      {
        id: '3',
        scenario: 'You see a stop sign at an intersection',
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
        points: 15
      },
      {
        id: '4',
        scenario: 'You are driving in heavy rain conditions',
        image: 'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=400',
        question: 'How should you adjust your driving?',
        options: [
          'Drive at the same speed as usual',
          'Reduce speed and increase following distance',
          'Use high beam headlights',
          'Drive closer to other vehicles for visibility'
        ],
        correct: 1,
        explanation: 'In wet conditions, reduce speed and increase following distance to maintain control and safety.',
        points: 18
      },
      {
        id: '5',
        scenario: 'An emergency vehicle with sirens is approaching from behind',
        image: 'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=400',
        question: 'What should you do?',
        options: [
          'Speed up to get out of the way',
          'Pull over safely to the right and stop',
          'Continue driving normally',
          'Change lanes to the left'
        ],
        correct: 1,
        explanation: 'Always pull over safely to the right and stop to allow emergency vehicles to pass.',
        points: 20
      }
    ]

    // Add country-specific questions
    if (country === 'IN') {
      baseQuestions.push({
        id: '6',
        scenario: 'You are riding a two-wheeler in India',
        image: 'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=400',
        question: 'What safety equipment is mandatory?',
        options: [
          'Only a helmet for the driver',
          'Helmet for both driver and passenger',
          'Reflective vest only',
          'No specific requirements'
        ],
        correct: 1,
        explanation: 'In India, helmets are mandatory for both the driver and passenger on two-wheelers.',
        points: 25
      })
    }

    if (country === 'US') {
      baseQuestions.push({
        id: '6',
        scenario: 'You approach a four-way stop intersection in the US',
        image: 'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=400',
        question: 'Who has the right of way?',
        options: [
          'The largest vehicle',
          'The vehicle that arrived first',
          'Vehicles going straight always',
          'The vehicle on the right'
        ],
        correct: 1,
        explanation: 'At a four-way stop, the vehicle that arrives first has the right of way. If vehicles arrive simultaneously, the vehicle on the right goes first.',
        points: 25
      })
    }

    if (country === 'GB') {
      baseQuestions.push({
        id: '6',
        scenario: 'You are approaching a roundabout in the UK',
        image: 'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=400',
        question: 'What is the correct procedure?',
        options: [
          'Enter immediately if no cars are visible',
          'Give way to traffic from the right',
          'Stop and wait for all traffic to clear',
          'Sound horn before entering'
        ],
        correct: 1,
        explanation: 'In UK roundabouts, you must give way to traffic approaching from the right.',
        points: 25
      })
    }

    return baseQuestions.slice(0, 5) // Return 5 questions for optimal game length
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
    setShowExplanation(true)
    setIsTimerActive(false)
    setStreak(0) // Reset streak on timeout
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return
    
    setSelectedAnswer(answerIndex)
    setShowResult(true)
    setShowExplanation(true)
    setIsTimerActive(false)
    
    if (answerIndex === questions[currentQuestion].correct) {
      const points = questions[currentQuestion].points + (timeLeft * 2) // Bonus for speed
      setScore(score + points)
      setStreak(streak + 1)
      setMaxStreak(Math.max(maxStreak, streak + 1))
    } else {
      setStreak(0)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setShowExplanation(false)
      setTimeLeft(30)
      setIsTimerActive(true)
    } else {
      setGameCompleted(true)
      const finalScore = Math.min(Math.round((score / (questions.length * 25)) * 100), 100)
      onComplete(finalScore)
    }
  }

  const handleRestart = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setShowExplanation(false)
    setScore(0)
    setGameCompleted(false)
    setTimeLeft(30)
    setIsTimerActive(true)
    setStreak(0)
    setMaxStreak(0)
  }

  if (gameCompleted) {
    const finalScore = Math.min(Math.round((score / (questions.length * 25)) * 100), 100)
    
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
          className="text-8xl mb-6"
        >
          {finalScore >= 80 ? '🏆' : finalScore >= 60 ? '🌟' : '👍'}
        </motion.div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Game Complete!</h2>
        <p className="text-lg text-gray-600 mb-6">
          You scored {score} points ({finalScore}%)
        </p>

        {/* Game Statistics */}
        <div className="grid grid-cols-2 gap-4 mb-8 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl border border-blue-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{finalScore}%</div>
            <div className="text-sm text-gray-600">Final Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">{maxStreak}</div>
            <div className="text-sm text-gray-600">Best Streak</div>
          </div>
        </div>
        
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
    <div className="max-w-3xl mx-auto">
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
          {streak > 0 && (
            <div className="flex items-center space-x-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
              <Zap className="h-3 w-3" />
              <span className="text-xs font-bold">{streak} streak!</span>
            </div>
          )}
        </div>
        
        {/* Enhanced Timer */}
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
          timeLeft <= 10 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-100 text-blue-700'
        }`}>
          <Clock className="h-4 w-4" />
          <div className="text-sm font-bold">{timeLeft}s</div>
        </div>
      </div>

      {/* Enhanced Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
        <motion.div
          className="h-3 rounded-full transition-all duration-300"
          style={{ 
            width: `${((currentQuestion + 1) / questions.length) * 100}%`,
            background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.secondaryColor})`
          }}
          initial={{ width: 0 }}
          animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <motion.div
        key={currentQuestion}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-3xl shadow-xl p-8 mb-6 border border-gray-100"
      >
        {/* Scenario */}
        <div className="mb-6">
          <div className="text-sm font-bold text-blue-600 mb-2 flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Scenario:</span>
          </div>
          <div className="text-gray-700 font-medium text-lg">{currentQ.scenario}</div>
        </div>

        {/* Image */}
        {currentQ.image && (
          <div className="mb-6">
            <motion.img
              src={currentQ.image}
              alt="Traffic scenario"
              className="w-full h-56 object-cover rounded-2xl shadow-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            />
          </div>
        )}

        {/* Question */}
        <h3 className="text-2xl font-bold text-gray-900 mb-6">{currentQ.question}</h3>

        {/* Options */}
        <div className="space-y-4">
          {currentQ.options.map((option, index) => (
            <motion.button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={showResult}
              whileHover={!showResult ? { scale: 1.02, x: 4 } : {}}
              whileTap={!showResult ? { scale: 0.98 } : {}}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                showResult
                  ? index === currentQ.correct
                    ? 'border-green-500 bg-green-50 text-green-900 shadow-lg'
                    : index === selectedAnswer && index !== currentQ.correct
                    ? 'border-red-500 bg-red-50 text-red-900'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                  : selectedAnswer === index
                  ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
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
                    <CheckCircle className="h-5 w-5 text-white" />
                  )}
                  {showResult && index === selectedAnswer && index !== currentQ.correct && (
                    <XCircle className="h-5 w-5 text-white" />
                  )}
                  {!showResult && selectedAnswer === index && (
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  )}
                  {!showResult && selectedAnswer !== index && (
                    <span className="text-sm font-bold text-gray-500">{String.fromCharCode(65 + index)}</span>
                  )}
                </div>
                <span className="font-semibold text-lg">{option}</span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Enhanced Explanation */}
        <AnimatePresence>
          {showExplanation && showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mt-6 p-6 rounded-2xl border-2 ${
                selectedAnswer === currentQ.correct
                  ? 'bg-green-50 border-green-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                {selectedAnswer === currentQ.correct ? (
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                ) : (
                  <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                )}
                <div className="flex-1">
                  <div className={`font-bold text-lg mb-2 ${
                    selectedAnswer === currentQ.correct ? 'text-green-800' : 'text-blue-800'
                  }`}>
                    {selectedAnswer === currentQ.correct ? 'Excellent!' : 'Learn More:'}
                  </div>
                  <div className={`text-base leading-relaxed ${
                    selectedAnswer === currentQ.correct ? 'text-green-700' : 'text-blue-700'
                  }`}>
                    {currentQ.explanation}
                  </div>
                  {selectedAnswer === currentQ.correct && (
                    <div className="flex items-center space-x-2 mt-3">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm font-bold text-green-700">
                        +{currentQ.points + (timeLeft * 2)} points (including speed bonus!)
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
            className="text-white px-8 py-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-3 mx-auto text-lg font-bold"
            style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
          >
            <span>
              {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Game'}
            </span>
            <ArrowRight className="h-6 w-6" />
          </button>
        </motion.div>
      )}
    </div>
  )
}

export default InteractiveGame