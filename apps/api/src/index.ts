import { loadEnv } from './env.js';
import { buildServer } from './server.js';

const env = loadEnv();

buildServer({ env })
  .then((app) => app.listen({ port: env.API_PORT, host: env.API_HOST }))
  .then((address) => {
    console.info(`B7 Radar API ouvindo em ${address}`);
  })
  .catch((err) => {
    console.error('Falha ao iniciar a API:', err);
    process.exit(1);
  });
