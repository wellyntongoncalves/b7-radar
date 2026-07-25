import { describe, expect, it } from 'vitest';
import {
  exchangeCodeForToken,
  MERCADO_LIVRE_OAUTH,
  OAuthExchangeError,
  type FetchLike,
  type TokenExchangeConfig,
} from './oauth.js';

const config: TokenExchangeConfig = {
  clientId: 'abc',
  clientSecret: 'secret',
  redirectUri: 'https://app/callback',
  ...MERCADO_LIVRE_OAUTH,
};

function mockFetch(status: number, payload: unknown): FetchLike {
  return async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  });
}

describe('exchangeCodeForToken', () => {
  it('maps a successful token response', async () => {
    const tokens = await exchangeCodeForToken(
      config,
      { code: 'the-code', codeVerifier: 'verifier' },
      mockFetch(200, {
        access_token: 'AT',
        refresh_token: 'RT',
        expires_in: 21600,
        user_id: 123456,
        scope: 'offline_access read',
      }),
    );
    expect(tokens.accessToken).toBe('AT');
    expect(tokens.refreshToken).toBe('RT');
    expect(tokens.expiresInSeconds).toBe(21600);
    expect(tokens.externalUserId).toBe('123456');
  });

  it('sends the client secret and verifier in the body', async () => {
    let sentBody = '';
    const fetchFn: FetchLike = async (_url, init) => {
      sentBody = init.body;
      return { ok: true, status: 200, json: async () => ({ access_token: 'AT' }) };
    };
    await exchangeCodeForToken(config, { code: 'c', codeVerifier: 'v' }, fetchFn);
    expect(sentBody).toContain('grant_type=authorization_code');
    expect(sentBody).toContain('client_secret=secret');
    expect(sentBody).toContain('code_verifier=v');
  });

  it('throws OAuthExchangeError on HTTP error', async () => {
    await expect(
      exchangeCodeForToken(config, { code: 'c', codeVerifier: 'v' }, mockFetch(401, {})),
    ).rejects.toBeInstanceOf(OAuthExchangeError);
  });

  it('throws when access_token is missing', async () => {
    await expect(
      exchangeCodeForToken(config, { code: 'c', codeVerifier: 'v' }, mockFetch(200, { foo: 1 })),
    ).rejects.toBeInstanceOf(OAuthExchangeError);
  });
});
