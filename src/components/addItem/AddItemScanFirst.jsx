import { useState, useEffect, useRef } from 'react';
import { Camera, Upload, List, Smartphone } from 'lucide-react';
import { getVoicePreference, speak } from '../../lib/voice';

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function ContinueOnMobile() {
  const [showQR, setShowQR] = useState(false);
  const appUrl = window.location.origin + '/dashboard';

  if (isMobileDevice()) return null;

  return (
    <div className="continue-on-mobile">
      <button
        type="button"
        className="scan-first-btn subtle"
        onClick={() => setShowQR(!showQR)}
      >
        <Smartphone size={18} />
        <span>Continue on phone</span>
      </button>
      {showQR && (
        <div className="mobile-qr-section">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(appUrl)}`}
            alt="QR code to open Nava on your phone"
            width={160}
            height={160}
            className="mobile-qr-img"
          />
          <p className="mobile-qr-hint">
            Scan this QR code with your phone to open Nava and use your camera there.
          </p>
        </div>
      )}
    </div>
  );
}

export default function AddItemScanFirst({
  userId,
  cameraRef,
  fileRef,
  scanning,
  scanError,
  onFileChange,
  onBrowseCategories,
}) {
  const didSpeakHint = useRef(false);
  useEffect(() => {
    if (!userId || scanning || didSpeakHint.current) return;
    if (!getVoicePreference(userId)) return;
    didSpeakHint.current = true;
    speak('Track something. Take a photo or upload an image. We\'ll identify it for you. Or choose browse categories to pick manually.');
  }, [userId, scanning]);

  return (
    <div className="scan-first-screen">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onFileChange} hidden />
      <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={onFileChange} hidden />

      {scanning ? (
        <div className="scan-first-loading">
          <div className="loading-spinner" />
          <p>Identifying document...</p>
        </div>
      ) : (
        <>
          <p className="scan-first-hint">Snap a photo of any document — we&apos;ll figure out what it is.</p>
          <button type="button" className="scan-first-btn primary" onClick={() => cameraRef.current?.click()}>
            <Camera size={24} />
            <span>Scan with camera</span>
          </button>
          <button type="button" className="scan-first-btn" onClick={() => fileRef.current?.click()}>
            <Upload size={20} />
            <span>Upload a photo</span>
          </button>
          <ContinueOnMobile />
          {scanError && <p className="scan-first-error">{scanError}</p>}
          <div className="scan-first-divider"><span>or</span></div>
          <button type="button" className="scan-first-btn ghost" onClick={onBrowseCategories}>
            <List size={20} />
            <span>Browse categories</span>
          </button>
        </>
      )}
    </div>
  );
}
