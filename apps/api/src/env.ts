import { z } from 'zod';

/** Validated environment. Fails fast at startup if misconfigured. */
const envSchema = z
  .object({
    API_PORT: z.coerce.number().default(3333),
    API_HOST: z.string().default('0.0.0.0'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    /** Comma-separated allowlist of origins for CORS (e.g. web app, extension). */
    CORS_ORIGINS: z.string().default(''),
    /** Secret used to sign the OAuth session cookie. Required in production. */
    COOKIE_SECRET: z.string().optional(),
    // Optional in the MVP (backend can run without a marketplace connection).
    TOKEN_ENCRYPTION_KEY: z.string().optional(),
    ML_OAUTH_CLIENT_ID: z.string().optional(),
    ML_OAUTH_CLIENT_SECRET: z.string().optional(),
    ML_OAUTH_REDIRECT_URI: z.string().url().optional(),
  })
  .superRefine((env, ctx) => {
    const oauthEnabled = Boolean(env.ML_OAUTH_CLIENT_ID && env.ML_OAUTH_REDIRECT_URI);
    if (oauthEnabled && !env.TOKEN_ENCRYPTION_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'TOKEN_ENCRYPTION_KEY é obrigatória quando o OAuth do Mercado Livre está ativo.',
      });
    }
    if (oauthEnabled && !env.COOKIE_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'COOKIE_SECRET é obrigatória quando o OAuth do Mercado Livre está ativo.',
      });
    }
    if (env.NODE_ENV === 'production' && !env.COOKIE_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'COOKIE_SECRET é obrigatória em produção.',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Configuração de ambiente inválida: ${parsed.error.message}`);
  }
  return parsed.data;
}

/** Parses the CORS allowlist into an array (empty means "no cross-origin"). */
export function corsOrigins(env: Env): string[] {
  return env.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
