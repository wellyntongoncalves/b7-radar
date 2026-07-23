# B7 Radar — Especificação: Dados do Anúncio Atual

> **Regra central (prioridade absoluta):** A B7 Radar deve identificar exatamente o anúncio
> aberto/visualizado no Mercado Livre e exibir **apenas** os dados reais, públicos, autorizados
> ou historicamente observados **daquele `listingId` específico** — com experiência integrada,
> funcionalmente semelhante ao AvantPro, mas com identidade e implementação próprias.
>
> Sem dados genéricos de categoria no lugar do anúncio. Sem números fictícios. Sem estimativa
> apresentada como dado real. Sem confundir métrica de catálogo com métrica do anúncio.

Chave primária de toda análise: **`listingId`**. Chaves auxiliares: `catalogProductId`,
`sellerId`, `variationId`, `categoryId`, `siteId` (`MLB` para o Brasil).

---

## 1. Matriz completa de dados (campo → fonte → captura → escopo → classificação → disponibilidade → limitações)

Classificação: **official** (API oficial) · **authorized** (conta do dono) · **observed**
(página pública) · **historical** (snapshots B7) · **calculated** (fórmula determinística).
Escopo: `listing` · `catalog-product` · `catalog-offer` · `seller` · `search-page` ·
`authorized-account`. Disponibilidade: 🟢 direta · 🟡 parcial/condicional · 🔴 indisponível legítima.

### 1.1 Identificação (escopo: listing / catalog-product)

| Campo | Fonte legítima | Endpoint / estratégia | Classe | Disp. | Limitações |
|---|---|---|---|---|---|
| listingId | URL + página | regex `MLB\d+` na URL / `data-*`; `GET /items/{id}` | official/observed | 🟢 | canônico da análise |
| título | API / página | `GET /items/{id}.title` / DOM | official | 🟢 | — |
| URL | navegador | `location.href` | observed | 🟢 | normalizar variação/tracking |
| condição | API | `/items/{id}.condition` | official | 🟢 | new/used/not_specified |
| categoria | API | `/items/{id}.category_id` → `/categories/{id}` | official | 🟢 | — |
| marca / modelo | API | `/items/{id}.attributes` (BRAND, MODEL) | official | 🟡 | nem todo anúncio preenche |
| GTIN | API | `attributes` (GTIN) | official | 🟡 | frequentemente ausente |
| catalogProductId | API | `/items/{id}.catalog_product_id` | official | 🟡 | null quando não é catálogo |
| variação selecionada | API/URL | `/items/{id}.variations` + `variation` da URL | official | 🟡 | só quando há variações |
| tipo do anúncio | API | `/items/{id}.listing_type_id` (gold_special=Clássico, gold_pro=Premium) | official | 🟢 | mapear id→rótulo |
| status | API | `/items/{id}.status` (active/paused/closed) | official | 🟢 | — |

### 1.2 Preço (escopo: listing / catalog-offer)

| Campo | Fonte | Captura | Classe | Disp. | Limitações |
|---|---|---|---|---|---|
| preço atual | API / página | `/items/{id}.price` / DOM | official/observed | 🟢 | — |
| preço original | API / página | `.original_price` / DOM | official | 🟡 | só quando há desconto |
| desconto | calculado | `(original-atual)/original` | calculated | 🟡 | depende de original |
| moeda | API | `.currency_id` (BRL) | official | 🟢 | — |
| parcelas / juros | página / API | `installments` / DOM | observed | 🟡 | varia por meio de pagamento |
| data da coleta | B7 | `collectedAt` (UTC) | — | 🟢 | carimbo obrigatório |

### 1.3 Vendas (escopo depende da fonte — ver Seções 4–7)

