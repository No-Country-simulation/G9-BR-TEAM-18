# ADR-0054: Correção da "Última Análise" - Ordenação DESC do GET /analyses (F076)

## Status

Aceito

> **Nota (06/08/2026):** Task F076 implementada, validada e movida para In
> review (issue #162). Suítes verdes: unit 257/257, E2E 39/39
> (profile-form + profile-delete + dashboard, Firefox), typecheck, lint 0 e
> prettier. Nenhuma mudança de contrato no backend foi necessária.

## Contexto

O usuário reportou (06/08/2026) que o card "Última Análise" do Perfil não
exibia a análise mais recente: mostrava sempre a primeira análise realizada e
nunca atualizava ao rodar novas análises. A investigação (com evidências)
concluiu:

1. **Backend** `GET /analyses` -> `AnalysisController.analysesForUser()` ->
   `EnergyAnalysisRepositoryAdapter.listByPropertyIds()` ->
   `findByPropertyIdInOrderByCreatedAtDesc`: retorna a lista em ordem **DESC**
   (mais recente primeiro).
2. **Frontend** assumia ordem **ASC**: `useProfile` e `Dashboard` pegavam
   `all[all.length - 1]` e `interpretTrend` usava `[length - 1]/[length - 2]`,
   selecionando a análise **mais antiga**.
3. **Bug antigo (não é regressão do F075)**: a lógica `all[length - 1]` já
   existia na ProfilePage antes do split (confirmado via `git show HEAD~9`).
4. **Mocks E2E mascaravam o bug**: `MOCK_ANALYSES` retorna em ordem crescente,
   o oposto do backend real - por isso os testes passavam mesmo com o
   comportamento errado.

## Decisão

Corrigir exclusivamente no frontend, sem mudança de contrato:

1. Selecionar a análise mais recente por `created_at`, de forma robusta a
   qualquer ordem da API, extraindo helpers compartilhados.
2. Aplicar em todos os consumidores: Perfil (última análise) e Dashboard
   (última análise, tendência e mensagem de progresso).
3. Dividir o hook `useProfile` em dois (mutações vs estado/load) para manter a
   regra de no máximo 300 linhas por arquivo sem sacrificar legibilidade.

## Detalhes da Implementação

- `src/utils/analyses.ts` (novo): `sortAnalysesDesc(analyses)` ordena por
  `created_at` DESC e `latestAnalysis(analyses)` retorna a mais recente.
- `src/pages/profile/useProfileState.ts` (novo, 178 linhas): estado + load do
  perfil; a "Última Análise" usa `latestAnalysis(all)`.
- `src/pages/profile/useProfile.ts` (176 linhas): apenas as mutações
  (salvar/excluir/analisar) e flags; mesma interface retornada ao consumidor.
- `src/pages/Dashboard.tsx`: lista normalizada com `sortAnalysesDesc` no load;
  `lastAnalysis = analyses[0]`; `recentCategories = analyses.slice(0, 2)`;
  `rankDiff` com os índices corrigidos.
- `src/pages/dashboard/helpers.ts`: `interpretTrend` ordena DESC internamente
  e compara a mais recente com a anterior.
- `src/pages/dashboard/LastAnalysisSection.tsx`: mensagem de progresso
  "evoluiu de [anterior] para [nova]" com os índices corretos e "Você" com
  acentuação.
- Comentário em `e2e/helpers/mock-data.ts` documentando que o fixture é
  ascendente de propósito enquanto a API real retorna DESC.

## Validação

| Verificação | Resultado |
|---|---|
| Unit (`vitest run`) | 257/257 (novos testes de `analyses-utils` e `interpretTrend` com dados DESC) |
| E2E Playwright (Firefox) | 39/39 (profile-form + profile-delete + dashboard) |
| Typecheck (`tsc --noEmit`) | 0 erros |
| Lint (`eslint . --max-warnings 0`) | 0 warnings |
| Prettier | OK |
| Regra de arquivos <=300 linhas | OK (useProfile 176, useProfileState 178) |

## Commits

- `cd54d2f` feat(utils): F076 - sortAnalysesDesc e latestAnalysis compartilhados
- `cffd36f` fix(profile): F076 - última análise = mais recente + split useProfileState
- `986b7bf` fix(dashboard): F076 - última análise, tendência e progresso corrigidos
- `e3c9580` test: F076 - testes unitários + E2E da última análise reforçado
