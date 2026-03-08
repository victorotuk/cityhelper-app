import { Monitor, Apple, Play } from 'lucide-react';
import { APP_CONFIG } from '../../lib/config';

export default function LandingFooter() {
  const { downloads, appStoreUrl, playStoreUrl } = APP_CONFIG;

  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      {(downloads || appStoreUrl || playStoreUrl) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px 20px', marginBottom: '20px' }}>
          {downloads?.mac && (
            <a
              href={downloads.mac}
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Monitor size={16} />
              Mac
            </a>
          )}
          {downloads?.windows && (
            <a
              href={downloads.windows}
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Monitor size={16} />
              Windows
            </a>
          )}
          {downloads?.linux && (
            <a
              href={downloads.linux}
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Monitor size={16} />
              Linux
            </a>
          )}
          {appStoreUrl && (
            <a
              href={appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Apple size={16} />
              App Store
            </a>
          )}
          {playStoreUrl && (
            <a
              href={playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Play size={16} />
              Play Store
            </a>
          )}
        </div>
      )}
      <p style={{ fontSize: '14px', color: '#6b6b70', marginBottom: '16px' }}>
        Built for the nights when you&apos;re tired of guessing which deadline you forgot.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', fontSize: '12px', color: '#6b6b70' }}>
        <span>© 2025 {APP_CONFIG.formalName || APP_CONFIG.name}</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <a href="#" style={{ color: '#6b6b70' }}>Privacy</a>
        <span style={{ opacity: 0.4 }}>·</span>
        <a href="#" style={{ color: '#6b6b70' }}>Terms</a>
      </div>
    </footer>
  );
}
