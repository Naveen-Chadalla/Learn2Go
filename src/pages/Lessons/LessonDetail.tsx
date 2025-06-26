import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { useData } from '../../contexts/DataContext'
import { useActivityTracking } from '../../hooks/useActivityTracking'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  PlayCircle,
  Brain,
  Clock,
  Target,
  Trophy,
  Star,
  Volume2,
  VolumeX,
  Gamepad2,
  Sparkles
} from 'lucide-react'
import Confetti from 'react-confetti'

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct_answer: number
  explanation: string
}

const LessonDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { data, updateUserProgress } = useData()
  const { trackLessonStart, trackLessonComplete, trackQuizAttempt, trackQuizComplete } = useActivityTracking()
  
  const [showQuiz, setShowQuiz] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [lessonStartTime, setLessonStartTime] = useState<number>(Date.now())
  const [quizStartTime, setQuizStartTime] = useState<number>(0)
  const [showGame, setShowGame] = useState(false)
  const [topicCompleted, setTopicCompleted] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [isReading, setIsReading] = useState(false)

  const lesson = data.lessons.find(l => l.id === id)
  const progress = data.userProgress.find(p => p.lesson_id === id)
  const { countryTheme } = data

  // Get lesson images based on content
  const getLessonImages = () => {
    const baseImages = [
      'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=800'
    ]
    
    // Add more specific images based on lesson content
    if (lesson?.title.toLowerCase().includes('traffic signals')) {
      return [
        'https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=800',
        ...baseImages
      ]
    }
    
    if (lesson?.title.toLowerCase().includes('pedestrian')) {
      return [
        'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=800',
        ...baseImages
      ]
    }
    
    return baseImages
  }

  const lessonImages = getLessonImages()

  useEffect(() => {
    if (!lesson) {
      navigate('/dashboard')
      return
    }

    // Track lesson start
    if (user?.user_metadata?.username) {
      setLessonStartTime(Date.now())
      trackLessonStart(lesson.id, lesson.title)
    }
  }, [lesson, navigate, user, trackLessonStart])

  // Text-to-speech functionality
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = data.userProfile?.language === 'hi' ? 'hi-IN' : 
                      data.userProfile?.language === 'te' ? 'te-IN' : 'en-US'
      utterance.rate = 0.8
      utterance.pitch = 1
      
      utterance.onstart = () => setIsReading(true)
      utterance.onend = () => setIsReading(false)
      
      speechSynthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
      setIsReading(false)
    }
  }

  const handleStartQuiz = () => {
    setShowQuiz(true)
    setCurrentQuestion(0)
    setSelectedAnswers([])
    setQuizCompleted(false)
    setQuizStartTime(Date.now())

    // Track quiz attempt
    if (user?.user_metadata?.username && lesson) {
      trackQuizAttempt(lesson.id, {
        totalQuestions: lesson.quiz_questions.length,
        startedAt: new Date().toISOString()
      })
    }
  }

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = answerIndex
    setSelectedAnswers(newAnswers)
  }

  const handleNextQuestion = () => {
    if (lesson && currentQuestion < lesson.quiz_questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      handleQuizSubmit()
    }
  }

  const handleQuizSubmit = async () => {
    if (!lesson || !user) return

    let correct = 0
    lesson.quiz_questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correct++
      }
    })

    const score = Math.round((correct / lesson.quiz_questions.length) * 100)
    const quizTimeSpent = Math.floor((Date.now() - quizStartTime) / 1000)
    
    setQuizScore(score)
    setQuizCompleted(true)

    // Track quiz completion
    trackQuizComplete(lesson.id, score, quizTimeSpent, {
      totalQuestions: lesson.quiz_questions.length,
      correctAnswers: correct,
      completedAt: new Date().toISOString(),
      answers: selectedAnswers
    })

    // Update progress using the data context
    await updateUserProgress(lesson.id, score, score >= 70)

    // Track lesson completion if quiz passed
    if (score >= 70) {
      const totalTimeSpent = Math.floor((Date.now() - lessonStartTime) / 1000)
      trackLessonComplete(lesson.id, lesson.title, totalTimeSpent)
    }
  }

  const handleRetakeQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswers([])
    setQuizCompleted(false)
    setQuizScore(0)
    setQuizStartTime(Date.now())

    // Track new quiz attempt
    if (user?.user_metadata?.username && lesson) {
      trackQuizAttempt(lesson.id, {
        totalQuestions: lesson.quiz_questions.length,
        retake: true,
        startedAt: new Date().toISOString()
      })
    }
  }

  const handleStartGame = () => {
    setShowGame(true)
  }

  const handleGameComplete = () => {
    setShowGame(false)
    setTopicCompleted(true)
  }

  const handleContinueToNext = () => {
    // Find next lesson
    const currentIndex = data.lessons.findIndex(l => l.id === id)
    if (currentIndex < data.lessons.length - 1) {
      const nextLesson = data.lessons[currentIndex + 1]
      navigate(`/lessons/${nextLesson.id}`)
    } else {
      navigate('/dashboard')
    }
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Lesson not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${countryTheme.primaryColor}10 0%, ${countryTheme.secondaryColor}10 100%)`
      }}
    >
      {/* Confetti for topic completion */}
      {topicCompleted && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>{t('common.back')}</span>
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div 
                className="rounded-lg p-2"
                style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
              >
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-600">
                {t('lessons.level')} {lesson.level}
              </span>
            </div>

            {/* Voice Control */}
            <button
              onClick={() => {
                if (isReading) {
                  stopSpeaking()
                } else {
                  setVoiceEnabled(!voiceEnabled)
                  if (!voiceEnabled) {
                    speakText(lesson.title + '. ' + lesson.description)
                  }
                }
              }}
              className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              {isReading ? (
                <VolumeX className="h-4 w-4 text-red-500" />
              ) : (
                <Volume2 className="h-4 w-4 text-blue-500" />
              )}
              <span className="text-sm">{isReading ? 'Stop' : 'Listen'}</span>
            </button>
          </div>
        </motion.div>

        {/* Topic Completed Screen */}
        <AnimatePresence>
          {topicCompleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="text-6xl mb-4"
                >
                  🎉
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Topic Complete!</h2>
                <p className="text-gray-600 mb-6">
                  Congratulations! You've successfully completed the lesson, quiz, and interactive game for this topic.
                </p>
                <button
                  onClick={handleContinueToNext}
                  className="w-full text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                  style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                >
                  <span>Continue to Next Topic</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!showQuiz && !showGame ? (
          <>
            {/* Lesson Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
                {progress?.completed && (
                  <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">{t('lessons.completed')}</span>
                  </div>
                )}
              </div>

              <p className="text-gray-600 mb-8 text-lg">{lesson.description}</p>

              {/* Lesson Images */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {lessonImages.slice(0, 2).map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="relative rounded-xl overflow-hidden shadow-lg"
                  >
                    <img
                      src={image}
                      alt={`Traffic safety illustration ${index + 1}`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </motion.div>
                ))}
              </div>

              <div className="prose max-w-none">
                <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {lesson.content}
                </div>
              </div>

              {/* Additional Image */}
              {lessonImages[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 rounded-xl overflow-hidden shadow-lg"
                >
                  <img
                    src={lessonImages[2]}
                    alt="Traffic safety concept"
                    className="w-full h-64 object-cover"
                  />
                </motion.div>
              )}

              {/* Lesson Stats */}
              <div className="mt-8 grid grid-cols-3 gap-6 p-6 bg-gray-50 rounded-xl">
                <div className="text-center">
                  <div 
                    className="rounded-full p-3 w-fit mx-auto mb-2"
                    style={{ background: `${countryTheme.primaryColor}20` }}
                  >
                    <Clock className="h-6 w-6" style={{ color: countryTheme.primaryColor }} />
                  </div>
                  <div className="text-sm text-gray-600">Duration</div>
                  <div className="font-semibold text-gray-900">15 min</div>
                </div>
                <div className="text-center">
                  <div 
                    className="rounded-full p-3 w-fit mx-auto mb-2"
                    style={{ background: `${countryTheme.secondaryColor}20` }}
                  >
                    <Brain className="h-6 w-6" style={{ color: countryTheme.secondaryColor }} />
                  </div>
                  <div className="text-sm text-gray-600">Difficulty</div>
                  <div className="font-semibold text-gray-900">Level {lesson.level}</div>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-full p-3 w-fit mx-auto mb-2">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-sm text-gray-600">Questions</div>
                  <div className="font-semibold text-gray-900">{lesson.quiz_questions.length}</div>
                </div>
              </div>
            </motion.div>

            {/* Ready to Test Prompt */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 border border-blue-200 mb-8"
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-4xl mb-4"
                >
                  🧠
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to test your knowledge?</h2>
                <p className="text-gray-600 mb-6">
                  Great job completing the lesson! Now let's see how well you understood the concepts with our interactive quiz.
                </p>

                {progress?.completed && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-center space-x-2">
                      <Trophy className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">
                        Previous Score: {progress.score}%
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleStartQuiz}
                  className="text-white px-8 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 font-semibold mx-auto"
                  style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                >
                  <PlayCircle className="h-5 w-5" />
                  <span>{progress?.completed ? t('quiz.retake') : 'Start Safety Quiz'}</span>
                </button>
              </div>
            </motion.div>
          </>
        ) : showQuiz && !showGame ? (
          /* Quiz Interface */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
          >
            {!quizCompleted ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t('quiz.question')} {currentQuestion + 1} of {lesson.quiz_questions.length}
                  </h2>
                  <div className="bg-gray-200 rounded-full h-3 w-32">
                    <div
                      className="h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${((currentQuestion + 1) / lesson.quiz_questions.length) * 100}%`,
                        background: `linear-gradient(90deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})`
                      }}
                    ></div>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    {lesson.quiz_questions[currentQuestion].question}
                  </h3>

                  <div className="space-y-4">
                    {lesson.quiz_questions[currentQuestion].options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                          selectedAnswers[currentQuestion] === index
                            ? 'text-blue-900'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        style={{
                          borderColor: selectedAnswers[currentQuestion] === index ? countryTheme.primaryColor : undefined,
                          backgroundColor: selectedAnswers[currentQuestion] === index ? `${countryTheme.primaryColor}10` : undefined
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              selectedAnswers[currentQuestion] === index
                                ? 'text-white'
                                : 'border-gray-300'
                            }`}
                            style={{
                              borderColor: selectedAnswers[currentQuestion] === index ? countryTheme.primaryColor : undefined,
                              backgroundColor: selectedAnswers[currentQuestion] === index ? countryTheme.primaryColor : undefined
                            }}
                          >
                            {selectedAnswers[currentQuestion] === index && (
                              <CheckCircle className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <span className="font-medium">{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setShowQuiz(false)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Back to Lesson
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={selectedAnswers[currentQuestion] === undefined}
                    className="text-white px-8 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                  >
                    <span>
                      {currentQuestion < lesson.quiz_questions.length - 1 ? t('quiz.next') : t('quiz.finish')}
                    </span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              /* Quiz Results */
              <div className="text-center">
                <div className="mb-8">
                  <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
                    quizScore >= 70 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <span className="text-4xl">
                      {quizScore >= 70 ? '🎉' : '😅'}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    {t('quiz.score')}: {quizScore}%
                  </h2>
                  <p className={`text-lg ${quizScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                    {quizScore >= 70 ? t('quiz.passed') : t('quiz.failed')}
                  </p>
                </div>

                {quizScore >= 70 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6"
                  >
                    <div className="flex items-center justify-center space-x-2 mb-4">
                      <Sparkles className="h-6 w-6 text-blue-600" />
                      <h3 className="text-xl font-bold text-gray-900">Ready for Interactive Game?</h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Excellent work! Now let's reinforce your learning with an interactive traffic safety game.
                    </p>
                    <button
                      onClick={handleStartGame}
                      className="text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto"
                      style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                    >
                      <Gamepad2 className="h-5 w-5" />
                      <span>Start Interactive Game</span>
                    </button>
                  </motion.div>
                ) : (
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setShowQuiz(false)}
                      className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Review Lesson
                    </button>
                    <button
                      onClick={handleRetakeQuiz}
                      className="text-white px-8 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                      style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                    >
                      {t('quiz.retake')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          /* Interactive Game */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
          >
            <div className="text-center">
              <div className="text-6xl mb-6">🎮</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Interactive Traffic Safety Game</h2>
              <p className="text-gray-600 mb-8">
                Apply what you've learned in this interactive scenario-based game!
              </p>
              
              {/* Simple game simulation */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-8 mb-6">
                <h3 className="text-lg font-semibold mb-4">Scenario: You're approaching a traffic light</h3>
                <div className="text-4xl mb-4">🚦</div>
                <p className="text-gray-700 mb-6">The light just turned yellow. What should you do?</p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setTimeout(() => {
                        alert('Correct! You should prepare to stop safely.')
                        handleGameComplete()
                      }, 1000)
                    }}
                    className="w-full p-3 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                  >
                    Prepare to stop safely
                  </button>
                  <button
                    onClick={() => {
                      alert('Incorrect. Yellow means prepare to stop, not speed up.')
                    }}
                    className="w-full p-3 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                  >
                    Speed up to get through
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default LessonDetail