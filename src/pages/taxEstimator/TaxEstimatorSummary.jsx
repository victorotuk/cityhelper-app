import { TrendingUp, TrendingDown } from 'lucide-react';

export default function TaxEstimatorSummary({ result }) {
  if (!result) return null;

  return (
    <div className="tax-results">
      <div className="result-card main">
        <div className="result-header">
          <TrendingDown size={24} />
          <span>Total Tax</span>
        </div>
        <div className="result-amount">
          ${result.totalTax.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
        </div>
        <div className="result-sub">{result.effectiveRate.toFixed(1)}% effective rate</div>
      </div>

      <div className="result-card success">
        <div className="result-header">
          <TrendingUp size={24} />
          <span>After Tax Income</span>
        </div>
        <div className="result-amount">
          ${result.afterTax.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
        </div>
        <div className="result-sub">
          ${result.monthlySalary.toLocaleString('en-CA', { minimumFractionDigits: 2 })}/month
        </div>
      </div>

      <div className="result-breakdown">
        <h3>Breakdown</h3>
        <div className="breakdown-row">
          <span>Gross Income</span>
          <span>${result.grossIncome.toLocaleString('en-CA')}</span>
        </div>
        <div className="breakdown-row">
          <span>Taxable Income</span>
          <span>${result.taxableIncome.toLocaleString('en-CA')}</span>
        </div>
        <div className="breakdown-row">
          <span>Federal Tax</span>
          <span>-${result.federalTax.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="breakdown-row">
          <span>
            {result.region === 'ca' ? `Provincial Tax (${result.province})` : `State Tax (${result.state})`}
          </span>
          <span>-${result.provincialTax.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span>
        </div>
        {result.region === 'ca' && (
          <>
            <div className="breakdown-row">
              <span>CPP Contributions</span>
              <span>-${result.cpp.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="breakdown-row">
              <span>EI Premiums</span>
              <span>-${result.ei.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span>
            </div>
          </>
        )}
        <div className="breakdown-row total">
          <span>Net Income</span>
          <span>${result.afterTax.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="result-note">
        <p><strong>Marginal Rate:</strong> {result.marginalRate}% — this is the tax rate on your next dollar earned.</p>
        <p className="disclaimer">
          This is an estimate. Actual taxes may vary based on credits, deductions, and other factors. Consult a tax professional for accurate advice.
        </p>
      </div>
    </div>
  );
}
