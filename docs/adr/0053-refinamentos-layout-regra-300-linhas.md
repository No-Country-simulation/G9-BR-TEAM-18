# ADR-0053: Refinamentos de Layout e Regra de no Máximo 300 Linhas por Arquivo (F075)

## Status

Aceito

> **Nota (06/08/2026):** Task F075 implementada e validada (issue #161).
> Suítes verdes: unit 249/249, E2E 88/88 (Firefox), typecheck, lint 0,
> prettier e build de produção OK.

## Contexto

Uma auditoria visual do frontend (06/08/2026) identificou dois defeitos de
layout e uma decisão estrutural de manutenção:

1. **Sobreposição no modal de detalhes do Histórico**: o botão de fechar
   (`position: absolute` no canto superior direito) colidia com a data/hora
   da análise, que estica até o canto com `margin-left: auto` - datas longas
   em pt-BR (dia por extenso + hora) invadiam a zona do botão.
2. **Espaço vazio nos cards da página principal**: a regra global
   `.feature-card:first-child { grid-column: 1 / -1 }` forçava o primeiro
   card de **qualquer** `.features-grid` a ocupar a linha inteira. Nas seções
   com 4 cards (`HowItWorks`, `TechStack`), o último card ficava sozinho com
   um buraco ao lado.
3. **Arquivos grandes**: vários arquivos de código excediam 300 linhas
   (`App.css` com 3.828, `ProfilePage.tsx` com 898, `Dashboard.tsx` com 663,
   `History.tsx` com 612, além de testes e specs E2E), dificultando a
   manutenção e a revisão.

## Decisão

Implementar no frontend, sem mudança de contrato no backend:

1. **Corrigir a sobreposição do modal de detalhes**: reservar espaço para o
   botão de fechar no header (`.hist-modal-header` com `padding-right: 3.5rem`).
2. **Corrigir o grid da Home**: remover o full-width global do `:first-child`
   e adicionar o modificador `.features-grid--three` (3 colunas) usado no
   `FeatureCards` (3 cards na mesma linha).
3. **Regra de ≤300 linhas por arquivo de código** (TS/TSX/CSS), quebrando os
   arquivos excedentes em módulos temáticos com escopo claro.

## Detalhes da Implementação

### 1. Fixes de layout

- `history-modal.css`: `.hist-modal-header` ganhou `padding: 1.5rem 3.5rem 0 1.5rem`,
  garantindo que a data nunca invada a zona do botão X (36×36 px absoluto).
- `features.css`: removida a regra `.feature-card:first-child { grid-column: 1 / -1 }`
  e adicionado `.features-grid--three` (`repeat(3, 1fr)` com breakpoint 768 px).
- `FeatureCards.tsx` passou a usar `features-grid features-grid--three`.
- Verificação das demais telas: Dashboard (2×2 ✅), ProfilePage (coluna única ✅),
  lista do Histórico (flex ✅) e modais de confirmação (sem botão absoluto - sem
  risco de sobreposição).

### 2. Divisão do CSS (App.css 3.828 → 22 arquivos)

`App.css` virou um **barrel** com `@import` de `src/styles/*.css` (22 arquivos
temáticos: base, navbar, hero, buttons, appliance*, demo*, charts, features,
footer, auth, dashboard*, history*, profile, simulation, property-selector).
Todos com ≤300 linhas. O `contrast.test.ts` foi atualizado para concatenar o
barrel + todos os arquivos de `src/styles/` antes de interpretar as variáveis.

### 3. Divisão das páginas

| Arquivo | Antes | Depois |
|---|---|---|
| `src/pages/ProfilePage.tsx` | 898 | 204 + hook `useProfile` + 8 subcomponentes em `src/pages/profile/` |
| `src/pages/Dashboard.tsx` | 663 | 194 + 6 subcomponentes e helpers puros em `src/pages/dashboard/` |
| `src/pages/History.tsx` | 612 | 275 + 4 subcomponentes em `src/pages/history/` |

Destaques:

- **ProfilePage**: toda a lógica (estado, effects, handlers) foi movida para o
  hook `useProfile` (container/presenter); os componentes `PropertyForm`,
  `HabitsForm`, `ApplianceCatalog`, `SelectedAppliancesList`,
  `RegularitySelector`, `AnalysisResult`, `DeletePropertyModal` e o cálculo
  puro `applianceCalc` foram extraídos.
- **Dashboard**: `helpers.ts` concentra as funções puras
  (`aggregateByGranularity`, `interpretTrend`) agora com testes unitários;
  `StatsCards`, `GoalCard`, `PropertySelector`, `SimulationPanel` (com
  `key={property.id}` para limpar o estado ao trocar de imóvel),
  `ConsumptionChart` e `LastAnalysisSection` foram extraídos.
- **History**: `AnalysisDetail`, `DeleteConfirmModal`, `ApplianceBreakdown`
  (gráfico + tabela) e `status.tsx`/`statusConfig.ts` (badge de status).
  Os hooks de a11y dos modais (Escape, foco, trap, inert) foram movidos para
  dentro dos próprios modais - comportamento equivalente, pois eles só são
  montados quando abertos.

### 4. Divisão da camada de serviços e testes

- `services/api.ts` (430) → diretório `services/api/` com módulos por domínio
  (`client`, `auth`, `properties`, `appliances`, `analyses`, `preferences`,
  `catalog`) + barrel `index.ts`. Nenhum caller precisou mudar.
- `src/test/api.test.ts` (509) → 5 arquivos por domínio + `helpers.ts`.
- `src/test/appliance-icons.test.ts` (575) → 3 arquivos por describe.
- `e2e/helpers/mocks.ts` (349) → `mock-data.ts` (dados) + `mocks.ts` (funções,
  com re-export dos dados para não quebrar imports).
- `e2e/profile.spec.ts` (403) → `profile-form.spec.ts` + `profile-delete.spec.ts`.
- `e2e/history.spec.ts` (311) → `history-list.spec.ts` + `history-detail.spec.ts`.
- Novos testes unitários: `dashboard-helpers.test.ts` (granularidade/tendência)
  e `appliance-calc.test.ts` (cálculo de consumo do perfil).

## Validação

| Verificação | Resultado |
|---|---|
| Typecheck (`tsc --noEmit`) | ✅ 0 erros |
| Lint (`eslint . --max-warnings 0`) | ✅ 0 warnings |
| Prettier (`--check e2e src`) | ✅ todos os arquivos formatados |
| Unit (`vitest run`) | ✅ 249/249 (20 arquivos) |
| E2E Playwright (Firefox) | ✅ 88/88 |
| Build de produção (`npm run build`) | ✅ barrel de `@import` resolve no bundle |
| Nenhum arquivo TS/TSX/CSS > 300 linhas | ✅ |

## Commits

- `1822326` fix(style): F075 - sobreposição do botão fechar e grid `--three` na Home
- `55785f0` refactor(style): F075 - App.css dividido em `src/styles/` (22 arquivos)
- `c5df1b0` refactor(services): F075 - api.ts dividido em módulos por domínio
- `cc74421` refactor(profile): F075 - ProfilePage dividido em useProfile + subcomponentes
- `4a27d6f` refactor(dashboard): F075 - Dashboard dividido em subcomponentes + helpers
- `4d5be28` refactor(history): F075 - History dividido em subcomponentes
- `dbf3a4a` test: F075 - testes divididos por domínio/describe + novos testes unitários
- `6bad1be` test(e2e): F075 - specs E2E divididos e mock-data extraído
