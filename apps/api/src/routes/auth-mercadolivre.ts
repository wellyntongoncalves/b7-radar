import {
  buildAuthorizationUrl,
  createPkcePair,
  generateState,
  safeEqual,
  MERCADO_LIVRE_OAUTH,
} from '@b7/auth';
import type { FastifyInstance } from 'fastify';
import type { Env } from '../env.js';

const SESSION_COOKIE = 'b7_ml_oauth';
const COOKIE_PATH = '/v1/auth/mercadolivre';
const strict = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } };

/**
 * Mercado Livre OAuth (authorization-code + PKCE).
 *
 * Security: the PKCE `verifier` and `state` are NEVER returned to the client.
 * They are stored server-side in a signed, httpOnly cookie and validated on the
 * callback. `/start` issues a 302 redirect to the consent screen. We never store
 * the marketplace password — only OAuth tokens, encrypted at rest (fase 2).
 */
export async function mercadoLivreAuthRoutes(app: FastifyInstance, env: Env): Promise<void> {
  app.get('/v1/auth/mercadolivre/start', strict, async (_request, reply) => {
    if (!env.ML_OAUTH_CLIENT_ID || !env.ML_OAUTH_REDIRECT_URI) {
      return reply.status(503).send({
        error: 'oauth_not_configured',
        message: 'Configure ML_OAUTH_CLIENT_ID e ML_OAUTH_REDIRECT_URI para conectar a conta.',
      });
    }
    const state = generateState();
    const pkce = createPkcePair();

    reply.setCookie(SESSION_COOKIE, JSON.stringify({ state, verifier: pkce.verifier }), {
      signed: true,
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      path: COOKIE_PATH,
      maxAge: 600, // 10 minutes
    });

    const authorizationUrl = buildAuthorizationUrl(
      {
        clientId: env.ML_OAUTH_CLIENT_ID,
        redirectUri: env.ML_OAUTH_REDIRECT_URI,
        ...MERCADO_LIVRE_OAUTH,
      },
      { state, codeChallenge: pkce.challenge },
    );
    return reply.redirect(authorizationUrl);
  });

  app.get('/v1/auth/mercadolivre/callback', strict, async (request, reply) => {
    const query = request.query as { code?: string; state?: string };
    if (!query.code || !query.state) {
      return reply.status(400).send({ error: 'missing_code_or_state' });
    }

    const raw = request.cookies[SESSION_COOKIE];
    const unsigned = raw ? request.unsignCookie(raw) : null;
    if (!unsigned || !unsigned.valid || !unsigned.value) {
      return reply.status(400).send({ error: 'missing_oauth_session' });
    }
    let session: { state?: string; verifier?: string };
    try {
      session = JSON.parse(unsigned.value);
    } catch {
      return reply.status(400).send({ error: 'invalid_oauth_session' });
    }
    if (!session.state || !safeEqual(session.state, query.state)) {
      return reply.status(400).send({ error: 'state_mismatch' });
    }

    // State validated. The token exchange (with ML_OAUTH_CLIENT_SECRET + the
    // stored verifier) and encrypted persistence land here in fase 2.
    reply.clearCookie(SESSION_COOKIE, { path: COOKIE_PATH });
    return reply.status(501).send({
      error: 'not_implemented',
      message: 'State validado. A troca de token e a persistência criptografada entram na fase 2.',
    });
  });
}
