import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Env } from './env.js';
import { buildServer } from './server.js';

const testEnv: Env = {
  API_PORT: 0,
  API_HOST: '127.0.0.1',
  NODE_ENV: 'test',
  CORS_ORIGINS: '',
};

let app: FastifyInstance;
beforeAll(async () => {
  app = await buildServer({ env: testEnv });
});
afterAll(async () => {
  await app.close();
});

describe('health', () => {
  it('responds ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok', version: 'v1' });
  });

  it('sets security headers (helmet)', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('/v1/calculations/margin', () => {
  it('computes the contribution for valid input', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/calculations/margin',
      payload: { priceReais: 200, productCostReais: 80, taxPercent: 7, listingType: 'CLASSIC' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().result.contributionMarginCents).toBe(8400);
  });

  it('returns 400 on invalid input', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/calculations/margin',
      payload: { priceReais: -5, listingType: 'CLASSIC' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('/v1/calculations/price-for-margin', () => {
  it('returns 422 when fees + margin are infeasible', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/calculations/price-for-margin',
      payload: {
        productCostReais: 10,
        taxPercent: 50,
        adPercent: 40,
        desiredMarginPercent: 30,
        listingType: 'CLASSIC',
      },
    });
    expect(res.statusCode).toBe(422);
  });
});

describe('OAuth (não configurado no ambiente de teste)', () => {
  it('/start returns 503 without client config', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/auth/mercadolivre/start' });
    expect(res.statusCode).toBe(503);
  });

  it('/callback returns 400 without code/state', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/auth/mercadolivre/callback' });
    expect(res.statusCode).toBe(400);
  });
});
