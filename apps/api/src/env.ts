import { z } from 'zod';

/** Validated environment. Fails fast at startup if misconfigured. */
const envSchema = z.object({
  API_PORT: z.coerce.number().default(3333),
  API_HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Optional in the MVP (backend can run without a marketplace connection).
  TOKEN_ENCRYPTION_KEY: z.string().optional(),
  ML_OAUTH_CLIENT_ID: z.string().optional(),
  ML_OAUTH_CLIENT_SECRET: z.string().optional(),
  ML_OAUTH_REDIRECT_URI: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Configuração de ambiente inválida: ${parsed.error.message}`);
  }
  return parsed.data;
}
