import { createHash, randomBytes } from 'node:crypto';

/**
 * OAuth helpers for connecting a marketplace account (Mercado Livre uses the
 * standard authorization-code flow with PKCE). These build URLs and PKCE pairs;
 * the actual token exchange happens server-side with the client secret from env.
 * We never store the marketplace password — only OAuth tokens, encrypted.
 */

export interface OAuthConfig {
  readonly clientId: string;
  readonly redirectUri: string;
  readonly authorizeEndpoint: string;
  readonly tokenEndpoint: string;
}

/** Default endpoints for Mercado Livre Brazil. */
export const MERCADO_LIVRE_OAUTH: Omit<OAuthConfig, 'clientId' | 'redirectUri'> = {
  authorizeEndpoint: 'https://auth.mercadolivre.com.br/authorization',
  tokenEndpoint: 'https://api.mercadolibre.com/oauth/token',
};

export interface PkcePair {
  readonly verifier: string;
  readonly challenge: string;
  readonly method: 'S256';
}

function base64Url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function generateState(): string {
  return base64Url(randomBytes(24));
}

export function createPkcePair(): PkcePair {
  const verifier = base64Url(randomBytes(32));
  const challenge = base64Url(createHash('sha256').update(verifier).digest());
  return { verifier, challenge, method: 'S256' };
}

export function buildAuthorizationUrl(
  config: OAuthConfig,
  params: { state: string; codeChallenge: string },
): string {
  const url = new URL(config.authorizeEndpoint);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('state', params.state);
  url.searchParams.set('code_challenge', params.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}
