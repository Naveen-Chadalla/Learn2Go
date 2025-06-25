import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, User, Home, BookOpen } from 'lucide-react'

const AuthFlowDiagram: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
        Authentication Flow & Login Triggers
      </h2>
      
      {/* Flow Steps */}
      <div className="space-y-8">
        {/* Step 1: User Access */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-4 p-4 bg-blue-50 rounded-xl"
        >
          <div className="bg-blue-500 rounded-full p-3">
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">User Tries to Access</h3>
            <p className="text-gray-600">Any protected route or clicks login</p>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400" />
        </motion.div>

        {/* Step 2: Auth Check */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center space-x-4 p-4 bg-yellow-50 rounded-xl"
        >
          <div className="bg-yellow-500 rounded-full p-3">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Authentication Check</h3>
            <p className="text-gray-600">System checks if user is logged in</p>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400" />
        </motion.div>

        {/* Decision Point */}
        <div className="flex justify-center">
          <div className="bg-gray-100 rounded-xl p-6 text-center">
            <h3 className="font-semibold text-gray-900 mb-2">Is User Authenticated?</h3>
            <div className="flex space-x-8">
              <div className="text-green-600 font-medium">✓ YES</div>
              <div className="text-red-600 font-medium">✗ NO</div>
            </div>
          </div>
        </div>

        {/* Two Paths */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Authenticated Path */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 bg-green-50 rounded-xl border-2 border-green-200"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-green-500 rounded-full p-2">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-green-900">Authenticated</h3>
            </div>
            <ul className="space-y-2 text-green-800">
              <li>• Redirect to Dashboard</li>
              <li>• Start data preloading</li>
              <li>• Show loading animation</li>
              <li>• Access granted</li>
            </ul>
          </motion.div>

          {/* Unauthenticated Path */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 bg-red-50 rounded-xl border-2 border-red-200"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-red-500 rounded-full p-2">
                <Home className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-red-900">Not Authenticated</h3>
            </div>
            <ul className="space-y-2 text-red-800">
              <li>• <strong>Redirect to /login</strong></li>
              <li>• Save intended destination</li>
              <li>• Show login form</li>
              <li>• Wait for credentials</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Login Triggers */}
      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-4">Login Page Opens When:</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Direct Access:</h4>
            <ul className="space-y-1 text-gray-600 text-sm">
              <li>• User navigates to /login</li>
              <li>• Clicks "Login" from home page</li>
              <li>• Clicks "Login" from signup page</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Automatic Redirects:</h4>
            <ul className="space-y-1 text-gray-600 text-sm">
              <li>• Accessing /dashboard without auth</li>
              <li>• Accessing /lessons/:id without auth</li>
              <li>• Accessing /results without auth</li>
              <li>• Accessing /admin without auth</li>
              <li>• Session expires</li>
            </ul>
          </div>
        </div>
      </div>

      {/* After Login */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl">
        <h3 className="font-semibold text-blue-900 mb-2">After Successful Login:</h3>
        <p className="text-blue-800">
          User is redirected to their intended destination (or dashboard by default) and 
          the data preloading process begins immediately.
        </p>
      </div>
    </div>
  )
}

export default AuthFlowDiagram