/** Parse notes for ticket #, city, plate. Returns { city, ticketNumber, licensePlate } */
export function parseTicketFromNotes(notes) {
  if (!notes || typeof notes !== 'string') return {};
  const n = notes.replace(/\r/g, '');
  let ticketNumber = '';
  let licensePlate = '';
  let city = '';
  const ticketMatch = n.match(/(?:Ticket\s*#?|Number:)\s*([A-Za-z0-9-]+)/i);
  if (ticketMatch) ticketNumber = ticketMatch[1].trim();
  const plateMatch = n.match(/(?:Plate|License\s*Plate):\s*([A-Za-z0-9\s-]+)/i);
  if (plateMatch) licensePlate = plateMatch[1].trim().replace(/\s+/g, ' ');
  const cityMatch = n.match(/(?:City:)\s*([^\n]+)/i);
  if (cityMatch) {
    const raw = cityMatch[1].trim();
    const portalKeys = {
      toronto: 'toronto', ottawa: 'ottawa', mississauga: 'mississauga', brampton: 'brampton',
      hamilton: 'hamilton', vancouver: 'vancouver', calgary: 'calgary', edmonton: 'edmonton',
      montreal: 'montreal', winnipeg: 'winnipeg',
      'new york': 'new-york', nyc: 'new-york', 'los angeles': 'los-angeles', la: 'los-angeles',
      chicago: 'chicago', 'san francisco': 'san-francisco', sf: 'san-francisco', seattle: 'seattle',
      boston: 'boston', houston: 'houston', phoenix: 'phoenix', philadelphia: 'philadelphia',
      'san diego': 'san-diego', denver: 'denver', miami: 'miami', 'las vegas': 'las-vegas'
    };
    const lower = raw.toLowerCase();
    for (const [key, id] of Object.entries(portalKeys)) {
      if (lower.includes(key)) { city = id; break; }
    }
  }
  return { city, ticketNumber, licensePlate };
}
