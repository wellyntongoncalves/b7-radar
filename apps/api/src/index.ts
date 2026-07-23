import { loadEnv } from './env.js';
import { buildServer } from './server.js';

const env = loadEnv();

buildServer({ env })
  .then((app) => app.listen({ port: env.API_PORT, host: env.API_HOST }))
  .then((address) => {
    // eslint-disable-next-line no-console
    console.info(`B7 Radar API ouvindo em ${address}`);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Falha ao iniciar a API:', err);
    process.exit(1);
  });
