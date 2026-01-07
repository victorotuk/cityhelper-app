import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { APP_CONFIG } from '../lib/config';
import { ArrowRight, ArrowLeft, Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const isReset = searchParams.get('reset') === 'true';
  
  const [mode, setMode] = useState(isReset ? 'newpassword' : 'signin'); // 'signin', 'signup', 'forgot', 'newpassword'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuthStore();
  const navigate = useNavigate();

  // Check if coming from password reset link
  useEffect(() => {
    if (isReset) {
      setMode('newpassword');
    }
  }, [isReset]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'newpassword') {
        // Set new password after reset
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setSuccess('Password updated! You can now sign in.');
        setMode('signin');
        setNewPassword('');
        // Clear the URL param
        navigate('/auth', { replace: true });
      } else if (mode === 'forgot') {
        // Send password reset email
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?reset=true`,
        });
        if (error) throw error;
        setSuccess('Check your email for a password reset link!');
      } else if (mode === 'signup') {
        const { data, error } = await signUpWithEmail(email, password);
        if (error) throw error;
        
        // Send welcome email (fire and forget)
        supabase.functions.invoke('send-email', {
          body: { to: email, type: 'welcome' }
        }).catch(console.error);

        // Check if email confirmation is required
        if (data?.user && !data?.session) {
          setSuccess('Account created! Check your email to confirm, then sign in.');
          setMode('signin');
        } else {
          navigate('/dashboard');
        }
      } else {
        await signInWithEmail(email, password);
        // Send sign-in notification email (fire and forget)
        supabase.functions.invoke('send-email', {
          body: { 
            to: email, 
            type: 'signin',
            data: { 
              time: new Date().toLocaleString(),
              device: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
            }
          }
        }).catch(console.error);
        navigate('/dashboard');
      }
    } catch (err) {
      // Friendly error messages
      let message = err.message;
      if (message.includes('Invalid login credentials')) {
        message = 'Wrong email or password. Try again or reset your password.';
      } else if (message.includes('Email not confirmed')) {
        message = 'Please confirm your email first. Check your inbox.';
      } else if (message.includes('User already registered')) {
        message = 'This email is already registered. Try signing in instead.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
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
          <div className="auth-logo">{APP_CONFIG.logo}</div>
          <h1 className="auth-title">{getTitle()}</h1>
          <p className="auth-subtitle">{getSubtitle()}</p>
        </div>

        <div className="auth-card">
          {(mode === 'signin' || mode === 'signup') && (
            <>
              <button className="btn btn-ghost" onClick={handleGoogleSignIn} style={{ width: '100%', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="auth-divider">or</div>
            </>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}
            
            {/* Email field - not shown for new password */}
            {mode !== 'newpassword' && (
              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    className="form-input with-icon"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
            )}

            {/* New password field - for reset flow */}
            {mode === 'newpassword' && (
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input with-icon with-toggle"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                    autoFocus
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="form-hint">At least 6 characters</p>
              </div>
            )}

            {/* Regular password field - for signin/signup */}
            {(mode === 'signin' || mode === 'signup') && (
              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label">Password</label>
                  {mode === 'signin' && (
                    <button 
                      type="button" 
                      className="forgot-link"
                      onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input with-toggle"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? 'Loading...' : (
                mode === 'newpassword' ? 'Update Password' :
                mode === 'forgot' ? 'Send Reset Link' :
                mode === 'signup' ? 'Create Account' : 'Sign In'
              )}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="auth-toggle">
            {mode === 'newpassword' ? (
              <>
                Changed your mind?{' '}
                <button onClick={() => { setMode('signin'); setError(''); setSuccess(''); navigate('/auth', { replace: true }); }}>
                  Back to Sign In
                </button>
              </>
            ) : mode === 'forgot' ? (
              <>
                Remember your password?{' '}
                <button onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}>
                  Sign In
                </button>
              </>
            ) : mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}>
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}>
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>

        <div className="auth-footer">
          <Link to="/">
            <ArrowLeft size={14} /> Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
