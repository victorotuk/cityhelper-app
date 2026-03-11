import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Upload, List, Smartphone, X } from 'lucide-react';
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
  onCapture,
}) {
  const didSpeakHint = useRef(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!userId || scanning || didSpeakHint.current) return;
    if (!getVoicePreference(userId)) return;
    didSpeakHint.current = true;
    speak('Track something. Take a photo or upload an image. We\'ll identify it for you. Or choose browse categories to pick manually.');
  }, [userId, scanning]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks?.().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setShowCamera(false);
    setCameraError('');
  }, []);

  useEffect(() => {
    if (!showCamera) return;
    return () => {
      streamRef.current?.getTracks?.().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [showCamera]);

  const startCamera = useCallback(async () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera not available on this device');
      return;
    }
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        { video: { facingMode: 'environment' }, audio: false }
      );
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setCameraError(err?.message || 'Camera access denied');
      setShowCamera(false);
    }
  }, []);

  const handleScanWithCameraClick = () => {
    if (scanning) return;
    if (isMobileDevice()) {
      cameraRef.current?.click?.();
      return;
    }
    startCamera();
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video?.videoWidth || !onCapture) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob);
        stopCamera();
      },
      'image/jpeg',
      0.9
    );
  };

  return (
    <div className="scan-first-screen">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onFileChange} hidden />
      <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={onFileChange} hidden />

      {showCamera ? (
        <div className="scan-camera-view">
          <div className="scan-camera-header">
            <span>Point camera at document</span>
            <button type="button" className="btn-icon" onClick={stopCamera} aria-label="Close camera"><X size={20} /></button>
          </div>
          {cameraError ? (
            <p className="scan-first-error">{cameraError}. Use &quot;Upload a photo&quot; or browse categories.</p>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="scan-camera-video" />
              <div className="scan-camera-actions">
                <button type="button" className="scan-first-btn primary" onClick={handleCapture}>
                  <Camera size={24} />
                  <span>Capture photo</span>
                </button>
                <button type="button" className="scan-first-btn ghost" onClick={stopCamera}>Cancel</button>
              </div>
            </>
          )}
        </div>
      ) : scanning ? (
        <div className="scan-first-loading">
          <div className="loading-spinner" />
          <p>Identifying document...</p>
        </div>
      ) : (
        <>
          <p className="scan-first-hint">Snap a photo of any document — we&apos;ll figure out what it is.</p>
          <button type="button" className="scan-first-btn primary" onClick={handleScanWithCameraClick}>
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
