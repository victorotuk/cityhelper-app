export default function DisputeStep3Contact({
  userName, setUserName,
  userAddress, setUserAddress,
  userPhone, setUserPhone,
  userEmail, setUserEmail,
}) {
  return (
    <div className="dispute-step">
      <h3>Step 3: Your Contact Information</h3>
      <p className="step-description">This will be included in your dispute letter so the city can contact you.</p>
      <div className="form-group">
        <label>Full Name *</label>
        <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Your full legal name" required />
      </div>
      <div className="form-group">
        <label>Address *</label>
        <input type="text" value={userAddress} onChange={(e) => setUserAddress(e.target.value)} placeholder="Your mailing address" required />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Phone *</label>
          <input type="tel" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} placeholder="(xxx) xxx-xxxx" required />
        </div>
        <div className="form-group">
          <label>Email *</label>
          <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="your@email.com" required />
        </div>
      </div>
    </div>
  );
}
