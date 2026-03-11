import { useState } from 'react';
import { X, Mail } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { APP_CONFIG } from '../../lib/config';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import DisputeStep1Ticket from './DisputeStep1Ticket';
import DisputeStep2Reason from './DisputeStep2Reason';
import DisputeStep3Contact from './DisputeStep3Contact';
import DisputeStep4Review from './DisputeStep4Review';

export default function DisputeTicket({ onClose, onAddItem }) {
  const { user } = useAuthStore();
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

  const cities = Object.entries(APP_CONFIG.parkingPortals || {}).map(([key, val]) => ({ id: key, ...val }));
  const selectedCity = APP_CONFIG.parkingPortals?.[city];
  const selectedReason = (APP_CONFIG.disputeReasons || []).find((r) => r.id === disputeReason);

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
      const groqKey = user?.id ? (localStorage.getItem(`nava_groq_key_${user.id}`) || undefined) : undefined;
      const { data, error } = await supabase.functions.invoke('ai-scan', {
        body: {
          image: base64,
          prompt: `Extract from this parking ticket image and return ONLY JSON:
{"ticketNumber":"","licensePlate":"","amount":"","date":"YYYY-MM-DD","city":""}
Use null for missing fields.`,
          apiKey: groqKey
        },
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
          const matched = cities.find((c) => c.name.toLowerCase().includes(cityLower));
          if (matched) setCity(matched.id);
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
      setScanError('Could not read ticket. Enter manually.');
    }
    setScanning(false);
  };

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
    window.location.href = generateMailtoLink();
    if (onAddItem && selectedCity) {
      const disputeDeadline = ticketDate
        ? addDays(new Date(ticketDate), selectedCity.disputeDays || 15)
        : addDays(new Date(), 14);
      onAddItem({
        name: `Parking Ticket Dispute #${ticketNumber}`,
        category: 'parking',
        due_date: disputeDeadline.toISOString().split('T')[0],
        notes: `City: ${selectedCity.name}\nReason: ${selectedReason?.label}\nStatus: Dispute submitted`,
      });
    }
  };

  const canContinue = () => {
    if (step === 1) return city && ticketNumber && ticketDate && licensePlate;
    if (step === 2) return !!disputeReason;
    if (step === 3) return userName && userAddress && userPhone && userEmail;
    return true;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="dispute-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎫 Dispute Parking Ticket</h2>
          <button type="button" className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {step === 1 && (
            <DisputeStep1Ticket
              city={city}
              setCity={setCity}
              ticketNumber={ticketNumber}
              setTicketNumber={setTicketNumber}
              ticketDate={ticketDate}
              setTicketDate={setTicketDate}
              licensePlate={licensePlate}
              setLicensePlate={setLicensePlate}
              ticketAmount={ticketAmount}
              setTicketAmount={setTicketAmount}
              scanning={scanning}
              scanError={scanError}
              onImageUpload={handleImageUpload}
            />
          )}
          {step === 2 && (
            <DisputeStep2Reason
              disputeReason={disputeReason}
              setDisputeReason={setDisputeReason}
              additionalDetails={additionalDetails}
              setAdditionalDetails={setAdditionalDetails}
            />
          )}
          {step === 3 && (
            <DisputeStep3Contact
              userName={userName}
              setUserName={setUserName}
              userAddress={userAddress}
              setUserAddress={setUserAddress}
              userPhone={userPhone}
              setUserPhone={setUserPhone}
              userEmail={userEmail}
              setUserEmail={setUserEmail}
            />
          )}
          {step === 4 && (
            <DisputeStep4Review
              selectedCity={selectedCity}
              ticketNumber={ticketNumber}
              selectedReason={selectedReason}
              generateDisputeLetter={generateDisputeLetter}
            />
          )}
        </div>
        <div className="modal-footer">
          {step > 1 && (
            <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>Back</button>
          )}
          {step < 4 ? (
            <button type="button" className="btn btn-primary" onClick={() => setStep(step + 1)} disabled={!canContinue()}>
              Continue
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={handleSubmitDispute}>
              <Mail size={18} />
              Open Email & Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
