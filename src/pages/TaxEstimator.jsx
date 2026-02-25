import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calculator, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { APP_CONFIG } from '../lib/config';
import ScanUpload from '../components/ScanUpload';
import { EXTRACT_PROMPTS } from '../lib/scanPrompts';

// 2024 Canadian Federal Tax Brackets
const FEDERAL_BRACKETS = [
  { min: 0, max: 55867, rate: 0.15 },
  { min: 55867, max: 111733, rate: 0.205 },
  { min: 111733, max: 173205, rate: 0.26 },
  { min: 173205, max: 246752, rate: 0.29 },
  { min: 246752, max: Infinity, rate: 0.33 }
];

// Ontario Provincial Tax Brackets
const ONTARIO_BRACKETS = [
  { min: 0, max: 51446, rate: 0.0505 },
  { min: 51446, max: 102894, rate: 0.0915 },
  { min: 102894, max: 150000, rate: 0.1116 },
  { min: 150000, max: 220000, rate: 0.1216 },
  { min: 220000, max: Infinity, rate: 0.1316 }
];

const BASIC_PERSONAL_AMOUNT_FEDERAL = 15705;
const BASIC_PERSONAL_AMOUNT_ONTARIO = 12399;

// All Canadian provinces
const CA_PROVINCES = [
  { value: 'ON', label: 'Ontario' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'AB', label: 'Alberta' },
  { value: 'QC', label: 'Quebec' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'YT', label: 'Yukon' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' },
];

// US states (regions we serve)
const US_STATES = [
  { value: 'NY', label: 'New York' },
  { value: 'CA', label: 'California' },
  { value: 'TX', label: 'Texas' },
  { value: 'FL', label: 'Florida' },
  { value: 'IL', label: 'Illinois' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'OH', label: 'Ohio' },
  { value: 'GA', label: 'Georgia' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'MI', label: 'Michigan' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'IN', label: 'Indiana' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MD', label: 'Maryland' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'CO', label: 'Colorado' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'AL', label: 'Alabama' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'OR', label: 'Oregon' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'UT', label: 'Utah' },
  { value: 'NV', label: 'Nevada' },
  { value: 'IA', label: 'Iowa' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'KS', label: 'Kansas' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'ID', label: 'Idaho' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'ME', label: 'Maine' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'MT', label: 'Montana' },
  { value: 'DE', label: 'Delaware' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'AK', label: 'Alaska' },
  { value: 'VT', label: 'Vermont' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
];

function calculateTax(income, brackets) {
  let tax = 0;
  let remaining = income;

  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const taxableInBracket = Math.min(remaining, bracket.max - bracket.min);
    tax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
  }

  return tax;
}

export default function TaxEstimator() {
  const [region, setRegion] = useState('ca'); // 'ca' | 'us'
  const [income, setIncome] = useState('');
  const [province, setProvince] = useState('ON');
  const [state, setState] = useState('NY');
  const [rrspContribution, setRrspContribution] = useState('');
  const [deductions, setDeductions] = useState('');
  const [result, setResult] = useState(null);

  const calculate = () => {
    const grossIncome = parseFloat(income) || 0;
    const rrsp = parseFloat(rrspContribution) || 0;
    const otherDeductions = parseFloat(deductions) || 0;

    // Calculate taxable income
    const taxableIncome = Math.max(0, grossIncome - rrsp - otherDeductions);

    // Federal tax
    const federalTax = calculateTax(taxableIncome, FEDERAL_BRACKETS);
    const federalCredit = BASIC_PERSONAL_AMOUNT_FEDERAL * 0.15;
    const netFederalTax = Math.max(0, federalTax - federalCredit);

    // Provincial/state tax (Ontario brackets as approx for other provinces for now)
    const provincialTax = calculateTax(taxableIncome, ONTARIO_BRACKETS);
    const provincialCredit = BASIC_PERSONAL_AMOUNT_ONTARIO * 0.0505;
    const netProvincialTax = Math.max(0, provincialTax - provincialCredit);

    // CPP & EI (Canada only)
    const cpp = region === 'ca' ? Math.min(grossIncome * 0.0595, 3867.50) : 0;
    const ei = region === 'ca' ? Math.min(grossIncome * 0.0163, 1049.12) : 0;

    const totalTax = netFederalTax + netProvincialTax + cpp + ei;
    const afterTax = grossIncome - totalTax;
    const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;
    const marginalRate = getMarginalRate(taxableIncome);

    setResult({
      grossIncome,
      taxableIncome,
      federalTax: netFederalTax,
      provincialTax: netProvincialTax,
      cpp,
      ei,
      totalTax,
      afterTax,
      effectiveRate,
      marginalRate,
      monthlySalary: afterTax / 12,
      biweeklySalary: afterTax / 26,
      region,
      province,
      state,
    });
  };

  const getMarginalRate = (income) => {
    let federalRate = 0;
    let provincialRate = 0;

    for (const bracket of FEDERAL_BRACKETS) {
      if (income > bracket.min) federalRate = bracket.rate;
    }
    for (const bracket of ONTARIO_BRACKETS) {
      if (income > bracket.min) provincialRate = bracket.rate;
    }

    return ((federalRate + provincialRate) * 100).toFixed(1);
  };

  return (
    <div className="tax-page">
      <header className="page-header">
        <Link to="/dashboard" className="back-btn">
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>
        <Link to="/dashboard" className="header-brand">
          <span>{APP_CONFIG.logo}</span>
          <span>{APP_CONFIG.name}</span>
        </Link>
      </header>

      <main className="tax-main">
        <div className="tax-container">
          <div className="tax-header">
            <Calculator size={32} className="tax-icon" />
            <h1>Tax Estimator</h1>
            <p>Estimate income tax for 2024. File with one prompt? We&apos;re exploring APIs (SimpleTax, etc.) to make that happen.</p>
          </div>

          <div className="tax-form">
            {/* Scan T4 to auto-fill */}
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
              <select value={region} onChange={(e) => { setRegion(e.target.value); setResult(null); }}>
                <option value="ca">Canada</option>
                <option value="us">United States</option>
              </select>
            </div>

            {region === 'ca' && (
              <div className="form-group">
                <label>Province</label>
                <select value={province} onChange={(e) => setProvince(e.target.value)}>
                  {CA_PROVINCES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            )}
            {region === 'us' && (
              <div className="form-group">
                <label>State</label>
                <select value={state} onChange={(e) => setState(e.target.value)}>
                  {US_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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

            <button className="btn btn-primary btn-block" onClick={calculate}>
              <Calculator size={18} />
              Calculate Tax
            </button>
          </div>

          {result && (
            <div className="tax-results">
              <div className="result-card main">
                <div className="result-header">
                  <TrendingDown size={24} />
                  <span>Total Tax</span>
                </div>
                <div className="result-amount">${result.totalTax.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</div>
                <div className="result-sub">{result.effectiveRate.toFixed(1)}% effective rate</div>
              </div>

              <div className="result-card success">
                <div className="result-header">
                  <TrendingUp size={24} />
                  <span>After Tax Income</span>
                </div>
                <div className="result-amount">${result.afterTax.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</div>
                <div className="result-sub">${result.monthlySalary.toLocaleString('en-CA', { minimumFractionDigits: 2 })}/month</div>
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
                  <span>{result.region === 'ca' ? `Provincial Tax (${result.province})` : `State Tax (${result.state})`}</span>
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
                <p className="disclaimer">This is an estimate. Actual taxes may vary based on credits, deductions, and other factors. Consult a tax professional for accurate advice.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

