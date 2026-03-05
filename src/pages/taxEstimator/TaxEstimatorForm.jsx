import { Calculator, DollarSign } from 'lucide-react';
import ScanUpload from '../../components/scanUpload/ScanUpload';
import { EXTRACT_PROMPTS } from '../../lib/scanPrompts';
import { CA_PROVINCES, US_STATES } from './taxConfig';

export default function TaxEstimatorForm({
  region,
  setRegion,
  onRegionChange,
  income,
  setIncome,
  province,
  setProvince,
  state,
  setState,
  rrspContribution,
  setRrspContribution,
  deductions,
  setDeductions,
  onCalculate,
}) {
  const handleRegionChange = onRegionChange || setRegion;
  return (
    <div className="tax-form">
      <div className="scan-t4-section">
        <label>📄 Scan your T4 to auto-fill</label>
        <ScanUpload
          onExtracted={(data) => {
            if (data.employmentIncome) setIncome(data.employmentIncome.replace(/[^0-9.]/g, ''));
            if (data.rrspDeduction) setRrspContribution(data.rrspDeduction.replace(/[^0-9.]/g, ''));
          }}
          extractPrompt={EXTRACT_PROMPTS.t4}
          compact={false}
        />
      </div>

      <div className="or-divider"><span>or enter manually</span></div>

      <div className="form-group">
        <label>Annual Gross Income</label>
        <div className="input-with-icon">
          <DollarSign size={18} />
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder="75000"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Region</label>
        <select value={region} onChange={(e) => handleRegionChange(e.target.value)}>
          <option value="ca">Canada</option>
          <option value="us">United States</option>
        </select>
      </div>

      {region === 'ca' && (
        <div className="form-group">
          <label>Province</label>
          <select value={province} onChange={(e) => setProvince(e.target.value)}>
            {CA_PROVINCES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      )}
      {region === 'us' && (
        <div className="form-group">
          <label>State</label>
          <select value={state} onChange={(e) => setState(e.target.value)}>
            {US_STATES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      )}

      {region === 'ca' && (
        <div className="form-group">
          <label>RRSP Contribution</label>
          <div className="input-with-icon">
            <DollarSign size={18} />
            <input
              type="number"
              value={rrspContribution}
              onChange={(e) => setRrspContribution(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      )}

      <div className="form-group">
        <label>Other Deductions</label>
        <div className="input-with-icon">
          <DollarSign size={18} />
          <input
            type="number"
            value={deductions}
            onChange={(e) => setDeductions(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <button type="button" className="btn btn-primary btn-block" onClick={onCalculate}>
        <Calculator size={18} />
        Calculate Tax
      </button>
    </div>
  );
}
