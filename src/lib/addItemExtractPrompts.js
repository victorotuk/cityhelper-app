/**
 * Category-specific extraction prompts for Add Item scan/upload.
 * Used by AddItemModal to tell the AI what to extract per category.
 */

export const EXTRACT_PROMPTS = {
  immigration: `Extract from this document and return ONLY JSON:
{"documentType":"visa/permit/passport","name":"","number":"","expiryDate":"YYYY-MM-DD","issueDate":""}`,
  driving: `Extract from this license/registration and return ONLY JSON:
{"documentType":"","name":"","number":"","expiryDate":"YYYY-MM-DD","class":""}`,
  parking: `Extract from this parking ticket, toll road invoice, or traffic violation and return ONLY JSON:
{"documentType":"parking ticket/toll invoice/407 ETR/E-ZPass/violation notice","amount":"","dueDate":"YYYY-MM-DD","ticketNumber":"","plateNumber":"","location":""}`,
  health: `Extract from this health card and return ONLY JSON:
{"name":"","cardNumber":"","expiryDate":"YYYY-MM-DD"}`,
  fitness: `Extract from this fitness/workout document and return ONLY JSON:
{"documentType":"gym membership/workout log/race registration/certification","name":"","expiryDate":"YYYY-MM-DD","eventDate":"YYYY-MM-DD","goal":"","notes":""}`,
  trust: `Extract from this trust or estate planning document and return ONLY JSON:
{"documentType":"trust/will/POA/beneficiary","name":"","trustee":"","beneficiary":"","reviewDate":"YYYY-MM-DD","expiryDate":"YYYY-MM-DD"}`,
  tax: `Extract from this tax document and return ONLY JSON:
{"documentType":"T4/T5/T2/receipt","year":"","amount":"","dueDate":"YYYY-MM-DD"}`,
  business_tax: `Extract from this business tax document and return ONLY JSON:
{"documentType":"T2/HST/GST/payroll","businessName":"","amount":"","dueDate":"YYYY-MM-DD","period":""}`,
  employees: `Extract from this employee/HR document and return ONLY JSON:
{"documentType":"contract/permit/check/certification","employeeName":"","position":"","startDate":"YYYY-MM-DD","expiryDate":"YYYY-MM-DD","number":""}`,
  assets: `Extract from this asset/equipment document and return ONLY JSON:
{"documentType":"lease/warranty/registration/license","assetName":"","value":"","purchaseDate":"YYYY-MM-DD","expiryDate":"YYYY-MM-DD","number":""}`,
  liabilities: `Extract from this financial obligation document and return ONLY JSON:
{"documentType":"loan/lease/invoice/statement","creditor":"","amount":"","dueDate":"YYYY-MM-DD","accountNumber":""}`,
  business_insurance: `Extract from this insurance document and return ONLY JSON:
{"documentType":"liability/E&O/auto/WSIB/cyber/D&O","insurer":"","policyNumber":"","expiryDate":"YYYY-MM-DD","premium":"","coverage":""}`,
  business_license: `Extract from this license and return ONLY JSON:
{"businessName":"","licenseNumber":"","expiryDate":"YYYY-MM-DD","type":""}`,
  inst_regulatory: `Extract from this regulatory/accreditation document and return ONLY JSON:
{"documentType":"inspection/accreditation/audit/compliance","authority":"","referenceNumber":"","expiryDate":"YYYY-MM-DD","nextReviewDate":"YYYY-MM-DD"}`,
  inst_staff: `Extract from this staff compliance document and return ONLY JSON:
{"documentType":"certification/police check/first aid/contract","staffName":"","position":"","expiryDate":"YYYY-MM-DD","issueDate":"YYYY-MM-DD","number":""}`,
  inst_student: `Extract from this student/member services document and return ONLY JSON:
{"documentType":"enrollment/transcript/financial aid/visa","studentName":"","program":"","dueDate":"YYYY-MM-DD","number":""}`,
  inst_finance: `Extract from this institutional finance document and return ONLY JSON:
{"documentType":"grant/funding/budget/tax return","funder":"","amount":"","dueDate":"YYYY-MM-DD","period":""}`,
  inst_safety: `Extract from this safety/inspection document and return ONLY JSON:
{"documentType":"fire/building/elevator/playground","inspector":"","nextInspection":"YYYY-MM-DD","referenceNumber":"","status":""}`,
  inst_facilities: `Extract from this facilities document and return ONLY JSON:
{"documentType":"maintenance/contract/inspection","provider":"","nextService":"YYYY-MM-DD","contractExpiry":"YYYY-MM-DD"}`,
  inst_legal: `Extract from this legal/insurance document and return ONLY JSON:
{"documentType":"insurance/union agreement/privacy/governance","provider":"","policyNumber":"","expiryDate":"YYYY-MM-DD"}`,
  inst_programs: `Extract from this program/curriculum document and return ONLY JSON:
{"documentType":"curriculum/schedule/accreditation","programName":"","deadline":"YYYY-MM-DD","semester":"","items":[{"name":"","date":"YYYY-MM-DD"}]}`,
  inst_sports: `Extract from this sports/recreation document and return ONLY JSON:
{"documentType":"registration/insurance/certification/permit","teamName":"","leagueName":"","personName":"","expiryDate":"YYYY-MM-DD","number":""}`,
  subscriptions: `Extract from this subscription/receipt and return ONLY JSON:
{"documentType":"subscription/membership","serviceName":"","amount":"","billingCycle":"monthly/yearly","nextBillingDate":"YYYY-MM-DD","expiryDate":"YYYY-MM-DD"}`,
  pet_care: `Extract from this pet/vet document and return ONLY JSON:
{"documentType":"vaccination/health record/license","petName":"","vetName":"","nextDueDate":"YYYY-MM-DD","expiryDate":"YYYY-MM-DD","notes":""}`,
  kids_family: `Extract from this family/school document and return ONLY JSON:
{"documentType":"school/daycare/immunization","childName":"","schoolName":"","dueDate":"YYYY-MM-DD","deadline":"YYYY-MM-DD"}`,
  personal_insurance: `Extract from this insurance document and return ONLY JSON:
{"documentType":"auto/home/renter","provider":"","policyNumber":"","expiryDate":"YYYY-MM-DD","premium":""}`,
  credit_banking: `Extract from this banking/credit document and return ONLY JSON:
{"documentType":"statement/loan/credit","institution":"","accountNumber":"","dueDate":"YYYY-MM-DD","amount":""}`,
  travel: `Extract from this travel document and return ONLY JSON:
{"documentType":"insurance/Global Entry/NEXUS/flight","holderName":"","expiryDate":"YYYY-MM-DD","membershipNumber":"","departureDate":"YYYY-MM-DD","flightNumber":"","destination":""}`,
  important_dates: `Extract from this invitation or date and return ONLY JSON:
{"documentType":"invitation/birthday/anniversary/event","eventName":"","date":"YYYY-MM-DD","rsvpDeadline":"YYYY-MM-DD","location":""}`,
  legal_court: `Extract from this legal/court document and return ONLY JSON:
{"documentType":"court date/filing/summons","caseNumber":"","courtDate":"YYYY-MM-DD","deadline":"YYYY-MM-DD"}`,
  moving: `Extract from this moving document and return ONLY JSON:
{"documentType":"change of address/lease","moveDate":"YYYY-MM-DD","address":"","utilityTransfer":"YYYY-MM-DD"}`,
  government_benefits: `Extract from this government/benefits document and return ONLY JSON:
{"documentType":"EI/CPP/OAS/benefits","programName":"","reviewDate":"YYYY-MM-DD","deadline":"YYYY-MM-DD"}`,
  contracts: `Extract from this contract and return ONLY JSON:
{"documentType":"client/vendor/NDA","parties":"","expiryDate":"YYYY-MM-DD","renewalDate":"YYYY-MM-DD"}`,
  certifications: `Extract from this certification document and return ONLY JSON:
{"documentType":"ISO/SOC2/industry","certificationName":"","expiryDate":"YYYY-MM-DD","auditDate":"YYYY-MM-DD"}`,
  patents_ip: `Extract from this IP/patent document and return ONLY JSON:
{"documentType":"patent/trademark/copyright","number":"","maintenanceDue":"YYYY-MM-DD","renewalDate":"YYYY-MM-DD"}`,
  environmental: `Extract from this environmental document and return ONLY JSON:
{"documentType":"permit/report/audit","permitNumber":"","dueDate":"YYYY-MM-DD","reportingPeriod":""}`,
  employee_benefits: `Extract from this benefits document and return ONLY JSON:
{"documentType":"health/dental/gym/education/housing/pet","benefitName":"","provider":"","renewalDate":"YYYY-MM-DD","coveragePeriod":""}`,
  data_privacy: `Extract from this privacy/compliance document and return ONLY JSON:
{"documentType":"GDPR/PIPEDA/policy","reviewDate":"YYYY-MM-DD","expiryDate":"YYYY-MM-DD"}`,
  education: `Extract from this school/education document (timetable, syllabus, curriculum, transcript, enrollment) and return ONLY JSON:
{"documentType":"timetable/syllabus/transcript/enrollment","courseName":"","instructor":"","dueDate":"YYYY-MM-DD","examDate":"YYYY-MM-DD","semester":"","items":[{"name":"","date":"YYYY-MM-DD"}]}`,
  work_schedule: `Extract from this work schedule/timetable and return ONLY JSON:
{"documentType":"schedule/timesheet/contract","employer":"","position":"","shifts":[{"day":"","startTime":"","endTime":""}],"startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"}`,
  retirement_estate: `Extract from this estate/retirement document and return ONLY JSON:
{"documentType":"will/trust/insurance/policy","provider":"","policyNumber":"","beneficiary":"","expiryDate":"YYYY-MM-DD","reviewDate":""}`,
};

const DEFAULT_PROMPT = `Extract key info and return JSON: {"name":"","number":"","expiryDate":"YYYY-MM-DD","type":""}`;

export function getExtractPromptForCategory(selectedCategory) {
  return EXTRACT_PROMPTS[selectedCategory] || DEFAULT_PROMPT;
}
