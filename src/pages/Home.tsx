import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  TrendingUp, 
  Globe, 
  Brain, 
  Award, 
  ArrowRight,
  CheckCircle,
  Car,
  AlertTriangle,
  Eye,
  X,
  Shield,
  Users,
  BarChart3,
  Heart,
  Target,
  Zap,
  Clock
} from 'lucide-react'

const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const { t } = useLanguage()
  const [showLearnMore, setShowLearnMore] = useState(false)

  // If user is authenticated, this component won't render due to AuthRedirect
  // But we keep the check for safety
  React.useEffect(() => {
    if (isAuthenticated) {
      // This will be handled by AuthRedirect component
      return
    }
  }, [isAuthenticated])

  const features = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: t('home.features.interactive'),
      description: t('home.features.interactive.desc'),
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: t('home.features.progress'),
      description: t('home.features.progress.desc'),
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: t('home.features.multilingual'),
      description: t('home.features.multilingual.desc'),
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: t('home.features.quizzes'),
      description: t('home.features.quizzes.desc'),
      color: 'from-orange-500 to-red-500'
    }
  ]

  const stats = [
    { label: 'Traffic Lessons', value: '100+', icon: <BookOpen className="h-6 w-6" /> },
    { label: 'Success Rate', value: '98%', icon: <CheckCircle className="h-6 w-6" /> },
    { label: 'Languages', value: '12+', icon: <Globe className="h-6 w-6" /> }
  ]

  const projectImportance = {
    why: [
      {
        icon: <AlertTriangle className="h-6 w-6 text-red-500" />,
        title: "Road Safety Crisis",
        description: "Over 1.35 million people die in road traffic crashes annually worldwide, with millions more injured."
      },
      {
        icon: <Users className="h-6 w-6 text-blue-500" />,
        title: "Education Gap",
        description: "Many drivers lack proper traffic safety education, leading to preventable accidents and fatalities."
      },
      {
        icon: <Globe className="h-6 w-6 text-green-500" />,
        title: "Global Impact",
        description: "Road traffic injuries are the leading cause of death for children and young adults aged 5-29 years."
      }
    ],
    how: [
      {
        icon: <Brain className="h-6 w-6 text-purple-500" />,
        title: "AI-Powered Learning",
        description: "Personalized content generation based on your country's specific traffic rules and regulations."
      },
      {
        icon: <Target className="h-6 w-6 text-orange-500" />,
        title: "Interactive Training",
        description: "Engaging quizzes, simulations, and real-world scenarios to reinforce learning."
      },
      {
        icon: <BarChart3 className="h-6 w-6 text-cyan-500" />,
        title: "Progress Tracking",
        description: "Comprehensive analytics to monitor learning progress and identify areas for improvement."
      }
    ],
    impact: [
      {
        icon: <Shield className="h-6 w-6 text-green-600" />,
        title: "Accident Reduction",
        description: "Studies show that proper traffic education can reduce accidents by up to 40%."
      },
      {
        icon: <Heart className="h-6 w-6 text-red-500" />,
        title: "Lives Saved",
        description: "Every educated driver contributes to safer roads and potentially saves lives."
      },
      {
        icon: <Zap className="h-6 w-6 text-yellow-500" />,
        title: "Behavioral Change",
        description: "Long-term positive impact on driving behavior and road safety culture."
      }
    ]
  }

  const supportedLanguages = [
    { name: 'English', flag: '🇺🇸', regions: ['US', 'GB', 'AU', 'CA'] },
    { name: 'Hindi', flag: '🇮🇳', regions: ['IN'] },
    { name: 'Telugu', flag: '🇮🇳', regions: ['IN'] },
    { name: 'Tamil', flag: '🇮🇳', regions: ['IN'] },
    { name: 'Bengali', flag: '🇮🇳', regions: ['IN'] },
    { name: 'Marathi', flag: '🇮🇳', regions: ['IN'] },
    { name: 'Gujarati', flag: '🇮🇳', regions: ['IN'] },
    { name: 'Kannada', flag: '🇮🇳', regions: ['IN'] },
    { name: 'Malayalam', flag: '🇮🇳', regions: ['IN'] },
    { name: 'Punjabi', flag: '🇮🇳', regions: ['IN'] },
    { name: 'Spanish', flag: '🇪🇸', regions: ['ES', 'MX', 'US'] },
    { name: 'French', flag: '🇫🇷', regions: ['FR', 'CA'] },
    { name: 'German', flag: '🇩🇪', regions: ['DE'] },
    { name: 'Portuguese', flag: '🇧🇷', regions: ['BR'] },
    { name: 'Chinese', flag: '🇨🇳', regions: ['CN'] },
    { name: 'Japanese', flag: '🇯🇵', regions: ['JP'] }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-green-600/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex justify-center mb-8">
              <div className="relative">
                <img 
                  src="/src/assets/ChatGPT Image Jun 21, 2025, 03_33_49 PM copy.png" 
                  alt="Learn2Go Logo" 
                  className="h-24 w-auto"
                  onError={(e) => {
                    // Fallback to gradient logo if image fails to load
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <div className="hidden bg-gradient-to-r from-blue-500 to-green-600 p-6 rounded-3xl">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-gradient-to-b from-red-500 via-yellow-500 to-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                {t('home.title')}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {t('home.subtitle')}
            </p>
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
              {t('home.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/signup"
                className="bg-gradient-to-r from-blue-500 to-green-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-blue-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <span>{t('home.getStarted')}</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <button 
                onClick={() => setShowLearnMore(true)}
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-2xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
              >
                {t('home.learnMore')}
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="bg-gradient-to-r from-blue-500 to-green-600 rounded-xl p-3 w-fit mx-auto mb-4">
                    <div className="text-white">{stat.icon}</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.features.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover the features that make Learn2Go the perfect platform for traffic safety education.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200"
              >
                <div className={`bg-gradient-to-r ${feature.color} rounded-xl p-4 w-fit mb-6`}>
                  <div className="text-white">{feature.icon}</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Language Support Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Global Language Support
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
              Learn traffic safety in your native language. We support <span className="font-bold text-blue-600">{supportedLanguages.length}+ languages</span> across multiple countries and regions.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {supportedLanguages.map((lang, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 text-center"
              >
                <div className="text-2xl mb-2">{lang.flag}</div>
                <div className="text-sm font-medium text-gray-900">{lang.name}</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
              <Globe className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-blue-900 mb-2">Localized Content</h3>
              <p className="text-blue-800">
                Each language includes country-specific traffic rules, road signs, and cultural context to ensure relevant and effective learning.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Safety Focus Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Making Roads Safer Through Education
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform focuses on critical traffic safety topics to reduce accidents and save lives.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-lg"
            >
              <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-4 w-fit mb-6">
                <Car className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Vehicle Safety</h3>
              <p className="text-gray-600">
                Learn about vehicle maintenance, safety checks, and proper driving techniques for different road conditions.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-lg"
            >
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4 w-fit mb-6">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Traffic Rules</h3>
              <p className="text-gray-600">
                Master traffic signals, road signs, right-of-way rules, and traffic regulations to become a responsible driver.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-lg"
            >
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 w-fit mb-6">
                <Eye className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Hazard Awareness</h3>
              <p className="text-gray-600">
                Develop skills to identify and respond to potential hazards, emergency situations, and adverse weather conditions.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Become a Safer Driver?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of learners who are making our roads safer through proper traffic education.
            </p>
            <Link
              to="/signup"
              className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
            >
              <span>Start Your Safety Journey</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Learn More Modal */}
      <AnimatePresence>
        {showLearnMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowLearnMore(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">Why Learn2Go Matters</h2>
                  <button
                    onClick={() => setShowLearnMore(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-12">
                  {/* Why This Project */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
                      The Problem We're Solving
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      {projectImportance.why.map((item, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-6">
                          <div className="flex items-center mb-3">
                            {item.icon}
                            <h4 className="font-semibold text-gray-900 ml-2">{item.title}</h4>
                          </div>
                          <p className="text-gray-600 text-sm">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* How We Help */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <Zap className="h-6 w-6 text-blue-500 mr-2" />
                      How Learn2Go Helps
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      {projectImportance.how.map((item, index) => (
                        <div key={index} className="bg-blue-50 rounded-xl p-6">
                          <div className="flex items-center mb-3">
                            {item.icon}
                            <h4 className="font-semibold text-gray-900 ml-2">{item.title}</h4>
                          </div>
                          <p className="text-gray-600 text-sm">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Impact */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <Heart className="h-6 w-6 text-green-500 mr-2" />
                      Our Impact
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      {projectImportance.impact.map((item, index) => (
                        <div key={index} className="bg-green-50 rounded-xl p-6">
                          <div className="flex items-center mb-3">
                            {item.icon}
                            <h4 className="font-semibold text-gray-900 ml-2">{item.title}</h4>
                          </div>
                          <p className="text-gray-600 text-sm">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                      By the Numbers
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                      <div>
                        <div className="text-3xl font-bold text-red-600 mb-2">1.35M</div>
                        <div className="text-sm text-gray-600">Annual road deaths globally</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-orange-600 mb-2">50M</div>
                        <div className="text-sm text-gray-600">People injured annually</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-green-600 mb-2">40%</div>
                        <div className="text-sm text-gray-600">Accident reduction with proper education</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-blue-600 mb-2">16+</div>
                        <div className="text-sm text-gray-600">Languages supported</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <Link
                    to="/signup"
                    onClick={() => setShowLearnMore(false)}
                    className="bg-gradient-to-r from-blue-500 to-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
                  >
                    <span>Join the Movement</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Home