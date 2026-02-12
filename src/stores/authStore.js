import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { hashPassword } from '../lib/crypto';

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Restore encryption key if exists
      const storedKeyHash = localStorage.getItem(`keyHash_${session.user.id}`);
      if (storedKeyHash) {
        // Key will be set when user "unlocks" with password
        // For now, check if already in session
        const sessionKey = sessionStorage.getItem('userEncryptionKey');
        if (!sessionKey) {
          // User needs to enter password to unlock
          set({ session, user: session.user, loading: false, needsUnlock: true });
          return;
        }
      }
    }
    
    set({ 
      session, 
      user: session?.user ?? null, 
      loading: false 
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ 
        session, 
        user: session?.user ?? null 
      });
    });
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
    set({ needsUnlock: false });
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
    // Clear encryption key
    sessionStorage.removeItem('userEncryptionKey');
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null, session: null, needsUnlock: false });
  }
}));
