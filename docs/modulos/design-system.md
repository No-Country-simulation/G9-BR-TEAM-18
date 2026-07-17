# Design System : Caos Controlado

Este documento descreve a linguagem visual do projeto, inspirada no universo estético de colagem urbana, ilustração estilo quadrinho de traço grosso, texturas de rua e paletas neon sobre fundo escuro. A ideia central é **caos controlado**: o visual é ousado nos pontos de impacto (hero, CTAs, divisores) e limpo nos pontos de leitura (corpo de texto, formulários), mantendo o site profissional e legível.

## Direção estética

| Atributo | Descrição |
|---|---|
| Personalidade | Urbano, distópico-pop, tecnológico e orgânico ao mesmo tempo |
| Texturas | Grafite, colagem, VHS/glitch, halftone, ruído analógico |
| Contraste chave | Fundo escuro vs. cor neon limpa; traço grosso vs. textura granulada |
| Tom | Confiante e irreverente, sem comprometer legibilidade |

## Paleta de cores

Fundo escuro como base, quatro cores ácidas de identidade.

| Token | Dark Hex | Light Hex | Uso |
|---|---|---|---|
| `--bg-base` | `#0B0E14` | `#F4F1E8` | Fundo principal |
| `--bg-surface` | `#151A24` | `#FFFFFF` | Cards, painéis |
| `--bg-surface-alt` | `#1E2530` | `#E8E4D8` | Seções alternadas |
| `--ink` | `#0A0A0A` | `#1A1A1A` | Contornos grossos, texto em btn |
| `--text-primary` | `#F4F1E8` | `#1A1A1A` | Texto principal |
| `--text-secondary` | `#A9AFBC` | `#4A4440` | Texto de apoio |
| `--accent-green` | `#C6FF3D` | `#5AA00F` | CTAs primários, destaques |
| `--accent-cyan` | `#29E7CD` | `#0FAF9A` | Links, hover, elementos tech |
| `--accent-magenta` | `#FF4FA3` | `#D42D7A` | Badges, scroll-to-top |
| `--accent-mustard` | `#F2C230` | `#C4921A` | Ícones, avisos |
| `--state-error` | `#FF3B3B` | `#D42D2D` | Erros de formulário |

### Regra de uso

Nunca use as quatro accent na mesma seção. Escolha uma dominante por seção (ex: hero em verde, features em magenta) e reserve as outras para pontos isolados (badges, ícones, hover).

Sempre use texto `--ink` (escuro) sobre fundo `--accent-green` ou `--accent-mustard`. Nunca texto claro sobre essas cores.

## Tipografia

| Papel | Fonte | Peso | Uso |
|---|---|---|---|
| Display | Anton | 400 | H1, H2, títulos em caixa alta |
| Acento | Bangers | Regular | Badges, selos (máx 3 palavras) |
| Corpo | Inter | 400-700 | Parágrafos, formulários, nav |
| Dados | Space Mono | 400 | Números, tags, timestamps |

### Escala

```css
--font-size-h1: clamp(2.5rem, 5vw, 4.5rem);
--font-size-h2: clamp(2rem, 4vw, 3rem);
--font-size-h3: clamp(1.5rem, 2.5vw, 2rem);
--font-size-body: 1rem;
--font-size-small: 0.875rem;
```

## Elementos gráficos

| Elemento | Implementação |
|---|---|
| Contorno grosso | `border: 2px solid var(--ink)` em cards, botões, inputs |
| Sombra dura | `box-shadow: 4px 4px 0 var(--ink)` (s/ blur) |
| Halftone | `repeating-conic-gradient` em divisores; `.halftone-bg` com `radial-gradient` |
| Ruído | `body::after` com SVG `feTurbulence`, opacidade 3.5% |
| Glitch | Classe `.glitch` com pseudo-elementos em ciano/magenta |
| Faixa diagonal | `.section-divider` com `clip-path: polygon()` |

### Regra de contenção

Ruído e glitch são globais e discretos. Não replicar o efeito em cada componente individual. Respeitar `prefers-reduced-motion`.

## Componentes

| Componente | Especificação |
|---|---|
| Botão primário | `accent-green` bg, `ink` text, 2px `ink` border, hard shadow |
| Botão secundário | Transparente, 2px `accent-cyan` border/text |
| Card | `bg-surface` bg, 2px `ink` border, hard shadow |
| Badge | `ink` bg, accent color text/texto, 1px accent border |
| Input | 2px `ink` border, focus `accent-cyan` |
| Seção divisor | 4px halftone pattern (`repeating-conic-gradient`) |

## Intensidade visual por seção

| Seção | Intensidade | Dominante |
|---|---|---|
| Hero | Máxima | green + cyan |
| Demo/ferramenta | Alta | cyan |
| Features | Média | magenta |
| Footer | Média | cyan + green |
| Auth (login/register) | Baixa | green |
| Dashboard | Baixa | green |

A lógica de intensidade segue o princípio de caos controlado: máximo impacto no hero (primeira impressão), intensidade decrescente conforme o usuário avança para seções de utilidade (FAQ, formulários), onde a legibilidade é prioridade.

## Temas

O sistema suporta dois temas via atributo `data-theme` no `<html>`:

- **Dark** (padrão): a experiência completa do design system, fundo escuro com neons
- **Light**: adaptação para ambientes claros, com cores mais sóbrias mantendo a identidade

A alternância é gerenciada pelo `ThemeContext` e persistida em `localStorage`.

### Contraste

- `accent-green` e `accent-mustard` têm luminância alta : usar texto `ink` escuro sobre elas
- `accent-magenta` e `accent-cyan` têm contraste moderado : reservar para elementos grandes
- Nunca usar duas accent adjacentes como texto sobre texto
- `prefers-reduced-motion` desativa animações globalmente
