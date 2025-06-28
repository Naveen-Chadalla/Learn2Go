import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download, 
  Share, 
  Trophy, 
  Award, 
  CheckCircle, 
  Home, 
  ArrowLeft, 
  Sparkles,
  Calendar,
  Star,
  Printer
} from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import Confetti from 'react-confetti'

const Certificate: React.FC = () => {
  const { user } = useAuth()
  const { data } = useData()
  const navigate = useNavigate()
  const certificateRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(true)
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  // Update window size for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Stop confetti after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false)
    }, 8000)
    return () => clearTimeout(timer)
  }, [])

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Get completion date
  const getCompletionDate = () => {
    if (data.userProgress.length > 0) {
      const sortedProgress = [...data.userProgress]
        .filter(p => p.completed)
        .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
      
      if (sortedProgress.length > 0) {
        return formatDate(new Date(sortedProgress[0].completed_at))
      }
    }
    return formatDate(new Date())
  }

  // Get username
  const getUsername = () => {
    return user?.user_metadata?.username || 
           data.userProfile?.username || 
           user?.email?.split('@')[0] || 
           'Student'
  }

  // Get country name
  const getCountryName = () => {
    const countryCode = data.userProfile?.country || 'US'
    const countries: Record<string, string> = {
      'US': 'United States',
      'IN': 'India',
      'GB': 'United Kingdom',
      'CA': 'Canada',
      'AU': 'Australia',
      'DE': 'Germany',
      'FR': 'France',
      'ES': 'Spain',
      'JP': 'Japan',
      'BR': 'Brazil',
      'MX': 'Mexico',
      'CN': 'China'
    }
    return countries[countryCode] || 'International'
  }

  // Download certificate as PDF
  const downloadCertificate = async () => {
    if (!certificateRef.current) return
    
    setIsDownloading(true)
    
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Learn2Go_Certificate_${getUsername()}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  // Print certificate
  const printCertificate = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-16 pb-16">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={true}
          numberOfPieces={200}
          gravity={0.1}
        />
      )}
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-bold text-gray-600">
                Achievement Unlocked
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* Certificate Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900">Your Certificate of Completion</h1>
          <p className="text-gray-600 mt-2">
            Congratulations on completing the Learn2Go Traffic Safety Education Program!
          </p>
        </motion.div>

        {/* Certificate */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8 print:mb-0"
        >
          <div 
            ref={certificateRef}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-double p-8 print:p-0 print:border-0 print:shadow-none print:rounded-none"
            style={{ 
              borderImage: 'linear-gradient(45deg, #3B82F6, #8B5CF6, #EC4899) 1',
              pageBreakInside: 'avoid'
            }}
          >
            {/* Certificate Header */}
            <div className="text-center mb-8 relative">
              <div className="absolute top-0 left-0 w-24 h-24 bg-blue-50 rounded-full opacity-30"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full opacity-30"></div>
              
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity }}
                className="text-6xl mb-4 inline-block"
              >
                🏆
              </motion.div>
              
              <h2 className="text-4xl font-bold text-gray-900 mb-2">Certificate of Completion</h2>
              <div className="h-1 w-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mx-auto"></div>
            </div>
            
            {/* Certificate Body */}
            <div className="text-center mb-8">
              <p className="text-lg text-gray-600 mb-6">This is to certify that</p>
              <h3 className="text-3xl font-bold text-blue-600 mb-6 font-serif">{getUsername()}</h3>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                has successfully completed the Road Safety and Traffic Rules Program on Learn2Go,
                demonstrating proficiency in traffic safety knowledge and practices for {getCountryName()}.
              </p>
              
              {/* Achievement Details */}
              <div className="grid grid-cols-3 gap-6 mb-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-blue-500 mb-1">
                    <CheckCircle className="h-6 w-6 mx-auto" />
                  </div>
                  <div className="text-sm text-gray-600">Lessons Completed</div>
                  <div className="font-bold text-gray-900">{data.analytics.lessonsCompleted}</div>
                </div>
                <div className="text-center">
                  <div className="text-purple-500 mb-1">
                    <Award className="h-6 w-6 mx-auto" />
                  </div>
                  <div className="text-sm text-gray-600">Average Score</div>
                  <div className="font-bold text-gray-900">{data.analytics.averageScore}%</div>
                </div>
                <div className="text-center">
                  <div className="text-pink-500 mb-1">
                    <Star className="h-6 w-6 mx-auto" />
                  </div>
                  <div className="text-sm text-gray-600">Badges Earned</div>
                  <div className="font-bold text-gray-900">{data.badges.filter(b => b.earned).length}</div>
                </div>
              </div>
              
              {/* Date and Signature */}
              <div className="flex justify-between items-end max-w-2xl mx-auto">
                <div className="text-left">
                  <div className="flex items-center space-x-2 text-gray-600 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>Date of Completion</span>
                  </div>
                  <div className="font-bold text-gray-900 border-t-2 border-gray-300 pt-1">
                    {getCompletionDate()}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-gray-900 mb-1 font-serif text-xl">Learn2Go</div>
                  <div className="border-t-2 border-gray-300 pt-1 text-gray-600">
                    Traffic Safety Education
                  </div>
                </div>
              </div>
            </div>
            
            {/* Certificate Footer */}
            <div className="text-center">
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mb-4"></div>
              <p className="text-sm text-gray-500">
                This certificate recognizes the successful completion of the Learn2Go Traffic Safety Education Program.
                The holder has demonstrated understanding of traffic rules, road safety, and responsible driving practices.
              </p>
              <div className="flex justify-center space-x-4 mt-4">
                <div className="text-2xl">🚦</div>
                <div className="text-2xl">🚸</div>
                <div className="text-2xl">🚗</div>
                <div className="text-2xl">🛑</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 print:hidden"
        >
          <motion.button
            onClick={downloadCertificate}
            disabled={isDownloading}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70"
          >
            {isDownloading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                <span>Download Certificate (PDF)</span>
              </>
            )}
          </motion.button>
          
          <motion.button
            onClick={printCertificate}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Printer className="h-5 w-5" />
            <span>Print Certificate</span>
          </motion.button>
          
          <motion.button
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </motion.button>
        </motion.div>

        {/* Congratulatory Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center max-w-2xl mx-auto print:hidden"
        >
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="text-4xl mb-4 inline-block"
            >
              <Sparkles className="h-10 w-10 text-yellow-500" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Congratulations on Your Achievement!</h3>
            <p className="text-gray-600 mb-4">
              You've successfully completed the Learn2Go Traffic Safety Education Program. 
              Your commitment to learning road safety rules contributes to making our roads safer for everyone.
            </p>
            <p className="text-gray-600 font-medium">
              Share your certificate and encourage others to learn about traffic safety!
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Certificate