| Campo | Fonte | Captura | Classe | Disp. | Limitações |
|---|---|---|---|---|---|
| vendas informadas (texto) | página | DOM "+X vendidos" | observed | 🟢 | **agrupado/arredondado** — exibir como está |
| vendas informadas (API) | API | `/items/{id}.sold_quantity` | official | 🔴/🟡 | **o ML removeu/restringiu esse campo publicamente**; tratar como possivelmente indisponível |
| vendas reais da conta | conta autorizada | `/orders/search?seller={id}` (OAuth, dono) | authorized | 🟡 | só p/ anúncio do próprio usuário |
| vendas observadas no período | snapshots B7 | Δ entre duas coletas do mesmo listingId | historical | 🟡 | precisa ≥2 snapshots |
| unidades por período | conta / snapshots | orders por data / Δ snapshots | authorized/historical | 🟡 | **nunca** por divisão idade |

### 1.4 Estoque (escopo: listing / variação)

| Campo | Fonte | Captura | Classe | Disp. | Limitações |
|---|---|---|---|---|---|
| quantidade disponível | API / página | `.available_quantity` / DOM | official/observed | 🟡 | ML **agrupa** ("+50 disponíveis") |
| estoque da variação | API | `variations[].available_quantity` | official | 🟡 | quando há variação |
| status disponibilidade | API | `.status` + `.available_quantity` | official | 🟢 | pausado/encerrado/sem estoque |

### 1.5 Vendedor (escopo: seller)

| Campo | Fonte | Captura | Classe | Disp. | Limitações |
|---|---|---|---|---|---|
| sellerId | API | `/items/{id}.seller_id` | official | 🟢 | — |
| nome público | API | `/users/{id}.nickname` | official | 🟢 | — |
| loja oficial | API | `.official_store_id` | official | 🟡 | null se não oficial |
| reputação / nível | API | `.seller_reputation.level_id`, `.power_seller_status` | official | 🟢 | — |
| vendas públicas do vendedor | API | `.seller_reputation.metrics.sales` | official | 🟡 | **do vendedor**, não do anúncio |
| localização | API | `.address.city/state` | official | 🟢 | — |
| tempo de atividade | API | `.registration_date` | official | 🟡 | — |
| MercadoLíder | API | `.seller_reputation.power_seller_status` | official | 🟡 | — |

### 1.6 Logística (escopo: listing)

| Campo | Fonte | Captura | Classe | Disp. | Limitações |
|---|---|---|---|---|---|
| modalidade (Full/Flex/…) | API | `/items/{id}.shipping.logistic_type` | official | 🟢 | fulfillment/self_service/… → rótulo |
| frete grátis | API | `.shipping.free_shipping` | official | 🟢 | — |
| custo do frete | API | `/items/{id}/shipping_options?zip_code=` | official | 🟡 | **exige CEP**; varia por destino |
| prazo de entrega | API | shipping_options | official | 🟡 | exige CEP |
| origem do envio | API | shipping_options | official | 🟡 | quando informado |

### 1.7 Avaliações (escopo: catalog-product / listing)

| Campo | Fonte | Captura | Classe | Disp. | Limitações |
|---|---|---|---|---|---|
| nota média | API / página | `/reviews/item/{id}.rating_average` | official | 🟡 | pode ser do catálogo |
| quantidade de avaliações | API / página | `/reviews/item/{id}.paging.total` | official | 🟡 | escopo (anúncio×catálogo) deve ser rotulado |
| distribuição | API | `/reviews/item/{id}.rating_levels` | official | 🟡 | — |
| perguntas públicas | API | `/questions/search?item={id}` | official | 🟡 | respeitar limites/políticas |

### 1.8 Datas & características

| Campo | Fonte | Captura | Classe | Disp. |
|---|---|---|---|---|
| data de criação / início | API | `/items/{id}.date_created` / `.start_time` | official | 🟢 |
| última atualização | API | `.last_updated` | official | 🟢 |
| idade do anúncio | calculado | `hoje - date_created` | calculated | 🟢 |
| atributos técnicos / variações / imagens / garantia | API | `.attributes`, `.variations`, `.pictures`, `.warranty` | official | 🟢 |
| ficha técnica / descrição | API | `/items/{id}/description` | official | 🟢 |

---

## 2. Separação anúncio · catálogo · oferta · vendedor

