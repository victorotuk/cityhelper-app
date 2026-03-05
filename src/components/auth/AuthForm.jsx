import { ArrowRight, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function AuthForm({
  mode,
  email,
  setEmail,
  password,
  setPassword,
  newPassword,
  setNewPassword,
  showPassword,
  setShowPassword,
  error,
  success,
  loading,
  onSubmit,
  onForgotClick,
}) {
  return (
    <form onSubmit={onSubmit} className="auth-form">
      {error && <div className="auth-error">{error}</div>}
      {success && <div className="auth-success">{success}</div>}

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

      {(mode === 'signin' || mode === 'signup') && (
        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label">Password</label>
            {mode === 'signin' && (
              <button type="button" className="forgot-link" onClick={onForgotClick}>
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
        {loading
          ? 'Loading...'
          : mode === 'newpassword'
            ? 'Update Password'
            : mode === 'forgot'
              ? 'Send Reset Link'
              : mode === 'signup'
                ? 'Create Account'
                : 'Sign In'}
        <ArrowRight size={18} />
      </button>
    </form>
  );
}
