import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Palette, 
  Type, 
  Square, 
  Circle, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Info,
  XCircle,
  Search,
  User,
  Mail
} from 'lucide-react'
import Button from './UI/Button'
import Card from './UI/Card'
import Input from './UI/Input'
import SearchBar from './UI/SearchBar'
import ProgressIndicator from './UI/ProgressIndicator'
import Tooltip from './UI/Tooltip'
import LoadingSpinner from './UI/LoadingSpinner'

const StyleGuide: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')

  const colors = {
    primary: [
      { name: 'Primary 50', value: '#f0f9ff', class: 'bg-primary-50' },
      { name: 'Primary 100', value: '#e0f2fe', class: 'bg-primary-100' },
      { name: 'Primary 200', value: '#bae6fd', class: 'bg-primary-200' },
      { name: 'Primary 300', value: '#7dd3fc', class: 'bg-primary-300' },
      { name: 'Primary 400', value: '#38bdf8', class: 'bg-primary-400' },
      { name: 'Primary 500', value: '#0ea5e9', class: 'bg-primary-500' },
      { name: 'Primary 600', value: '#0284c7', class: 'bg-primary-600' },
      { name: 'Primary 700', value: '#0369a1', class: 'bg-primary-700' },
      { name: 'Primary 800', value: '#075985', class: 'bg-primary-800' },
      { name: 'Primary 900', value: '#0c4a6e', class: 'bg-primary-900' },
    ],
    secondary: [
      { name: 'Secondary 50', value: '#faf5ff', class: 'bg-secondary-50' },
      { name: 'Secondary 100', value: '#f3e8ff', class: 'bg-secondary-100' },
      { name: 'Secondary 200', value: '#e9d5ff', class: 'bg-secondary-200' },
      { name: 'Secondary 300', value: '#d8b4fe', class: 'bg-secondary-300' },
      { name: 'Secondary 400', value: '#c084fc', class: 'bg-secondary-400' },
      { name: 'Secondary 500', value: '#a855f7', class: 'bg-secondary-500' },
      { name: 'Secondary 600', value: '#9333ea', class: 'bg-secondary-600' },
      { name: 'Secondary 700', value: '#7c3aed', class: 'bg-secondary-700' },
      { name: 'Secondary 800', value: '#6b21b6', class: 'bg-secondary-800' },
      { name: 'Secondary 900', value: '#581c87', class: 'bg-secondary-900' },
    ],
    neutral: [
      { name: 'White', value: '#ffffff', class: 'bg-white' },
      { name: 'Neutral 50', value: '#f9fafb', class: 'bg-neutral-50' },
      { name: 'Neutral 100', value: '#f3f4f6', class: 'bg-neutral-100' },
      { name: 'Neutral 200', value: '#e5e7eb', class: 'bg-neutral-200' },
      { name: 'Neutral 300', value: '#d1d5db', class: 'bg-neutral-300' },
      { name: 'Neutral 400', value: '#9ca3af', class: 'bg-neutral-400' },
      { name: 'Neutral 500', value: '#6b7280', class: 'bg-neutral-500' },
      { name: 'Neutral 600', value: '#4b5563', class: 'bg-neutral-600' },
      { name: 'Neutral 700', value: '#374151', class: 'bg-neutral-700' },
      { name: 'Neutral 800', value: '#1f2937', class: 'bg-neutral-800' },
      { name: 'Neutral 900', value: '#111827', class: 'bg-neutral-900' },
    ]
  }

  const typography = [
    { name: 'Heading 1', class: 'text-6xl font-bold', sample: 'The quick brown fox' },
    { name: 'Heading 2', class: 'text-5xl font-bold', sample: 'The quick brown fox' },
    { name: 'Heading 3', class: 'text-4xl font-bold', sample: 'The quick brown fox' },
    { name: 'Heading 4', class: 'text-3xl font-bold', sample: 'The quick brown fox' },
    { name: 'Heading 5', class: 'text-2xl font-bold', sample: 'The quick brown fox' },
    { name: 'Heading 6', class: 'text-xl font-bold', sample: 'The quick brown fox' },
    { name: 'Body Large', class: 'text-lg', sample: 'The quick brown fox jumps over the lazy dog' },
    { name: 'Body', class: 'text-base', sample: 'The quick brown fox jumps over the lazy dog' },
    { name: 'Body Small', class: 'text-sm', sample: 'The quick brown fox jumps over the lazy dog' },
    { name: 'Caption', class: 'text-xs', sample: 'The quick brown fox jumps over the lazy dog' },
  ]

  const progressSteps = [
    { id: '1', title: 'Step 1', description: 'First step', status: 'completed' as const },
    { id: '2', title: 'Step 2', description: 'Second step', status: 'current' as const },
    { id: '3', title: 'Step 3', description: 'Third step', status: 'pending' as const },
    { id: '4', title: 'Step 4', description: 'Fourth step', status: 'pending' as const },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">Learn2Go Design System</h1>
          <p className="text-lg text-neutral-600">
            A comprehensive design system for modern, accessible, and beautiful user interfaces
          </p>
        </div>

        {/* Colors */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-neutral-900 mb-8 flex items-center">
            <Palette className="h-8 w-8 mr-3" />
            Color Palette
          </h2>
          
          {Object.entries(colors).map(([category, colorArray]) => (
            <div key={category} className="mb-8">
              <h3 className="text-xl font-semibold text-neutral-800 mb-4 capitalize">
                {category} Colors
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
                {colorArray.map((color) => (
                  <motion.div
                    key={color.name}
                    whileHover={{ scale: 1.05 }}
                    className="text-center"
                  >
                    <div 
                      className={`${color.class} w-full h-16 rounded-lg shadow-md border border-neutral-200 mb-2`}
                    />
                    <p className="text-xs font-medium text-neutral-700">{color.name}</p>
                    <p className="text-xs text-neutral-500">{color.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Typography */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-neutral-900 mb-8 flex items-center">
            <Type className="h-8 w-8 mr-3" />
            Typography
          </h2>
          
          <Card>
            <Card.Body>
              <div className="space-y-6">
                {typography.map((type) => (
                  <div key={type.name} className="flex items-center justify-between border-b border-neutral-200 pb-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-600 mb-1">{type.name}</p>
                      <p className={`${type.class} text-neutral-900`}>{type.sample}</p>
                    </div>
                    <code className="text-sm bg-neutral-100 px-2 py-1 rounded">
                      {type.class}
                    </code>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </section>

        {/* Buttons */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-neutral-900 mb-8 flex items-center">
            <Square className="h-8 w-8 mr-3" />
            Buttons
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold">Button Variants</h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <Button variant="primary">Primary Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                    <Button variant="danger">Danger Button</Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <Button variant="primary" icon={<CheckCircle className="h-4 w-4" />}>
                      With Icon
                    </Button>
                    <Button variant="primary" loading>
                      Loading
                    </Button>
                    <Button variant="primary" disabled>
                      Disabled
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold">Button Sizes</h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        </section>

        {/* Form Elements */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-neutral-900 mb-8 flex items-center">
            <Circle className="h-8 w-8 mr-3" />
            Form Elements
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold">Input Fields</h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  <Input
                    label="Default Input"
                    placeholder="Enter text here..."
                  />
                  
                  <Input
                    label="Input with Icon"
                    placeholder="Enter email..."
                    icon={<Mail className="h-4 w-4" />}
                  />
                  
                  <Input
                    label="Password Input"
                    type="password"
                    placeholder="Enter password..."
                    showPasswordToggle
                  />
                  
                  <Input
                    label="Success State"
                    placeholder="Valid input"
                    success="This looks good!"
                  />
                  
                  <Input
                    label="Error State"
                    placeholder="Invalid input"
                    error="This field is required"
                  />
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold">Search Bar</h3>
              </Card.Header>
              <Card.Body>
                <SearchBar
                  placeholder="Search for anything..."
                  onSearch={(query, filters) => console.log(query, filters)}
                  results={[
                    {
                      id: '1',
                      title: 'Traffic Safety Basics',
                      description: 'Learn the fundamentals of road safety',
                      type: 'lesson',
                      category: 'safety'
                    },
                    {
                      id: '2',
                      title: 'Road Signs Quiz',
                      description: 'Test your knowledge of traffic signs',
                      type: 'quiz',
                      category: 'signs'
                    }
                  ]}
                />
              </Card.Body>
            </Card>
          </div>
        </section>

        {/* Progress Indicators */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-neutral-900 mb-8 flex items-center">
            <Zap className="h-8 w-8 mr-3" />
            Progress Indicators
          </h2>
          
          <div className="grid gap-8">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold">Horizontal Progress</h3>
              </Card.Header>
              <Card.Body>
                <ProgressIndicator
                  steps={progressSteps}
                  orientation="horizontal"
                  showLabels={true}
                />
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold">Vertical Progress</h3>
              </Card.Header>
              <Card.Body>
                <ProgressIndicator
                  steps={progressSteps}
                  orientation="vertical"
                  showLabels={true}
                />
              </Card.Body>
            </Card>
          </div>
        </section>

        {/* Loading States */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-neutral-900 mb-8 flex items-center">
            <Circle className="h-8 w-8 mr-3" />
            Loading States
          </h2>
          
          <Card>
            <Card.Body>
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Small Spinner</h3>
                  <LoadingSpinner size="sm" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Medium Spinner</h3>
                  <LoadingSpinner size="md" text="Loading..." />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Large Spinner</h3>
                  <LoadingSpinner size="lg" text="Please wait..." />
                </div>
              </div>
            </Card.Body>
          </Card>
        </section>

        {/* Interactive Elements */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-neutral-900 mb-8 flex items-center">
            <Zap className="h-8 w-8 mr-3" />
            Interactive Elements
          </h2>
          
          <Card>
            <Card.Body>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Tooltips</h3>
                  <div className="flex gap-4">
                    <Tooltip content="This is a tooltip on top" position="top">
                      <Button variant="secondary">Top</Button>
                    </Tooltip>
                    <Tooltip content="This is a tooltip on bottom" position="bottom">
                      <Button variant="secondary">Bottom</Button>
                    </Tooltip>
                    <Tooltip content="This is a tooltip on left" position="left">
                      <Button variant="secondary">Left</Button>
                    </Tooltip>
                    <Tooltip content="This is a tooltip on right" position="right">
                      <Button variant="secondary">Right</Button>
                    </Tooltip>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Cards</h3>
                  <div className="space-y-4">
                    <Card hover>
                      <Card.Header>
                        <h4 className="font-semibold">Interactive Card</h4>
                      </Card.Header>
                      <Card.Body>
                        <p className="text-sm text-neutral-600">
                          This card has hover effects and smooth animations.
                        </p>
                      </Card.Body>
                      <Card.Footer>
                        <Button size="sm">Action</Button>
                      </Card.Footer>
                    </Card>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </section>

        {/* Accessibility Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-neutral-900 mb-8 flex items-center">
            <CheckCircle className="h-8 w-8 mr-3" />
            Accessibility Features
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold">WCAG 2.1 Compliance</h3>
              </Card.Header>
              <Card.Body>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>High contrast ratios (4.5:1 minimum)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Keyboard navigation support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Screen reader compatibility</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Focus management</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Semantic HTML structure</span>
                  </li>
                </ul>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold">Responsive Design</h3>
              </Card.Header>
              <Card.Body>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Mobile-first approach</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Flexible grid system</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Touch-friendly interactions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Optimized for all screen sizes</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Fast loading performance</span>
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </div>
        </section>

        {/* Design Principles */}
        <section>
          <h2 className="text-3xl font-bold text-neutral-900 mb-8 flex items-center">
            <Info className="h-8 w-8 mr-3" />
            Design Principles
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <Card.Body className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Simplicity</h3>
                <p className="text-neutral-600 text-sm">
                  Clean, minimal design that focuses on user needs without unnecessary complexity.
                </p>
              </Card.Body>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <Card.Body className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Accessibility</h3>
                <p className="text-neutral-600 text-sm">
                  Inclusive design that works for everyone, regardless of ability or technology.
                </p>
              </Card.Body>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <Card.Body className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Circle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Consistency</h3>
                <p className="text-neutral-600 text-sm">
                  Unified patterns and behaviors that create predictable user experiences.
                </p>
              </Card.Body>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}

export default StyleGuide