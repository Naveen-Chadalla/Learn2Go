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
  Zap,
  ChevronRight,
  RotateCcw,
  Home
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

type FlowStep = 'lesson' | 'quiz' | 'game' | 'complete'

const LessonDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { data, updateUserProgress } = useData()
  const { trackLessonStart, trackLessonComplete, trackQuizAttempt, trackQuizComplete, trackGamePlay } = useActivityTracking()
  
  // Flow state management
  const [currentStep, setCurrentStep] = useState<FlowStep>('lesson')
  const [stepProgress, setStepProgress] = useState({
    lesson: false,
    quiz: false,
    game: false,
    complete: false
  })
  
  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [showQuizResults, setShowQuizResults] = useState(false)
  
  // Game state
  const [gameScore, setGameScore] = useState(0)
  const [showGameResults, setShowGameResults] = useState(false)
  
  // Timing
  const [lessonStartTime, setLessonStartTime] = useState<number>(Date.now())
  const [quizStartTime, setQuizStartTime] = useState<number>(0)
  const [gameStartTime, setGameStartTime] = useState<number>(0)
  
  // UI state
  const [showCelebration, setShowCelebration] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const lesson = data.lessons.find(l => l.id === id)
  const progress = data.userProgress.find(p => p.lesson_id === id)
  const { countryTheme } = data

  // Enhanced lesson images with more variety and accuracy
  const getLessonImages = () => {
    const baseImages = [
      'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=800'
    ]
    
    // Topic-specific images for better relevance
    if (lesson?.title.toLowerCase().includes('traffic signals') || lesson?.title.toLowerCase().includes('traffic light')) {
      return [
        'https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=800', // Traffic lights
        'https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=800', // Traffic intersection
        'https://images.pexels.com/photos/378570/pexels-photo-378570.jpeg?auto=compress&cs=tinysrgb&w=800', // City traffic
        ...baseImages.slice(0, 2)
      ]
    }
    
    if (lesson?.title.toLowerCase().includes('pedestrian') || lesson?.title.toLowerCase().includes('crosswalk')) {
      return [
        'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=800', // Pedestrian crossing
        'https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=800', // Traffic signals
        'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=800', // Crosswalk
        ...baseImages.slice(0, 2)
      ]
    }
    
    if (lesson?.title.toLowerCase().includes('parking') || lesson?.title.toLowerCase().includes('park')) {
      return [
        'https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg?auto=compress&cs=tinysrgb&w=800', // Parking lot
        'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=800', // Cars parked
        'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=800', // Street parking
        ...baseImages.slice(0, 2)
      ]
    }
    
    if (lesson?.title.toLowerCase().includes('speed') || lesson?.title.toLowerCase().includes('limit')) {
      return [
        'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=800', // Speed limit sign
        'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=800', // Highway
        'https://images.pexels.com/photos/378570/pexels-photo-378570.jpeg?auto=compress&cs=tinysrgb&w=800', // City driving
        ...baseImages.slice(0, 2)
      ]
    }
    
    if (lesson?.title.toLowerCase().includes('emergency') || lesson?.title.toLowerCase().includes('accident')) {
      return [
        'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=800', // Emergency scene
        'https://images.pexels.com/photos/378570/pexels-photo-378570.jpeg?auto=compress&cs=tinysrgb&w=800', // Traffic management
        'https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=800', // Traffic control
        ...baseImages.slice(0, 2)
      ]
    }
    
    if (lesson?.title.toLowerCase().includes('introduction') || lesson?.title.toLowerCase().includes('intro')) {
      return [
        'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=800', // Road
        'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=800', // Pedestrian crossing
        'https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=800', // Traffic signals
        'https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=800', // City traffic
        'https://images.pexels.com/photos/378570/pexels-photo-378570.jpeg?auto=compress&cs=tinysrgb&w=800' // Urban traffic
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

    // Check if lesson was already completed to determine starting step
    if (progress?.completed) {
      setStepProgress(prev => ({ ...prev, lesson: true, quiz: true }))
    }
  }, [lesson, navigate, user, trackLessonStart, progress])

  // Step progression functions
  const completeLesson = () => {
    setStepProgress(prev => ({ ...prev, lesson: true }))
    setIsTransitioning(true)
    
    setTimeout(() => {
      setCurrentStep('quiz')
      setIsTransitioning(false)
      setQuizStartTime(Date.now())
    }, 1000)
  }

  const startQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswers([])
    setQuizCompleted(false)
    setShowQuizResults(false)
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
    setShowQuizResults(true)

    // Track quiz completion
    trackQuizComplete(lesson.id, score, quizTimeSpent, {
      totalQuestions: lesson.quiz_questions.length,
      correctAnswers: correct,
      completedAt: new Date().toISOString(),
      answers: selectedAnswers
    })

    // Update progress using the data context
    await updateUserProgress(lesson.id, score, score >= 70)

    // Auto-progress to game if quiz passed
    if (score >= 70) {
      setStepProgress(prev => ({ ...prev, quiz: true }))
      
      setTimeout(() => {
        setIsTransitioning(true)
        setTimeout(() => {
          setCurrentStep('game')
          setIsTransitioning(false)
          setGameStartTime(Date.now())
        }, 1500)
      }, 2000)
    }
  }

  const handleRetakeQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswers([])
    setQuizCompleted(false)
    setShowQuizResults(false)
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
    // Ensure score is a valid number between 0-100
    const validScore = Math.min(100, Math.max(0, Math.round(score)))
    const gameTimeSpent = Math.floor((Date.now() - gameStartTime) / 1000)
    
    setGameScore(validScore)
    setShowGameResults(true)
    setStepProgress(prev => ({ ...prev, game: true }))

    // Track game completion
    if (lesson) {
      trackGamePlay(lesson.id, `${lesson.title} Game`, validScore, gameTimeSpent)
    }

    // Show celebration
    setShowCelebration(true)
    
    setTimeout(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep('complete')
        setStepProgress(prev => ({ ...prev, complete: true }))
        setIsTransitioning(false)
      }, 1500)
    }, 3000)
  }

  const handleContinueToNext = () => {
    // Track lesson completion
    if (lesson) {
      const totalTimeSpent = Math.floor((Date.now() - lessonStartTime) / 1000)
      trackLessonComplete(lesson.id, lesson.title, totalTimeSpent)
    }

    // Find next lesson
    const currentIndex = data.lessons.findIndex(l => l.id === id)
    if (currentIndex < data.lessons.length - 1) {
      const nextLesson = data.lessons[currentIndex + 1]
      navigate(`/lessons/${nextLesson.id}`)
    } else {
      navigate('/dashboard')
    }
  }

  const getStepIcon = (step: FlowStep) => {
    switch (step) {
      case 'lesson': return <BookOpen className="h-5 w-5" />
      case 'quiz': return <Brain className="h-5 w-5" />
      case 'game': return <Gamepad2 className="h-5 w-5" />
      case 'complete': return <Trophy className="h-5 w-5" />
    }
  }

  const getStepTitle = (step: FlowStep) => {
    switch (step) {
      case 'lesson': return 'Learn'
      case 'quiz': return 'Quiz'
      case 'game': return 'Game'
      case 'complete': return 'Complete'
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
        {/* Header with Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <motion.button
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-soft"
          >
            <Home className="h-5 w-5" />
            <span className="font-medium">Dashboard</span>
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
                Level {lesson.level}
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* Progress Flow Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Learning Journey</h3>
            <div className="flex items-center justify-between">
              {(['lesson', 'quiz', 'game', 'complete'] as FlowStep[]).map((step, index) => (
                <div key={step} className="flex items-center">
                  <motion.div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                      currentStep === step
                        ? 'text-white shadow-lg'
                        : stepProgress[step]
                        ? 'bg-green-100 border-green-500 text-green-700'
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                    style={{
                      background: currentStep === step ? `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` : undefined,
                      borderColor: currentStep === step ? countryTheme.primaryColor : undefined
                    }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {stepProgress[step] && currentStep !== step ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      getStepIcon(step)
                    )}
                  </motion.div>
                  
                  {index < 3 && (
                    <div className={`w-16 h-1 mx-2 rounded transition-all duration-300 ${
                      stepProgress[(['lesson', 'quiz', 'game'] as FlowStep[])[index]]
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {(['lesson', 'quiz', 'game', 'complete'] as FlowStep[]).map((step) => (
                <div key={step} className="text-center">
                  <span className={`text-sm font-medium ${
                    currentStep === step ? 'text-blue-600' : 
                    stepProgress[step] ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {getStepTitle(step)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Dynamic Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <DynamicTagline 
            showRefreshButton={false}
            autoRefresh={false}
            size="small"
          />
        </motion.div>

        {/* Transition Overlay */}
        <AnimatePresence>
          {isTransitioning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div 
                className="bg-white rounded-3xl p-8 text-center shadow-2xl"
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="text-4xl mb-4"
                >
                  ⚡
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {currentStep === 'lesson' ? 'Preparing Quiz...' : 
                   currentStep === 'quiz' ? 'Loading Game...' : 'Finalizing...'}
                </h3>
                <p className="text-gray-600">Get ready for the next step!</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          {currentStep === 'lesson' && (
            <motion.div
              key="lesson"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Lesson Content */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-gray-100">
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
                      <span className="font-bold">Previously Completed</span>
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

                {/* Enhanced Lesson Images Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {lessonImages.slice(0, 3).map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className="relative rounded-3xl overflow-hidden shadow-xl group cursor-pointer"
                    >
                      <img
                        src={image}
                        alt={`Traffic safety illustration ${index + 1} for ${lesson.title}`}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-sm font-medium">Traffic Safety Example {index + 1}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Lesson Content */}
                <div className="prose max-w-none mb-8">
                  <div className="text-gray-800 leading-relaxed whitespace-pre-wrap text-lg">
                    {lesson.content}
                  </div>
                </div>

                {/* Additional Images */}
                {lessonImages.length > 3 && (
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {lessonImages.slice(3, 5).map((image, index) => (
                      <motion.div
                        key={index + 3}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        className="relative rounded-3xl overflow-hidden shadow-xl group"
                      >
                        <img
                          src={image}
                          alt={`Additional traffic safety example ${index + 4}`}
                          className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Lesson Stats */}
                <motion.div 
                  className="grid grid-cols-3 gap-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl border border-gray-200"
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
              </div>

              {/* Continue to Quiz Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="bg-gradient-to-r from-blue-50 to-green-50 rounded-3xl p-8 border-2 border-blue-200 shadow-xl text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-5xl mb-4"
                >
                  🧠
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to test your knowledge?</h2>
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                  Excellent! You've completed the lesson. Now let's see how well you understood the concepts with our interactive quiz.
                </p>

                <motion.button
                  onClick={completeLesson}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-white px-8 py-3 rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center space-x-2 font-bold mx-auto text-lg"
                  style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                >
                  <Brain className="h-5 w-5" />
                  <span>Start Safety Quiz</span>
                  <ChevronRight className="h-5 w-5" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {currentStep === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-100"
            >
              {!quizCompleted ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">
                      Question {currentQuestion + 1} of {lesson.quiz_questions.length}
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
                        {currentQuestion < lesson.quiz_questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
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
                      Quiz Score: {quizScore}%
                    </h2>
                    <p className={`text-xl ${quizScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                      {quizScore >= 70 ? 'Excellent! You passed the safety test!' : 'Review the lesson and try again to improve your safety knowledge'}
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
                        <h3 className="text-2xl font-bold text-gray-900">Get ready for the game!</h3>
                      </div>
                      <p className="text-gray-600 mb-4 text-lg">
                        Outstanding work! The interactive game will start automatically to reinforce your learning.
                      </p>
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-3xl"
                      >
                        🎮
                      </motion.div>
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
                        className="text-white px-8 py-3 rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl font-bold flex items-center space-x-2"
                        style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Retake Quiz</span>
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
              transition={{ duration: 0.5 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-100"
            >
              <div className="text-center mb-6">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-5xl mb-4"
                >
                  🎮
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Interactive Safety Game</h2>
                <p className="text-gray-600 text-lg">
                  Apply what you've learned in this engaging traffic safety game!
                </p>
              </div>

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
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <motion.div 
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-12 border border-gray-100"
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="text-8xl mb-6"
                >
                  🏆
                </motion.div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Lesson Complete!</h2>
                <p className="text-gray-600 mb-6 text-xl leading-relaxed">
                  Congratulations! You've successfully completed the entire learning journey for this topic.
                </p>

                {/* Achievement Summary */}
                <div className="grid grid-cols-3 gap-6 mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">{quizScore}%</div>
                    <div className="text-sm text-gray-600">Quiz Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">{gameScore}%</div>
                    <div className="text-sm text-gray-600">Game Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                      {Math.floor((Date.now() - lessonStartTime) / 60000)}m
                    </div>
                    <div className="text-sm text-gray-600">Total Time</div>
                  </div>
                </div>

                <motion.button
                  onClick={handleContinueToNext}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full text-white px-8 py-4 rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-3 font-bold text-lg"
                  style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                >
                  <Trophy className="h-6 w-6" />
                  <span>Continue to Next Lesson</span>
                  <ArrowRight className="h-6 w-6" />
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