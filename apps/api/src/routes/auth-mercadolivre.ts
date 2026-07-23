import {
  buildAuthorizationUrl,
  createPkcePair,
  generateState,
  MERCADO_LIVRE_OAUTH,
} from '@b7/auth';
import type { FastifyInstance } from 'fastify';
import type { Env } from '../env.js';

/**
 * Mercado Livre OAuth scaffold (authorization-code + PKCE). The MVP wires the
 * start endpoint that redirects the user to the marketplace consent screen. The
 * callback validates state and is where the server-side token exchange (with the
 * client secret) and encrypted storage will happen. We never store the
 * marketplace password — only OAuth tokens, encrypted at rest.
 *
 * PKCE verifier and state must be persisted per-session; here they are returned
 * for the caller to store securely (e.g. httpOnly cookie / session store).
 */
export async function mercadoLivreAuthRoutes(app: FastifyInstance, env: Env): Promise<void> {
  app.get('/v1/auth/mercadolivre/start', async (_request, reply) => {
    if (!env.ML_OAUTH_CLIENT_ID || !env.ML_OAUTH_REDIRECT_URI) {
      return reply.status(503).send({
        error: 'oauth_not_configured',
        message: 'Configure ML_OAUTH_CLIENT_ID e ML_OAUTH_REDIRECT_URI para conectar a conta.',
      });
    }
    const state = generateState();
    const pkce = createPkcePair();
    const authorizationUrl = buildAuthorizationUrl(
      {
        clientId: env.ML_OAUTH_CLIENT_ID,
        redirectUri: env.ML_OAUTH_REDIRECT_URI,
        ...MERCADO_LIVRE_OAUTH,
      },
      { state, codeChallenge: pkce.challenge },
    );
    // Caller stores {state, verifier} securely and redirects the user.
    return { authorizationUrl, state, codeVerifier: pkce.verifier };
  });

  app.get('/v1/auth/mercadolivre/callback', async (request, reply) => {
    const query = request.query as { code?: string; state?: string };
    if (!query.code || !query.state) {
      return reply.status(400).send({ error: 'missing_code_or_state' });
    }
    // Token exchange with ML_OAUTH_CLIENT_SECRET + encrypted persistence lands
    // here in the next phase (validate state against the stored value first).
    return reply.status(501).send({
      error: 'not_implemented',
      message: 'Troca de token e persistência criptografada serão implementadas na fase 2.',
    });
  });
}