| Conceito | Definição | Chave | Métricas próprias (rótulo obrigatório) |
|---|---|---|---|
| **Anúncio** | publicação individual de um vendedor | `listingId` | "Vendas deste anúncio", "Estoque deste anúncio" |
| **Produto de catálogo** | página que agrupa ofertas do mesmo produto | `catalogProductId` | "Vendas informadas no catálogo", "Avaliações do catálogo" |
| **Oferta do catálogo** | oferta de um vendedor dentro do catálogo | `listingId` + `catalogProductId` | "Participação deste vendedor", "Ofertas disponíveis" |
| **Vendedor atual** | quem detém a oferta principal no momento | `sellerId` | "Vendedor atual", "Vendas públicas do vendedor" |

**Proibições:** vendas do catálogo ≠ vendas do anúncio; vendas do vendedor ≠ vendas do
produto; nº de ofertas ≠ nº de vendedores únicos; faturamento do catálogo ≠ faturamento de um
anúncio. Toda métrica exibe seu **escopo**.

---

## 3. Dados por origem de acesso

**Públicos (concorrentes):** identificação, preço, tipo, status, estoque (agrupado), vendedor
e reputação, logística, avaliações, datas, atributos, vendas informadas (texto agrupado).

**Somente conta autorizada (dono do anúncio, OAuth):** pedidos reais, unidades vendidas por
período (hoje/7/15/30 dias/mês), receita real, cancelamentos, devoluções, ticket médio,
visitas reais (`/items/{id}/visits` quando permitido). Rótulo: **"Dados da sua conta"**.

**Somente por snapshots B7 (histórico próprio):** vendas observadas entre coletas (Δ da
quantidade informada), alteração de preço/estoque/tipo/frete, novas avaliações, mudança de
reputação/vendedor/posição. Rótulo: **"Vendas observadas no período"**.

**Impossíveis de obter legitimamente (não exibir, nem estimar):** vendas reais por período de
**concorrentes**; visitas de concorrentes; conversão real de concorrentes; faturamento real
histórico de concorrentes; estoque exato quando o ML agrupa; margem real do concorrente.

---

## 4. Correções obrigatórias no código atual (violações da nova regra)

| Item atual | Problema | Correção |
|---|---|---|
| `calculations/listing.ts → estimateSales()` | gera "vendas estimadas" (Seção 3 proíbe) | remover do ViewModel; manter só como utilitário interno **não exibido**, ou excluir |
| `extension/lib/analyze.ts → estimated_sales_total/_per_month` | estimativa exibida | substituir por **"Vendas informadas"** (observed, como está) e **"Vendas observadas no período"** (só com snapshots) |
| `analyze.ts → estimated_gross_revenue` (classe Estimado) | "receita estimada" | renomear para **"Faturamento bruto calculado"** = preço × qtd informada, classe **calculated**, com limitações no tooltip |
| `extension/lib/aggregate.ts → totalEstimatedSales / estimatedRevenueReais` | estima vendas/receita da busca | remover estimativas; manter só **observados** por `listingId` e totais rotulados "observado na página" |
| `MetricValue` (shared-types) | falta `scope` e distinção catálogo×anúncio | evoluir para **`ProductMetric<T>`** (Seção 6) com `scope`, `source`, `listingId`, flags `isRounded/isGrouped/limitation` |
| conversão de "+10 mil" → número exato | precisão falsa | preservar o **texto agrupado** ("+10 mil") + flag `isGrouped` + tooltip |
| cache de análise | não é por `listingId` | cache **chaveado por `listingId`** (+ variação); cancelar requisição ao desmontar |

---

## 5. Modelo de dados

