export const SESSION_KEY = 'ss_current_user';

const textEncoder = new TextEncoder();

export async function hashPassword(password) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('Secure password hashing is not available in this browser.');
  }

  const bytes = textEncoder.encode(password);
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}
