// ============================================
// ZERO-KNOWLEDGE ENCRYPTION
// User data is encrypted client-side
// Even the app owner cannot read it
// ============================================

// Convert string to ArrayBuffer
function str2ab(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

// Convert ArrayBuffer to string
function ab2str(buf) {
  const decoder = new TextDecoder();
  return decoder.decode(buf);
}

// Convert ArrayBuffer to base64
function ab2base64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

// Convert base64 to ArrayBuffer
function base642ab(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive encryption key from password + salt using PBKDF2
async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    str2ab(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt data with user's password
export async function encrypt(plaintext, password) {
  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Derive key from password
  const key = await deriveKey(password, salt);
  
  // Encrypt the data
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    str2ab(plaintext)
  );
  
  // Combine salt + iv + ciphertext into single base64 string
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);
  
  return ab2base64(combined.buffer);
}

// Decrypt data with user's password
export async function decrypt(ciphertext, password) {
  try {
    const combined = new Uint8Array(base642ab(ciphertext));
    
    // Extract salt, iv, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);
    
    // Derive key from password
    const key = await deriveKey(password, salt);
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );
    
    return ab2str(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

// Encrypt an object (JSON)
export async function encryptObject(obj, password) {
  const json = JSON.stringify(obj);
  return encrypt(json, password);
}

// Decrypt an object (JSON)
export async function decryptObject(ciphertext, password) {
  const json = await decrypt(ciphertext, password);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Generate a random encryption key for the user (stored encrypted with their password)
export function generateUserKey() {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return ab2base64(key.buffer);
}

// Hash password for verification (not for encryption)
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return ab2base64(hash);
}