```ts
interface ProductMetric<T> {
  key: string;
  label: string;              // pt-BR
  value: T | null;
  formattedValue: string | null;

  scope: 'listing' | 'catalog-product' | 'catalog-offer'
       | 'seller' | 'search-page' | 'authorized-account';
  source: 'official-api' | 'authorized-account' | 'public-page'
        | 'b7-snapshot' | 'user-input' | 'calculated';
  classification: 'official' | 'authorized' | 'observed'
        | 'historical' | 'calculated';

  listingId?: string;
  catalogProductId?: string;
  sellerId?: string;
  variationId?: string;

  collectedAt: string;        // UTC
  periodStart?: string;
  periodEnd?: string;

  isRounded?: boolean;
  isGrouped?: boolean;        // ex.: "+10 mil"
  limitation?: string;        // ex.: "ML agrupa quantidades públicas"
  formula?: string;
  formulaVersion?: string;
}

// ViewModel exclusivo de um anúncio, montado por listingId.
interface ListingViewModel {
  listingId: string;
  catalogProductId: string | null;
  sellerId: string | null;
  variationId: string | null;
  siteId: 'MLB';
  isOwn: boolean;             // pertence à conta autenticada?
  metrics: ProductMetric<unknown>[];
  collectedAt: string;
}
```

O modelo persistido (`ListingSnapshot`, `Seller`, `Category`, `MetricValue→MetricValue+scope`)
já existe em `@b7/database` e recebe a coluna `scope` e o vínculo por `listingId`.

---

## 6. Arquitetura dos adapters

```
MarketplaceAdapter (contrato)
 ├─ ProductPageAdapter        → identifyListingRef(url, dom): ListingRef  (listingId, catalog, variation, siteId)
 │                              extractPublicListing(dom): ProductMetric[] (scope=listing, source=public-page)
 ├─ MercadoLivreApiAdapter    → fetchItem(listingId), fetchSeller, fetchReviews, fetchCategory,
 │                              fetchShippingOptions(zip), fetchCatalog(catalogProductId)   (source=official-api)
 ├─ AuthorizedAccountAdapter  → fetchOrdersByListing(listingId, range), fetchVisits  (source=authorized-account; só se isOwn)
 └─ SnapshotAdapter (B7)      → diff(listingId): vendas observadas no período, deltas  (source=b7-snapshot)
```

Regras: seletores **somente** no registro central (já existe `selectors.ts`); cada campo
retorna proveniência; API oficial só via OAuth/backend; **antes de cada campo, validar contra
a documentação oficial atual** do Mercado Livre.

---

## 7. Cache e histórico por `listingId`

- **Cache** chaveado por `listingId` (+ `variationId`), TTL curto, no `background` da extensão;
  nunca compartilhar valor entre anúncios diferentes.
- **Cancelamento**: `AbortController` por card/painel; ao desmontar (mudança de URL/rolagem),
  aborta a consulta pendente.
- **Snapshots**: gravados por `listingId` no backend; "vendas observadas no período" = Δ entre
  dois snapshots reais, com `periodStart/periodEnd`. Sem 2 snapshots → campo **omitido**.
- **SPA**: `MutationObserver` + escuta de mudança de URL (history API) → desmonta ViewModel
  anterior e reconsulta o novo `listingId`.

---

## 8. Wireframes (placeholders — sem números fictícios)

### 8.1 Página de produto — faixa "Informações B7 Radar"
```
┌ Informações B7 Radar ───────────────────────────── [Atualizar] [⤢] ┐
│ Vendas informadas [QTD INFORMADA] (i)   Estoque [ESTOQUE DISPONÍVEL] │
│ Preço [PREÇO ATUAL]   Tipo [TIPO ANÚNCIO]   Frete [FRETE]            │
│ Reputação [REPUTAÇÃO VENDEDOR]                                       │
├─────────────────────────────────────────────────────────────────────┤
│ Criado em [DATA CRIAÇÃO]   Idade [IDADE]   Avaliações [Nº] Nota [NOTA]│
│ Comissão [COMISSÃO]   Líquido calculado [VALOR LÍQUIDO]              │
├── (só com histórico) ───────────────────────────────────────────────┤
│ Vendas observadas no período [VENDAS OBSERVADAS] ([PERÍODO])         │
│ Alteração de preço [Δ PREÇO]   Última coleta [DATA COLETA]           │
└ [Histórico] [Calculadora] [Comparar] [Monitorar] [Mais informações] ┘
```
Campos indisponíveis são **omitidos** (não aparecem vazios). Cada valor tem chip de origem.

