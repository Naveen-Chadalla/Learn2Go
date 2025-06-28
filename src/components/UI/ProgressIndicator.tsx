import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Circle, Clock } from 'lucide-react'

interface Step {
  id: string
  title: string
  description?: string
  status: 'completed' | 'current' | 'pending'
}

interface ProgressIndicatorProps {
  steps: Step[]
  orientation?: 'horizontal' | 'vertical'
  showLabels?: boolean
  className?: string
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  orientation = 'horizontal',
  showLabels = true,
  className = ''
}) => {
  const completedSteps = steps.filter(step => step.status === 'completed').length
  const totalSteps = steps.length
  const progressPercentage = (completedSteps / totalSteps) * 100

  if (orientation === 'horizontal') {
    return (
      <div className={`w-full ${className}`}>
        {/* Progress Bar */}
        <div className="relative mb-8">
          <div className="progress">
            <motion.div
              className="progress-bar"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          
          {/* Step Indicators */}
          <div className="absolute top-0 left-0 w-full flex justify-between transform -translate-y-1/2">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  step.status === 'completed'
                    ? 'bg-primary-500 border-primary-500 text-white'
                    : step.status === 'current'
                    ? 'bg-white border-primary-500 text-primary-500'
                    : 'bg-white border-neutral-300 text-neutral-400'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : step.status === 'current' ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </div>
                
                {showLabels && (
                  <div className="mt-3 text-center max-w-24">
                    <p className={`text-sm font-medium ${
                      step.status === 'completed' || step.status === 'current'
                        ? 'text-neutral-800'
                        : 'text-neutral-500'
                    }`}>
                      {step.title}
                    </p>
                    {step.description && (
                      <p className="text-xs text-neutral-500 mt-1">
                        {step.description}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Progress Text */}
        <div className="text-center">
          <p className="text-sm text-neutral-600">
            Step {completedSteps + 1} of {totalSteps}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {Math.round(progressPercentage)}% complete
          </p>
        </div>
      </div>
    )
  }

  // Vertical orientation
  return (
    <div className={`${className}`}>
      <div className="space-y-6">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-4"
          >
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                step.status === 'completed'
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : step.status === 'current'
                  ? 'bg-white border-primary-500 text-primary-500'
                  : 'bg-white border-neutral-300 text-neutral-400'
              }`}>
                {step.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : step.status === 'current' ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>
              
              {index < steps.length - 1 && (
                <div className={`w-0.5 h-12 mt-2 transition-colors duration-300 ${
                  step.status === 'completed' ? 'bg-primary-500' : 'bg-neutral-300'
                }`} />
              )}
            </div>
            
            {showLabels && (
              <div className="flex-1 pb-6">
                <h3 className={`font-medium ${
                  step.status === 'completed' || step.status === 'current'
                    ? 'text-neutral-800'
                    : 'text-neutral-500'
                }`}>
                  {step.title}
                </h3>
                {step.description && (
                  <p className="text-sm text-neutral-600 mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default ProgressIndicator