export default function AuthModeSwitch({ mode, onSwitchToSignIn, onSwitchToSignUp }) {
  if (mode === 'newpassword') {
    return (
      <div className="auth-toggle">
        Changed your mind? <button type="button" onClick={onSwitchToSignIn}>Back to Sign In</button>
      </div>
    );
  }
  if (mode === 'forgot') {
    return (
      <div className="auth-toggle">
        Remember your password? <button type="button" onClick={onSwitchToSignIn}>Sign In</button>
      </div>
    );
  }
  if (mode === 'signup') {
    return (
      <div className="auth-toggle">
        Already have an account? <button type="button" onClick={onSwitchToSignIn}>Sign In</button>
      </div>
    );
  }
  return (
    <div className="auth-toggle">
      Don&apos;t have an account? <button type="button" onClick={onSwitchToSignUp}>Sign Up</button>
    </div>
  );
}
