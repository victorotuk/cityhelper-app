import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { encryptObject, decryptObject } from '../lib/crypto';
import { differenceInDays, parseISO, addMonths, addYears } from 'date-fns';

// Get encryption key from session storage (set at login)
const getEncryptionKey = () => sessionStorage.getItem('userEncryptionKey');

// Audit trail helper (fire-and-forget)
const logAudit = async (itemId, userId, action, oldData, newData) => {
  try {
    await supabase.from('compliance_item_audit').insert({
      item_id: itemId,
      user_id: userId,
      action,
      old_data: oldData || null,
      new_data: newData || null
    });
  } catch (e) {
    console.warn('[Audit]', e);
  }
};

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

  // Fetch all items for current user (own + shared with me, decrypted)
  fetchItems: async (userId) => {
    set({ loading: true, error: null });
    try {
      // Own items
      const { data: ownData, error: ownErr } = await supabase
        .from('compliance_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (ownErr) throw ownErr;

      // Shared with me
      const { data: shares } = await supabase
        .from('item_shares')
        .select('item_id')
        .eq('shared_with_user_id', userId);

      let sharedData = [];
      if (shares?.length) {
        const ids = shares.map(s => s.item_id);
        const { data } = await supabase
          .from('compliance_items')
          .select('*')
          .in('id', ids);
        sharedData = (data || []).map(i => ({ ...i, isShared: true }));
      }

      const merged = [...(ownData || []).map(i => ({ ...i, isShared: false })), ...sharedData]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Decrypt sensitive data
      const key = getEncryptionKey();
      const decryptedItems = await Promise.all(
        merged.map(async (item) => {
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
      document_id: item.document_id || null,
      recurrence_interval: item.recurrence_interval || null,
      alert_emails: item.alert_emails || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('compliance_items')
      .insert([dbItem])
      .select()
      .single();

    if (error) throw error;

    const localItem = { ...data, ...sensitiveData, pay_url: item.pay_url || null, pay_phone: item.pay_phone || null, document_id: item.document_id || null, recurrence_interval: item.recurrence_interval || null, alert_emails: item.alert_emails || null };
    set(state => ({ items: [localItem, ...state.items] }));
    logAudit(localItem.id, item.user_id, 'created', null, { category: item.category, due_date: item.due_date });
    return localItem;
  },

  // Update item
  updateItem: async (id, updates) => {
    const key = getEncryptionKey();
    const currentItem = get().items.find(i => i.id === id);
    
    // If updating sensitive fields, re-encrypt
    if (updates.name || updates.notes || updates.document_url) {
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
    if (currentItem?.user_id) logAudit(id, currentItem.user_id, 'updated', { due_date: currentItem.due_date, category: currentItem.category }, { due_date: updates.due_date ?? currentItem.due_date, category: updates.category ?? currentItem.category });
    return localData;
  },

  // Snooze item (skip reminders until date)
  snoozeItem: async (id, until) => {
    const item = get().items.find(i => i.id === id);
    const { data, error } = await supabase
      .from('compliance_items')
      .update({ snooze_until: until })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    set(state => ({
      items: state.items.map(i => i.id === id ? { ...i, snooze_until: data.snooze_until } : i)
    }));
    if (item?.user_id) logAudit(id, item.user_id, 'snoozed', { snooze_until: item.snooze_until }, { snooze_until: until });
    return data;
  },

  // Mark complete / renew (sets last_completed_at, resets due_date if recurring)
  renewItem: async (id) => {
    const item = get().items.find(i => i.id === id);
    if (!item) return null;
    const now = new Date();
    let nextDue = null;
    if (item.recurrence_interval) {
      switch (item.recurrence_interval) {
        case '1_month': nextDue = addMonths(now, 1); break;
        case '3_months': nextDue = addMonths(now, 3); break;
        case '6_months': nextDue = addMonths(now, 6); break;
        case '1_year': nextDue = addYears(now, 1); break;
        default: break;
      }
    }
    const updates = {
      last_completed_at: now.toISOString(),
      snooze_until: null,
      ...(nextDue && { due_date: nextDue.toISOString().slice(0, 10) })
    };
    if (item.user_id) logAudit(id, item.user_id, 'renewed', { due_date: item.due_date, last_completed_at: item.last_completed_at }, { due_date: updates.due_date ?? item.due_date, last_completed_at: updates.last_completed_at });
    return get().updateItem(id, updates);
  },

  // Delete item
  deleteItem: async (id) => {
    const item = get().items.find(i => i.id === id);
    if (item?.user_id) logAudit(id, item.user_id, 'deleted', { category: item.category, due_date: item.due_date }, null);
    const { error } = await supabase
      .from('compliance_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    set(state => ({
      items: state.items.filter(i => i.id !== id)
    }));
  },

  // Clear items (on logout)
  clearItems: () => set({ items: [], error: null })
}));
