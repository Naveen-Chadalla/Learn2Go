import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { motion } from 'framer-motion'
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
  Eye
} from 'lucide-react'

const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const { t } = useLanguage()

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
    { label: 'Languages', value: '3', icon: <Globe className="h-6 w-6" /> }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-3xl">
                <BookOpen className="h-16 w-16 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <span>{t('home.getStarted')}</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-2xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200">
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
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-3 w-fit mx-auto mb-4">
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

      {/* Safety Focus Section */}
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
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
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
    </div>
  )
}

export default Home