### 8.2 Card na busca — bloco "Informações B7 Radar" (vinculado ao listingId do link)
```
┌ Informações B7 Radar · ID [LISTING ID] ────────────┐
│ Preço [PREÇO ATUAL]  Vendas [QTD INFORMADA]  [TIPO] │
│ Vendedor [VENDEDOR] · [REPUTAÇÃO]  Frete [FRETE]    │
│ Criado [DATA CRIAÇÃO]  Aval. [Nº] [NOTA]            │
│ (se houver) Observado no período [VENDAS OBSERVADAS]│
│                         [Salvar] [Comparar] [Monitorar] │
└─────────────────────────────────────────────────────┘
```
Cada card lê **seu próprio** `listingId` do link; nunca reaproveita valor de outro card.

### 8.3 Painel lateral — abas
```
┌ Informações B7 Radar ───────────────────────── [Atualizar] ┐
│ [IMG] [TÍTULO] · ID [LISTING ID] · [VENDEDOR] · [ÚLT. ATUALIZAÇÃO] │
│ Abas: Informações | Vendas | Preço | Vendedor | Logística | Histórico | Calculadora │
│ ── Vendas (concorrente) ──  quantidade informada [QTD], histórico [SNAPSHOTS],       │
│    vendas observadas entre coletas [VENDAS OBSERVADAS], período [PERÍODO]            │
│ ── Vendas (sua conta) ──   pedidos [PEDIDOS], unidades [UNIDADES], receita real       │
│    [RECEITA REAL], cancelamentos [Nº], devoluções [Nº] · rótulo "Dados da sua conta" │
└──────────────────────────────────────────────────────────────────────────────────────┘
```
Os dois modos de "Vendas" **nunca** se misturam.

---

## 9. Testes obrigatórios (fixtures por cenário)

Fixtures: sem catálogo · de catálogo · com variações · sem vendas exibidas · quantidade
agrupada · sem estoque · clássico · premium · Full · vendedor oficial · sem reputação · do
próprio usuário · de concorrente. Fluxos: mudança de URL · rolagem infinita · atualização de
preço · troca de variação.

**Teste anti-mistura (obrigatório):** dados do anúncio A nunca aparecem no card B; cache
separado por `listingId`; snapshots separados por `listingId`; requisição cancelada ao
desmontar o card.

---

## 10. Critérios de validação

Os 17 critérios da Seção 17 do briefing, com destaque: (1) identifica o anúncio atual; (2)
tudo vinculado ao `listingId`; (5) sem números fictícios; (6) sem vendas mensais sem histórico;
(7) catálogo não vira anúncio; (8) dado privado só para conta autorizada; (12) mudar de anúncio
limpa os dados; (17) campo indisponível omitido/identificado.

---

## 11. Plano de implementação (por incrementos verificáveis)

1. **Modelo:** `ProductMetric<T>` + `ListingViewModel` em `@b7/shared-types`; adicionar `scope`.
2. **Correções:** remover estimativas do ViewModel e da busca; renomear receita para
   "Faturamento bruto calculado"; preservar texto agrupado + flags.
3. **ProductPageAdapter:** `identifyListingRef` (listingId/catalog/variation/siteId) + extração
   pública por escopo; **remontar** ViewModel ao mudar de anúncio (SPA).
4. **Backend/OAuth:** `MercadoLivreApiAdapter` (item/seller/reviews/category/shipping) e
   `AuthorizedAccountAdapter` (orders por período) atrás do backend, com OAuth do dono.
5. **Cache/cancelamento por `listingId`** no background + `AbortController`.
6. **Snapshots:** "vendas observadas no período" = Δ real entre coletas.
7. **UI:** faixa na página de produto, bloco por card na busca, painel lateral com abas —
   campos indisponíveis omitidos, chips de origem/escopo.
8. **Testes:** fixtures por cenário + teste anti-mistura A/B.

Cada campo será validado contra a **documentação oficial atual** do Mercado Livre antes de ir
para produção.
