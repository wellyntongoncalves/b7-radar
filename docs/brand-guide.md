# Guia de Marca — B7 Radar

**Assinatura:** Inteligência de mercado por Bloco 7
**Slogan:** Dados organizados. Decisões mais fortes.

## Conceito

A B7 Radar faz parte do ecossistema **Bloco 7**. O conceito é transformar informações
dispersas em **blocos claros de decisão**. "Bloco" = organização, estrutura, modularidade.
O número **7** = os sete pilares: Produto, Preço, Mercado, Concorrência, Vendas, Margem,
Oportunidade.

A marca transmite tecnologia, precisão, confiabilidade, clareza e controle. **Evita**
qualquer associação com jogos de azar, apostas, fichas, roleta ou promessa de dinheiro fácil.

## Logotipo

O símbolo é construído com **exatamente sete blocos geométricos** que formam o número 7
(uma barra superior de quatro blocos + um traço descendente de três blocos), representando
os sete pilares. O fluxo do gradiente institucional (azul → violeta → ciano) atravessa o
símbolo.

Arquivos em [`packages/brand/assets`](../packages/brand/assets):

| Versão | Arquivo |
|---|---|
| Símbolo (gradiente) | `logo-symbol.svg` |
| Símbolo monocromático (`currentColor`) | `logo-symbol-mono.svg` |
| Horizontal (símbolo + wordmark + assinatura) | `logo-horizontal.svg` |
| Ícone da extensão (tile 128px) | `icon-extension.svg` |
| Favicon (32px, simplificado p/ 16px) | `favicon.svg` |

O símbolo mono serve para fundo claro e escuro e impressão em uma cor.

## Paleta

| Nome | Hex | Uso |
|---|---|---|
| Azul Bloco | `#2457FF` | Primária |
| Violeta 7 | `#6D35FF` | Secundária |
| Ciano de Dados | `#19C9E8` | Destaque de dados |
| Preto Estrutural | `#0B0D12` | Texto / superfícies escuras |
| Branco Gelo | `#F6F8FC` | Fundo claro |
| Cinza de Interface | `#667085` | Texto secundário / bordas |

Semânticas: sucesso `#16B364`, alerta `#F79009`, erro `#F04438`, informação `#2E90FA`.

Gradiente institucional: `linear-gradient(135deg, #2457FF 0%, #6D35FF 55%, #19C9E8 100%)`.
Usar com moderação — botão principal, borda de destaque, indicador ativo, estados premium.
Nunca em grandes áreas que prejudiquem a leitura.

## Tipografia

- **Sora** — marca, títulos, chamadas (Bold/SemiBold).
- **Inter** — interface, formulários, tabelas, métricas (Regular/SemiBold/Bold).

Fallback: fontes abertas geométricas de alta legibilidade.

## Linguagem visual

Central profissional de inteligência comercial: cards modulares, grid, blocos de informação,
números com destaque, bordas discretas (cards 8–12px, inputs 6–8px), sombras suaves, ícones
lineares, etiquetas de origem/confiança/período. Cortes diagonais sutis inspirados no "7".
Densidade sem poluição visual. Tema claro (padrão) e escuro.

## Tom de voz

Direto, analítico, profissional, transparente, sem sensacionalismo. Nunca promessas absolutas.

- ✅ "Receita bruta estimada com base no preço atual e nas vendas observadas."
- ❌ "Este anúncio faturou exatamente R$ 200 mil."

Os design tokens vivem em código: [`packages/brand/src/tokens.ts`](../packages/brand/src/tokens.ts)
e o espelho CSS em [`tokens.css`](../packages/brand/src/tokens.css).
