import { useState, useRef } from 'react';
import { Camera, Upload, Loader, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * Reusable Scan/Upload component with AI extraction
 * Uses backend AI - no user API key required
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
  label = "Scan or Upload"
}) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      if (onExtracted && data.extracted) {
        onExtracted(data.extracted, file);
        setSuccess(true);
      } else if (onExtracted && data.raw) {
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

  if (compact) {
    return (
      <div className="scan-upload-compact">
        <button 
          className="scan-compact-btn"
          onClick={() => cameraInputRef.current?.click()}
          disabled={scanning}
          title="Take photo"
        >
          {scanning ? <Loader size={18} className="spin" /> : <Camera size={18} />}
        </button>
        <button 
          className="scan-compact-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={scanning}
          title="Upload file"
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
            disabled={scanning}
          >
            {scanning ? <Loader size={24} className="spin" /> : <Camera size={24} />}
            <span>Take Photo</span>
          </button>
          <button 
            className="scan-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
          >
            <Upload size={24} />
            <span>Upload</span>
          </button>
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

// Pre-built extraction prompts for common document types
export const EXTRACT_PROMPTS = {
  parkingTicket: `Extract from this parking ticket and return ONLY JSON:
{"ticketNumber":"","licensePlate":"","amount":"","date":"YYYY-MM-DD","city":"","location":""}`,

  passport: `Extract from this passport and return ONLY JSON:
{"fullName":"","passportNumber":"","nationality":"","dateOfBirth":"YYYY-MM-DD","expiryDate":"YYYY-MM-DD","issuingCountry":""}`,

  visa: `Extract from this visa/permit and return ONLY JSON:
{"type":"","number":"","holderName":"","expiryDate":"YYYY-MM-DD","issueDate":"YYYY-MM-DD","conditions":""}`,

  driversLicense: `Extract from this driver's license and return ONLY JSON:
{"fullName":"","licenseNumber":"","dateOfBirth":"YYYY-MM-DD","expiryDate":"YYYY-MM-DD","class":"","address":"","province":""}`,

  healthCard: `Extract from this health card and return ONLY JSON:
{"fullName":"","cardNumber":"","expiryDate":"YYYY-MM-DD","province":""}`,

  t4: `Extract from this T4 tax slip and return ONLY JSON:
{"year":"","employerName":"","employmentIncome":"","incomeTaxDeducted":"","cppContributions":"","eiPremiums":"","employeeNumber":""}`,

  receipt: `Extract from this receipt and return ONLY JSON:
{"vendor":"","date":"YYYY-MM-DD","total":"","items":[],"taxAmount":"","category":""}`,

  businessLicense: `Extract from this business license and return ONLY JSON:
{"businessName":"","licenseNumber":"","type":"","expiryDate":"YYYY-MM-DD","issueDate":"YYYY-MM-DD","city":""}`,

  vehicleRegistration: `Extract from this vehicle registration and return ONLY JSON:
{"ownerName":"","plateNumber":"","vin":"","make":"","model":"","year":"","expiryDate":"YYYY-MM-DD"}`,

  generic: `Extract all key information from this document and return ONLY JSON with relevant fields like:
{"documentType":"","name":"","number":"","date":"","expiryDate":"","amount":"","otherDetails":""}`
};
