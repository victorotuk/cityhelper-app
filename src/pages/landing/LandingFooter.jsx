import { APP_CONFIG } from '../../lib/config';

export default function LandingFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Built for the nights when you&apos;re tired of guessing which deadline you forgot.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
        <span>&copy; {new Date().getFullYear()} {APP_CONFIG.formalName || APP_CONFIG.name}</span>
        <span style={{ opacity: 0.4 }}>&middot;</span>
        <a href="#" style={{ color: 'var(--text-muted)' }}>Privacy</a>
        <span style={{ opacity: 0.4 }}>&middot;</span>
        <a href="#" style={{ color: 'var(--text-muted)' }}>Terms</a>
      </div>
    </footer>
  );
}
