import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import { loadEnv, type Env } from './env.js';
import { mercadoLivreAuthRoutes } from './routes/auth-mercadolivre.js';
import { calculationRoutes } from './routes/calculations.js';

export interface BuildOptions {
  env?: Env;
}

/** Builds the Fastify app with routes registered. Kept pure for testing. */
export async function buildServer(options: BuildOptions = {}): Promise<FastifyInstance> {
  const env = options.env ?? loadEnv();
  const app = Fastify({
    logger: env.NODE_ENV !== 'test',
    // Do not log request bodies/headers that may carry secrets.
    disableRequestLogging: env.NODE_ENV === 'production',
  });

  await app.register(cors, { origin: true });

  app.get('/health', async () => ({ status: 'ok', service: 'b7-radar-api', version: 'v1' }));

  await app.register(async (instance) => {
    await calculationRoutes(instance);
    await mercadoLivreAuthRoutes(instance, env);
  });

  return app;
}
