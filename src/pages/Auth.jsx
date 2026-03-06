import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { APP_CONFIG } from '../lib/config';
import LogoImg from '../components/ui/LogoImg';
import AuthSocialButtons from '../components/auth/AuthSocialButtons';
import AuthForm from '../components/auth/AuthForm';
import AuthModeSwitch from '../components/auth/AuthModeSwitch';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const isReset = searchParams.get('reset') === 'true';

  const [mode, setMode] = useState(isReset ? 'newpassword' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { signInWithGoogle, signInWithAzure, signInWithEmail, signUpWithEmail } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isReset) setMode('newpassword');
  }, [isReset]);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      if (mode === 'newpassword') {
        const { error: err } = await supabase.auth.updateUser({ password: newPassword });
        if (err) throw err;
        setSuccess('Password updated! You can now sign in.');
        setMode('signin');
        setNewPassword('');
        navigate('/auth', { replace: true });
      } else if (mode === 'forgot') {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?reset=true`,
        });
        if (err) throw err;
        setSuccess('Check your email for a password reset link!');
      } else if (mode === 'signup') {
        const { data, error: err } = await signUpWithEmail(email, password);
        if (err) throw err;
        supabase.functions.invoke('send-email', { body: { to: email, type: 'welcome' } }).catch(console.error);
        if (data?.user && !data?.session) {
          setSuccess('Account created! Check your email to confirm, then sign in.');
          setMode('signin');
        } else {
          navigate('/dashboard');
        }
      } else {
        await signInWithEmail(email, password);
        supabase.functions.invoke('send-email', {
          body: {
            to: email,
            type: 'signin',
            data: {
              time: new Date().toLocaleString(),
              device: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
            },
          },
        }).catch(console.error);
        navigate('/dashboard');
      }
    } catch (err) {
      let message = err.message;
      if (message.includes('Invalid login credentials')) message = 'Wrong email or password. Try again or reset your password.';
      else if (message.includes('Email not confirmed')) message = 'Please confirm your email first. Check your inbox.';
      else if (message.includes('User already registered')) message = 'This email is already registered. Try signing in instead.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === 'newpassword') return 'Set New Password';
    if (mode === 'forgot') return 'Reset Password';
    if (mode === 'signup') return 'Create Account';
    return 'Welcome Back';
  };

  const getSubtitle = () => {
    if (mode === 'newpassword') return 'Enter your new password below';
    if (mode === 'forgot') return "We'll send you a reset link";
    if (mode === 'signup') return 'Start tracking your compliance';
    return 'Sign in to your dashboard';
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
          {(APP_CONFIG.logoImage || APP_CONFIG.logoImageDark || APP_CONFIG.logoImageLight) ? (
            <LogoImg alt="Nava" className="auth-logo-img" />
          ) : (
            APP_CONFIG.logo
          )}
        </div>
          <h1 className="auth-title">{getTitle()}</h1>
          <p className="auth-subtitle">{getSubtitle()}</p>
        </div>

        <div className="auth-card">
          {(mode === 'signin' || mode === 'signup') && (
            <AuthSocialButtons
              onGoogle={async () => {
                try { await signInWithGoogle(); } catch (err) { setError(err.message); }
              }}
              onAzure={async () => {
                try { await signInWithAzure(); } catch (err) { setError(err.message); }
              }}
            />
          )}

          <AuthForm
            mode={mode}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            error={error}
            success={success}
            loading={loading}
            onSubmit={handleSubmit}
            onForgotClick={() => { setMode('forgot'); clearMessages(); }}
          />

          <AuthModeSwitch
            mode={mode}
            onSwitchToSignIn={() => { setMode('signin'); clearMessages(); navigate('/auth', { replace: true }); }}
            onSwitchToSignUp={() => { setMode('signup'); clearMessages(); }}
          />
        </div>

        <p className="auth-footer">
          <Link to="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
