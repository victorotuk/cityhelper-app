import { useState, useRef } from 'react';
import { X, Mail, AlertTriangle, ExternalLink, Check, Camera, Upload, Loader } from 'lucide-react';
import { APP_CONFIG } from '../lib/config';
import { format, addDays } from 'date-fns';
import { supabase } from '../lib/supabase';

export default function DisputeTicket({ onClose, onAddItem }) {
  const [step, setStep] = useState(1);
  const [city, setCity] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [ticketDate, setTicketDate] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [ticketAmount, setTicketAmount] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [userName, setUserName] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const cities = Object.entries(APP_CONFIG.parkingPortals).map(([key, val]) => ({
    id: key,
    ...val
  }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setScanError('');

    try {
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
        if (extracted.amount) setTicketAmount(String(extracted.amount).replace(/[^0-9.]/g, ''));
        if (extracted.date) setTicketDate(extracted.date);
        if (extracted.city) {
          const cityLower = extracted.city.toLowerCase();
          const matched = cities.find(c => c.name.toLowerCase().includes(cityLower));
          if (matched) setCity(matched.id);
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
      setScanError('Could not read ticket. Enter manually.');
    }
    setScanning(false);
  };

  const selectedCity = APP_CONFIG.parkingPortals[city];
  const selectedReason = APP_CONFIG.disputeReasons.find(r => r.id === disputeReason);

  const generateDisputeLetter = () => {
    const dateStr = ticketDate ? format(new Date(ticketDate), 'MMMM d, yyyy') : '[Date of Ticket]';
    
    return `To Whom It May Concern,

I am writing to formally dispute Parking Ticket #${ticketNumber || '[Ticket Number]'}, issued on ${dateStr} for the vehicle with license plate ${licensePlate || '[License Plate]'}.

REASON FOR DISPUTE: ${selectedReason?.label || 'See details below'}

${selectedReason?.description || ''}

${additionalDetails ? `ADDITIONAL DETAILS:\n${additionalDetails}\n` : ''}
I respectfully request that this ticket be reviewed and cancelled based on the circumstances described above.

Please find my contact information below:
Name: ${userName}
Address: ${userAddress}
Phone: ${userPhone}
Email: ${userEmail}

Thank you for your time and consideration. I look forward to your response.

Sincerely,
${userName}

---
Ticket Details:
- Ticket Number: ${ticketNumber}
- Date Issued: ${dateStr}
- License Plate: ${licensePlate}
- Amount: $${ticketAmount || 'N/A'}
- City: ${selectedCity?.name || city}`;
  };

  const generateMailtoLink = () => {
    const subject = encodeURIComponent(`Parking Ticket Dispute - Ticket #${ticketNumber}`);
    const body = encodeURIComponent(generateDisputeLetter());
    const email = selectedCity?.disputeEmail || '';
    
    return `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleSubmitDispute = () => {
    // Open mailto link
    window.location.href = generateMailtoLink();
    
    // Add as compliance item to track
    if (onAddItem && selectedCity) {
      const disputeDeadline = ticketDate 
        ? addDays(new Date(ticketDate), selectedCity.disputeDays || 15)
        : addDays(new Date(), 14);
      
      onAddItem({
        name: `Parking Ticket Dispute #${ticketNumber}`,
        category: 'parking',
        due_date: disputeDeadline.toISOString().split('T')[0],
        notes: `City: ${selectedCity.name}\nReason: ${selectedReason?.label}\nStatus: Dispute submitted`
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="dispute-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎫 Dispute Parking Ticket</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Step 1: Ticket Details */}
          {step === 1 && (
            <div className="dispute-step">
              <h3>Step 1: Ticket Information</h3>
              
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

              {scanError && <div className="scan-error">{scanError}</div>}

              <div className="or-divider"><span>or enter manually</span></div>
              
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
                  <label>Ticket Date *</label>
                  <input
                    type="date"
                    value={ticketDate}
                    onChange={e => setTicketDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>License Plate *</label>
                  <input
                    type="text"
                    value={licensePlate}
                    onChange={e => setLicensePlate(e.target.value.toUpperCase())}
                    placeholder="e.g., ABCD 123"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Ticket Amount ($)</label>
                  <input
                    type="number"
                    value={ticketAmount}
                    onChange={e => setTicketAmount(e.target.value)}
                    placeholder="e.g., 60"
                  />
                </div>
              </div>

              {city && selectedCity && (
                <div className="dispute-deadline-notice">
                  <AlertTriangle size={16} />
                  <span>
                    {selectedCity.name} allows disputes within <strong>{selectedCity.disputeDays} days</strong> of the ticket date.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Dispute Reason */}
          {step === 2 && (
            <div className="dispute-step">
              <h3>Step 2: Why are you disputing?</h3>
              
              <div className="reason-grid">
                {APP_CONFIG.disputeReasons.map(reason => (
                  <button
                    key={reason.id}
                    type="button"
                    className={`reason-option ${disputeReason === reason.id ? 'selected' : ''}`}
                    onClick={() => setDisputeReason(reason.id)}
                  >
                    <strong>{reason.label}</strong>
                    <small>{reason.description}</small>
                  </button>
                ))}
              </div>

              <div className="form-group">
                <label>Additional Details (optional but recommended)</label>
                <textarea
                  value={additionalDetails}
                  onChange={e => setAdditionalDetails(e.target.value)}
                  placeholder="Describe what happened in detail. Include any evidence you have (photos, receipts, etc.)"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 3: Your Info */}
          {step === 3 && (
            <div className="dispute-step">
              <h3>Step 3: Your Contact Information</h3>
              <p className="step-description">This will be included in your dispute letter so the city can contact you.</p>
              
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="Your full legal name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Address *</label>
                <input
                  type="text"
                  value={userAddress}
                  onChange={e => setUserAddress(e.target.value)}
                  placeholder="Your mailing address"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={e => setUserPhone(e.target.value)}
                    placeholder="(xxx) xxx-xxxx"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={e => setUserEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Send */}
          {step === 4 && (
            <div className="dispute-step">
              <h3>Step 4: Review & Send</h3>
              
              <div className="dispute-summary">
                <div className="summary-item">
                  <span>City:</span>
                  <strong>{selectedCity?.name}</strong>
                </div>
                <div className="summary-item">
                  <span>Ticket #:</span>
                  <strong>{ticketNumber}</strong>
                </div>
                <div className="summary-item">
                  <span>Reason:</span>
                  <strong>{selectedReason?.label}</strong>
                </div>
                <div className="summary-item">
                  <span>Sending to:</span>
                  <strong>{selectedCity?.disputeEmail}</strong>
                </div>
              </div>

              <div className="dispute-preview">
                <h4>Your Dispute Letter:</h4>
                <pre>{generateDisputeLetter()}</pre>
              </div>

              <div className="dispute-note">
                <Mail size={16} />
                <span>
                  Clicking "Open Email & Send" will open your email app with everything pre-filled. 
                  Just review and hit Send!
                </span>
              </div>

              {selectedCity?.disputeInfo && (
                <a 
                  href={selectedCity.disputeInfo} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="dispute-info-link"
                >
                  <ExternalLink size={14} />
                  View {selectedCity.name}'s official dispute info
                </a>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step > 1 && (
            <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          
          {step < 4 ? (
            <button 
              className="btn btn-primary" 
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && (!city || !ticketNumber || !ticketDate || !licensePlate)) ||
                (step === 2 && !disputeReason) ||
                (step === 3 && (!userName || !userAddress || !userPhone || !userEmail))
              }
            >
              Continue
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmitDispute}>
              <Mail size={18} />
              Open Email & Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

