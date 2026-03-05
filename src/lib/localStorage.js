/**
 * Local storage layer — IndexedDB for sensitive data.
 * Used on web, mobile (Capacitor), desktop (Tauri).
 * Online components cannot write here; we only PULL from server when we choose.
 */
const DB_NAME = 'nava-local';
const DB_VERSION = 1;
const STORE_ITEMS = 'compliance_items';
const STORE_SETTINGS = 'user_settings';
const STORE_META = 'meta';

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_ITEMS)) {
          db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: 'user_id' });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'key' });
        }
      };
    });
  }
  return dbPromise;
}

function run(storeName, mode, fn) {
  return getDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const req = fn(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  });
}

// --- Compliance items (local-first) ---

export async function getLocalItems(userId) {
  const all = await run(STORE_ITEMS, 'readonly', (s) => s.getAll());
  return (all || []).filter((i) => i.user_id === userId);
}

export async function setLocalItems(userId, items) {
  const db = await getDB();
  const tx = db.transaction(STORE_ITEMS, 'readwrite');
  const store = tx.objectStore(STORE_ITEMS);
  // Remove old items for this user
  const existing = await new Promise((res) => {
    const r = store.getAll();
    r.onsuccess = () => res(r.result || []);
  });
  for (const e of existing) {
    if (e.user_id === userId) store.delete(e.id);
  }
  for (const item of items) {
    store.put(item);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function putLocalItem(item) {
  return run(STORE_ITEMS, 'readwrite', (s) => s.put(item));
}

export async function deleteLocalItem(id) {
  return run(STORE_ITEMS, 'readwrite', (s) => s.delete(id));
}

// --- User settings (sensitive parts) ---

export async function getLocalSettings(userId) {
  return run(STORE_SETTINGS, 'readonly', (s) => s.get(userId));
}

export async function setLocalSettings(userId, data) {
  return run(STORE_SETTINGS, 'readwrite', (s) =>
    s.put({ user_id: userId, ...data })
  );
}

// --- Sync metadata (last sync time, etc.) ---

export async function getSyncMeta(key) {
  const row = await run(STORE_META, 'readonly', (s) => s.get(key));
  return row?.value;
}

export async function setSyncMeta(key, value) {
  return run(STORE_META, 'readwrite', (s) => s.put({ key, value }));
}

// --- Backup export ---

export async function exportBackup(userId) {
  const items = await getLocalItems(userId);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    userId,
    items
  };
}

// --- Clear all (on logout) ---

export async function clearLocalData() {
  const db = await getDB();
  const tx = db.transaction(
    [STORE_ITEMS, STORE_SETTINGS, STORE_META],
    'readwrite'
  );
  tx.objectStore(STORE_ITEMS).clear();
  tx.objectStore(STORE_SETTINGS).clear();
  tx.objectStore(STORE_META).clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
