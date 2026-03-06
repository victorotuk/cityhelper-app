/**
 * Per-category config for the generic Item Setup Wizard.
 * Setup guides: short, clear flows so even teenagers can follow. Every category that can be set up gets a guide.
 */

export const TRUST_TYPES = [
  { id: 'living', label: 'Living trust' },
  { id: 'irrevocable', label: 'Irrevocable trust' },
  { id: 'family', label: 'Family trust' },
  { id: 'other', label: 'Other' },
];

/** Categories that use "type + name" in step 1 (e.g. trust type). Others use name + optional quick picks. */
export const CATEGORIES_WITH_TYPE_SELECTOR = ['trust'];

/** Categories that use dedicated "people" fields in step 2 (e.g. trustee, beneficiaries). Others use a single notes field. */
export const CATEGORIES_WITH_PEOPLE_STEP = ['trust'];

/**
 * Setup guide for each category: title + short steps (shown at top of step 1).
 * Written so anyone—including teenagers—can follow. Links back to dashboard when done.
 */
export const CATEGORY_SETUP_GUIDES = {
  trust: {
    title: 'How to set up a trust',
    steps: [
      'You\'re here. Choose the type of trust and give it a name.',
      'Add who\'s involved (trustee and beneficiaries) so you have it on record.',
      'Set a review date and optionally link a document. Then we add it to your dashboard and remind you.',
    ],
  },
  contracts: {
    title: 'Setting up a holding company or contract',
    steps: [
      'Give it a name (e.g. the company or agreement name) so you can find it later.',
      'Add any details you know—parties, key dates, notes—in the next step.',
      'Set when you want to be reminded and link a document if you have one. We\'ll add it to your dashboard.',
    ],
  },
  business_license: {
    title: 'Setting up a company or license to track',
    steps: [
      'Name the company or license (e.g. "ABC Corp" or "Restaurant license") so you can track it.',
      'Add any details—registration number, expiry, notes—so everything is in one place.',
      'Set a due or review date and link a document if you have one. We\'ll add it to your dashboard.',
    ],
  },
  retirement_estate: {
    title: 'Setting up something to track for wealth or estate',
    steps: [
      'Give it a name (e.g. "RRSP with Bank X" or "Estate plan") so you can track it.',
      'Add any details you want to remember—account, dates, notes.',
      'Set a review date and link a document if you have one. We\'ll add it to your dashboard.',
    ],
  },
  housing: {
    title: 'Setting up a housing-related item',
    steps: [
      'Name it (e.g. "Lease – 123 Main St" or "Mortgage") so you can track it.',
      'Add any details—landlord, dates, notes—in the next step.',
      'Set a due date and link a document if you have one. We\'ll add it to your dashboard.',
    ],
  },
  other: {
    title: 'Adding an item to track',
    steps: [
      'Give it a name so you can find it on your dashboard.',
      'Add any notes or details in the next step.',
      'Set a due date and optionally link a document. We\'ll add it to your dashboard.',
    ],
  },
};

/** Default guide for categories without a specific one: short and generic. */
const DEFAULT_GUIDE = {
  title: 'Adding this to your dashboard',
  steps: [
    'Name it so you can track it.',
    'Add any details in the next step.',
    'Set a due date and optionally link a document. We\'ll add it to your dashboard.',
  ],
};

export function getSetupGuide(category) {
  return CATEGORY_SETUP_GUIDES[category] || DEFAULT_GUIDE;
}

export function hasTypeSelector(category) {
  return CATEGORIES_WITH_TYPE_SELECTOR.includes(category);
}

export function hasPeopleStep(category) {
  return CATEGORIES_WITH_PEOPLE_STEP.includes(category);
}
