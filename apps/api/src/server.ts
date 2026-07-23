import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';
import { corsOrigins, loadEnv, type Env } from './env.js';
import { mercadoLivreAuthRoutes } from './routes/auth-mercadolivre.js';
import { calculationRoutes } from './routes/calculations.js';

export interface BuildOptions {
  env?: Env;
}

/** Builds the Fastify app with security middleware and routes registered. */
export async function buildServer(options: BuildOptions = {}): Promise<FastifyInstance> {
  const env = options.env ?? loadEnv();
  const app = Fastify({
    logger:
      env.NODE_ENV === 'test'
        ? false
        : {
            // Never log secrets: redact auth material and OAuth codes.
            redact: [
              'req.headers.authorization',
              'req.headers.cookie',
              'res.headers["set-cookie"]',
              'req.query.code',
              'req.query.state',
            ],
          },
    // Do not log request bodies (may carry cost/tax inputs or tokens).
    disableRequestLogging: env.NODE_ENV !== 'development',
  });

  // Security headers.
  await app.register(helmet, { contentSecurityPolicy: false });

  // CORS: explicit allowlist only. No reflection of arbitrary origins.
  const allow = corsOrigins(env);
  await app.register(cors, {
    origin: allow.length > 0 ? allow : false,
    credentials: allow.length > 0,
  });

  // Signed cookies for the OAuth session (state/verifier live server-side).
  await app.register(cookie, {
    secret: env.COOKIE_SECRET ?? 'dev-only-insecure-secret',
  });

  // Global rate limit; auth routes get a stricter limit in their plugin.
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });

  app.get('/health', async () => ({ status: 'ok', service: 'b7-radar-api', version: 'v1' }));

  await app.register(async (instance) => {
    await calculationRoutes(instance);
    await mercadoLivreAuthRoutes(instance, env);
  });

  return app;
}
