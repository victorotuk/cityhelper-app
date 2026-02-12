import { useState, useRef } from 'react';
import { X, CreditCard, ExternalLink, Clock, Copy, Check, Camera, Upload, Loader } from 'lucide-react';
import { APP_CONFIG } from '../lib/config';
import { supabase } from '../lib/supabase';

export default function PayTicket({ onClose, initialValues = {} }) {
  const [city, setCity] = useState(initialValues.city || '');
  const [ticketNumber, setTicketNumber] = useState(initialValues.ticketNumber || '');
  const [licensePlate, setLicensePlate] = useState(initialValues.licensePlate || '');
  const [copied, setCopied] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const cities = Object.entries(APP_CONFIG.parkingPortals).map(([key, val]) => ({
    id: key,
    ...val
  }));

  const selectedCity = APP_CONFIG.parkingPortals[city];

  const getPaymentUrl = () => {
    if (!selectedCity) return null;
    if (selectedCity.payUrl) {
      return selectedCity.payUrl(ticketNumber, licensePlate);
    }
    return selectedCity.pay;
  };

  const handlePayNow = () => {
    const url = getPaymentUrl();
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(ticketNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setScanError('');

    try {
      // Convert to base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

      // Call backend AI scan function
      const { data, error } = await supabase.functions.invoke('ai-scan', {
        body: { 
          image: base64,
          prompt: `Extract from this parking ticket image and return ONLY JSON:
{"ticketNumber":"","licensePlate":"","amount":"","date":"YYYY-MM-DD","city":""}
Use null for missing fields.`
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const extracted = data.extracted;
      if (extracted) {
        if (extracted.ticketNumber) setTicketNumber(extracted.ticketNumber);
        if (extracted.licensePlate) setLicensePlate(extracted.licensePlate);
        
        // Try to match city
        if (extracted.city) {
          const cityLower = extracted.city.toLowerCase();
          const matchedCity = cities.find(c => 
            c.name.toLowerCase().includes(cityLower) || 
            cityLower.includes(c.name.toLowerCase())
          );
          if (matchedCity) setCity(matchedCity.id);
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
      setScanError('Could not read ticket. Please enter details manually.');
    }

    setScanning(false);
  };

  const canProceed = city && ticketNumber;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-ticket-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💳 Pay Parking Ticket</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Scan/Upload Options */}
          <div className="scan-options">
            <button 
              className="scan-btn"
              onClick={() => cameraInputRef.current?.click()}
              disabled={scanning}
            >
              {scanning ? <Loader size={20} className="spin" /> : <Camera size={20} />}
              <span>Take Photo</span>
            </button>
            <button 
              className="scan-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
            >
              <Upload size={20} />
              <span>Upload Image</span>
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>

          {scanning && (
            <div className="scan-status">
              <Loader size={16} className="spin" />
              <span>Reading ticket...</span>
            </div>
          )}

          {scanError && (
            <div className="scan-error">{scanError}</div>
          )}

          <div className="or-divider">
            <span>or enter manually</span>
          </div>

          <div className="form-group">
            <label>City *</label>
            <select value={city} onChange={e => setCity(e.target.value)} required>
              <option value="">Select your city...</option>
              {cities.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Ticket Number *</label>
              <input
                type="text"
                value={ticketNumber}
                onChange={e => setTicketNumber(e.target.value)}
                placeholder="e.g., 12345678"
                required
              />
            </div>
            <div className="form-group">
              <label>License Plate (optional)</label>
              <input
                type="text"
                value={licensePlate}
                onChange={e => setLicensePlate(e.target.value.toUpperCase())}
                placeholder="e.g., ABCD 123"
              />
            </div>
          </div>

          {canProceed && selectedCity && (
            <div className="pay-ready">
              <div className="pay-ready-header">
                <Check size={20} />
                <span>Ready to pay!</span>
              </div>
              
              <div className="pay-instructions">
                <p>Click the button below to open <strong>{selectedCity.name}'s</strong> payment portal.</p>
                
                <div className="ticket-copy-box">
                  <span>Your ticket #:</span>
                  <code>{ticketNumber}</code>
                  <button 
                    className="btn-icon" 
                    onClick={handleCopyTicket}
                    title="Copy ticket number"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                
                <p className="pay-note">
                  <Clock size={14} />
                  The payment page may ask you to enter the ticket number. 
                  We've copied it for you - just paste!
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-primary" 
            onClick={handlePayNow}
            disabled={!canProceed}
          >
            <CreditCard size={18} />
            Pay Now
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
