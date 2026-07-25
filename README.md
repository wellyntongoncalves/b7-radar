# B7 Radar

**Inteligência de mercado por Bloco 7.**
_Dados organizados. Decisões mais fortes._

B7 Radar é uma plataforma de inteligência de mercado para o **Mercado Livre Brasil**,
entregue como **extensão Chromium (Chrome/Edge)** + **aplicação web** + **backend opcional**.
Ela transforma dados dispersos de anúncios, vendedores e categorias em **blocos de decisão**,
sempre com **origem e nível de confiança explícitos**.

> **Princípio central:** nenhuma métrica é mostrada como um número solto. Todo valor carrega
> classificação (Oficial / Observado / Calculado / Estimado / Configurado), fonte, timestamp,
> confiança e — quando calculado — a fórmula versionada. Estimativas nunca são apresentadas
> como fatos.

---

## Estrutura do monorepo

```
apps/
  extension/   Extensão WXT + React (MV3, Chrome/Edge) — painel na página de produto
  web/         Aplicação web (Next.js) — dashboard + B7 Margem
  api/         Backend Fastify (opcional) — /health, /v1/calculations, OAuth ML
  worker/      Jobs de monitoramento (fase 2) — a construir
packages/
  shared-types/         Camada de honestidade: MetricValue, classificação, confiança
  calculations/         Funções puras: margem, ROI, ponto de equilíbrio, oportunidade
  auth/                 Criptografia de tokens (AES-256-GCM) + OAuth PKCE
  database/             Schema Drizzle (PostgreSQL/Supabase) + migrations
  brand/                Design tokens + logotipos B7 (7 blocos) + favicon
  marketplace-adapters/ MarketplaceAdapter + adapter DOM ML + registro de seletores + fixtures
docs/                   Guia de marca, matriz de dados, arquitetura
```

## Requisitos

- Node.js >= 20
- pnpm 9

## Começar

```bash
pnpm install
pnpm test          # roda os testes de todos os pacotes
pnpm lint          # ESLint (typescript-eslint) em todo o repo
pnpm typecheck     # tsc --noEmit em todos os pacotes
```

### Backend (Fastify)

```bash
pnpm --filter @b7/api dev     # desenvolvimento (tsx watch)
pnpm --filter @b7/api start   # produção (tsx) — sobe em API_HOST:API_PORT
```

### Extensão (Chrome)

```bash
pnpm --filter @b7/extension build       # gera .output/chrome-mv3
pnpm --filter @b7/extension build:edge  # gera .output/edge-mv3
pnpm --filter @b7/extension dev         # desenvolvimento com HMR
```

Para instalar sem publicar: abra `chrome://extensions`, ative o **Modo do desenvolvedor**
e clique em **Carregar sem compactação**, apontando para `apps/extension/.output/chrome-mv3`.
No Edge: `edge://extensions` → **Carregar descompactado**.

Ao abrir uma página de **produto** do Mercado Livre, o painel B7 Radar aparece no canto,
lê os dados públicos exibidos, calcula margem (se você configurou custo/imposto no popup) e
permite salvar o anúncio localmente.

## Testes

- `@b7/calculations` — 27 testes (dinheiro, margem Modo A/B, ROI, oportunidade, idade, estimativas)
- `@b7/marketplace-adapters` — 13 testes (identificação de página, extração, proveniência, fixtures)

```bash
pnpm -r test
```

## Deploy (Supabase + Vercel)

O ambiente de desenvolvimento remoto tem **egresso restrito** e não alcança `api.vercel.com`
nem `supabase.com` diretamente. O deploy é feito **via GitHub**, sem depender de rede do
container:

1. **Vercel** → _Import Git Repository_ apontando para este repositório. Em _Settings_, defina
   **Root Directory = `apps/web`** e mantenha "Include files outside the Root Directory" ligado
   (o monorepo pnpm instala a partir da raiz). A Vercel builda e publica `apps/web` a cada push.
2. **Supabase** → crie o projeto no dashboard e configure `DATABASE_URL`, `SUPABASE_URL`,
   `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` como _Environment Variables_ na Vercel.
   As migrations rodam via GitHub Action ou no build.

Veja `.env.example` para todas as variáveis.

## Princípios (resumo)

- Apenas APIs oficiais + dados publicamente exibidos na página que o usuário abriu.
- Sem burlar CAPTCHA/antibot/limites; sem capturar credenciais, dados bancários ou mensagens.
- Permissões mínimas na extensão (host restrito a domínios do Mercado Livre).
- Taxas/tarifas **nunca hardcoded** em fórmulas — ficam em tabela versionada e configurável.
- LGPD desde a arquitetura: consentimento, exportação, exclusão, retenção.

Detalhes em [`docs/`](./docs).

## Licença

Proprietária — Bloco 7. Todos os direitos reservados.
