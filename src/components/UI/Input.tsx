import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: string
  hint?: string
  icon?: React.ReactNode
  showPasswordToggle?: boolean
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  success,
  hint,
  icon,
  showPasswordToggle = false,
  type = 'text',
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const inputType = showPasswordToggle && type === 'password' 
    ? (showPassword ? 'text' : 'password') 
    : type

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-neutral-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}
        
        <motion.input
          whileFocus={{ scale: 1.01 }}
          className={`input ${icon ? 'pl-10' : ''} ${showPasswordToggle ? 'pr-10' : ''} ${
            error ? 'border-red-500 focus:border-red-500' : 
            success ? 'border-green-500 focus:border-green-500' : ''
          } ${className}`}
          type={inputType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {showPasswordToggle && (
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        
        {(error || success) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {error && <AlertCircle className="w-4 h-4 text-red-500" />}
            {success && <CheckCircle className="w-4 h-4 text-green-500" />}
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {(error || success || hint) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm"
          >
            {error && <p className="text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>}
            {success && <p className="text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {success}
            </p>}
            {hint && !error && !success && <p className="text-neutral-500">{hint}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Input