import crypto from 'crypto';
import { User } from '../types';

const SCRYPT_KEYLEN = 64;

/**
 * Hashes a plaintext password using Node.js native cryptographic scrypt with a 16-byte random salt.
 * Format: scrypt$<saltHex>$<derivedKeyHex>
 */
export function hashPassword(plainPassword: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(plainPassword, salt, SCRYPT_KEYLEN).toString('hex');
  return `scrypt$${salt}$${derivedKey}`;
}

/**
 * Verifies a plaintext password against a stored scrypt hash using constant-time comparison.
 */
export function verifyPassword(plainPassword: string, storedHash?: string): boolean {
  if (!plainPassword || !storedHash) return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;

  const [, salt, originalKeyHex] = parts;
  if (!salt || !originalKeyHex) return false;

  try {
    const derivedBuffer = crypto.scryptSync(plainPassword, salt, SCRYPT_KEYLEN);
    const originalBuffer = Buffer.from(originalKeyHex, 'hex');
    if (derivedBuffer.length !== originalBuffer.length) return false;
    return crypto.timingSafeEqual(derivedBuffer, originalBuffer);
  } catch {
    return false;
  }
}

/**
 * Validates password complexity rules:
 * - At least 8 characters
 * - At least one letter and one number
 */
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'VALIDATION_ERROR: Password is required.' };
  }
  if (password.length < 8) {
    return {
      valid: false,
      error: 'VALIDATION_ERROR: Password must be at least 8 characters long.'
    };
  }
  if (password.length > 128) {
    return {
      valid: false,
      error: 'VALIDATION_ERROR: Password must not exceed 128 characters.'
    };
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      valid: false,
      error: 'VALIDATION_ERROR: Password must contain at least one letter and one number.'
    };
  }
  return { valid: true };
}

/**
 * Validates standard email format.
 */
export function isValidEmailFormat(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

/**
 * Generates a cryptographically random opaque session ID.
 */
export function generateSessionId(): string {
  return `sess_${crypto.randomBytes(32).toString('hex')}`;
}

/**
 * Strips sensitive authentication fields (passwordHash, token) before returning a User object to the frontend.
 */
export function sanitizeUserForClient(user: User | null | undefined): Omit<User, 'token' | 'passwordHash'> | null {
  if (!user) return null;
  const { token, passwordHash, ...safeUser } = user as User & { passwordHash?: string; token?: string };
  return safeUser;
}

/**
 * Parses cookies from an incoming Cookie HTTP header.
 */
export function parseCookies(cookieHeader?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;

  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) {
      try {
        result[key] = decodeURIComponent(val);
      } catch {
        result[key] = val;
      }
    }
  }
  return result;
}
