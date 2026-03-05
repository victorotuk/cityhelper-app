import { Cpu, MapPin } from 'lucide-react';

export const CATEGORIES = [
  { id: 'vehicle', label: 'Vehicle' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'property', label: 'Property' },
  { id: 'jewelry', label: 'Jewelry' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'other', label: 'Other' },
];

export const MILEAGE_OPTIONS = [
  { id: 'obd', label: 'OBD-II dongle', desc: 'Auto-read from Bluetooth OBD when in car (GPS fallback)', icon: Cpu },
  { id: 'gps_maps', label: 'GPS + Maps', desc: 'Detect trips by speed & road (no dongle)', icon: MapPin },
];
