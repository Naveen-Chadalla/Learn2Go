import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { DataProvider } from './contexts/DataContext'
import { useActivityTracking } from './hooks/useActivityTracking'
import { useToast } from './hooks/useToast'
import ProtectedRoute from './components/ProtectedRoute'
import AuthRedirect from './components/AuthRedirect'
import DataLoader from './components/DataLoader'
import ModernNavbar from './components/Layout/ModernNavbar'
import AIAssistant from './components/AIAssistant'
import { ToastContainer } from './components/UI/Toast'

// Import design system styles
import './styles/design-system.css'

// Pages
import Home from './pages/Home'
import Login from './pages/Auth/Login'
import Signup from './pages/Auth/Signup'
import Dashboard from './pages/Dashboard'
import LessonDetail from './pages/Lessons/LessonDetail'
import Results from './pages/Results'
import Leaderboard from './pages/Leaderboard'
import AdminDashboard from './pages/Admin/AdminDashboard'

// Activity tracking wrapper component
const ActivityTrackingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useActivityTracking()
  return <>{children}</>
}

function App() {
  const { toasts, removeToast } = useToast()

  return (
    <LanguageProvider>
      <AuthProvider>
        <DataProvider>
          <Router>
            <AuthRedirect>
              <DataLoader>
                <ActivityTrackingWrapper>
                  <div className="min-h-screen bg-neutral-50">
                    <ModernNavbar />
                    <Routes>
                      {/* Public routes - will redirect to dashboard if authenticated */}
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      
                      {/* Protected routes - require authentication */}
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/lessons/:id"
                        element={
                          <ProtectedRoute>
                            <LessonDetail />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/results"
                        element={
                          <ProtectedRoute>
                            <Results />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/leaderboard"
                        element={
                          <ProtectedRoute>
                            <Leaderboard />
                          </ProtectedRoute>
                        }
                      />
                      
                      {/* Admin only routes */}
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute adminOnly>
                            <AdminDashboard />
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                    
                    {/* AI Assistant - Only show for authenticated users */}
                    <ProtectedRoute requireAuth={false}>
                      <AIAssistant />
                    </ProtectedRoute>

                    {/* Toast Notifications */}
                    <ToastContainer toasts={toasts} onClose={removeToast} />
                  </div>
                </ActivityTrackingWrapper>
              </DataLoader>
            </AuthRedirect>
          </Router>
        </DataProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App