import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import TaxEstimator from './pages/TaxEstimator';
import Assistant from './pages/Assistant';
import Documents from './pages/Documents';
import Settings from './pages/Settings';
import Apply from './pages/Apply';
import ChatBubble from './components/ChatBubble';

function ProtectedRoute({ children, showChat = true }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <>
      {children}
      {showChat && <ChatBubble />}
    </>
  );
}

function App() {
  const { initialize, loading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/tax-estimator" element={
        <ProtectedRoute><TaxEstimator /></ProtectedRoute>
      } />
      <Route path="/assistant" element={
        <ProtectedRoute showChat={false}><Assistant /></ProtectedRoute>
      } />
      <Route path="/documents" element={
        <ProtectedRoute><Documents /></ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute><Settings /></ProtectedRoute>
      } />
      <Route path="/apply" element={
        <ProtectedRoute><Apply /></ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
