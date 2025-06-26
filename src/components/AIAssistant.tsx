import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User, Loader } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { data } = useData()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'assistant',
        content: `Hi ${user?.user_metadata?.username || 'there'}! 👋 I'm your AI traffic safety assistant. I can help you with:\n\n• Traffic rules and regulations\n• Road safety tips\n• Lesson explanations\n• Quiz help\n• Country-specific driving laws\n\nWhat would you like to know?`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, user])

  const generateResponse = async (userMessage: string): Promise<string> => {
    // Simulate AI response based on common traffic safety queries
    const lowerMessage = userMessage.toLowerCase()
    
    if (lowerMessage.includes('traffic light') || lowerMessage.includes('signal')) {
      return `Traffic lights are crucial for road safety! Here's what each color means:

🔴 **Red Light**: Complete stop required. Wait behind the stop line.
🟡 **Yellow Light**: Prepare to stop safely. Don't speed up to "beat" the light.
🟢 **Green Light**: Proceed with caution after checking for pedestrians and cross traffic.

Remember: Always look both ways even on green lights!`
    }
    
    if (lowerMessage.includes('speed limit') || lowerMessage.includes('speeding')) {
      const country = data.userProfile?.country || 'US'
      const countryInfo = country === 'IN' ? 'In India, city speed limits are typically 50 km/h' :
                         country === 'US' ? 'In the US, city speed limits vary by state, typically 25-35 mph' :
                         'Speed limits vary by country and road type'
      
      return `Speed limits save lives! ${countryInfo}.

**Why speed limits matter:**
• Reduces accident severity
• Gives more reaction time
• Protects pedestrians and cyclists
• Reduces fuel consumption

Always adjust your speed for weather and traffic conditions, even if you're under the limit!`
    }
    
    if (lowerMessage.includes('pedestrian') || lowerMessage.includes('crosswalk')) {
      return `Pedestrian safety is everyone's responsibility! 🚶‍♀️

**For Drivers:**
• Always yield to pedestrians at crosswalks
• Look for pedestrians before turning
• Slow down in school zones
• Be extra careful in bad weather

**For Pedestrians:**
• Use designated crosswalks
• Look both ways before crossing
• Make eye contact with drivers
• Stay visible with bright clothing

Working together keeps everyone safe!`
    }
    
    if (lowerMessage.includes('parking') || lowerMessage.includes('park')) {
      return `Smart parking keeps traffic flowing! 🅿️

**Legal parking tips:**
• Check for parking signs and time limits
• Don't block driveways or fire hydrants
• Leave space for emergency vehicles
• Park in designated spots only

**Parallel parking made easy:**
1. Find a space 1.5x your car length
2. Pull alongside the front car
3. Reverse while turning steering wheel
4. Straighten when your car is at 45°
5. Continue backing until parallel`
    }
    
    if (lowerMessage.includes('emergency') || lowerMessage.includes('accident')) {
      const country = data.userProfile?.country || 'US'
      const emergencyNumber = country === 'IN' ? '112' : country === 'US' ? '911' : '999'
      
      return `Emergency procedures for ${country}: 🚨

**Emergency Number: ${emergencyNumber}**

**If you're in an accident:**
1. Check for injuries (yourself and others)
2. Call emergency services immediately
3. Move to safety if possible
4. Exchange information with other parties
5. Document the scene with photos

**Vehicle breakdown:**
• Pull over safely to the shoulder
• Turn on hazard lights
• Exit away from traffic
• Call for roadside assistance

Stay calm and prioritize safety over speed!`
    }
    
    if (lowerMessage.includes('quiz') || lowerMessage.includes('test') || lowerMessage.includes('exam')) {
      return `Great question about quizzes! 📝

**Quiz tips for success:**
• Read each question carefully
• Eliminate obviously wrong answers
• Think about real-world scenarios
• Review lesson content before quizzes
• Take your time - there's no rush!

**Common quiz topics:**
• Traffic signals and signs
• Right-of-way rules
• Speed limits and safety
• Pedestrian interactions
• Emergency procedures

Need help with a specific topic? Just ask!`
    }
    
    if (lowerMessage.includes('lesson') || lowerMessage.includes('learn')) {
      return `I'm here to help with your learning journey! 📚

**Study tips:**
• Take notes during lessons
• Practice with interactive games
• Review difficult concepts
• Ask questions when confused
• Apply knowledge in real situations

**Lesson structure:**
1. **Content**: Core traffic safety concepts
2. **Quiz**: Test your understanding
3. **Game**: Apply knowledge interactively
4. **Progress**: Track your improvement

Which lesson topic would you like help with?`
    }
    
    // Default response for other queries
    return `I'd be happy to help you with traffic safety! 🚗

I can assist with:
• Traffic rules and regulations
• Road safety best practices
• Lesson explanations
• Quiz preparation
• Country-specific driving laws
• Emergency procedures

Could you be more specific about what you'd like to know? For example:
• "What does a yellow traffic light mean?"
• "How do I parallel park?"
• "What should I do in an emergency?"

Feel free to ask me anything about road safety!`
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Simulate thinking time
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
      
      const response = await generateResponse(userMessage.content)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try asking your question again!",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
      >
        <MessageCircle className="h-6 w-6" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Safety Assistant</h3>
                  <p className="text-xs opacity-90">Always here to help!</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[80%] ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-gradient-to-r from-blue-500 to-green-600' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-600'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className={`rounded-2xl p-3 ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-green-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 opacity-70 ${
                        message.type === 'user' ? 'text-white' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl p-3">
                      <div className="flex items-center space-x-2">
                        <Loader className="h-4 w-4 animate-spin text-gray-500" />
                        <p className="text-sm text-gray-600">Thinking...</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about traffic safety..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <motion.button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default AIAssistant