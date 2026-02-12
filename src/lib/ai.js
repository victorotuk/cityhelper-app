// ============================================
// AI PROVIDER INTEGRATIONS
// Full selection of AI models like paal.ai
// ============================================

const AI_PROVIDERS = {
  // OpenAI Models
  'gpt-4o': {
    name: 'GPT-4o',
    icon: '🟢',
    description: 'OpenAI\'s fastest flagship',
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o'
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    icon: '🟢',
    description: 'Fast & affordable',
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini'
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    icon: '🟢',
    description: 'Most capable GPT-4',
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4-turbo'
  },
  'o1-preview': {
    name: 'o1 Preview',
    icon: '🟢',
    description: 'Advanced reasoning',
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'o1-preview'
  },

  // Anthropic Claude Models
  'claude-opus': {
    name: 'Claude Opus',
    icon: '🟣',
    description: 'Most powerful Claude',
    provider: 'claude',
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-opus-20240229'
  },
  'claude-sonnet': {
    name: 'Claude Sonnet',
    icon: '🟣',
    description: 'Balanced power & speed',
    provider: 'claude',
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-5-sonnet-20241022'
  },
  'claude-haiku': {
    name: 'Claude Haiku',
    icon: '🟣',
    description: 'Fast & efficient',
    provider: 'claude',
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-haiku-20240307'
  },

  // xAI Grok
  'grok': {
    name: 'Grok',
    icon: '⚡',
    description: 'xAI\'s witty AI',
    provider: 'grok',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-beta'
  },
  'grok-2': {
    name: 'Grok 2',
    icon: '⚡',
    description: 'Latest Grok model',
    provider: 'grok',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-2-1212'
  },

  // Google
  'gemini-pro': {
    name: 'Gemini Pro',
    icon: '🔵',
    description: 'Google\'s flagship',
    provider: 'gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    model: 'gemini-pro'
  },
  'gemini-flash': {
    name: 'Gemini Flash',
    icon: '🔵',
    description: 'Fast & lightweight',
    provider: 'gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    model: 'gemini-1.5-flash'
  },

  // Meta Llama (via Together/Groq)
  'llama-70b': {
    name: 'Llama 3.1 70B',
    icon: '🦙',
    description: 'Meta\'s open model',
    provider: 'together',
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    model: 'meta-llama/Llama-3.1-70B-Instruct-Turbo'
  },
  'llama-405b': {
    name: 'Llama 3.1 405B',
    icon: '🦙',
    description: 'Largest open model',
    provider: 'together',
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    model: 'meta-llama/Llama-3.1-405B-Instruct-Turbo'
  },

  // Mistral
  'mistral-large': {
    name: 'Mistral Large',
    icon: '🌀',
    description: 'Mistral\'s flagship',
    provider: 'mistral',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    model: 'mistral-large-latest'
  }
};

// Group providers for the UI
const PROVIDER_GROUPS = {
  openai: { name: 'OpenAI', color: '#10a37f', keyUrl: 'https://platform.openai.com/api-keys' },
  claude: { name: 'Anthropic', color: '#7c3aed', keyUrl: 'https://console.anthropic.com/' },
  grok: { name: 'xAI', color: '#1d9bf0', keyUrl: 'https://console.x.ai/' },
  gemini: { name: 'Google', color: '#4285f4', keyUrl: 'https://makersuite.google.com/app/apikey' },
  together: { name: 'Together AI', color: '#ff6b35', keyUrl: 'https://api.together.xyz/' },
  mistral: { name: 'Mistral', color: '#ff7000', keyUrl: 'https://console.mistral.ai/' }
};

