import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Loader, X, Check, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { APP_CONFIG } from '../lib/config';
import { useAuthStore } from '../stores/authStore';

/**
 * Reusable Scan/Upload component with AI extraction
 * Uses backend AI - no user API key required
 * Now includes rate limiting awareness and usage display
 * 
 * Props:
 * - onExtracted: (data) => void - Called with extracted data
 * - extractPrompt: string - Custom prompt for what to extract
 * - onFileSelected: (file, base64) => void - Called with raw file if needed
 * - showPreview: boolean - Show image preview after upload
 * - compact: boolean - Smaller button layout
 * - label: string - Custom label text
 */
export default function ScanUpload({ 
  onExtracted, 
  extractPrompt,
  onFileSelected,
  showPreview = false,
  compact = false,
  label: _label = "Scan or Upload"
}) {
  const { user } = useAuthStore();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [success, setSuccess] = useState(false);
  const [scanUsage, setScanUsage] = useState(null); // { count, limit, tier }
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Fetch scan usage on mount
  useEffect(() => {
    if (!user) return;
    const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    supabase
      .from('scan_usage')
      .select('scan_count')
      .eq('user_id', user.id)
      .eq('month', month)
      .single()
      .then(({ data }) => {
        const count = data?.scan_count ?? 0;
        // Default to free tier limit; backend enforces the real limit
        const limit = APP_CONFIG.pricing?.free?.scanLimit ?? 10;
        setScanUsage({ count, limit, tier: 'free' });
      });
  }, [user]);

  const defaultPrompt = `Extract all relevant information from this document/image. 
Return ONLY a JSON object with the data you find. Common fields might include:
- name, date, expiry_date, number, amount, address, type, category
Use null for fields not found. Be thorough.`;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setError('');
    setSuccess(false);

    try {
      // Convert to base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          if (showPreview) setPreview(result);
          resolve(result);
        };
        reader.readAsDataURL(file);
      });

      // If caller just wants the file, not AI extraction
      if (onFileSelected) {
        onFileSelected(file, base64);
        if (!onExtracted) {
          setScanning(false);
          setSuccess(true);
          return;
        }
      }

      // Call backend AI scan function
      const { data, error: fnError } = await supabase.functions.invoke('ai-scan', {
        body: { 
          image: base64,
          prompt: extractPrompt || defaultPrompt
        }
      });

      // Handle rate limit response
      if (data?.limit_reached) {
        const tierName = APP_CONFIG.pricing?.[data.tier]?.name || 'Free';
        setError(`Scan limit reached (${data.scan_count}/${data.scan_limit} for ${tierName} plan). ${
          data.tier === 'business' ? 'Contact support for more.' : 'Upgrade for more scans.'
        }`);
        setScanning(false);
        return;
      }

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      // Update local usage count
      if (scanUsage) {
        setScanUsage(prev => prev ? { ...prev, count: prev.count + 1 } : prev);
      }

      if (onExtracted && data?.extracted) {
        onExtracted(data.extracted, file);
        setSuccess(true);
      } else if (onExtracted && data?.raw) {
        onExtracted({ rawText: data.raw }, file);
        setSuccess(true);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError(err.message || 'Could not read. Try again or enter manually.');
    }

    setScanning(false);
  };

  const clearPreview = () => {
    setPreview(null);
    setSuccess(false);
  };

  const usageText = scanUsage
    ? `${scanUsage.count}/${scanUsage.limit} scans used this month`
    : null;

  const nearLimit = scanUsage && scanUsage.count >= scanUsage.limit * 0.8;
  const atLimit = scanUsage && scanUsage.count >= scanUsage.limit;

  if (compact) {
    return (
      <div className="scan-upload-compact">
        <button 
          className="scan-compact-btn"
          onClick={() => cameraInputRef.current?.click()}
          disabled={scanning || atLimit}
          title={atLimit ? 'Scan limit reached' : 'Take photo'}
        >
          {scanning ? <Loader size={18} className="spin" /> : <Camera size={18} />}
        </button>
        <button 
          className="scan-compact-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={scanning || atLimit}
          title={atLimit ? 'Scan limit reached' : 'Upload file'}
        >
          <Upload size={18} />
        </button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
        {error && <span className="scan-compact-error" title={error}>!</span>}
        {success && <Check size={16} className="scan-compact-success" />}
      </div>
    );
  }

  return (
    <div className="scan-upload">
      {preview && showPreview ? (
        <div className="scan-preview">
          <img src={preview} alt="Preview" />
          <button className="scan-preview-close" onClick={clearPreview}>
            <X size={16} />
          </button>
          {success && (
            <div className="scan-preview-success">
              <Check size={16} /> Extracted!
            </div>
          )}
        </div>
      ) : (
        <div className="scan-options">
          <button 
            className="scan-btn"
            onClick={() => cameraInputRef.current?.click()}
            disabled={scanning || atLimit}
          >
            {scanning ? <Loader size={24} className="spin" /> : <Camera size={24} />}
            <span>Take Photo</span>
          </button>
          <button 
            className="scan-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning || atLimit}
          >
            <Upload size={24} />
            <span>Upload</span>
          </button>
        </div>
      )}

      {/* Scan usage indicator */}
      {usageText && (
        <div className={`scan-usage ${nearLimit ? 'scan-usage-warn' : ''} ${atLimit ? 'scan-usage-limit' : ''}`}>
          {nearLimit && <AlertTriangle size={14} />}
          <span>{usageText}</span>
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.jpg,.jpeg,.png,.webp"
        onChange={handleFile}
        style={{ display: 'none' }}
      />

      {scanning && (
        <div className="scan-status">
          <Loader size={16} className="spin" />
          <span>Reading document...</span>
        </div>
      )}

      {error && <div className="scan-error">{error}</div>}
    </div>
  );
}
