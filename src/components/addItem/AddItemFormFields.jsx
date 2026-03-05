import { APP_CONFIG } from '../../lib/config';
import { getExtractPromptForCategory } from '../../lib/addItemExtractPrompts';
import { BILL_CATEGORIES, RECURRENCE_OPTIONS } from '../dashboard/constants.js';
import ScanUpload from '../scanUpload/ScanUpload';

export default function AddItemFormFields({
  selectedCategory,
  name,
  setName,
  dueDate,
  setDueDate,
  notes,
  setNotes,
  payUrl,
  setPayUrl,
  payPhone,
  setPayPhone,
  recurrenceInterval,
  setRecurrenceInterval,
  documentId,
  setDocumentId,
  documents,
  alertEmails,
  setAlertEmails,
  itemCountry,
  setCountryOverride,
  userCountries,
  onExtracted,
  onSubmit,
  onBack,
}) {
  const templates = selectedCategory ? (APP_CONFIG.templates[selectedCategory] || []) : [];
  const isBillCategory = BILL_CATEGORIES.includes(selectedCategory);

  return (
    <form onSubmit={onSubmit} className="add-form">
      <ScanUpload
        onExtracted={onExtracted}
        extractPrompt={getExtractPromptForCategory(selectedCategory)}
      />
      <div className="or-divider"><span>or enter manually</span></div>

      {templates.length > 0 && (
        <div className="templates">
          <label>Quick Add:</label>
          <div className="template-btns">
            {templates.map((t, i) => (
              <button key={i} type="button" className="template-btn" onClick={() => setName(t.name)}>{t.name}</button>
            ))}
          </div>
        </div>
      )}

      <div className="form-group">
        <label>Item Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Driver's License" required />
      </div>

      {userCountries?.length >= 2 && (
        <div className="form-group">
          <label>Country</label>
          <div className="country-picker-inline">
            {[{ id: 'ca', name: 'Canada', flag: '🇨🇦' }, { id: 'us', name: 'United States', flag: '🇺🇸' }]
              .filter((c) => userCountries.includes(c.id))
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`country-pick-btn ${itemCountry === c.id ? 'selected' : ''}`}
                  onClick={() => setCountryOverride(c.id)}
                >
                  <span className="country-pick-flag">{c.flag}</span>
                  <span className="country-pick-name">{c.name}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      <div className="form-group">
        <label>Due/Expiry Date</label>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>

      <div className="form-group">
        <label>Notes (optional)</label>
        <textarea value={notes || ''} onChange={(e) => setNotes(e.target.value)} placeholder="Extra details" rows={2} />
      </div>

      <div className="form-group">
        <label>Recurrence</label>
        <select value={recurrenceInterval} onChange={(e) => setRecurrenceInterval(e.target.value)}>
          {RECURRENCE_OPTIONS.map((opt) => (
            <option key={opt.value || 'none'} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="field-hint">For renewals (license, insurance, etc.) — we&apos;ll set the next due date when you mark it done</span>
      </div>

      {documents.length > 0 && (
        <div className="form-group">
          <label>Link document (optional)</label>
          <select value={documentId || ''} onChange={(e) => setDocumentId(e.target.value || null)}>
            <option value="">None</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="form-group">
        <label>Extra alert emails (optional)</label>
        <input
          type="text"
          value={alertEmails}
          onChange={(e) => setAlertEmails(e.target.value)}
          placeholder="email1@example.com, email2@example.com"
        />
        <span className="field-hint">Notify others when this item is due</span>
      </div>

      {isBillCategory && (
        <div className="bill-pay-fields">
          <label>Pay options (optional)</label>
          <div className="form-group">
            <input type="url" value={payUrl} onChange={(e) => setPayUrl(e.target.value)} placeholder="https://provider.com/login" />
            <span className="field-hint">Enter the login or pay URL for this provider</span>
          </div>
          <div className="form-group">
            <input type="tel" value={payPhone} onChange={(e) => setPayPhone(e.target.value)} placeholder="1-800-123-4567" />
            <span className="field-hint">Enter the number you call to pay this bill</span>
          </div>
        </div>
      )}

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onBack}>Back</button>
        <button type="submit" className="btn btn-primary">Add Item</button>
      </div>
    </form>
  );
}
