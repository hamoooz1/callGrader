import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import Profile from './components/auth/Profile';
import UserManagement from './components/admin/UserManagement';
import DashboardPage from './pages/DashboardPage';
import CallListPage from './pages/CallListPage';
import CallDetailPage from './pages/CallDetailPage';
import EvaluationPage from './pages/EvaluationPage';
import EvaluationsListPage from './pages/EvaluationsListPage';
import UploadCallPage from './pages/UploadCallPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Toaster position="top-right" />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/calls" element={
              <ProtectedRoute>
                <CallListPage />
              </ProtectedRoute>
            } />
            <Route path="/calls/:id" element={
              <ProtectedRoute>
                <CallDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/evaluations" element={
              <ProtectedRoute>
                <EvaluationsListPage />
              </ProtectedRoute>
            } />
            <Route path="/evaluations/:id" element={
              <ProtectedRoute>
                <EvaluationPage />
              </ProtectedRoute>
            } />
            <Route path="/upload" element={
              <ProtectedRoute>
                <UploadCallPage />
              </ProtectedRoute>
            } />
            
            {/* Admin routes */}
            <Route path="/admin/users" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            } />
            
            {/* Redirect to login for unknown routes */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
