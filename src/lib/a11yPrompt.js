/**
 * One-time accessibility prompt helpers (localStorage key and get/set).
 */

const A11Y_ASKED_KEY = (userId) => `nava_a11y_prompt_asked_${userId || ''}`;

export function markA11yPromptAsked(userId) {
  if (userId) localStorage.setItem(A11Y_ASKED_KEY(userId), 'true');
}

export function wasA11yPromptAsked(userId) {
  if (!userId) return true;
  return localStorage.getItem(A11Y_ASKED_KEY(userId)) === 'true';
}
