/**
 * Tax brackets, regions, and calculation helpers for TaxEstimator.
 */

export const FEDERAL_BRACKETS = [
  { min: 0, max: 55867, rate: 0.15 },
  { min: 55867, max: 111733, rate: 0.205 },
  { min: 111733, max: 173205, rate: 0.26 },
  { min: 173205, max: 246752, rate: 0.29 },
  { min: 246752, max: Infinity, rate: 0.33 },
];

export const ONTARIO_BRACKETS = [
  { min: 0, max: 51446, rate: 0.0505 },
  { min: 51446, max: 102894, rate: 0.0915 },
  { min: 102894, max: 150000, rate: 0.1116 },
  { min: 150000, max: 220000, rate: 0.1216 },
  { min: 220000, max: Infinity, rate: 0.1316 },
];

export const BASIC_PERSONAL_AMOUNT_FEDERAL = 15705;
export const BASIC_PERSONAL_AMOUNT_ONTARIO = 12399;

export const CA_PROVINCES = [
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

export const US_STATES = [
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

export function calculateTax(income, brackets) {
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

export function getMarginalRate(income, federalBrackets, provincialBrackets) {
  let federalRate = 0;
  let provincialRate = 0;
  for (const bracket of federalBrackets) {
    if (income > bracket.min) federalRate = bracket.rate;
  }
  for (const bracket of provincialBrackets) {
    if (income > bracket.min) provincialRate = bracket.rate;
  }
  return ((federalRate + provincialRate) * 100).toFixed(1);
}
