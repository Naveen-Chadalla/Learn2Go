import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { useData } from '../../contexts/DataContext'
import { useActivityTracking } from '../../hooks/useActivityTracking'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  PlayCircle,
  Brain,
  Clock,
  Target
} from 'lucide-react'

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

  const lesson = data.lessons.find(l => l.id === id)
  const progress = data.userProgress.find(p => p.lesson_id === id)
  const { countryTheme } = data

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
        </motion.div>

        {!showQuiz ? (
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

              <div className="prose max-w-none">
                <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {lesson.content}
                </div>
              </div>

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

            {/* Quiz Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('quiz.title')}</h2>
              <p className="text-gray-600 mb-6">
                Test your understanding of this lesson with our interactive quiz.
              </p>

              {progress?.completed && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      Previous Score: {progress.score}%
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleStartQuiz}
                className="text-white px-8 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 font-semibold"
                style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
              >
                <PlayCircle className="h-5 w-5" />
                <span>{progress?.completed ? t('quiz.retake') : t('lessons.quiz')}</span>
              </button>
            </motion.div>
          </>
        ) : (
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

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setShowQuiz(false)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Back to Lesson
                  </button>
                  <button
                    onClick={handleRetakeQuiz}
                    className="text-white px-8 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    style={{ background: `linear-gradient(135deg, ${countryTheme.primaryColor}, ${countryTheme.secondaryColor})` }}
                  >
                    {t('quiz.retake')}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default LessonDetail