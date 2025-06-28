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
  Sparkles,
  Award,
  Zap
} from 'lucide-react'
import Confetti from 'react-confetti'
import DynamicTagline from '../../components/DynamicTagline'
import VoiceoverPlayer from '../../components/VoiceoverPlayer'
import InteractiveGame from '../../components/InteractiveGame'

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
  
  const [currentStep, setCurrentStep] = useState<'lesson' | 'quiz' | 'game' | 'complete'>('lesson')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [gameScore, setGameScore] = useState(0)
  const [lessonStartTime, setLessonStartTime] = useState<number>(Date.now())
  const [quizStartTime, setQuizStartTime] = useState<number>(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [flowProgress, setFlowProgress] = useState(0)

  const lesson = data.lessons.find(l => l.id === id)
  const progress = data.userProgress.find(p => p.lesson_id === id)
  const { countryTheme } = data

  // Calculate flow progress
  useEffect(() => {
    switch (currentStep) {
      case 'lesson':
        setFlowProgress(25)
        break
      case 'quiz':
        setFlowProgress(50)
        break
      case 'game':
        setFlowProgress(75)
        break
      case 'complete':
        setFlowProgress(100)
        break
    }
  }, [currentStep])

  // Enhanced lesson images with better variety
  const getLessonImages = () => {
    const baseImages = [
      'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=800'
    ]
    
    // Add topic-specific images
    if (lesson?.title.toLowerCase().includes('traffic signals') || lesson?.title.toLowerCase().includes('traffic light')) {
      return [
        'https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/3593922/pexels-photo-3593922.jpeg?auto=compress&cs=tinysrgb&w=800',
        ...baseImages
      ]
    }
    
    if (lesson?.title.toLowerCase().includes('pedestrian') || lesson?.title.toLowerCase().includes('crosswalk')) {
      return [
        'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=800',
        ...baseImages
      ]
    }

    if (lesson?.title.toLowerCase().includes('parking') || lesson?.title.toLowerCase().includes('vehicle')) {
      return [
        'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=800',
        ...baseImages
      ]
    }

    if (lesson?.title.toLowerCase().includes('emergency') || lesson?.title.toLowerCase().includes('safety')) {
      return [
        'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=800',
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

  const handleLessonComplete = () => {
    setCurrentStep('quiz')
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
      
      // Automatically proceed to game after a brief celebration
      setTimeout(() => {
        setCurrentStep('game')
      }, 2000)
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

  const handleGameComplete = (score: number) => {
    setGameScore(score)
    setShowCelebration(true)
    setCurrentStep('complete')
    
    // Show celebration for 3 seconds then auto-navigate to next lesson
    setTimeout(() => {
      handleContinueToNext()
    }, 3000)
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

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'lesson':
        return <BookOpen className="h-5 w-5" />
      case 'quiz':
        return <Brain className="h-5 w-5" />
      case 'game':
        return <Gamepad2 className="h-5 w-5" />
      case 'complete':
        return <Trophy className="h-5 w-5" />
      default:
        return <Target className="h-5 w-5" />
    }
  }

  const getStepTitle = (step: string) => {
    switch (step) {
      case 'lesson':
        return 'Learn'
      case 'quiz':
        return 'Quiz'
      case 'game':
        return 'Practice'
      case 'complete':
        return 'Complete'
      default:
        return 'Step'
    }
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
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
      className="min-h-screen pt-16"
      style={{
        background: `linear-gradient(135deg, ${countryTheme.primaryColor}08 0%, ${countryTheme.secondaryColor}08 100%)`
      }}
    >
      {/* Celebration Confetti */}
      {showCelebration && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={300}
          gravity={0.3}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header with Flow Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <motion.button
              onClick={() => navigate('/dashboard')}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-soft"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">{t('common.back')}</span>
            </motion.button>
            
            <div className="flex items-center space-x-4">
              <motion.div 
                className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-soft"
                whileHover={{ scale: 1.02 }}
              >
                <div 
                  className="rounded-xl p-2 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                >
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-bold text-gray-600">
                  {t('lessons.level')} {lesson.level}
                </span>
              </motion.div>
            </div>
          </div>

          {/* Learning Flow Progress */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Learning Journey</h2>
              <span className="text-sm text-gray-600">{flowProgress}% Complete</span>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-4">
              {['lesson', 'quiz', 'game', 'complete'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <motion.div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      currentStep === step
                        ? 'text-white shadow-lg'
                        : index < ['lesson', 'quiz', 'game', 'complete'].indexOf(currentStep)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                    style={{
                      background: currentStep === step 
                        ? `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})`
                        : index < ['lesson', 'quiz', 'game', 'complete'].indexOf(currentStep)
                        ? '#10B981'
                        : '#E5E7EB'
                    }}
                    whileHover={{ scale: 1.1 }}
                    animate={currentStep === step ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 2, repeat: currentStep === step ? Infinity : 0 }}
                  >
                    {index < ['lesson', 'quiz', 'game', 'complete'].indexOf(currentStep) ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      getStepIcon(step)
                    )}
                  </motion.div>
                  <div className="ml-3 text-left">
                    <div className={`text-sm font-medium ${
                      currentStep === step ? 'text-blue-600' : 
                      index < ['lesson', 'quiz', 'game', 'complete'].indexOf(currentStep) ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {getStepTitle(step)}
                    </div>
                  </div>
                  {index < 3 && (
                    <div className={`w-16 h-1 mx-4 rounded transition-all duration-300 ${
                      index < ['lesson', 'quiz', 'game', 'complete'].indexOf(currentStep) ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                className="h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${flowProgress}%`,
                  background: `linear-gradient(90deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})`
                }}
                initial={{ width: 0 }}
                animate={{ width: `${flowProgress}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Dynamic Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <DynamicTagline 
            showRefreshButton={false}
            autoRefresh={false}
            size="small"
          />
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 'lesson' && (
            <motion.div
              key="lesson"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Lesson Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-4xl font-bold text-gray-900">{lesson.title}</h1>
                  {progress?.completed && (
                    <motion.div 
                      className="flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-2xl border border-green-200"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-bold">{t('lessons.completed')}</span>
                    </motion.div>
                  )}
                </div>

                <p className="text-gray-600 mb-8 text-lg leading-relaxed">{lesson.description}</p>

                {/* Voiceover Player */}
                <motion.div 
                  className="mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <VoiceoverPlayer
                    text={`${lesson.title}. ${lesson.description}. ${lesson.content}`}
                    language={data.userProfile?.language || 'en'}
                    autoPlay={false}
                    showControls={true}
                    naturalTone={true}
                  />
                </motion.div>

                {/* Enhanced Lesson Images */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {lessonImages.slice(0, 2).map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className="relative rounded-3xl overflow-hidden shadow-xl group"
                    >
                      <img
                        src={image}
                        alt={`Traffic safety illustration ${index + 1}`}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </motion.div>
                  ))}
                </div>

                <div className="prose max-w-none">
                  <div className="text-gray-800 leading-relaxed whitespace-pre-wrap text-lg">
                    {lesson.content}
                  </div>
                </div>

                {/* Additional Image */}
                {lessonImages[2] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="mt-8 rounded-3xl overflow-hidden shadow-xl group"
                  >
                    <img
                      src={lessonImages[2]}
                      alt="Traffic safety concept"
                      className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </motion.div>
                )}

                {/* Lesson Stats */}
                <motion.div 
                  className="mt-8 grid grid-cols-3 gap-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl border border-gray-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="text-center">
                    <motion.div 
                      className="rounded-full p-3 w-fit mx-auto mb-2 shadow-lg"
                      style={{ background: `${countryTheme.primaryColor}20` }}
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Clock className="h-6 w-6" style={{ color: countryTheme.primaryColor }} />
                    </motion.div>
                    <div className="text-sm text-gray-600 font-medium">Duration</div>
                    <div className="font-bold text-gray-900">15 min</div>
                  </div>
                  <div className="text-center">
                    <motion.div 
                      className="rounded-full p-3 w-fit mx-auto mb-2 shadow-lg"
                      style={{ background: `${countryTheme.secondaryColor}20` }}
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Brain className="h-6 w-6" style={{ color: countryTheme.secondaryColor }} />
                    </motion.div>
                    <div className="text-sm text-gray-600 font-medium">Difficulty</div>
                    <div className="font-bold text-gray-900">Level {lesson.level}</div>
                  </div>
                  <div className="text-center">
                    <motion.div 
                      className="bg-green-100 rounded-full p-3 w-fit mx-auto mb-2 shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Target className="h-6 w-6 text-green-600" />
                    </motion.div>
                    <div className="text-sm text-gray-600 font-medium">Questions</div>
                    <div className="font-bold text-gray-900">{lesson.quiz_questions.length}</div>
                  </div>
                </motion.div>

                {/* Continue to Quiz Button */}
                <motion.div
                  className="mt-8 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <motion.button
                    onClick={handleLessonComplete}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-white px-8 py-3 rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center space-x-2 font-bold mx-auto text-lg"
                    style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                  >
                    <Brain className="h-5 w-5" />
                    <span>Continue to Quiz</span>
                    <ArrowRight className="h-5 w-5" />
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {currentStep === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-100"
            >
              {!quizCompleted ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">
                      {t('quiz.question')} {currentQuestion + 1} of {lesson.quiz_questions.length}
                    </h2>
                    <div className="bg-gray-200 rounded-full h-3 w-32">
                      <motion.div
                        className="h-3 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${((currentQuestion + 1) / lesson.quiz_questions.length) * 100}%`,
                          background: `linear-gradient(90deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})`
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentQuestion + 1) / lesson.quiz_questions.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      {lesson.quiz_questions[currentQuestion].question}
                    </h3>

                    <div className="space-y-4">
                      {lesson.quiz_questions[currentQuestion].options.map((option, index) => (
                        <motion.button
                          key={index}
                          onClick={() => handleAnswerSelect(index)}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                            selectedAnswers[currentQuestion] === index
                              ? 'text-blue-900 shadow-lg'
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
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <motion.button
                      onClick={() => setCurrentStep('lesson')}
                      whileHover={{ scale: 1.05, x: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors bg-gray-100 rounded-2xl font-medium"
                    >
                      Back to Lesson
                    </motion.button>
                    <motion.button
                      onClick={handleNextQuestion}
                      disabled={selectedAnswers[currentQuestion] === undefined}
                      whileHover={{ scale: 1.05, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-white px-8 py-3 rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-bold"
                      style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                    >
                      <span>
                        {currentQuestion < lesson.quiz_questions.length - 1 ? t('quiz.next') : t('quiz.finish')}
                      </span>
                      <ArrowRight className="h-5 w-5" />
                    </motion.button>
                  </div>
                </>
              ) : (
                /* Quiz Results */
                <div className="text-center">
                  <div className="mb-8">
                    <motion.div 
                      className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
                        quizScore >= 70 ? 'bg-green-100' : 'bg-red-100'
                      }`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <span className="text-4xl">
                        {quizScore >= 70 ? '🎉' : '😅'}
                      </span>
                    </motion.div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                      {t('quiz.score')}: {quizScore}%
                    </h2>
                    <p className={`text-xl ${quizScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                      {quizScore >= 70 ? t('quiz.passed') : t('quiz.failed')}
                    </p>
                  </div>

                  {quizScore >= 70 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-6 border border-green-200"
                    >
                      <div className="flex items-center justify-center space-x-2 mb-4">
                        <Sparkles className="h-6 w-6 text-blue-600" />
                        <h3 className="text-2xl font-bold text-gray-900">Proceeding to Interactive Game!</h3>
                      </div>
                      <p className="text-gray-600 mb-4 text-lg">
                        Excellent work! Get ready for an interactive game to reinforce your learning.
                      </p>
                      <div className="flex items-center justify-center space-x-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Gamepad2 className="h-6 w-6 text-blue-600" />
                        </motion.div>
                        <span className="text-blue-600 font-medium">Loading game...</span>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex justify-center space-x-4">
                      <motion.button
                        onClick={() => setCurrentStep('lesson')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors bg-gray-100 rounded-2xl font-medium"
                      >
                        Review Lesson
                      </motion.button>
                      <motion.button
                        onClick={handleRetakeQuiz}
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-white px-8 py-3 rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl font-bold"
                        style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                      >
                        {t('quiz.retake')}
                      </motion.button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {currentStep === 'game' && (
            <motion.div
              key="game"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-100"
            >
              <InteractiveGame
                lessonId={lesson.id}
                country={data.userProfile?.country || 'US'}
                language={data.userProfile?.language || 'en'}
                onComplete={handleGameComplete}
                theme={countryTheme}
              />
            </motion.div>
          )}

          {currentStep === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <motion.div 
                className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full mx-auto shadow-2xl border border-gray-100"
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="text-6xl mb-4"
                >
                  🏆
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Topic Mastered!</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Outstanding! You've successfully completed the lesson, quiz, and interactive game. 
                  You're ready for the next challenge!
                </p>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="bg-blue-100 rounded-full p-3 w-fit mx-auto mb-2">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-sm font-medium text-gray-600">Lesson</div>
                    <div className="text-green-600 font-bold">✓ Complete</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-100 rounded-full p-3 w-fit mx-auto mb-2">
                      <Brain className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="text-sm font-medium text-gray-600">Quiz</div>
                    <div className="text-green-600 font-bold">{quizScore}%</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-orange-100 rounded-full p-3 w-fit mx-auto mb-2">
                      <Gamepad2 className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="text-sm font-medium text-gray-600">Game</div>
                    <div className="text-green-600 font-bold">{gameScore}%</div>
                  </div>
                </div>

                <motion.div
                  className="flex items-center justify-center space-x-2 text-blue-600 mb-4"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="h-5 w-5" />
                  <span className="font-medium">Auto-navigating to next lesson...</span>
                </motion.div>

                <motion.button
                  onClick={handleContinueToNext}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full text-white px-6 py-3 rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-2 font-bold"
                  style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                >
                  <span>Continue Learning Journey</span>
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default LessonDetail