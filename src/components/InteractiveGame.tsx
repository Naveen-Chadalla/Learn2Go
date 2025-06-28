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
  const [gameStarted, setGameStarted] = useState(false)

  // Generate enhanced game questions based on lesson content and country
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
      },
      {
        id: '4',
        scenario: 'You encounter an emergency vehicle with sirens',
        image: 'https://images.pexels.com/photos/1738986/pexels-photo-1738986.jpeg?auto=compress&cs=tinysrgb&w=400',
        question: 'What should you do immediately?',
        options: [
          'Continue at the same speed',
          'Pull over to the right and stop',
          'Speed up to get out of the way',
          'Follow the emergency vehicle'
        ],
        correct: 1,
        explanation: 'Always pull over to the right side of the road and stop when emergency vehicles approach with sirens.',
        points: 20
      },
      {
        id: '5',
        scenario: 'You are approaching a school zone during school hours',
        image: 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=400',
        question: 'What is the most important thing to do?',
        options: [
          'Maintain normal speed',
          'Reduce speed and watch for children',
          'Honk to alert children',
          'Drive faster to clear the area quickly'
        ],
        correct: 1,
        explanation: 'School zones require reduced speed and extra vigilance for children who may unexpectedly enter the roadway.',
        points: 15
      }
    ]

    // Add country-specific questions
    if (country === 'IN') {
      baseQuestions.push({
        id: '6',
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

      baseQuestions.push({
        id: '7',
        scenario: 'You encounter a cow on the road in India',
        question: 'What is the safest approach?',
        options: [
          'Honk loudly to move it',
          'Drive around it carefully',
          'Wait patiently and drive slowly around',
          'Get out and push it away'
        ],
        correct: 2,
        explanation: 'In India, animals on roads are common. Wait patiently and drive slowly around them to avoid accidents.',
        points: 10
      })
    }

    if (country === 'US') {
      baseQuestions.push({
        id: '6',
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

      baseQuestions.push({
        id: '7',
        scenario: 'You see a school bus with flashing red lights',
        question: 'What must you do?',
        options: [
          'Slow down and proceed',
          'Stop completely until lights stop flashing',
          'Change lanes and continue',
          'Honk and proceed carefully'
        ],
        correct: 1,
        explanation: 'When a school bus has flashing red lights, all traffic must stop completely until the lights stop flashing.',
        points: 20
      })
    }

    return baseQuestions
  }

  const questions = getGameQuestions()

  // Timer effect
  useEffect(() => {
    if (isTimerActive && timeLeft > 0 && !showResult && gameStarted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showResult && gameStarted) {
      handleTimeUp()
    }
  }, [timeLeft, isTimerActive, showResult, gameStarted])

  const handleTimeUp = () => {
    setSelectedAnswer(null)
    setShowResult(true)
    setIsTimerActive(false)
  }

  const handleGameStart = () => {
    setGameStarted(true)
    setTimeLeft(30)
    setIsTimerActive(true)
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
      const finalScore = Math.round((score / (questions.reduce((sum, q) => sum + q.points, 0))) * 100)
      onComplete(finalScore)
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
    setGameStarted(false)
  }

  if (!gameStarted) {
    return (
      <div className="text-center p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="text-6xl mb-6"
        >
          🎮
        </motion.div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Interactive Safety Game</h2>
        <p className="text-lg text-gray-600 mb-6">
          Test your traffic safety knowledge with real-world scenarios! You'll have 30 seconds per question.
        </p>
        
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 mb-6 border border-blue-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Game Rules:</h3>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>30 seconds per question</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <span>{questions.length} challenging scenarios</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <span>Points for correct answers</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <span>Real-world situations</span>
            </div>
          </div>
        </div>
        
        <motion.button
          onClick={handleGameStart}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="text-white px-8 py-4 rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center space-x-2 mx-auto text-lg font-bold"
          style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
        >
          <span>Start Safety Game</span>
          <ArrowRight className="h-6 w-6" />
        </motion.button>
      </div>
    )
  }

  if (gameCompleted) {
    const finalScore = Math.round((score / (questions.reduce((sum, q) => sum + q.points, 0))) * 100)
    
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
        
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Game Complete!</h2>
        <p className="text-xl text-gray-600 mb-6">
          You scored {score} points ({finalScore}%)
        </p>
        
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-6 border border-green-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Performance:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{score}</div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{finalScore}%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
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
            <span>Continue Learning</span>
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
        
        {/* Enhanced Timer */}
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
          timeLeft <= 10 ? 'bg-red-100 text-red-700' : timeLeft <= 20 ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
        }`}>
          <Clock className="h-4 w-4" />
          <div className="text-sm font-bold">{timeLeft}s</div>
          <div className={`w-2 h-2 rounded-full ${timeLeft <= 10 ? 'bg-red-500' : timeLeft <= 20 ? 'bg-yellow-500' : 'bg-blue-500'} ${
            isTimerActive ? 'animate-pulse' : ''
          }`}></div>
        </div>
      </div>

      {/* Enhanced Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-6 shadow-inner">
        <div
          className="h-3 rounded-full transition-all duration-300 shadow-sm"
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
          <div className="text-gray-700 font-medium">{currentQ.scenario}</div>
        </div>

        {/* Image */}
        {currentQ.image && (
          <div className="mb-6">
            <img
              src={currentQ.image}
              alt="Traffic scenario"
              className="w-full h-48 object-cover rounded-xl shadow-md"
              loading="lazy"
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
                    {selectedAnswer === currentQ.correct ? 'Excellent!' : 'Learn More:'}
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