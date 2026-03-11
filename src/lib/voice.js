/**
 * Voice feedback for accessibility — uses Speech Synthesis API.
 * When enabled, the app can read out confirmations and key info so users
 * can use Nava without looking at the screen.
 */

const STORAGE_KEY = 'nava_voice_feedback';

export function getVoicePreference(userId) {
  if (typeof window === 'undefined') return false;
  try {
    const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

export function setVoicePreference(userId, enabled) {
  if (typeof window === 'undefined') return;
  try {
    const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
    if (enabled) localStorage.setItem(key, 'true');
    else localStorage.removeItem(key);
  } catch { /* ignore */ }
}

/** Speak text. Call only when voice feedback is enabled (caller checks preference). */
export function speak(text, options = {}) {
  if (typeof window === 'undefined' || !text?.trim()) return;
  const { interrupt = true } = options;
  const synth = window.speechSynthesis;
  if (!synth) return;
  if (interrupt) synth.cancel();
  const u = new SpeechSynthesisUtterance(text.trim());
  u.rate = 0.95;
  u.pitch = 1;
  u.lang = 'en-US';
  synth.speak(u);
}

export function stopSpeaking() {
  if (typeof window === 'undefined') return;
  window.speechSynthesis?.cancel();
}
