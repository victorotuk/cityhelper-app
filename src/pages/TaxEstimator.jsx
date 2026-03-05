import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calculator } from 'lucide-react';
import { APP_CONFIG } from '../lib/config';
import {
  FEDERAL_BRACKETS,
  ONTARIO_BRACKETS,
  BASIC_PERSONAL_AMOUNT_FEDERAL,
  BASIC_PERSONAL_AMOUNT_ONTARIO,
  calculateTax,
  getMarginalRate,
} from './taxEstimator/taxConfig';
import TaxEstimatorForm from './taxEstimator/TaxEstimatorForm';
import TaxEstimatorSummary from './taxEstimator/TaxEstimatorSummary';

export default function TaxEstimator() {
  const [region, setRegion] = useState('ca');
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
    const taxableIncome = Math.max(0, grossIncome - rrsp - otherDeductions);

    const federalTax = calculateTax(taxableIncome, FEDERAL_BRACKETS);
    const federalCredit = BASIC_PERSONAL_AMOUNT_FEDERAL * 0.15;
    const netFederalTax = Math.max(0, federalTax - federalCredit);

    const provincialTax = calculateTax(taxableIncome, ONTARIO_BRACKETS);
    const provincialCredit = BASIC_PERSONAL_AMOUNT_ONTARIO * 0.0505;
    const netProvincialTax = Math.max(0, provincialTax - provincialCredit);

    const cpp = region === 'ca' ? Math.min(grossIncome * 0.0595, 3867.5) : 0;
    const ei = region === 'ca' ? Math.min(grossIncome * 0.0163, 1049.12) : 0;

    const totalTax = netFederalTax + netProvincialTax + cpp + ei;
    const afterTax = grossIncome - totalTax;
    const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;
    const marginalRate = getMarginalRate(taxableIncome, FEDERAL_BRACKETS, ONTARIO_BRACKETS);

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

          <TaxEstimatorForm
            region={region}
            setRegion={setRegion}
            onRegionChange={(v) => { setRegion(v); setResult(null); }}
            income={income}
            setIncome={setIncome}
            province={province}
            setProvince={setProvince}
            state={state}
            setState={setState}
            rrspContribution={rrspContribution}
            setRrspContribution={setRrspContribution}
            deductions={deductions}
            setDeductions={setDeductions}
            onCalculate={calculate}
          />

          <TaxEstimatorSummary result={result} />
        </div>
      </main>
    </div>
  );
}
