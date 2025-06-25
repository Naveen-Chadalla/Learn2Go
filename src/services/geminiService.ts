interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
}

interface LessonContent {
  title: string
  description: string
  content: string
  quiz_questions: Array<{
    question: string
    options: string[]
    correct_answer: number
    explanation: string
  }>
}

interface GameContent {
  id: string
  name: string
  description: string
  type: 'simulation' | 'quiz' | 'memory' | 'scenario'
  content: any
}

class GeminiService {
  private apiKey: string
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
  private readonly REQUEST_TIMEOUT = 5000 // 5 seconds timeout
  private readonly MAX_RETRIES = 2

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!this.apiKey) {
      console.warn('Gemini API key not found. Using fallback content.')
    }
  }

  private async makeRequest(prompt: string, timeout: number = this.REQUEST_TIMEOUT): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 20, // Reduced for faster response
            topP: 0.8, // Reduced for faster response
            maxOutputTokens: 1024, // Reduced for faster response
          }
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`)
      }

      const data: GeminiResponse = await response.json()
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API')
      }

      return data.candidates[0].content.parts[0].text
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
  }

  async generateLessonContent(country: string, language: string, topic: string, level: number): Promise<LessonContent> {
    // Simplified prompt for faster response
    const prompt = `Create a traffic safety lesson for ${country} about ${topic} (Level ${level}). 
Return JSON: {"title":"...","description":"...","content":"...","quiz_questions":[{"question":"...","options":["A","B","C","D"],"correct_answer":0,"explanation":"..."}]}
Keep content concise (300 words max), include 3 quiz questions.`

    try {
      const response = await this.makeRequest(prompt, 3000) // 3 second timeout
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleanedResponse)
      
      // Validate response structure
      if (!parsed.title || !parsed.content || !parsed.quiz_questions) {
        throw new Error('Invalid response structure')
      }
      
      return parsed
    } catch (error) {
      console.warn('Gemini lesson generation failed, using fallback:', error)
      return this.getFallbackLessonContent(country, language, topic, level)
    }
  }

  async generateGameContent(country: string, language: string, gameType: string): Promise<GameContent> {
    // Simplified game generation
    const prompt = `Create a simple traffic safety ${gameType} for ${country}. 
Return JSON: {"id":"game_${Date.now()}","name":"...","description":"...","type":"${gameType}","content":{"questions":[{"q":"...","a":"..."}]}}
Keep it simple with 3 questions max.`

    try {
      const response = await this.makeRequest(prompt, 2000) // 2 second timeout
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim()
      return JSON.parse(cleanedResponse)
    } catch (error) {
      console.warn('Gemini game generation failed, using fallback:', error)
      return this.getFallbackGameContent(country, language, gameType)
    }
  }

  async generateLocalizedContent(country: string, language: string, contentType: string): Promise<any> {
    try {
      const response = await this.makeRequest(`Brief ${contentType} for ${country} in ${language}`, 2000)
      return response
    } catch (error) {
      console.warn('Gemini localization failed:', error)
      return null
    }
  }

  async translateContent(content: string, targetLanguage: string): Promise<string> {
    try {
      const response = await this.makeRequest(`Translate to ${targetLanguage}: ${content.substring(0, 500)}`, 2000)
      return response.trim()
    } catch (error) {
      console.warn('Gemini translation failed:', error)
      return content
    }
  }

  private getFallbackLessonContent(country: string, language: string, topic: string, level: number): LessonContent {
    const fallbackContent = {
      'Pedestrian Safety': {
        title: 'Pedestrian Safety Basics',
        description: 'Essential pedestrian safety rules and practices.',
        content: `Pedestrian safety is crucial for road safety in ${country}. Key rules include:

• Always use designated crosswalks
• Look both ways before crossing
• Follow traffic signals
• Stay visible, especially at night
• Avoid distractions like phones while crossing
• Make eye contact with drivers when possible

