import { defineConfig } from 'wxt';

// B7 Radar extension. Manifest V3, minimal permissions. Host access is limited
// to Mercado Livre domains — no <all_urls>, no broad tabs permission.
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'B7 Radar',
    description: 'Inteligência de mercado por Bloco 7. Dados organizados. Decisões mais fortes.',
    // Least privilege: only local storage. Data is read from the page the user
    // is already viewing (activeTab), never from arbitrary sites.
    permissions: ['storage', 'activeTab', 'alarms', 'notifications'],
    host_permissions: [
      'https://*.mercadolivre.com.br/*',
      'https://*.mercadolibre.com/*',
    ],
    icons: {
      16: '/icon/16.png',
      32: '/icon/32.png',
      48: '/icon/48.png',
      128: '/icon/128.png',
    },
    action: {
      default_title: 'B7 Radar',
    },
  },
});
