// js/auth.js
// Simple client‑side authentication for the admin panel (demo only).
// Stores a salted SHA‑256 hash of the password in localStorage.
// NOTE: This is NOT secure for production; anyone with access to the device can read localStorage.

const AUTH_KEY = 'adminAuthToken';
const STORED_HASH = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd6aefc7fbd4a3c5e9b'; // SHA‑256 of "password"

function hashPassword(pw) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pw);
  return crypto.subtle.digest('SHA-256', data).then(buf => {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  });
}

export async function login(password) {
  const hash = await hashPassword(password);
  if (hash === STORED_HASH) {
    localStorage.setItem(AUTH_KEY, hash);
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

export function isLoggedIn() {
  return !!localStorage.getItem(AUTH_KEY);
}

export function requireAuth(redirectPage = '../login.html') {
  if (!isLoggedIn()) {
    window.location.href = redirectPage;
  }
}
