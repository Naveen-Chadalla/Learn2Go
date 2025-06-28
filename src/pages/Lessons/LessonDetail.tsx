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
  
  // Lesson flow states
  const [currentPhase, setCurrentPhase] = useState<'lesson' | 'quiz' | 'game' | 'complete'>('lesson')
  const [showQuiz, setShowQuiz] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [lessonStartTime, setLessonStartTime] = useState<number>(Date.now())
  const [quizStartTime, setQuizStartTime] = useState<number>(0)
  const [showGame, setShowGame] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [gameScore, setGameScore] = useState(0)
  const [topicCompleted, setTopicCompleted] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [isReading, setIsReading] = useState(false)
  const [lessonCompleted, setLessonCompleted] = useState(false)

  const lesson = data.lessons.find(l => l.id === id)
  const progress = data.userProgress.find(p => p.lesson_id === id)
  const { countryTheme } = data

  // Get lesson images based on content with better variety
  const getLessonImages = () => {
    const baseImages = [
      'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1738986/pexels-photo-1738986.jpeg?auto=compress&cs=tinysrgb&w=800'
    ]
    
    // Add more specific images based on lesson content
    if (lesson?.title.toLowerCase().includes('traffic signals') || lesson?.title.toLowerCase().includes('traffic light')) {
      return [
        'https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800',
        ...baseImages
      ]
    }
    
    if (lesson?.title.toLowerCase().includes('pedestrian') || lesson?.title.toLowerCase().includes('crosswalk')) {
      return [
        'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1738986/pexels-photo-1738986.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=800',
        ...baseImages
      ]
    }

    if (lesson?.title.toLowerCase().includes('emergency') || lesson?.title.toLowerCase().includes('accident')) {
      return [
        'https://images.pexels.com/photos/1738986/pexels-photo-1738986.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=800',
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

    // Check if lesson was already completed
    if (progress?.completed) {
      setLessonCompleted(true)
    }
  }, [lesson, navigate, user, trackLessonStart, progress])

  const handleLessonComplete = () => {
    setLessonCompleted(true)
    setCurrentPhase('quiz')
    
    // Auto-prompt for quiz after lesson completion
    setTimeout(() => {
      handleStartQuiz()
    }, 1000)
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
    setCurrentPhase('game')

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

    // Auto-prompt for game after quiz completion (if passed)
    if (score >= 70) {
      setTimeout(() => {
        handleStartGame()
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

  const handleStartGame = () => {
    setShowGame(true)
  }

  const handleGameComplete = (score: number) => {
    setShowGame(false)
    setGameCompleted(true)
    setGameScore(score)
    setCurrentPhase('complete')
    setTopicCompleted(true)

    // Auto-suggest next lesson after game completion
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
      // No more lessons, go to dashboard with celebration
      navigate('/dashboard', { 
        state: { 
          message: 'Congratulations! You have completed all available lessons!',
          celebration: true
        }
      })
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
        {/* Header with Progress Indicator */}
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
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">{t('common.back')}</span>
          </motion.button>
          
          {/* Progress Flow Indicator */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentPhase === 'lesson' || lessonCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {lessonCompleted ? <CheckCircle className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
              </div>
              <span className="text-sm font-medium">Lesson</span>
            </div>
            
            <div className={`w-8 h-1 rounded transition-all duration-300 ${
              currentPhase === 'quiz' || quizCompleted ? 'bg-blue-500' : 'bg-gray-200'
            }`}></div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentPhase === 'quiz' || quizCompleted ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {quizCompleted ? <CheckCircle className="h-5 w-5" /> : <Brain className="h-5 w-5" />}
              </div>
              <span className="text-sm font-medium">Quiz</span>
            </div>
            
            <div className={`w-8 h-1 rounded transition-all duration-300 ${
              currentPhase === 'game' || gameCompleted ? 'bg-purple-500' : 'bg-gray-200'
            }`}></div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentPhase === 'game' || gameCompleted ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {gameCompleted ? <CheckCircle className="h-5 w-5" /> : <Gamepad2 className="h-5 w-5" />}
              </div>
              <span className="text-sm font-medium">Game</span>
            </div>
            
            <div className={`w-8 h-1 rounded transition-all duration-300 ${
              currentPhase === 'complete' ? 'bg-green-500' : 'bg-gray-200'
            }`}></div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentPhase === 'complete' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                <Trophy className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Complete</span>
            </div>
          </div>
          
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

        {/* Topic Completed Screen */}
        <AnimatePresence>
          {topicCompleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div 
                className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 text-center shadow-2xl"
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
                  🎉
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Complete Learning Journey!</h2>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Amazing work! You've successfully completed:
                </p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>Lesson: {lesson.title}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-blue-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>Quiz Score: {quizScore}%</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-purple-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>Game Score: {gameScore}%</span>
                  </div>
                </div>
                <motion.button
                  onClick={handleContinueToNext}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full text-white px-6 py-3 rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-2 font-bold"
                  style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                >
                  <span>Continue to Next Lesson</span>
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {!showQuiz && !showGame ? (
          <>
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

              {/* Lesson Images - Enhanced with better layout */}
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
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white text-sm font-medium bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1">
                      Safety Illustration {index + 1}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="prose max-w-none">
                <div className="text-gray-800 leading-relaxed whitespace-pre-wrap text-lg">
                  {lesson.content}
                </div>
              </div>

              {/* Additional Images */}
              {lessonImages.slice(2, 4).length > 0 && (
                <div className="mt-8 grid md:grid-cols-2 gap-6">
                  {lessonImages.slice(2, 4).map((image, index) => (
                    <motion.div
                      key={index + 2}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className="relative rounded-3xl overflow-hidden shadow-xl group"
                    >
                      <img
                        src={image}
                        alt={`Traffic safety concept ${index + 3}`}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 text-white text-sm font-medium bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1">
                        Safety Concept {index + 3}
                      </div>
                    </motion.div>
                  ))}
                </div>
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
            </motion.div>

            {/* Lesson Complete Button */}
            {!lessonCompleted && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-gradient-to-r from-blue-50 to-green-50 rounded-3xl p-8 border-2 border-blue-200 mb-8 shadow-xl text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-5xl mb-4"
                >
                  📚
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Lesson Complete!</h2>
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                  Great job reading through the lesson! Now let's test your understanding with our interactive quiz.
                </p>

                <motion.button
                  onClick={handleLessonComplete}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-white px-8 py-3 rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center space-x-2 font-bold mx-auto text-lg"
                  style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                >
                  <Award className="h-5 w-5" />
                  <span>Complete Lesson & Start Quiz</span>
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </motion.div>
            )}

            {/* Ready to Test Prompt */}
            {lessonCompleted && !showQuiz && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-gradient-to-r from-blue-50 to-green-50 rounded-3xl p-8 border-2 border-blue-200 mb-8 shadow-xl"
              >
                <div className="text-center">
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

                  {progress?.completed && (
                    <motion.div 
                      className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Trophy className="h-5 w-5 text-green-600" />
                        <span className="font-bold text-green-800">
                          Previous Score: {progress.score}%
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <motion.button
                    onClick={handleStartQuiz}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-white px-8 py-3 rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center space-x-2 font-bold mx-auto text-lg"
                    style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                  >
                    <PlayCircle className="h-5 w-5" />
                    <span>{progress?.completed ? t('quiz.retake') : 'Start Safety Quiz'}</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </>
        ) : showQuiz && !showGame ? (
          /* Quiz Interface */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
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
                    onClick={() => setShowQuiz(false)}
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
                      <h3 className="text-2xl font-bold text-gray-900">Ready for Interactive Game?</h3>
                    </div>
                    <p className="text-gray-600 mb-4 text-lg">
                      Excellent work! Now let's reinforce your learning with an interactive traffic safety game.
                    </p>
                    <motion.button
                      onClick={handleStartGame}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-white px-6 py-3 rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center space-x-2 mx-auto font-bold"
                      style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                    >
                      <Gamepad2 className="h-5 w-5" />
                      <span>Start Interactive Game</span>
                    </motion.button>
                  </motion.div>
                ) : (
                  <div className="flex justify-center space-x-4">
                    <motion.button
                      onClick={() => setShowQuiz(false)}
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
        ) : (
          /* Interactive Game */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
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
      </div>
    </div>
  )
}

export default LessonDetail