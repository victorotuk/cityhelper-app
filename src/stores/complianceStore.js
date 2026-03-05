import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { encryptObject, decryptObject } from '../lib/crypto';
import { differenceInDays, parseISO, addMonths, addYears } from 'date-fns';
import {
  getLocalItems,
  setLocalItems,
  putLocalItem,
  deleteLocalItem,
  clearLocalData
} from '../lib/localStorage';

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

// Decrypt items (shared helper)
async function decryptItems(items, key) {
  if (!items?.length) return [];
  return Promise.all(
    items.map(async (item) => {
      if (item.encrypted_data && key) {
        const decrypted = await decryptObject(item.encrypted_data, key);
        return { ...item, ...decrypted };
      }
      return item;
    })
  );
}

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

  // Fetch: LOCAL-FIRST. Read IndexedDB first (instant), then merge from Supabase.
  fetchItems: async (userId) => {
    set({ loading: true, error: null });
    const key = getEncryptionKey();

    try {
      // 1. Read from local first (instant)
      const localRaw = await getLocalItems(userId);
      const localDecrypted = await decryptItems(localRaw, key);
      if (localDecrypted.length > 0) {
        set({ items: localDecrypted, loading: false });
      }

      // 2. Fetch from Supabase (own + shared)
      const { data: ownData, error: ownErr } = await supabase
        .from('compliance_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (ownErr) throw ownErr;

      const { data: shares } = await supabase
        .from('item_shares')
        .select('item_id')
        .eq('shared_with_user_id', userId);

      let sharedData = [];
      if (shares?.length) {
        const ids = shares.map((s) => s.item_id);
        const { data } = await supabase
          .from('compliance_items')
          .select('*')
          .in('id', ids);
        sharedData = (data || []).map((i) => ({ ...i, isShared: true }));
      }

      const merged = [
        ...(ownData || []).map((i) => ({ ...i, isShared: false })),
        ...sharedData
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const decryptedItems = await decryptItems(merged, key);

      // 3. Persist raw rows to local (own only; encrypted form for device privacy)
      const ownRaw = (ownData || []).map((i) => ({ ...i, user_id: userId }));
      if (ownRaw.length > 0) {
        await setLocalItems(userId, ownRaw);
      }

      set({ items: decryptedItems, loading: false });
    } catch (error) {
      console.error('Fetch error:', error);
      set({ error: error.message, loading: false });
    }
  },

  // Add new item: LOCAL-FIRST. Write to IndexedDB, update UI, then sync to Supabase.
  addItem: async (item) => {
    const key = getEncryptionKey();
    const sensitiveData = {
      name: item.name,
      notes: item.notes || '',
      document_url: item.document_url || ''
    };
    const encrypted_data = key ? await encryptObject(sensitiveData, key) : null;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const dbItem = {
      id,
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
      country: item.country || null,
      created_at: now,
      updated_at: now
    };

    const localItem = {
      ...dbItem,
      ...sensitiveData,
      pay_url: item.pay_url || null,
      pay_phone: item.pay_phone || null,
      document_id: item.document_id || null,
      recurrence_interval: item.recurrence_interval || null,
      alert_emails: item.alert_emails || null,
      country: item.country || null
    };

    // 1. Write to local first (instant)
    await putLocalItem({ ...dbItem, user_id: item.user_id });
    set((state) => ({ items: [localItem, ...state.items] }));

    // 2. Sync to Supabase (background)
    const { error } = await supabase.from('compliance_items').insert([dbItem]);
    if (error) console.warn('[Sync] addItem failed:', error);

    logAudit(id, item.user_id, 'created', null, {
      category: item.category,
      due_date: item.due_date
    });
    return localItem;
  },

  // Update item: LOCAL-FIRST. Update local, then sync to Supabase.
  updateItem: async (id, updates) => {
    const key = getEncryptionKey();
    const currentItem = get().items.find((i) => i.id === id);
    if (!currentItem) return null;

    const patch = { ...updates, updated_at: new Date().toISOString() };
    if (updates.name || updates.notes || updates.document_url) {
      const sensitiveData = {
        name: updates.name ?? currentItem.name ?? '',
        notes: updates.notes ?? currentItem.notes ?? '',
        document_url: updates.document_url ?? currentItem.document_url ?? ''
      };
      patch.encrypted_data = key ? await encryptObject(sensitiveData, key) : null;
      patch.name = key ? '[Encrypted]' : updates.name;
    }

    const localData = {
      ...currentItem,
      ...patch,
      name: patch.name ?? currentItem.name,
      notes: patch.notes ?? currentItem.notes,
      document_url: patch.document_url ?? currentItem.document_url
    };

    // 1. Update local first
    await putLocalItem({
      ...currentItem,
      ...patch,
      user_id: currentItem.user_id
    });
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? localData : item))
    }));

    // 2. Sync to Supabase
    const { error } = await supabase
      .from('compliance_items')
      .update(patch)
      .eq('id', id);
    if (error) console.warn('[Sync] updateItem failed:', error);

    if (currentItem.user_id) {
      logAudit(id, currentItem.user_id, 'updated', {
        due_date: currentItem.due_date,
        category: currentItem.category
      }, {
        due_date: patch.due_date ?? currentItem.due_date,
        category: patch.category ?? currentItem.category
      });
    }
    return localData;
  },

  // Snooze item: LOCAL-FIRST
  snoozeItem: async (id, until) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return null;

    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, snooze_until: until } : i
      )
    }));
    await putLocalItem({
      ...item,
      snooze_until: until,
      user_id: item.user_id
    });

    const { error } = await supabase
      .from('compliance_items')
      .update({ snooze_until: until })
      .eq('id', id);
    if (error) console.warn('[Sync] snoozeItem failed:', error);
    if (item.user_id) {
      logAudit(id, item.user_id, 'snoozed', { snooze_until: item.snooze_until }, { snooze_until: until });
    }
    return { snooze_until: until };
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

  // Delete item: LOCAL-FIRST
  deleteItem: async (id) => {
    const item = get().items.find((i) => i.id === id);
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
    await deleteLocalItem(id);

    const { error } = await supabase.from('compliance_items').delete().eq('id', id);
    if (error) console.warn('[Sync] deleteItem failed:', error);
    if (item?.user_id) {
      logAudit(id, item.user_id, 'deleted', { category: item.category, due_date: item.due_date }, null);
    }
  },

  // Clear items (on logout) — also clear local storage
  clearItems: async () => {
    await clearLocalData().catch(() => {});
    set({ items: [], error: null });
  }
}));