// System prompt for Canadian compliance assistant
const SYSTEM_PROMPT = `You are CityHelper, your all-in-one Canadian compliance assistant. Users talk to YOU for everything - no need to navigate elsewhere.

## What You Handle

**🛂 Immigration & Visas**
- Work permits, study permits, visitor visas, PR cards, citizenship
- IRCC processing times, application requirements, document checklists
- Status extensions, bridging permits, flagpoling

**💰 Taxes (Personal & Business)**
- T1 deadlines (April 30, June 15 self-employed), T4, RRSP, deductions
- T2 corporate, HST/GST filings, payroll, tax installments
- CRA My Account, Notice of Assessment

**🏢 Business & Office**
- Corporate taxes (T2), HST/GST filings
- Payroll source deductions, WSIB payments
- Business licenses, annual returns (provincial & federal)
- Commercial leases, office insurance, equipment leasing

**🏡 Housing & Rentals**
- Lease expiry tracking, rent increase limits (Ontario 2.5% guideline for 2024)
- Tenant rights by province, landlord obligations
- Tenant insurance, utility bills, move-in/out inspections
- LTB (Landlord Tenant Board) processes in Ontario

**🚗 Driving & Vehicles**
- License renewals, vehicle registration, sticker renewals
- Insurance requirements, out-of-province transfers

**🅿️ Traffic & Parking Violations Tracker**
- Parking and highway traffic infractions, every province
- Pay, dispute, or track tickets — city and provincial portals

**❤️ Health**
- Provincial health cards: OHIP (ON), RAMQ (QC), MSP (BC), AHCIP (AB), Manitoba, Saskatchewan, Nova Scotia, New Brunswick, PEI, Newfoundland & Labrador, NWT, Yukon, Nunavut
- Medical appointments, prescriptions
- Health insurance and dental plans / dental insurance
- Passport renewals, SIN applications
- Professional license renewals (nursing, engineering, CPA, etc.)

**📜 Retirement & Estate Planning**
- Wills, trusts, Power of Attorney (POA)
- Life insurance, critical illness insurance, disability insurance, annuities
- Beneficiary designations (RRSP, TFSA, insurance) — flag when will and beneficiaries contradict
- Estate administration (probate, inventory, debts, taxes, distribution)
- Executor services, RRSP, TFSA
- Value: One dashboard shows who gets what — helps catch mismatches (ex-spouse on policy, new baby not on RRSP, etc.)

## Key Actions You Help With
1. **Explain deadlines** - Tell them exactly when things are due
2. **Calculate estimates** - Taxes, rent increases, penalties
3. **Draft letters** - Dispute letters, formal requests
4. **Find professionals** - Lawyers, accountants, immigration consultants
5. **Provide checklists** - What documents they need for applications
6. **Cite sources** - Link to CRA, IRCC, ServiceOntario, city websites

## Finding Professional Help
- **Immigration**: Law Society directories, ICCRC licensed consultants (cicc-ccic.ca)
- **Accountants/CPAs**: CPA Canada directory, H&R Block, local firms
- **Lawyers**: Law Society of Ontario/BC/Alberta referral services
- Remind them to use "Copy Summary" to share their tracked items with professionals

## Your Style
- Concise but complete - don't over-explain simple things
- Warm and encouraging - compliance is stressful, be supportive
- Action-oriented - tell them exactly what to do next
- Cite official sources when relevant

Never provide specific legal/tax advice - recommend professionals for complex situations.`;

// OpenAI-compatible API call (works for OpenAI, Grok, Together, Mistral)
async function callOpenAICompatible(messages, config, apiKey) {
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API error');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Claude API call
async function callClaude(messages, config, apiKey) {
  const claudeMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content
  }));

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: claudeMessages
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Claude API error');
  }

  const data = await response.json();
  return data.content[0].text;
}

// Gemini API call
async function callGemini(messages, config, apiKey) {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  contents.unshift({
    role: 'user',
    parts: [{ text: `Context: ${SYSTEM_PROMPT}\n\nNow respond to the following:` }]
  });

  const url = `${config.endpoint}?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Gemini API error');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Main chat function
export async function chat(messages, modelKey, apiKeys) {
  const config = AI_PROVIDERS[modelKey];
  if (!config) throw new Error('Unknown model');

  const apiKey = apiKeys[config.provider];
  if (!apiKey) {
    throw new Error(`Add your ${PROVIDER_GROUPS[config.provider].name} API key in settings`);
  }

  switch (config.provider) {
    case 'openai':
    case 'grok':
    case 'together':
    case 'mistral':
      return callOpenAICompatible(messages, config, apiKey);
    case 'claude':
      return callClaude(messages, config, apiKey);
    case 'gemini':
      return callGemini(messages, config, apiKey);
    default:
      throw new Error('Unknown provider');
  }
}

export { AI_PROVIDERS, PROVIDER_GROUPS, SYSTEM_PROMPT };
