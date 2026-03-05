import { Link } from 'react-router-dom';
import { X, CheckCircle } from 'lucide-react';

export default function ScanResultCard({ scanResult, onDismiss }) {
  if (!scanResult?.success || !scanResult?.parsed) return null;
  const p = scanResult.parsed;
  const type = (p.type || '').toLowerCase();

  return (
    <div className="scan-result">
      <div className="scan-result-header">
        <CheckCircle size={20} />
        <h3>Document Scanned</h3>
        <button type="button" onClick={onDismiss}><X size={18} /></button>
      </div>
      <div className="scan-result-content">
        <div className="scan-type">
          <span className="label">Detected Type:</span>
          <span className="value">{(p.type || 'Unknown').toUpperCase()}</span>
        </div>

        {(type === 't4') && (
          <div className="scan-data">
            <h4>T4 Data Extracted:</h4>
            <div className="data-grid">
              {p.employer && <div className="data-item"><span>Employer</span><strong>{p.employer}</strong></div>}
              {p.employment_income != null && <div className="data-item"><span>Employment Income</span><strong>${Number(p.employment_income).toLocaleString()}</strong></div>}
              {p.income_tax_deducted != null && <div className="data-item"><span>Tax Deducted</span><strong>${Number(p.income_tax_deducted).toLocaleString()}</strong></div>}
              {p.cpp_contributions != null && <div className="data-item"><span>CPP</span><strong>${Number(p.cpp_contributions).toLocaleString()}</strong></div>}
              {p.ei_premiums != null && <div className="data-item"><span>EI</span><strong>${Number(p.ei_premiums).toLocaleString()}</strong></div>}
              {p.year && <div className="data-item"><span>Tax Year</span><strong>{p.year}</strong></div>}
            </div>
            <Link to="/tax-estimator" className="btn btn-primary btn-sm">Use in Tax Estimator →</Link>
          </div>
        )}

        {(type === 'id' || type?.includes('license')) && (
          <div className="scan-data">
            <h4>ID Data Extracted:</h4>
            <div className="data-grid">
              {p.name && <div className="data-item"><span>Name</span><strong>{p.name}</strong></div>}
              {p.id_number && <div className="data-item"><span>ID Number</span><strong>{p.id_number}</strong></div>}
              {p.expiry_date && <div className="data-item highlight"><span>Expiry Date</span><strong>{p.expiry_date}</strong></div>}
            </div>
            <Link to="/dashboard" className="btn btn-primary btn-sm">Add to Tracker →</Link>
          </div>
        )}

        {(type === 'receipt') && (
          <div className="scan-data">
            <h4>Receipt Data Extracted:</h4>
            <div className="data-grid">
              {p.merchant && <div className="data-item"><span>Merchant</span><strong>{p.merchant}</strong></div>}
              {p.total != null && <div className="data-item"><span>Total</span><strong>${Number(p.total).toFixed(2)}</strong></div>}
              {p.date && <div className="data-item"><span>Date</span><strong>{p.date}</strong></div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
