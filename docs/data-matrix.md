# Matriz de disponibilidade dos dados

Classificação: **OFI** Oficial · **OBS** Observado · **CAL** Calculado · **EST** Estimado ·
**CFG** Configurado. Confiança: A(alta) / M(média) / B(baixa).

Cada métrica na B7 Radar carrega valor, unidade, classificação, fonte, timestamp, período,
confiança e (quando aplicável) fórmula versionada. Quando não há dado, o campo fica
**indisponível** — nunca inventamos um valor.

| Dado | Fonte provável | Disponib. | Classe | Conf. | Fórmula / Método | Fallback | Risco |
|---|---|---|---|---|---|---|---|
| Preço atual | DOM / API item | Alta | OBS/OFI | A | leitura direta | indisponível | mudança de seletor |
| Preço original / desconto | DOM / API | Média | OBS | A | `(orig-atual)/orig` | ocultar | nem sempre exposto |
| Vendas informadas | DOM ("+X vendidos") | Média | OBS | M | parse de texto | indisponível | ML mostra faixas |
| Vendas estimadas | Modelo B7 v1 | Alta | EST | M/B | `f(vendasInf, idade, reviews)` | usar só informadas | é estimativa |
| Vendas/dia · /mês | Cálculo | Alta | CAL | M | estimadas ÷ período | — | herda incerteza |
| Ritmo de vendas | Série/cálculo | Média | CAL/EST | M | Δvendas entre snapshots | estimado por idade | precisa histórico |
| Receita bruta est. | Cálculo | Alta | EST | M | `preço × vendas` (rotulado) | — | herda incerteza |
| Estoque | DOM / API | Média | OBS/OFI | A | leitura | indisponível | ML oculta às vezes |
| Idade do anúncio | API `date_created` | Alta | OBS/OFI | A | `hoje - criação` | indisponível | fuso |
| Visitas | API (só do dono) | Baixa | OFI | A | `/visits` (auth) | indisponível | só conta conectada |
| Conversão | Cálculo | Baixa | EST | B | `vendas/visitas` | indisponível | precisa visitas |
| Comissão % | FeeSchedule + tipo | Alta | CFG/OFI | A | tabela por categoria/tipo | pedir ao usuário | tabela desatualizar |
| Tarifa fixa | FeeSchedule por faixa | Alta | CFG | A | regra por preço | configurável | muda por política |
| Frete | DOM / API shipping | Média | OBS/OFI | M | leitura/estimativa | configurável | regras complexas |
| Imposto | Config do usuário | Alta | CFG | A | `preço × alíquota` | 0 até configurar | responsabilidade do user |
| Margem / ROI / equilíbrio | @b7/calculations | Alta | CAL | A | módulo puro testado | — | entradas do user |
| Reputação vendedor | DOM / API seller | Média | OBS/OFI | A | leitura | indisponível | representação varia |
| Logística (Full/Flex…) | DOM / API | Média | OBS | A | tags → enum | indisponível | seletor |
| Nº avaliações / nota | DOM / API reviews | Alta | OBS/OFI | A | leitura | indisponível | — |
| Participação no catálogo | Cálculo | Baixa | EST | B | share entre concorrentes | indisponível | dados parciais |
| B7 Opportunity Score | Modelo v1 | Alta | EST | M | soma ponderada explicável | ocultar | subjetividade dos pesos |

## Fórmulas versionadas

As fórmulas ficam em `@b7/calculations`, cada uma com versão em
[`version.ts`](../packages/calculations/src/version.ts):

- `contribution-margin@1.0.0` — margem de contribuição, ROI, ponto de equilíbrio (Modo A).
- `price-for-margin@1.0.0` — preço mínimo/recomendado/psicológico (Modo B).
- `opportunity-score@1.0.0` — B7 Opportunity Score (0–100, fatores explicáveis).
- `estimated-sales@1.0.0` — estimativa conservadora de vendas.
- `listing-age@1.0.0` — idade do anúncio em dias (UTC).

As tarifas do marketplace ficam em
[`fee-schedule.ts`](../packages/calculations/src/fee-schedule.ts) — versionadas e
**configuráveis**, nunca embutidas nas fórmulas. O `DEFAULT_ML_FEE_SCHEDULE` é um
_placeholder_ editável e deve ser verificado contra a política vigente antes de ser tratado
como oficial.
