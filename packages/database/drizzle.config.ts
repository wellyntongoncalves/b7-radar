import { defineConfig } from 'drizzle-kit';

// Generates and runs migrations against the Supabase Postgres connection string.
export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});
