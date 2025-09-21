// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AssessmentCreate from './pages/AssessmentCreate';
import AssessmentTake from './pages/AssessmentTake';
import LoadingSpinner from './components/common/LoadingSpinner';
import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function ProtectedRoute({ children, requiredRole }) {
  const { user, userData, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  if (requiredRole && userData?.role !== requiredRole) return <Navigate to="/" />;
  
  return children;
}

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
  <Route path="/login" element={<Login />} />
  <Route 
    path="/" 
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    } 
  />
  <Route 
    path="/assessment/create" 
    element={
      <ProtectedRoute requiredRole="interviewer">
        <AssessmentCreate />
      </ProtectedRoute>
    } 
  />
  {/* Change this route to match the navigation */}
  <Route 
    path="/assessment/edit/:id" 
    element={
      <ProtectedRoute requiredRole="interviewer">
        <AssessmentCreate />
      </ProtectedRoute>
    } 
  />
  <Route 
    path="/assessment/take/:id" 
    element={
      <ProtectedRoute>
        <AssessmentTake />
      </ProtectedRoute>
    } 
  />
</Routes>
        </div>
      </Router>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;