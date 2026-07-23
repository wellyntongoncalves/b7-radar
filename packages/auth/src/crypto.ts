import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

/**
 * Authenticated encryption for marketplace tokens (AES-256-GCM). Tokens are
 * encrypted at rest and never logged. The key comes from the environment
 * (TOKEN_ENCRYPTION_KEY), a base64-encoded 32-byte value.
 *
 * Ciphertext layout (base64): iv(12) | authTag(16) | ciphertext.
 */
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;

export function loadKey(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, 'base64');
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY inválida: esperado ${KEY_BYTES} bytes em base64, recebido ${key.length}.`,
    );
  }
  return key;
}

/** Generates a fresh base64 key (helper for setup, not used at runtime). */
export function generateKeyBase64(): string {
  return randomBytes(KEY_BYTES).toString('base64');
}

export function encryptToken(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

export function decryptToken(payload: string, key: Buffer): string {
  const buf = Buffer.from(payload, 'base64');
  if (buf.length < IV_BYTES + TAG_BYTES) {
    throw new Error('Payload de token cifrado malformado.');
  }
  const iv = buf.subarray(0, IV_BYTES);
  const tag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = buf.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/** Constant-time string comparison for secrets (e.g. OAuth state). */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
