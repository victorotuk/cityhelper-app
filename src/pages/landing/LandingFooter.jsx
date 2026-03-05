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
      <p style={{ fontSize: '14px', color: '#6b6b70', marginBottom: '16px' }}>
        Built for the nights when you&apos;re tired of guessing which deadline you forgot.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '12px', color: '#6b6b70' }}>
        <span>© 2025 {APP_CONFIG.formalName || APP_CONFIG.name}</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <a href="#" style={{ color: '#6b6b70' }}>Privacy</a>
        <span style={{ opacity: 0.4 }}>·</span>
        <a href="#" style={{ color: '#6b6b70' }}>Terms</a>
      </div>
    </footer>
  );
}
