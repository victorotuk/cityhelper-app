import { useEffect, lazy, Suspense } from 'react';
import { Capacitor } from '@capacitor/core';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { supabase } from './lib/supabase';
import { startNotificationListener, stopNotificationListener } from './lib/notificationListener';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import TaxEstimator from './pages/TaxEstimator';
import Assistant from './pages/Assistant';
import Documents from './pages/Documents';
import Settings from './pages/Settings';
import Apply from './pages/Apply';
import Estate from './pages/Estate';
import Assets from './pages/Assets';
import Business from './pages/Business';
import WealthLearn from './pages/WealthLearn';
import ChatBubble from './components/ChatBubble';
import ChatOverlay from './components/ChatOverlay';
import UnlockScreen from './components/UnlockScreen';

const Dashboard = lazy(() => import('./pages/Dashboard'));

function ProtectedRoute({ children, showChat = true }) {
  const { user, loading, needsUnlock } = useAuthStore();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-screen-content">
          <div className="loading-spinner"></div>
          <span className="loading-text">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (needsUnlock) {
    return <UnlockScreen />;
  }

  return (
    <>
      {children}
      {showChat && <><ChatBubble /><ChatOverlay /></>}
    </>
  );
}

function App() {
  const { initialize, loading, user } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Android notification suggestions: when enabled, listen for notifications and suggest tracking
  useEffect(() => {
    if (!user || Capacitor.getPlatform() !== 'android') return;
    const getEnabled = async () => {
      const { data } = await supabase
        .from('user_settings')
        .select('notification_suggestions_enabled')
        .eq('user_id', user.id)
        .single();
      return !!data?.notification_suggestions_enabled;
    };
    const setPendingText = (text) => {
      import('./stores/sharedSuggestStore').then(({ useSharedSuggestStore }) => {
        useSharedSuggestStore.getState().setPendingText(text);
      });
    };
    startNotificationListener(user.id, getEnabled, setPendingText).catch((err) => {
      console.warn('[NotificationListener] Not available:', err?.message);
    });
    return () => stopNotificationListener();
  }, [user?.id]);

  // Share Target: when user shares text to Nava (Android/iOS), we receive it.
  // Processed on-device only. We never send shared content to our servers.
  useEffect(() => {
    if (Capacitor.getPlatform() === 'web') return;
    import('@capgo/capacitor-share-target').then(({ CapacitorShareTarget }) => {
      CapacitorShareTarget.addListener('shareReceived', async (event) => {
        const texts = event?.texts || [];
        const text = texts.join(' ').trim();
        if (text) {
          const { useSharedSuggestStore } = await import('./stores/sharedSuggestStore');
          useSharedSuggestStore.getState().setPendingText(text);
        }
      });
    }).catch(() => {});
  }, []);

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
        <ProtectedRoute>
          <Suspense fallback={<div className="loading-screen"><div className="loading-screen-content"><div className="loading-spinner"></div><span className="loading-text">Loading...</span></div></div>}>
            <Dashboard />
          </Suspense>
        </ProtectedRoute>
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
      <Route path="/estate" element={
        <ProtectedRoute><Estate /></ProtectedRoute>
      } />
      <Route path="/wealth-learn" element={
        <ProtectedRoute><WealthLearn /></ProtectedRoute>
      } />
      <Route path="/assets" element={
        <ProtectedRoute><Assets /></ProtectedRoute>
      } />
      <Route path="/business" element={
        <ProtectedRoute><Business /></ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
