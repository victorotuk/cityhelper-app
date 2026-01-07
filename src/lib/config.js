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
      features: ["Deadline reminders", "5 compliance items", "Email alerts"]
    },
    personal: {
      name: "Personal",
      price: 8,
      features: ["Unlimited items", "Document vault", "Tax estimator", "SMS alerts", "Calendar sync"]
    },
    business: {
      name: "Business", 
      price: 25,
      features: ["Everything in Personal", "Multiple users", "Business compliance", "Payroll calculator", "Priority support"]
    }
  },
  
  // COMPLIANCE CATEGORIES
  categories: [
    { id: "immigration", name: "Immigration & Visas", icon: "Plane", color: "#3b82f6" },
    { id: "personal_tax", name: "Personal Taxes", icon: "DollarSign", color: "#10b981" },
    { id: "business_tax", name: "Business Taxes", icon: "Building2", color: "#8b5cf6" },
    { id: "driving", name: "Driving & Vehicles", icon: "Car", color: "#f59e0b" },
    { id: "parking", name: "Parking Tickets", icon: "ParkingCircle", color: "#dc2626" },
    { id: "health", name: "Health Cards", icon: "Heart", color: "#ef4444" },
    { id: "housing", name: "Housing & Rentals", icon: "Home", color: "#06b6d4" },
    { id: "office", name: "Office & Business", icon: "Briefcase", color: "#8b5cf6" },
    { id: "business_license", name: "Business Licenses", icon: "FileText", color: "#6366f1" },
    { id: "property", name: "Property & Municipal", icon: "Building", color: "#14b8a6" },
    { id: "professional", name: "Professional Licenses", icon: "GraduationCap", color: "#f97316" },
    { id: "other", name: "Other", icon: "Pin", color: "#64748b" }
  ],
  
  // PARKING TICKET PORTALS BY CITY (lookup, pay, dispute)
  parkingPortals: {
    toronto: {
      name: "Toronto",
      lookup: "https://secure.toronto.ca/wes/eTPP/welcome.do",
      pay: "https://secure.toronto.ca/wes/eTPP/welcome.do",
      // Toronto accepts tag_number param for pre-fill
      payUrl: (ticket, plate) => `https://secure.toronto.ca/wes/eTPP/welcome.do?tag_number=${ticket}`,
      disputeEmail: "parkingticketreview@toronto.ca",
      disputeDays: 15,
      disputeInfo: "https://www.toronto.ca/services-payments/tickets-fines-penalties/dispute-a-ticket/"
    },
    ottawa: {
      name: "Ottawa",
      lookup: "https://ottawa.ca/en/parking-tickets",
      pay: "https://pay.ottawa.ca/",
      payUrl: (ticket, plate) => `https://pay.ottawa.ca/`,
      disputeEmail: "parkingtickets@ottawa.ca",
      disputeDays: 15,
      disputeInfo: "https://ottawa.ca/en/parking-tickets#dispute"
    },
    mississauga: {
      name: "Mississauga",
      lookup: "https://www.mississauga.ca/services-and-programs/transportation-and-streets/parking/parking-tickets/",
      pay: "https://www.paytickets.ca/",
      // paytickets.ca supports infraction_number param
      payUrl: (ticket, plate) => `https://www.paytickets.ca/?infraction_number=${ticket}`,
      disputeEmail: "parking.tickets@mississauga.ca",
      disputeDays: 15,
      disputeInfo: "https://www.mississauga.ca/services-and-programs/transportation-and-streets/parking/dispute-a-parking-ticket/"
    },
    brampton: {
      name: "Brampton",
      lookup: "https://www.brampton.ca/EN/residents/Parking/Pages/Parking-Tickets.aspx",
      pay: "https://www.paytickets.ca/",
      payUrl: (ticket, plate) => `https://www.paytickets.ca/?infraction_number=${ticket}`,
      disputeEmail: "parking@brampton.ca",
      disputeDays: 15,
      disputeInfo: "https://www.brampton.ca/EN/residents/Parking/Pages/Parking-Tickets.aspx"
    },
    hamilton: {
      name: "Hamilton",
      lookup: "https://www.hamilton.ca/streets-transportation/tickets-parking/parking-tickets",
      pay: "https://www.paytickets.ca/",
      payUrl: (ticket, plate) => `https://www.paytickets.ca/?infraction_number=${ticket}`,
      disputeEmail: "parkingservices@hamilton.ca",
      disputeDays: 15,
      disputeInfo: "https://www.hamilton.ca/streets-transportation/tickets-parking/dispute-parking-ticket"
    },
    vancouver: {
      name: "Vancouver",
      lookup: "https://vancouver.ca/streets-transportation/pay-a-parking-ticket.aspx",
      pay: "https://epay.vancouver.ca/",
      payUrl: (ticket, plate) => `https://epay.vancouver.ca/parkingviolation/`,
      disputeEmail: "parking@vancouver.ca",
      disputeDays: 14,
      disputeInfo: "https://vancouver.ca/streets-transportation/dispute-a-parking-ticket.aspx"
    },
    calgary: {
      name: "Calgary",
      lookup: "https://www.calgary.ca/cps/traffic/tickets.html",
      pay: "https://eservices.calgary.ca/parkingtickets/",
      payUrl: (ticket, plate) => `https://eservices.calgary.ca/parkingtickets/`,
      disputeEmail: "parkingauthority@calgary.ca",
      disputeDays: 30,
      disputeInfo: "https://www.calgary.ca/cps/traffic/parking-tickets/dispute.html"
    },
    edmonton: {
      name: "Edmonton",
      lookup: "https://www.edmonton.ca/transportation/parking_tickets",
      pay: "https://parkingtickets.edmonton.ca/",
      payUrl: (ticket, plate) => `https://parkingtickets.edmonton.ca/`,
      disputeEmail: "parking@edmonton.ca",
      disputeDays: 30,
      disputeInfo: "https://www.edmonton.ca/transportation/parking_tickets/dispute-parking-ticket"
    },
    montreal: {
      name: "Montreal",
      lookup: "https://montreal.ca/en/services/pay-fine",
      pay: "https://servicesenligne2.ville.montreal.qc.ca/",
      payUrl: (ticket, plate) => `https://servicesenligne2.ville.montreal.qc.ca/`,
      disputeEmail: "stationnement@montreal.ca",
      disputeDays: 30,
      disputeInfo: "https://montreal.ca/en/services/contest-ticket"
    },
    winnipeg: {
      name: "Winnipeg",
      lookup: "https://winnipeg.ca/ppd/parking/tickets.stm",
      pay: "https://myservices.winnipeg.ca/",
      payUrl: (ticket, plate) => `https://myservices.winnipeg.ca/`,
      disputeEmail: "parkingauthority@winnipeg.ca",
      disputeDays: 14,
      disputeInfo: "https://winnipeg.ca/ppd/parking/dispute.stm"
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
    health: [
      { name: "OHIP Card (Ontario)", reminderDays: [90, 60, 30, 14] },
      { name: "Health Card (Other Province)", reminderDays: [90, 60, 30, 14] }
    ],
    personal_tax: [
      { name: "T1 Personal Tax Return", dueDate: "April 30", reminderDays: [60, 30, 14, 7] },
      { name: "T1 Self-Employed", dueDate: "June 15", reminderDays: [60, 30, 14, 7] }
    ],
    business_tax: [
      { name: "HST/GST Return (Quarterly)", reminderDays: [30, 14, 7] },
      { name: "HST/GST Return (Annual)", reminderDays: [60, 30, 14] },
      { name: "T2 Corporate Tax", reminderDays: [90, 60, 30, 14] }
    ],
    business_license: [
      { name: "Business License (Municipal)", reminderDays: [60, 30, 14] },
      { name: "Ontario Annual Return", reminderDays: [60, 30, 14] },
      { name: "Federal Corporation Annual Return", reminderDays: [60, 30, 14] },
      { name: "WSIB", reminderDays: [60, 30, 14] }
    ],
    professional: [
      { name: "Professional License", reminderDays: [90, 60, 30, 14] }
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
    ]
  }
};

export default APP_CONFIG;

