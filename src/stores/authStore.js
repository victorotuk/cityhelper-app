import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { hashPassword, generateUserKey } from '../lib/crypto';

const OAUTH_KEY_PREFIX = 'navaEncryptionKey_';

function ensureEncryptionKey(session) {
  if (!session?.user) return;
  const userId = session.user.id;
  let key = sessionStorage.getItem('userEncryptionKey');
  if (key) return;

  const storedKeyHash = localStorage.getItem(`keyHash_${userId}`);
  if (storedKeyHash) {
    return; // Password user — needs unlock, key not in session
  }

  // OAuth user: get or create auto-generated key
  let oauthKey = localStorage.getItem(OAUTH_KEY_PREFIX + userId);
  if (!oauthKey) {
    oauthKey = generateUserKey();
    localStorage.setItem(OAUTH_KEY_PREFIX + userId, oauthKey);
  }
  sessionStorage.setItem('userEncryptionKey', oauthKey);
}

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const storedKeyHash = localStorage.getItem(`keyHash_${session.user.id}`);
        const sessionKey = sessionStorage.getItem('userEncryptionKey');

        if (storedKeyHash && !sessionKey) {
          set({ session, user: session.user, loading: false, needsUnlock: true });
          return;
        }

        // OAuth user: no key locally, but has recovery_key in metadata → needs recovery passphrase
        const recoveryKey = session.user?.user_metadata?.recovery_key;
        if (!storedKeyHash && !sessionKey && recoveryKey) {
          set({ session, user: session.user, loading: false, needsUnlock: true, needsRecovery: true });
          return;
        }

        ensureEncryptionKey(session);
      }

      set({
        session,
        user: session?.user ?? null,
        loading: false
      });

      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) ensureEncryptionKey(session);
        set({
          session,
          user: session?.user ?? null
        });
      });
    } catch (err) {
      console.error('[Auth] Initialize failed:', err);
      set({ session: null, user: null, loading: false });
    }
  },

  // Set encryption key (derived from password)
  setEncryptionKey: async (password, userId) => {
    // Use password as encryption key (in production, derive properly)
    sessionStorage.setItem('userEncryptionKey', password);
    
    // Store hash to verify on future logins
    const hash = await hashPassword(password);
    localStorage.setItem(`keyHash_${userId}`, hash);
    
    set({ needsUnlock: false });
  },

  // Verify and unlock with password
  unlockWithPassword: async (password, userId) => {
    const storedHash = localStorage.getItem(`keyHash_${userId}`);
    const inputHash = await hashPassword(password);
    
    if (storedHash && storedHash !== inputHash) {
      throw new Error('Incorrect password');
    }
    
    sessionStorage.setItem('userEncryptionKey', password);
    set({ needsUnlock: false, needsRecovery: false });
    return true;
  },

  // Recover with passphrase (OAuth users who set recovery passphrase)
  recoverWithPassphrase: async (passphrase, userId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const recoveryKey = user?.user_metadata?.recovery_key;
    if (!recoveryKey) throw new Error('No recovery key found');
    const { decrypt } = await import('../lib/crypto');
    const key = await decrypt(recoveryKey, passphrase);
    if (!key) throw new Error('Incorrect passphrase');
    localStorage.setItem(OAUTH_KEY_PREFIX + userId, key);
    sessionStorage.setItem('userEncryptionKey', key);
    set({ needsUnlock: false, needsRecovery: false });
    return true;
  },

  // Set recovery passphrase (OAuth users — backs up key to user_metadata)
  setRecoveryPassphrase: async (passphrase, userId) => {
    const oauthKey = localStorage.getItem(OAUTH_KEY_PREFIX + userId);
    if (!oauthKey) throw new Error('No encryption key found');
    const { encrypt } = await import('../lib/crypto');
    const encrypted = await encrypt(oauthKey, passphrase);
    const { error } = await supabase.auth.updateUser({ data: { recovery_key: encrypted } });
    if (error) throw error;
    return true;
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard'
      }
    });
    if (error) throw error;
  },

  signInWithAzure: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: window.location.origin + '/dashboard'
      }
    });
    if (error) throw error;
  },

  signInWithEmail: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    
    // Set encryption key from password
    await get().setEncryptionKey(password, data.user.id);
    
    return data;
  },

  signUpWithEmail: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    if (error) throw error;
    
    // Set encryption key from password for new user
    if (data.user) {
      await get().setEncryptionKey(password, data.user.id);
    }
    
    return data;
  },

  signOut: async () => {
    sessionStorage.removeItem('userEncryptionKey');
    set({ needsRecovery: false });
    const { useComplianceStore } = await import('./complianceStore');
    await useComplianceStore.getState().clearItems();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null, session: null, needsUnlock: false, needsRecovery: false });
  }
}));
