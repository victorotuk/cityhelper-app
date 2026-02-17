// ============================================
// APP CONFIGURATION
// Change the name here and it updates everywhere
// ============================================

export const APP_CONFIG = {
  // BRANDING - Change these to rebrand the entire app
  name: "CityHelper",           // App name (change this!)
  tagline: "Never miss a deadline",
  description: "Track all your Canadian compliance — taxes, licenses, visas, renewals — in one place.",
  
  // BRAND VISUALS
  logo: "🍁",
  
  // CONTACT
  supportEmail: "support@example.com",
  
  // PRICING (CAD)
  pricing: {
    free: {
      name: "Free",
      price: 0,
      scanLimit: 10,
      features: ["Deadline reminders", "5 compliance items", "Email alerts", "10 document scans/month"]
    },
    personal: {
      name: "Personal",
      price: 8,
      scanLimit: 50,
      features: ["Unlimited items", "Document vault", "Tax estimator", "SMS alerts", "Calendar sync", "50 document scans/month"]
    },
    business: {
      name: "Business", 
      price: 25,
      scanLimit: 200,
      features: ["Everything in Personal", "Multiple users", "Business compliance", "Payroll calculator", "Priority support", "200 document scans/month"]
    }
  },
  
  // COMPLIANCE CATEGORIES — Personal / Business / Institution
  categories: [
    // ── Personal ──
    { id: "immigration", name: "Immigration & Visas", icon: "Plane", color: "#3b82f6", group: "personal" },
    { id: "tax", name: "Personal Taxes", icon: "DollarSign", color: "#10b981", group: "personal" },
    { id: "driving", name: "Driving & Vehicles", icon: "Car", color: "#f59e0b", group: "personal" },
    { id: "parking", name: "Traffic & Parking", icon: "ParkingCircle", color: "#dc2626", group: "personal" },
    { id: "health", name: "Health", icon: "Heart", color: "#ef4444", group: "personal" },
    { id: "housing", name: "Housing & Rentals", icon: "Home", color: "#06b6d4", group: "personal" },
    { id: "education", name: "Education & School", icon: "BookOpen", color: "#8b5cf6", group: "personal" },
    { id: "work_schedule", name: "Work & Shifts", icon: "Clock", color: "#f97316", group: "personal" },
    { id: "retirement_estate", name: "Retirement & Estate", icon: "Landmark", color: "#0d9488", group: "personal" },
    { id: "other", name: "Other", icon: "Pin", color: "#64748b", group: "personal" },

    // ── Business ──
    { id: "employees", name: "Employees & HR", icon: "Users", color: "#6366f1", group: "business" },
    { id: "business_tax", name: "Business Taxes", icon: "DollarSign", color: "#059669", group: "business" },
    { id: "assets", name: "Assets & Equipment", icon: "Package", color: "#0ea5e9", group: "business" },
    { id: "liabilities", name: "Liabilities & Debt", icon: "AlertTriangle", color: "#e11d48", group: "business" },
    { id: "business_license", name: "Business Licenses & Permits", icon: "FileText", color: "#7c3aed", group: "business" },
    { id: "business_insurance", name: "Insurance & Liability", icon: "Shield", color: "#0891b2", group: "business" },
    { id: "office", name: "Office & Operations", icon: "Briefcase", color: "#8b5cf6", group: "business" },
    { id: "property", name: "Property & Municipal", icon: "Building", color: "#14b8a6", group: "business" },
    { id: "professional", name: "Professional Licenses", icon: "GraduationCap", color: "#f97316", group: "business" },

    // ── Institution (schools, hospitals, nonprofits, government) ──
    { id: "inst_regulatory", name: "Regulatory & Accreditation", icon: "Shield", color: "#7c3aed", group: "institution" },
    { id: "inst_staff", name: "Staff Compliance", icon: "Users", color: "#2563eb", group: "institution" },
    { id: "inst_student", name: "Student & Member Services", icon: "BookOpen", color: "#8b5cf6", group: "institution" },
    { id: "inst_finance", name: "Funding & Financial", icon: "DollarSign", color: "#059669", group: "institution" },
    { id: "inst_safety", name: "Safety & Inspections", icon: "AlertTriangle", color: "#dc2626", group: "institution" },
    { id: "inst_facilities", name: "Facilities & Property", icon: "Building", color: "#14b8a6", group: "institution" },
    { id: "inst_legal", name: "Legal & Insurance", icon: "FileText", color: "#0891b2", group: "institution" },
    { id: "inst_programs", name: "Programs & Curriculum", icon: "Calendar", color: "#f59e0b", group: "institution" },
    { id: "inst_sports", name: "Sports & Recreation", icon: "Trophy", color: "#ea580c", group: "institution" },
  ],
  
  // PARKING TICKET PORTALS BY CITY (lookup, pay, dispute)
  parkingPortals: {
    toronto: {
      name: "Toronto",
      lookup: "https://secure.toronto.ca/wes/eTPP/welcome.do",
      pay: "https://secure.toronto.ca/wes/eTPP/welcome.do",
      // Toronto accepts tag_number param for pre-fill
      payUrl: (ticket, _plate) => `https://secure.toronto.ca/wes/eTPP/welcome.do?tag_number=${ticket}`,
      disputeEmail: "parkingticketreview@toronto.ca",
      disputeDays: 15,
      disputeInfo: "https://www.toronto.ca/services-payments/tickets-fines-penalties/dispute-a-ticket/"
    },
    ottawa: {
      name: "Ottawa",
      lookup: "https://ottawa.ca/en/parking-tickets",
      pay: "https://pay.ottawa.ca/",
      payUrl: (_ticket, _plate) => `https://pay.ottawa.ca/`,
      disputeEmail: "parkingtickets@ottawa.ca",
      disputeDays: 15,
      disputeInfo: "https://ottawa.ca/en/parking-tickets#dispute"
    },
    mississauga: {
      name: "Mississauga",
      lookup: "https://www.mississauga.ca/services-and-programs/transportation-and-streets/parking/parking-tickets/",
      pay: "https://www.paytickets.ca/",
      // paytickets.ca supports infraction_number param
      payUrl: (ticket, _plate) => `https://www.paytickets.ca/?infraction_number=${ticket}`,
      disputeEmail: "parking.tickets@mississauga.ca",
      disputeDays: 15,
      disputeInfo: "https://www.mississauga.ca/services-and-programs/transportation-and-streets/parking/dispute-a-parking-ticket/"
    },
    brampton: {
      name: "Brampton",
      lookup: "https://www.brampton.ca/EN/residents/Parking/Pages/Parking-Tickets.aspx",
      pay: "https://www.paytickets.ca/",
      payUrl: (ticket, _plate) => `https://www.paytickets.ca/?infraction_number=${ticket}`,
      disputeEmail: "parking@brampton.ca",
      disputeDays: 15,
      disputeInfo: "https://www.brampton.ca/EN/residents/Parking/Pages/Parking-Tickets.aspx"
    },
    hamilton: {
      name: "Hamilton",
      lookup: "https://www.hamilton.ca/streets-transportation/tickets-parking/parking-tickets",
      pay: "https://www.paytickets.ca/",
      payUrl: (ticket, _plate) => `https://www.paytickets.ca/?infraction_number=${ticket}`,
      disputeEmail: "parkingservices@hamilton.ca",
      disputeDays: 15,
      disputeInfo: "https://www.hamilton.ca/streets-transportation/tickets-parking/dispute-parking-ticket"
    },
    vancouver: {
      name: "Vancouver",
      lookup: "https://vancouver.ca/streets-transportation/pay-a-parking-ticket.aspx",
      pay: "https://epay.vancouver.ca/",
      payUrl: (_ticket, _plate) => `https://epay.vancouver.ca/parkingviolation/`,
      disputeEmail: "parking@vancouver.ca",
      disputeDays: 14,
      disputeInfo: "https://vancouver.ca/streets-transportation/dispute-a-parking-ticket.aspx"
    },
    calgary: {
      name: "Calgary",
      lookup: "https://www.calgary.ca/cps/traffic/tickets.html",
      pay: "https://eservices.calgary.ca/parkingtickets/",
      payUrl: (_ticket, _plate) => `https://eservices.calgary.ca/parkingtickets/`,
      disputeEmail: "parkingauthority@calgary.ca",
      disputeDays: 30,
      disputeInfo: "https://www.calgary.ca/cps/traffic/parking-tickets/dispute.html"
    },
    edmonton: {
      name: "Edmonton",
      lookup: "https://www.edmonton.ca/transportation/parking_tickets",
      pay: "https://parkingtickets.edmonton.ca/",
      payUrl: (_ticket, _plate) => `https://parkingtickets.edmonton.ca/`,
      disputeEmail: "parking@edmonton.ca",
      disputeDays: 30,
      disputeInfo: "https://www.edmonton.ca/transportation/parking_tickets/dispute-parking-ticket"
    },
    montreal: {
      name: "Montreal",
      lookup: "https://montreal.ca/en/services/pay-fine",
      pay: "https://servicesenligne2.ville.montreal.qc.ca/",
      payUrl: (_ticket, _plate) => `https://servicesenligne2.ville.montreal.qc.ca/`,
      disputeEmail: "stationnement@montreal.ca",
      disputeDays: 30,
      disputeInfo: "https://montreal.ca/en/services/contest-ticket"
    },
    winnipeg: {
      name: "Winnipeg",
      lookup: "https://winnipeg.ca/ppd/parking/tickets.stm",
      pay: "https://myservices.winnipeg.ca/",
      payUrl: (_ticket, _plate) => `https://myservices.winnipeg.ca/`,
      disputeEmail: "parkingauthority@winnipeg.ca",
      disputeDays: 14,
      disputeInfo: "https://winnipeg.ca/ppd/parking/dispute.stm"
    },
    // US cities
    'new-york': {
      name: "New York City",
      lookup: "https://www.nyc.gov/site/finance/vehicles/parking-tickets.page",
      pay: "https://a836-citypay.nyc.gov/citypay/Parking",
      payUrl: (_ticket, _plate) => `https://a836-citypay.nyc.gov/citypay/Parking`,
      disputeEmail: "customerservice@finance.nyc.gov",
      disputeDays: 30,
      disputeInfo: "https://www.nyc.gov/site/finance/vehicles/dispute-a-ticket.page"
    },
    'los-angeles': {
      name: "Los Angeles",
      lookup: "https://ladot.lacity.gov/projects/parking-in-la/pay-your-parking-citation",
      pay: "https://wmq.etimspayments.com/pbw/include/la/input.jsp",
      payUrl: (_ticket, _plate) => `https://wmq.etimspayments.com/pbw/include/la/input.jsp`,
      disputeEmail: "pvb@lacity.org",
      disputeDays: 21,
      disputeInfo: "https://ladot.lacity.gov/projects/parking-in-la/dispute-a-citation"
    },
    chicago: {
      name: "Chicago",
      lookup: "https://www.chicago.gov/city/en/depts/fin/supp_info/revenue/chicago_parking_tickets.html",
      pay: "https://parkingticketpay.chicago.gov/",
      payUrl: (_ticket, _plate) => `https://parkingticketpay.chicago.gov/`,
      disputeEmail: "tickets@cityofchicago.org",
      disputeDays: 21,
      disputeInfo: "https://www.chicago.gov/city/en/depts/fin/supp_info/revenue/chicago_parking_tickets.html"
    },
    'san-francisco': {
      name: "San Francisco",
      lookup: "https://www.sfmta.com/getting-around/drive-park/parking-citations",
      pay: "https://www.sfmta.com/getting-around/drive-park/pay-parking-citation",
      payUrl: (_ticket, _plate) => `https://www.sfmta.com/getting-around/drive-park/pay-parking-citation`,
      disputeEmail: "sfmta_parking@sfmta.com",
      disputeDays: 21,
      disputeInfo: "https://www.sfmta.com/getting-around/drive-park/contest-parking-citation"
    },
    seattle: {
      name: "Seattle",
      lookup: "https://www.seattle.gov/transportation/parking/parking-citations",
      pay: "https://www.seattle.gov/transportation/parking/parking-citations/pay-a-citation",
      payUrl: (_ticket, _plate) => `https://www.seattle.gov/transportation/parking/parking-citations/pay-a-citation`,
      disputeEmail: "parking@seattle.gov",
      disputeDays: 15,
      disputeInfo: "https://www.seattle.gov/transportation/parking/parking-citations/contest-a-citation"
    },
    boston: {
      name: "Boston",
      lookup: "https://www.boston.gov/departments/transportation/parking-tickets",
      pay: "https://www.boston.gov/departments/transportation/parking-tickets",
      payUrl: (_ticket, _plate) => `https://www.boston.gov/departments/transportation/parking-tickets`,
      disputeEmail: "parking@boston.gov",
      disputeDays: 21,
      disputeInfo: "https://www.boston.gov/departments/transportation/appeal-parking-ticket"
    },
    houston: {
      name: "Houston",
      lookup: "https://www.houstontx.gov/abandonedvehicles/parking_tickets.html",
      pay: "https://www.houstontx.gov/abandonedvehicles/parking_tickets.html",
      payUrl: (_ticket, _plate) => `https://www.houstontx.gov/abandonedvehicles/parking_tickets.html`,
      disputeEmail: "parking@houstontx.gov",
      disputeDays: 21,
      disputeInfo: "https://www.houstontx.gov/abandonedvehicles/parking_tickets.html"
    },
    phoenix: {
      name: "Phoenix",
      lookup: "https://www.phoenix.gov/streets/parking/pay-parking-violation",
      pay: "https://www.phoenix.gov/streets/parking/pay-parking-violation",
      payUrl: (_ticket, _plate) => `https://www.phoenix.gov/streets/parking/pay-parking-violation`,
      disputeEmail: "parking@phoenix.gov",
      disputeDays: 15,
      disputeInfo: "https://www.phoenix.gov/streets/parking/dispute-parking-violation"
    },
    philadelphia: {
      name: "Philadelphia",
      lookup: "https://www.phila.gov/services/payments-assistance-taxes/parking-violations/",
      pay: "https://phillyparking.phila.gov/",
      payUrl: (_ticket, _plate) => `https://phillyparking.phila.gov/`,
      disputeEmail: "parking@phila.gov",
      disputeDays: 30,
      disputeInfo: "https://www.phila.gov/services/payments-assistance-taxes/parking-violations/"
    },
    'san-diego': {
      name: "San Diego",
      lookup: "https://www.sandiego.gov/cip/parking/pay",
      pay: "https://www.sandiego.gov/cip/parking/pay",
      payUrl: (_ticket, _plate) => `https://www.sandiego.gov/cip/parking/pay`,
      disputeEmail: "parkingenforcement@sandiego.gov",
      disputeDays: 21,
      disputeInfo: "https://www.sandiego.gov/cip/parking/contest"
    },
    denver: {
      name: "Denver",
      lookup: "https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Department-of-Transportation-and-Infrastructure/Parking/Parking-Enforcement",
      pay: "https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Department-of-Transportation-and-Infrastructure/Parking/Pay-or-Contest-a-Parking-Ticket",
      payUrl: (_ticket, _plate) => `https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Department-of-Transportation-and-Infrastructure/Parking/Pay-or-Contest-a-Parking-Ticket`,
      disputeEmail: "parking@denvergov.org",
      disputeDays: 30,
      disputeInfo: "https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Department-of-Transportation-and-Infrastructure/Parking/Pay-or-Contest-a-Parking-Ticket"
    },
    miami: {
      name: "Miami",
      lookup: "https://www.miamigov.com/Residents/Parking",
      pay: "https://www.miamigov.com/Residents/Parking",
      payUrl: (_ticket, _plate) => `https://www.miamigov.com/Residents/Parking`,
      disputeEmail: "parking@miamigov.com",
      disputeDays: 30,
      disputeInfo: "https://www.miamigov.com/Residents/Parking"
    },
    'las-vegas': {
      name: "Las Vegas",
      lookup: "https://www.lasvegasnevada.gov/Residents/Parking",
      pay: "https://www.lasvegasnevada.gov/Residents/Parking",
      payUrl: (_ticket, _plate) => `https://www.lasvegasnevada.gov/Residents/Parking`,
      disputeEmail: "parking@lasvegasnevada.gov",
      disputeDays: 30,
      disputeInfo: "https://www.lasvegasnevada.gov/Residents/Parking"
    }
  },

  // RENEWAL PORTALS — direct links for renewable items (Canada + US)
  renewalPortals: {
    // Canada
    ca: {
      "Passport": "https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports.html",
      "PR Card": "https://www.canada.ca/en/immigration-refugees-citizenship/services/new-immigrants/pr-card.html",
      "Work Permit": "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/permit.html",
      "Study Permit": "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html",
      "Visitor Visa": "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html",
      "Driver's License": {
        ON: "https://www.ontario.ca/page/renew-drivers-licence",
        BC: "https://www2.gov.bc.ca/gov/content/transportation/driving-and-cycling/icbc/driver-licensing/renew-replace",
        AB: "https://www.alberta.ca/renew-drivers-licence.aspx",
        QC: "https://saaq.gouv.qc.ca/en/drivers-licence/renewal/",
        MB: "https://www.gov.mb.ca/mit/driver/licensing/renew.html",
        SK: "https://www.sgi.sk.ca/renew-licence",
        NS: "https://novascotia.ca/sns/access/victoria/renew-drivers-licence.asp",
        NB: "https://www2.gnb.ca/content/gnb/en/departments/public_safety/services/drivers_and_vehicles.html",
        NL: "https://www.gov.nl.ca/motorregistration/renewal/",
        PE: "https://www.princeedwardisland.ca/en/information/transportation-and-infrastructure/renewing-your-drivers-licence",
        YT: "https://yukon.ca/en/drivers-licence-renewal",
        NT: "https://www.gov.nt.ca/en/services/drivers-licence-renewal",
        NU: "https://www.gov.nu.ca/community-and-government-services/information/driver-licensing",
        default: "https://www.canada.ca/en/services/transport/driving.html"
      },
      "OHIP Card (Ontario)": "https://www.ontario.ca/page/health-cards",
      "RAMQ Card (Quebec)": "https://www.ramq.gouv.qc.ca/en/citizens/health-insurance/Pages/health-insurance-card.aspx",
      "MSP Card (British Columbia)": "https://www2.gov.bc.ca/gov/content/health/health-drug-coverage/msp",
      "AHCIP Card (Alberta)": "https://www.alberta.ca/ahcip-card-renewal.aspx",
      "Vehicle Registration": {
        ON: "https://www.ontario.ca/page/renew-your-vehicle-permit",
        BC: "https://www.icbc.com/vehicle-registration/Pages/default.aspx",
        AB: "https://www.servicealberta.ca/renew-vehicle-registration.cfm",
        default: "https://www.canada.ca/en/services/transport.html"
      }
    },
    us: {
      "Passport": "https://travel.state.gov/content/travel/en/passports.html",
      "Driver's License": {
        default: "https://www.usa.gov/renew-drivers-license",
        NY: "https://dmv.ny.gov/renew-license",
        CA: "https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/",
        TX: "https://www.dps.texas.gov/section/driver-license",
        FL: "https://www.flhsmv.gov/driver-licenses-id-cards/",
        IL: "https://www.ilsos.gov/departments/drivers/drivers_license_guide.html",
        PA: "https://www.dmv.pa.gov/Driver-Services/Driver-Licensing/Pages/Renewal.aspx",
        AZ: "https://azdot.gov/motor-vehicles/driver-services/driver-license",
        WA: "https://www.dol.wa.gov/driverslicense/renew.html",
        MA: "https://www.mass.gov/drivers-license"
      }
    }
  },
  
  // COMMON DISPUTE REASONS
  disputeReasons: [
    { id: "signage", label: "Unclear or missing signage", description: "The parking signs were not visible, obstructed, or confusing" },
    { id: "meter", label: "Broken parking meter", description: "The meter was malfunctioning and would not accept payment" },
    { id: "medical", label: "Medical emergency", description: "I had a medical emergency that prevented me from moving my vehicle" },
    { id: "permit", label: "Valid permit not visible", description: "I had a valid parking permit that may not have been properly displayed" },
    { id: "wrong_plate", label: "Wrong license plate", description: "The ticket has an incorrect license plate number" },
    { id: "time_error", label: "Time/date error", description: "The ticket time or date is incorrect, or I was within the allowed time" },
    { id: "paid", label: "Already paid for parking", description: "I had already paid for parking via meter, app, or permit" },
    { id: "other", label: "Other reason", description: "A different reason not listed above" }
  ],
  
  // COMMON COMPLIANCE ITEMS (templates users can add)
  templates: {
    immigration: [
      { name: "Work Permit", reminderDays: [90, 60, 30, 14] },
      { name: "Study Permit", reminderDays: [90, 60, 30, 14] },
      { name: "Visitor Visa", reminderDays: [90, 60, 30, 14] },
      { name: "PR Card", reminderDays: [180, 90, 60, 30] },
      { name: "Passport", reminderDays: [180, 90, 60, 30] }
    ],
    driving: [
      { name: "Driver's License", reminderDays: [90, 60, 30, 14] },
      { name: "Vehicle Registration", reminderDays: [60, 30, 14, 7] },
      { name: "Car Insurance", reminderDays: [60, 30, 14, 7] }
    ],
    retirement_estate: [
      { name: "Will", reminderDays: [90, 60, 30] },
      { name: "Trust", reminderDays: [90, 60, 30] },
      { name: "Power of Attorney (POA)", reminderDays: [90, 60, 30] },
      { name: "Life Insurance", reminderDays: [60, 30, 14, 7] },
      { name: "Critical Illness Insurance", reminderDays: [60, 30, 14, 7] },
      { name: "Disability Insurance", reminderDays: [60, 30, 14, 7] },
      { name: "Annuity", reminderDays: [60, 30, 14, 7] },
      { name: "Beneficiary Designation Review", reminderDays: [90, 60, 30] },
      { name: "Estate Administration", reminderDays: [60, 30, 14, 7] },
      { name: "Executor Services", reminderDays: [60, 30, 14, 7] },
      { name: "RRSP", reminderDays: [60, 30, 14, 7] },
      { name: "TFSA", reminderDays: [60, 30, 14, 7] }
    ],
    health: [
      { name: "OHIP Card (Ontario)", reminderDays: [90, 60, 30, 14] },
      { name: "RAMQ Card (Quebec)", reminderDays: [90, 60, 30, 14] },
      { name: "MSP Card (British Columbia)", reminderDays: [90, 60, 30, 14] },
      { name: "AHCIP Card (Alberta)", reminderDays: [90, 60, 30, 14] },
      { name: "Health Card (Manitoba)", reminderDays: [90, 60, 30, 14] },
      { name: "Health Card (Saskatchewan)", reminderDays: [90, 60, 30, 14] },
      { name: "Health Card (Nova Scotia)", reminderDays: [90, 60, 30, 14] },
      { name: "Medicare Card (New Brunswick)", reminderDays: [90, 60, 30, 14] },
      { name: "Health Card (PEI)", reminderDays: [90, 60, 30, 14] },
      { name: "MCP Card (Newfoundland & Labrador)", reminderDays: [90, 60, 30, 14] },
      { name: "Health Card (Northwest Territories)", reminderDays: [90, 60, 30, 14] },
      { name: "Health Card (Yukon)", reminderDays: [90, 60, 30, 14] },
      { name: "Health Card (Nunavut)", reminderDays: [90, 60, 30, 14] },
      { name: "Medical Appointment", reminderDays: [14, 7, 3, 1] },
      { name: "Health Insurance", reminderDays: [60, 30, 14, 7] },
      { name: "Dental Plan", reminderDays: [60, 30, 14, 7] },
      { name: "Dental Insurance", reminderDays: [60, 30, 14, 7] }
    ],
    education: [
      { name: "Tuition Payment Deadline", reminderDays: [30, 14, 7, 3, 1] },
      { name: "Course Registration", reminderDays: [14, 7, 3, 1] },
      { name: "Drop/Add Deadline", reminderDays: [14, 7, 3, 1] },
      { name: "Exam", reminderDays: [30, 14, 7, 3, 1] },
      { name: "Midterm", reminderDays: [14, 7, 3, 1] },
      { name: "Assignment Due", reminderDays: [14, 7, 3, 1] },
      { name: "Project Deadline", reminderDays: [14, 7, 3, 1] },
      { name: "Lab Report Due", reminderDays: [7, 3, 1] },
      { name: "Scholarship Application", reminderDays: [30, 14, 7, 3] },
      { name: "Financial Aid Deadline", reminderDays: [30, 14, 7, 3] },
      { name: "Graduation Application", reminderDays: [60, 30, 14, 7] },
      { name: "Transcript Request", reminderDays: [14, 7, 3] },
      { name: "Student Visa Renewal", reminderDays: [90, 60, 30, 14] },
      { name: "Co-op/Internship Start", reminderDays: [30, 14, 7, 3] },
      { name: "Thesis/Dissertation Deadline", reminderDays: [60, 30, 14, 7, 3] }
    ],
    work_schedule: [
      { name: "Shift Start", reminderDays: [1] },
      { name: "Schedule Change", reminderDays: [7, 3, 1] },
      { name: "Time-Off Request Deadline", reminderDays: [14, 7, 3] },
      { name: "Overtime Approval", reminderDays: [3, 1] },
      { name: "Pay Day", reminderDays: [3, 1] },
      { name: "Performance Review", reminderDays: [14, 7, 3] },
      { name: "Training Session", reminderDays: [7, 3, 1] },
      { name: "Certification Expiry", reminderDays: [60, 30, 14, 7] },
      { name: "Union Dues Payment", reminderDays: [7, 3, 1] },
      { name: "Contract End Date", reminderDays: [90, 60, 30, 14, 7] }
    ],
    tax: [
      { name: "T1 Personal Tax Return", dueDate: "April 30", reminderDays: [60, 30, 14, 7] },
      { name: "T1 Self-Employed", dueDate: "June 15", reminderDays: [60, 30, 14, 7] },
      { name: "RRSP Contribution Deadline", dueDate: "March 1", reminderDays: [30, 14, 7] },
      { name: "Property Tax Installment", reminderDays: [30, 14, 7] }
    ],
    business_tax: [
      { name: "T2 Corporate Tax Return", reminderDays: [90, 60, 30, 14] },
      { name: "HST/GST Return (Quarterly)", reminderDays: [30, 14, 7] },
      { name: "HST/GST Return (Annual)", reminderDays: [60, 30, 14] },
      { name: "Payroll Remittance", reminderDays: [14, 7, 3] },
      { name: "T4 / T5 Slips Filing", dueDate: "February 28", reminderDays: [30, 14, 7] }
    ],
    employees: [
      { name: "New Hire Onboarding", reminderDays: [14, 7, 3, 1] },
      { name: "Work Permit / Visa Expiry", reminderDays: [180, 90, 60, 30, 14] },
      { name: "Police Background Check", reminderDays: [30, 14, 7] },
      { name: "Employment Contract Renewal", reminderDays: [90, 60, 30, 14] },
      { name: "Probation Review", reminderDays: [30, 14, 7] },
      { name: "Benefits Enrollment Deadline", reminderDays: [30, 14, 7, 3] },
      { name: "Payroll Run", reminderDays: [7, 3, 1] },
      { name: "ROE Filing (Record of Employment)", reminderDays: [7, 3, 1] },
      { name: "Workplace Safety Training", reminderDays: [30, 14, 7] },
      { name: "Employee Certification Renewal", reminderDays: [90, 60, 30, 14] },
      { name: "Sponsorship Application Deadline", reminderDays: [60, 30, 14, 7] },
      { name: "Annual Performance Review", reminderDays: [30, 14, 7] },
      { name: "T4 Slip Issuance", dueDate: "February 28", reminderDays: [30, 14, 7] }
    ],
    assets: [
      { name: "Vehicle Registration Renewal", reminderDays: [60, 30, 14, 7] },
      { name: "Equipment Warranty Expiry", reminderDays: [90, 60, 30] },
      { name: "Equipment Lease Renewal", reminderDays: [90, 60, 30, 14] },
      { name: "Insurance Policy Renewal", reminderDays: [60, 30, 14, 7] },
      { name: "CCA / Depreciation Schedule", reminderDays: [30, 14, 7] },
      { name: "Software License Renewal", reminderDays: [30, 14, 7] },
      { name: "Domain Name Renewal", reminderDays: [60, 30, 14, 7] },
      { name: "SSL Certificate Expiry", reminderDays: [30, 14, 7, 3] },
      { name: "Asset Inventory Audit", reminderDays: [30, 14, 7] }
    ],
    liabilities: [
      { name: "Business Loan Payment", reminderDays: [14, 7, 3, 1] },
      { name: "Line of Credit Review", reminderDays: [30, 14, 7] },
      { name: "Lease Obligation Payment", reminderDays: [14, 7, 3, 1] },
      { name: "Credit Card Statement", reminderDays: [7, 3, 1] },
      { name: "Vendor Invoice Due", reminderDays: [14, 7, 3, 1] },
      { name: "Government Grant Reporting", reminderDays: [30, 14, 7] },
      { name: "Lawsuit / Legal Filing Deadline", reminderDays: [30, 14, 7, 3] },
      { name: "Insurance Claim Deadline", reminderDays: [30, 14, 7] }
    ],
    business_license: [
      { name: "Business License (Municipal)", reminderDays: [60, 30, 14] },
      { name: "Ontario Annual Return", reminderDays: [60, 30, 14] },
      { name: "Federal Corporation Annual Return", reminderDays: [60, 30, 14] },
      { name: "WSIB", reminderDays: [60, 30, 14] }
    ],
    professional: [
      { name: "Professional License", reminderDays: [90, 60, 30, 14] },
      { name: "Designation Renewal (CPA, P.Eng, etc.)", reminderDays: [90, 60, 30, 14] },
      { name: "Continuing Education Credits", reminderDays: [60, 30, 14, 7] }
    ],
    business_insurance: [
      { name: "General Liability Insurance", reminderDays: [60, 30, 14, 7] },
      { name: "Professional Liability / E&O Insurance", reminderDays: [60, 30, 14, 7] },
      { name: "Commercial Auto Insurance", reminderDays: [60, 30, 14, 7] },
      { name: "Workers Compensation (WSIB)", reminderDays: [60, 30, 14, 7] },
      { name: "Property / Contents Insurance", reminderDays: [60, 30, 14, 7] },
      { name: "Cyber Liability Insurance", reminderDays: [60, 30, 14, 7] },
      { name: "Directors & Officers Insurance", reminderDays: [60, 30, 14, 7] },
      { name: "Key Person Insurance", reminderDays: [60, 30, 14, 7] }
    ],
    property: [
      { name: "Property Tax", reminderDays: [30, 14, 7] },
      { name: "Pet License", reminderDays: [30, 14, 7] }
    ],
    housing: [
      { name: "Lease Expiry", reminderDays: [90, 60, 30, 14] },
      { name: "Rent Increase Notice", reminderDays: [90, 60, 30] },
      { name: "Tenant Insurance", reminderDays: [60, 30, 14, 7] },
      { name: "Hydro Bill", reminderDays: [14, 7, 3] },
      { name: "Gas Bill", reminderDays: [14, 7, 3] },
      { name: "Internet Bill", reminderDays: [14, 7, 3] },
      { name: "Water Bill", reminderDays: [14, 7, 3] },
      { name: "Phone Bill", reminderDays: [14, 7, 3] },
      { name: "Electricity Bill", reminderDays: [14, 7, 3] },
      { name: "Move-in Inspection", reminderDays: [7, 3, 1] },
      { name: "Move-out Inspection", reminderDays: [30, 14, 7, 3] }
    ],
    office: [
      { name: "Commercial Lease", reminderDays: [180, 90, 60, 30] },
      { name: "Office Insurance", reminderDays: [60, 30, 14] },
      { name: "WSIB Payment", reminderDays: [30, 14, 7] },
      { name: "Payroll Remittance", reminderDays: [14, 7, 3] },
      { name: "HST Quarterly Filing", reminderDays: [30, 14, 7] },
      { name: "Annual Return (Provincial)", reminderDays: [60, 30, 14] },
      { name: "Annual Return (Federal)", reminderDays: [60, 30, 14] },
      { name: "Equipment Lease", reminderDays: [60, 30, 14] },
      { name: "Professional Liability Insurance", reminderDays: [60, 30, 14] }
    ],

    // ── Institution templates ──
    inst_regulatory: [
      { name: "Ministry of Education Inspection", reminderDays: [90, 60, 30, 14, 7] },
      { name: "Accreditation Renewal", reminderDays: [180, 90, 60, 30, 14] },
      { name: "Annual Compliance Report", reminderDays: [60, 30, 14, 7] },
      { name: "Government Audit", reminderDays: [60, 30, 14, 7] },
      { name: "Accessibility Compliance Deadline (AODA)", reminderDays: [90, 60, 30, 14] },
      { name: "Privacy Impact Assessment", reminderDays: [60, 30, 14, 7] },
      { name: "Health & Safety Act Compliance Review", reminderDays: [60, 30, 14] },
      { name: "Charitable Status Renewal (CRA)", reminderDays: [90, 60, 30, 14] },
      { name: "Hospital Accreditation (Accreditation Canada)", reminderDays: [180, 90, 60, 30] },
      { name: "Licensing Renewal (Childcare / Long-Term Care)", reminderDays: [120, 90, 60, 30, 14] }
    ],
    inst_staff: [
      { name: "Teacher Certification Renewal (OCT)", reminderDays: [120, 90, 60, 30, 14] },
      { name: "Vulnerable Sector Police Check", reminderDays: [90, 60, 30, 14] },
      { name: "Staff First Aid / CPR Certification", reminderDays: [60, 30, 14, 7] },
      { name: "Work Permit Expiry (International Staff)", reminderDays: [180, 90, 60, 30, 14] },
      { name: "Professional Development Hours", reminderDays: [60, 30, 14, 7] },
      { name: "Nursing License Renewal (CNO)", reminderDays: [120, 90, 60, 30, 14] },
      { name: "WHMIS Training Renewal", reminderDays: [60, 30, 14] },
      { name: "Employee Contract Renewal", reminderDays: [90, 60, 30, 14] },
      { name: "Probation Period End", reminderDays: [30, 14, 7] },
      { name: "Annual Performance Evaluation", reminderDays: [30, 14, 7] },
      { name: "Benefits Enrollment Deadline", reminderDays: [30, 14, 7, 3] }
    ],
    inst_student: [
      { name: "Report Card Submission", reminderDays: [14, 7, 3, 1] },
      { name: "OSAP / Financial Aid Processing", reminderDays: [30, 14, 7, 3] },
      { name: "Scholarship Disbursement", reminderDays: [30, 14, 7] },
      { name: "International Student Visa Tracking", reminderDays: [180, 90, 60, 30, 14] },
      { name: "Co-op Placement Paperwork", reminderDays: [30, 14, 7, 3] },
      { name: "Student Registration Deadline", reminderDays: [30, 14, 7, 3] },
      { name: "Admissions Application Deadline", reminderDays: [60, 30, 14, 7] },
      { name: "Transcript Release", reminderDays: [14, 7, 3] },
      { name: "Student Record Retention Review", reminderDays: [60, 30, 14] },
      { name: "Immunization Record Verification", reminderDays: [30, 14, 7] }
    ],
    inst_finance: [
      { name: "Government Funding Application", reminderDays: [60, 30, 14, 7] },
      { name: "Grant Reporting Deadline", reminderDays: [30, 14, 7, 3] },
      { name: "Charitable Return Filing (T3010)", dueDate: "June 30", reminderDays: [60, 30, 14, 7] },
      { name: "Annual Budget Submission", reminderDays: [60, 30, 14, 7] },
      { name: "Tuition Fee Collection Deadline", reminderDays: [30, 14, 7, 3] },
      { name: "Payroll Run", reminderDays: [7, 3, 1] },
      { name: "Property Tax Payment", reminderDays: [30, 14, 7] },
      { name: "Audit Completion", reminderDays: [60, 30, 14, 7] },
      { name: "Donor Receipt Issuance", reminderDays: [30, 14, 7] }
    ],
    inst_safety: [
      { name: "Fire Safety Inspection", reminderDays: [60, 30, 14, 7] },
      { name: "Building Code Inspection", reminderDays: [60, 30, 14, 7] },
      { name: "Fire Drill", reminderDays: [14, 7, 3, 1] },
      { name: "Lockdown Drill", reminderDays: [14, 7, 3, 1] },
      { name: "Emergency Plan Review", reminderDays: [60, 30, 14] },
      { name: "Elevator Inspection (TSSA)", reminderDays: [60, 30, 14] },
      { name: "Boiler / Pressure Vessel Inspection", reminderDays: [60, 30, 14] },
      { name: "Playground Safety Inspection", reminderDays: [30, 14, 7] },
      { name: "Hazardous Materials Audit", reminderDays: [60, 30, 14] },
      { name: "AED / Defibrillator Maintenance", reminderDays: [30, 14, 7] }
    ],
    inst_facilities: [
      { name: "HVAC Maintenance", reminderDays: [30, 14, 7] },
      { name: "Roof Inspection", reminderDays: [60, 30, 14] },
      { name: "Pest Control Service", reminderDays: [14, 7, 3] },
      { name: "Water Quality Testing", reminderDays: [30, 14, 7] },
      { name: "Backflow Prevention Test", reminderDays: [60, 30, 14] },
      { name: "Generator Testing", reminderDays: [30, 14, 7] },
      { name: "Parking Lot Maintenance", reminderDays: [30, 14, 7] },
      { name: "Snow Removal Contract Renewal", reminderDays: [90, 60, 30] },
      { name: "Janitorial Contract Renewal", reminderDays: [60, 30, 14] },
      { name: "Security System Inspection", reminderDays: [60, 30, 14] }
    ],
    inst_legal: [
      { name: "Insurance Policy Renewal", reminderDays: [60, 30, 14, 7] },
      { name: "Directors & Officers Insurance", reminderDays: [60, 30, 14, 7] },
      { name: "Union Agreement Renewal", reminderDays: [180, 90, 60, 30] },
      { name: "Collective Bargaining Deadline", reminderDays: [90, 60, 30, 14] },
      { name: "Legal Filing Deadline", reminderDays: [30, 14, 7, 3] },
      { name: "Privacy Policy Review (FIPPA / PHIPA)", reminderDays: [60, 30, 14] },
      { name: "Board Governance Review", reminderDays: [60, 30, 14] },
      { name: "Annual General Meeting", reminderDays: [60, 30, 14, 7] },
      { name: "Conflict of Interest Declarations", reminderDays: [30, 14, 7] }
    ],
    inst_programs: [
      { name: "Curriculum Review Deadline", reminderDays: [60, 30, 14, 7] },
      { name: "Program Accreditation Submission", reminderDays: [90, 60, 30, 14] },
      { name: "Academic Calendar Finalization", reminderDays: [60, 30, 14] },
      { name: "Course Offering Deadline", reminderDays: [30, 14, 7] },
      { name: "Exam Schedule Publication", reminderDays: [30, 14, 7] },
      { name: "Textbook / Material Ordering", reminderDays: [60, 30, 14] },
      { name: "Field Trip Approval Deadline", reminderDays: [14, 7, 3] },
      { name: "Graduation Ceremony Planning", reminderDays: [90, 60, 30, 14] },
      { name: "Research Ethics Board Submission", reminderDays: [30, 14, 7] },
      { name: "Clinical Placement Agreement", reminderDays: [60, 30, 14, 7] }
    ],
    inst_sports: [
      { name: "League Registration Deadline", reminderDays: [60, 30, 14, 7] },
      { name: "Player Eligibility Paperwork", reminderDays: [30, 14, 7, 3] },
      { name: "Medical Clearance / Physical", reminderDays: [60, 30, 14, 7] },
      { name: "Coaching Certification Renewal", reminderDays: [90, 60, 30, 14] },
      { name: "Coach Background Check (VSS)", reminderDays: [90, 60, 30, 14] },
      { name: "First Aid / CPR Certification", reminderDays: [60, 30, 14, 7] },
      { name: "Team Insurance Policy Renewal", reminderDays: [60, 30, 14, 7] },
      { name: "Facility Booking / Permit", reminderDays: [30, 14, 7, 3] },
      { name: "Arena / Field Safety Inspection", reminderDays: [30, 14, 7] },
      { name: "Equipment Safety Check", reminderDays: [30, 14, 7] },
      { name: "Sponsorship Agreement Renewal", reminderDays: [60, 30, 14] },
      { name: "Municipal Grant Application", reminderDays: [60, 30, 14, 7] },
      { name: "Annual General Meeting", reminderDays: [30, 14, 7] },
      { name: "Tournament Registration", reminderDays: [30, 14, 7, 3] },
      { name: "Referee / Official Certification", reminderDays: [60, 30, 14] },
      { name: "Season Fee Collection Deadline", reminderDays: [30, 14, 7, 3] }
    ]
  }
};

export default APP_CONFIG;

