/**
 * Per-category config for the generic Item Setup Wizard.
 * Determines step 1 & 2 content (name/type vs templates, trustee vs notes).
 */

export const TRUST_TYPES = [
  { id: 'living', label: 'Living trust' },
  { id: 'irrevocable', label: 'Irrevocable trust' },
  { id: 'family', label: 'Family trust' },
  { id: 'other', label: 'Other' },
];

/** Categories that use "type + name" in step 1 (e.g. trust type). Others use name + template quick picks. */
export const CATEGORIES_WITH_TYPE_SELECTOR = ['trust'];

/** Categories that use dedicated "people" fields in step 2 (e.g. trustee, beneficiaries). Others use a single notes field. */
export const CATEGORIES_WITH_PEOPLE_STEP = ['trust'];

export function hasTypeSelector(category) {
  return CATEGORIES_WITH_TYPE_SELECTOR.includes(category);
}

export function hasPeopleStep(category) {
  return CATEGORIES_WITH_PEOPLE_STEP.includes(category);
}
