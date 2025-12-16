import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Subscribers from './pages/Subscribers'
import Signals from './pages/Signals'
import Settings from './pages/Settings'
import Billing from './pages/Billing'
import Join from './pages/Join'
import Invites from './pages/Invites'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminHostDetail from './pages/admin/AdminHostDetail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Activate from './pages/Activate'
import SubscriberLogin from './pages/subscriber/SubscriberLogin'
import SubscriberDashboard from './pages/subscriber/SubscriberDashboard'
import SubscriberSettings from './pages/subscriber/SubscriberSettings'
import SubscriberTrades from './pages/subscriber/SubscriberTrades'
import Landing from './pages/Landing'
import NotFound from './pages/NotFound'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/hosts/:id" element={<AdminHostDetail />} />
      
      {/* Subscriber portal routes */}
      <Route path="/subscriber/login" element={<SubscriberLogin />} />
      <Route path="/subscriber/dashboard" element={<SubscriberDashboard />} />
      <Route path="/subscriber/settings" element={<SubscriberSettings />} />
      <Route path="/subscriber/trades" element={<SubscriberTrades />} />
      
      {/* Landing page */}
      <Route path="/home" element={<Landing />} />
      
      {/* Public routes */}
      <Route path="/join/:code" element={<Join />} />
      <Route path="/activate/:slug" element={<Activate />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="subscribers" element={<Subscribers />} />
        <Route path="signals" element={<Signals />} />
        <Route path="settings" element={<Settings />} />
        <Route path="billing" element={<Billing />} />
        <Route path="invites" element={<Invites />} />
      </Route>
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
