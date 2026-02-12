import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { encryptObject, decryptObject } from '../lib/crypto';
import { differenceInDays, parseISO } from 'date-fns';

// Get encryption key from session storage (set at login)
const getEncryptionKey = () => sessionStorage.getItem('userEncryptionKey');

export const useComplianceStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,

  // Calculate status based on days until due
  getStatus: (dueDate) => {
    if (!dueDate) return 'ok';
    const days = differenceInDays(parseISO(dueDate), new Date());
    if (days < 0) return 'overdue';
    if (days <= 14) return 'urgent';
    if (days <= 30) return 'warning';
    return 'ok';
  },

  // Fetch all items for current user (decrypted)
  fetchItems: async (userId) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('compliance_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Decrypt sensitive data
      const key = getEncryptionKey();
      const decryptedItems = await Promise.all(
        (data || []).map(async (item) => {
          if (item.encrypted_data && key) {
            const decrypted = await decryptObject(item.encrypted_data, key);
            return { ...item, ...decrypted };
          }
          return item;
        })
      );

      set({ items: decryptedItems, loading: false });
    } catch (error) {
      console.error('Fetch error:', error);
      set({ error: error.message, loading: false });
    }
  },

  // Add new item (encrypted)
  addItem: async (item) => {
    const key = getEncryptionKey();
    
    // Separate sensitive data for encryption
    const sensitiveData = {
      name: item.name,
      notes: item.notes || '',
      document_url: item.document_url || ''
    };

    // Encrypt sensitive data
    const encrypted_data = key ? await encryptObject(sensitiveData, key) : null;

    // Store non-sensitive metadata + encrypted blob
    const dbItem = {
      user_id: item.user_id,
      category: item.category,
      due_date: item.due_date,
      status: 'active',
      encrypted_data,
      name: key ? '[Encrypted]' : item.name,
      pay_url: item.pay_url || null,
      pay_phone: item.pay_phone || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('compliance_items')
      .insert([dbItem])
      .select()
      .single();

    if (error) throw error;

    const localItem = { ...data, ...sensitiveData, pay_url: item.pay_url || null, pay_phone: item.pay_phone || null };
    set(state => ({ items: [localItem, ...state.items] }));
    return localItem;
  },

  // Update item
  updateItem: async (id, updates) => {
    const key = getEncryptionKey();
    
    // If updating sensitive fields, re-encrypt
    if (updates.name || updates.notes || updates.document_url) {
      const currentItem = get().items.find(i => i.id === id);
      const sensitiveData = {
        name: updates.name || currentItem?.name || '',
        notes: updates.notes || currentItem?.notes || '',
        document_url: updates.document_url || currentItem?.document_url || ''
      };
      updates.encrypted_data = key ? await encryptObject(sensitiveData, key) : null;
      updates.name = key ? '[Encrypted]' : updates.name;
    }

    const { data, error } = await supabase
      .from('compliance_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Decrypt for local state
    let localData = data;
    if (data.encrypted_data && key) {
      const decrypted = await decryptObject(data.encrypted_data, key);
      localData = { ...data, ...decrypted };
    }

    set(state => ({
      items: state.items.map(item => item.id === id ? localData : item)
    }));
    return localData;
  },

  // Delete item
  deleteItem: async (id) => {
    const { error } = await supabase
      .from('compliance_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    set(state => ({
      items: state.items.filter(item => item.id !== id)
    }));
  },

  // Clear items (on logout)
  clearItems: () => set({ items: [], error: null })
}));
