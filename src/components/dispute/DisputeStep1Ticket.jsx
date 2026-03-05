import { useRef } from 'react';
import { Camera, Upload, Loader, AlertTriangle } from 'lucide-react';
import { APP_CONFIG } from '../../lib/config';

export default function DisputeStep1Ticket({
  city,
  setCity,
  ticketNumber,
  setTicketNumber,
  ticketDate,
  setTicketDate,
  licensePlate,
  setLicensePlate,
  ticketAmount,
  setTicketAmount,
  scanning,
  scanError,
  onImageUpload,
}) {
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const cities = Object.entries(APP_CONFIG.parkingPortals || {}).map(([key, val]) => ({ id: key, ...val }));
  const selectedCity = APP_CONFIG.parkingPortals?.[city];

  return (
    <div className="dispute-step">
      <h3>Step 1: Ticket Information</h3>
      <div className="scan-options">
        <button type="button" className="scan-btn" onClick={() => cameraInputRef.current?.click()} disabled={scanning}>
          {scanning ? <Loader size={20} className="spin" /> : <Camera size={20} />}
          <span>Take Photo</span>
        </button>
        <button type="button" className="scan-btn" onClick={() => fileInputRef.current?.click()} disabled={scanning}>
          <Upload size={20} />
          <span>Upload Image</span>
        </button>
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={onImageUpload} style={{ display: 'none' }} />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={onImageUpload} style={{ display: 'none' }} />
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
        <select value={city} onChange={(e) => setCity(e.target.value)} required>
          <option value="">Select your city...</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Ticket Number *</label>
          <input type="text" value={ticketNumber} onChange={(e) => setTicketNumber(e.target.value)} placeholder="e.g., 12345678" required />
        </div>
        <div className="form-group">
          <label>Ticket Date *</label>
          <input type="date" value={ticketDate} onChange={(e) => setTicketDate(e.target.value)} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>License Plate *</label>
          <input type="text" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value.toUpperCase())} placeholder="e.g., ABCD 123" required />
        </div>
        <div className="form-group">
          <label>Ticket Amount ($)</label>
          <input type="number" value={ticketAmount} onChange={(e) => setTicketAmount(e.target.value)} placeholder="e.g., 60" />
        </div>
      </div>
      {city && selectedCity && (
        <div className="dispute-deadline-notice">
          <AlertTriangle size={16} />
          <span>{selectedCity.name} allows disputes within <strong>{selectedCity.disputeDays} days</strong> of the ticket date.</span>
        </div>
      )}
    </div>
  );
}
