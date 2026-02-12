/** Pre-built extraction prompts for common document types */
export const EXTRACT_PROMPTS = {
  parkingTicket: `Extract from this parking ticket and return ONLY JSON:
{"ticketNumber":"","licensePlate":"","amount":"","date":"YYYY-MM-DD","city":"","location":""}`,

  passport: `Extract from this passport and return ONLY JSON:
{"fullName":"","passportNumber":"","nationality":"","dateOfBirth":"YYYY-MM-DD","expiryDate":"YYYY-MM-DD","issuingCountry":""}`,

  visa: `Extract from this visa/permit and return ONLY JSON:
{"type":"","number":"","holderName":"","expiryDate":"YYYY-MM-DD","issueDate":"YYYY-MM-DD","conditions":""}`,

  driversLicense: `Extract from this driver's license and return ONLY JSON:
{"fullName":"","licenseNumber":"","dateOfBirth":"YYYY-MM-DD","expiryDate":"YYYY-MM-DD","class":"","address":"","province":""}`,

  healthCard: `Extract from this health card and return ONLY JSON:
{"fullName":"","cardNumber":"","expiryDate":"YYYY-MM-DD","province":""}`,

  t4: `Extract from this T4 tax slip and return ONLY JSON:
{"year":"","employerName":"","employmentIncome":"","incomeTaxDeducted":"","cppContributions":"","eiPremiums":"","employeeNumber":""}`,

  receipt: `Extract from this receipt and return ONLY JSON:
{"vendor":"","date":"YYYY-MM-DD","total":"","items":[],"taxAmount":"","category":""}`,

  businessLicense: `Extract from this business license and return ONLY JSON:
{"businessName":"","licenseNumber":"","type":"","expiryDate":"YYYY-MM-DD","issueDate":"YYYY-MM-DD","city":""}`,

  vehicleRegistration: `Extract from this vehicle registration and return ONLY JSON:
{"ownerName":"","plateNumber":"","vin":"","make":"","model":"","year":"","expiryDate":"YYYY-MM-DD"}`,

  generic: `Extract all key information from this document and return ONLY JSON with relevant fields like:
{"documentType":"","name":"","number":"","date":"","expiryDate":"","amount":"","otherDetails":""}`
};