Remember: Pedestrians are vulnerable road users and must take extra precautions to stay safe.`,
        quiz_questions: [
          {
            question: "When should pedestrians cross the road?",
            options: ["Anywhere convenient", "Only at designated crosswalks", "When no cars are visible", "During rush hour"],
            correct_answer: 1,
            explanation: "Pedestrians should always use designated crosswalks for safety."
          },
          {
            question: "What should you do before crossing a street?",
            options: ["Run quickly", "Look both ways", "Use your phone", "Close your eyes"],
            correct_answer: 1,
            explanation: "Always look both ways to check for oncoming traffic."
          },
          {
            question: "How can pedestrians stay visible at night?",
            options: ["Wear dark clothes", "Wear bright/reflective clothing", "Walk in shadows", "Avoid walking"],
            correct_answer: 1,
            explanation: "Bright and reflective clothing helps drivers see pedestrians in low light."
          }
        ]
      },
      'Emergency Procedures': {
        title: 'Emergency Procedures',
        description: 'What to do in traffic emergencies.',
        content: `Emergency procedures for ${country}:

• Emergency number: ${country === 'IN' ? '112' : country === 'US' ? '911' : '999'}
• Pull over safely if your vehicle breaks down
• Turn on hazard lights immediately
• Exit vehicle away from traffic if safe
• Call for help and wait in a safe location
• Keep emergency kit in your vehicle

In case of accidents:
• Check for injuries
• Call emergency services
• Document the scene if safe to do so
• Exchange information with other parties`,
        quiz_questions: [
          {
            question: `What is the emergency number in ${country}?`,
            options: ["911", "112", "999", "108"],
            correct_answer: country === 'IN' ? 1 : country === 'US' ? 0 : 2,
            explanation: `The emergency number in ${country} is ${country === 'IN' ? '112' : country === 'US' ? '911' : '999'}.`
          },
          {
            question: "What should you do first if your car breaks down?",
            options: ["Keep driving", "Pull over safely", "Get out immediately", "Call a friend"],
            correct_answer: 1,
            explanation: "Always pull over safely to avoid blocking traffic and ensure your safety."
          },
          {
            question: "What should you turn on when stopped on the roadside?",
            options: ["Headlights", "Hazard lights", "Radio", "Air conditioning"],
            correct_answer: 1,
            explanation: "Hazard lights alert other drivers that your vehicle is stopped."
          }
        ]
      }
    }

    return fallbackContent[topic as keyof typeof fallbackContent] || {
      title: `Traffic Safety: ${topic}`,
      description: `Learn about ${topic} for safe driving in ${country}.`,
      content: `This lesson covers important aspects of ${topic} for drivers in ${country}. Understanding these concepts is essential for road safety.

Key points:
• Follow local traffic laws
• Stay alert and focused
• Respect other road users
• Maintain your vehicle properly
• Practice defensive driving

Safety is everyone's responsibility on the road.`,
      quiz_questions: [
        {
          question: "What is the most important aspect of road safety?",
          options: ["Speed", "Following traffic laws", "Loud music", "Expensive car"],
          correct_answer: 1,
          explanation: "Following traffic laws is fundamental to road safety."
        },
        {
          question: "Who is responsible for road safety?",
          options: ["Only police", "Only drivers", "Everyone", "Only pedestrians"],
          correct_answer: 2,
          explanation: "Road safety is everyone's responsibility - drivers, pedestrians, and cyclists."
        },
        {
          question: "What should you do to stay safe while driving?",
          options: ["Use phone", "Stay alert", "Drive fast", "Ignore signals"],
          correct_answer: 1,
          explanation: "Staying alert and focused is crucial for safe driving."
        }
      ]
    }
  }

  private getFallbackGameContent(country: string, language: string, gameType: string): GameContent {
    return {
      id: `fallback_${gameType}_${Date.now()}`,
      name: `Traffic Safety ${gameType.charAt(0).toUpperCase() + gameType.slice(1)}`,
      description: `Interactive traffic safety game for ${country}`,
      type: gameType as any,
      content: {
        questions: [
          {
            q: "What does a red traffic light mean?",
            a: "Stop completely"
          },
          {
            q: "When should you wear a seatbelt?",
            a: "Always when in a vehicle"
          },
          {
            q: "What should you do at a stop sign?",
            a: "Come to a complete stop"
          }
        ],
        placeholder: false
      }
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) return false
    
    try {
      await this.makeRequest("Test", 1000)
      return true
    } catch {
      return false
    }
  }
}

export const geminiService = new GeminiService()
export default geminiService