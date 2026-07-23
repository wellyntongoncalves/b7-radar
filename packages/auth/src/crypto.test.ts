import { describe, expect, it } from 'vitest';
import {
  decryptToken,
  encryptToken,
  generateKeyBase64,
  loadKey,
  safeEqual,
} from './crypto.js';
import { buildAuthorizationUrl, createPkcePair, generateState } from './oauth.js';

describe('token crypto (AES-256-GCM)', () => {
  const key = loadKey(generateKeyBase64());

  it('round-trips a token', () => {
    const secret = 'APP_USR-123456-abcdef-secret-token';
    const enc = encryptToken(secret, key);
    expect(enc).not.toContain(secret);
    expect(decryptToken(enc, key)).toBe(secret);
  });

  it('produces different ciphertext each time (random IV)', () => {
    expect(encryptToken('same', key)).not.toBe(encryptToken('same', key));
  });

  it('fails to decrypt with a different key', () => {
    const enc = encryptToken('secret', key);
    const otherKey = loadKey(generateKeyBase64());
    expect(() => decryptToken(enc, otherKey)).toThrow();
  });

  it('rejects tampered ciphertext (auth tag)', () => {
    const enc = encryptToken('secret', key);
    const tampered = `${enc.slice(0, -2)}AA`;
    expect(() => decryptToken(tampered, key)).toThrow();
  });

  it('rejects an invalid key length', () => {
    expect(() => loadKey(Buffer.from('short').toString('base64'))).toThrow();
  });

  it('safeEqual compares in constant time', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});

describe('OAuth helpers', () => {
  it('creates a valid PKCE pair', () => {
    const pkce = createPkcePair();
    expect(pkce.method).toBe('S256');
    expect(pkce.verifier.length).toBeGreaterThan(20);
    expect(pkce.challenge).not.toBe(pkce.verifier);
  });

  it('builds an authorization URL with PKCE and state', () => {
    const url = buildAuthorizationUrl(
      {
        clientId: 'abc',
        redirectUri: 'https://app/callback',
        authorizeEndpoint: 'https://auth.mercadolivre.com.br/authorization',
        tokenEndpoint: 'https://api.mercadolibre.com/oauth/token',
      },
      { state: generateState(), codeChallenge: 'challenge' },
    );
    const parsed = new URL(url);
    expect(parsed.searchParams.get('response_type')).toBe('code');
    expect(parsed.searchParams.get('client_id')).toBe('abc');
    expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
  });
});
