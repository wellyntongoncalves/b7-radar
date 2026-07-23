# Arquitetura — B7 Radar

## Visão geral

```
EXTENSÃO (MV3)                 APP WEB (Next.js/Vercel)      BACKEND (opcional)
content script (Shadow DOM) ┐  dashboard · B7 Margem      ┐  API Fastify
background service worker   ├─ itens salvos               ├─ Postgres (Supabase)
popup / opções             ┘                              ┘  worker (fase 2)
        │                          │                            │
        └───────── packages/ (TypeScript compartilhado) ────────┘
   shared-types · calculations · marketplace-adapters · brand · ui · ...
```

Fluxo do dado: **DOM/API → Adapter (normaliza + carimba origem/confiança/timestamp) →
domínio → calculations → UI**. Seletores vivem só em `marketplace-adapters`; cálculos só em
`calculations`. Nenhum componente faz fetch direto nem contém regra financeira.

## Decisões técnicas

| Camada | Escolha | Justificativa |
|---|---|---|
| Monorepo | pnpm workspaces + Turborepo | rápido, cache de build |
| Extensão | WXT + React + TS | MV3 first-class, build Chrome e Edge, HMR |
| App web | Next.js (App Router) | deploy Vercel nativo |
| Backend | Fastify + TS | leve, schema-first, baixo overhead |
| Banco | PostgreSQL (Supabase) + Drizzle | SQL-first, migrations versionadas |
| Validação | Zod nas bordas | schemas compartilhados, erros tipados |
| Testes | Vitest + Playwright | rápido, TS nativo |

## Camada de adaptação

Toda integração implementa `MarketplaceAdapter`
([`adapter.ts`](../packages/marketplace-adapters/src/adapter.ts)):
`identifyPage`, `extractListing`, `extractSearchResults`, `extractSeller`, `getSourceMetadata`.
Implementações separadas para **DOM público**, **API oficial** (futuro) e **fixtures**.
Cada campo capturado retorna valor + fonte + confiança + timestamp + método + erro/fallback
([`CapturedField`](../packages/shared-types/src/marketplace.ts)).

O **registro central de seletores**
([`selectors.ts`](../packages/marketplace-adapters/src/mercadolivre/selectors.ts)) é
versionado — mudanças de DOM são corrigidas em um só lugar e monitoráveis (falha por seletor).

## Segurança e privacidade

- Permissões mínimas: `storage`, `activeTab`; host restrito a domínios do Mercado Livre.
- Tokens do marketplace criptografados em repouso (AES-256-GCM); nunca em log.
- Painel em Shadow DOM (CSS isolado); não quebra a página, não esconde compra, não recarrega.
- LGPD desde o início: consentimento, exportação, exclusão, retenção, mascaramento.

## Estado atual (vertical slice entregue)

- ✅ `shared-types`, `calculations` (27 testes), `marketplace-adapters` (13 testes), `brand`.
- ✅ Extensão: detecção de página de produto, painel B7 em Shadow DOM, margem, salvar local,
  popup de configuração, tema claro/escuro. Build Chrome/Edge OK.
- ⏳ Próximo: cards na busca + barra agregada, app web, backend + sync, B7 Monitor.
