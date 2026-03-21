import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Navbar from './components/Navbar'
import LoadingSpinner from './components/LoadingSpinner'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Alerts from './pages/Alerts'
import Shelters from './pages/Shelters'
import Replay from './pages/Replay'

// Inside <Routes> add:
<Route path="/replay" element={
  <ProtectedRoute>
    <AppLayout><Replay /></AppLayout>
  </ProtectedRoute>
} />

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      {children}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout><Dashboard /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/alerts" element={
          <ProtectedRoute>
            <AppLayout><Alerts /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/shelters" element={
          <ProtectedRoute>
            <AppLayout><Shelters /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
