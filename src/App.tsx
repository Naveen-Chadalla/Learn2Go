import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { DataProvider } from './contexts/DataContext'
import { useActivityTracking } from './hooks/useActivityTracking'
import ProtectedRoute from './components/ProtectedRoute'
import AuthRedirect from './components/AuthRedirect'
import DataLoader from './components/DataLoader'
import Navbar from './components/Layout/Navbar'
import AIAssistant from './components/AIAssistant'

// Pages
import Home from './pages/Home'
import Login from './pages/Auth/Login'
import Signup from './pages/Auth/Signup'
import Dashboard from './pages/Dashboard'
import LessonDetail from './pages/Lessons/LessonDetail'
import Results from './pages/Results'
import Leaderboard from './pages/Leaderboard'
import AdminDashboard from './pages/Admin/AdminDashboard'
import Certificate from './pages/Certificate'

// Activity tracking wrapper component
const ActivityTrackingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useActivityTracking()
  return <>{children}</>
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <DataProvider>
          <Router>
            <AuthRedirect>
              <DataLoader>
                <ActivityTrackingWrapper>
                  <div className="min-h-screen bg-gray-50">
                    <Navbar />
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
                      <Route
                        path="/certificate"
                        element={
                          <ProtectedRoute>
                            <Certificate />
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