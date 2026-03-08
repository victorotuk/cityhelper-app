import { Link, Navigate } from 'react-router-dom';
import { Monitor, Smartphone, Globe, ArrowRight, Apple, Play, ArrowLeft } from 'lucide-react';
import { APP_CONFIG } from '../lib/config';
import LogoImg from '../components/ui/LogoImg';
import { useAuthStore } from '../stores/authStore';

export default function GetStarted() {
  const { user } = useAuthStore();

  if (user) return <Navigate to="/dashboard" replace />;

  const { downloads, appStoreUrl, playStoreUrl } = APP_CONFIG;

  return (
    <div className="getstarted-page">
      <nav className="getstarted-nav">
        <Link to="/" className="getstarted-back">
          <ArrowLeft size={18} />
          <span>Back</span>
        </Link>
      </nav>

      <main className="getstarted-main">
        <div className="getstarted-header">
          <div className="getstarted-logo">
            {(APP_CONFIG.logoImage || APP_CONFIG.logoImageDark || APP_CONFIG.logoImageLight) ? (
              <LogoImg alt="Nava" className="getstarted-logo-img" />
            ) : (
              <span>{APP_CONFIG.logo}</span>
            )}
          </div>
          <h1 className="getstarted-title">Get started with {APP_CONFIG.name}</h1>
          <p className="getstarted-subtitle">Choose how you want to use {APP_CONFIG.name}. Free on every platform.</p>
        </div>

        <div className="getstarted-options">
          {/* Web — primary option */}
          <Link to="/auth" className="getstarted-card primary">
            <div className="getstarted-card-icon">
              <Globe size={28} />
            </div>
            <div className="getstarted-card-content">
              <h2>Use on the web</h2>
              <p>Sign up or sign in — start tracking immediately in your browser. No download needed.</p>
            </div>
            <ArrowRight size={20} className="getstarted-card-arrow" />
          </Link>

          {/* Desktop */}
          {downloads && (
            <div className="getstarted-card">
              <div className="getstarted-card-icon">
                <Monitor size={28} />
              </div>
              <div className="getstarted-card-content">
                <h2>Desktop app</h2>
                <p>Native app for your computer. Faster, works offline, auto-updates.</p>
                <div className="getstarted-download-links">
                  {downloads.mac && (
                    <a href={downloads.mac} className="getstarted-dl-btn">
                      <Apple size={16} /> Mac
                    </a>
                  )}
                  {downloads.windows && (
                    <a href={downloads.windows} className="getstarted-dl-btn">
                      <Monitor size={16} /> Windows
                    </a>
                  )}
                  {downloads.linux && (
                    <a href={downloads.linux} className="getstarted-dl-btn">
                      <Monitor size={16} /> Linux
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mobile */}
          {(appStoreUrl || playStoreUrl) && (
            <div className="getstarted-card">
              <div className="getstarted-card-icon">
                <Smartphone size={28} />
              </div>
              <div className="getstarted-card-content">
                <h2>Mobile app</h2>
                <p>Track deadlines on the go. Push notifications so you never miss one.</p>
                <div className="getstarted-download-links">
                  {appStoreUrl && (
                    <a href={appStoreUrl} target="_blank" rel="noopener noreferrer" className="getstarted-dl-btn">
                      <Apple size={16} /> App Store
                    </a>
                  )}
                  {playStoreUrl && (
                    <a href={playStoreUrl} target="_blank" rel="noopener noreferrer" className="getstarted-dl-btn">
                      <Play size={16} /> Google Play
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="getstarted-note">
          One account works everywhere. Sign up on web, download the app later — your data syncs across all devices.
        </p>
      </main>
    </div>
  );
}
