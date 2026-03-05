const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://qyisjxfugogimgzhualw.supabase.co').replace(/\/$/, '');

export const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

export const PROVIDERS = [
  { id: 'gmail', name: 'Gmail', desc: 'Google Mail' },
  { id: 'outlook', name: 'Outlook', desc: 'Microsoft 365, Outlook.com, Hotmail' },
];
