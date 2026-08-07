# ADR-0050: Exclusão de Imóvel e Polimentos de Exibição no Frontend (F073)

## Status

Aceito

> **Nota (06/08/2026):** Task F073 implementada, validada e movida para In review
> (issue #158). Suítes verdes: unit 175/175, E2E 77/77 (Firefox), typecheck, lint 0
> e build OK.

## Contexto

Uma auditoria comparativa entre o backend e o frontend (06/08/2026) identificou
que o `PropertyController` já expõe `DELETE /properties/{propertyId}` (com
ownership check e resposta `204 No Content`), porém o frontend não consumia o
endpoint: não existia função no `services/api.ts` nem UI no `ProfilePage`. O
usuário conseguia criar, trocar e editar imóveis (F059), mas não excluir um
imóvel criado por engano ou duplicado.

A mesma auditoria revelou campos que o backend já retorna nas análises, mas que
o frontend não exibia:

1. `source` (`"ML"` ou `"FALLBACK"`) no `AnalysisResponseDTO` e na listagem de
   análises: a origem da classificação não era visível para o usuário.
2. `updatedAt` no detalhe da análise: o tipo `AnalysisHistory` do frontend nem
   mapeava o campo.
3. `highestConsumptionProducts` na listagem do histórico: o campo era exibido
   apenas no resultado da análise (F048), não no card do histórico.

## Decisão

Implementar no frontend, sem nenhuma mudança de contrato no backend, os quatro
itens do F073:

1. **Excluir imóvel**: consumir o `DELETE /properties/{propertyId}` existente,
   com modal de confirmação e recuperação de estado consistente.
2. **Badge de fonte da análise** (ML vs FALLBACK) no detalhe do histórico, no
   resultado do perfil e no resultado da simulação do dashboard.
3. **`updated_at` no histórico**: mapear o campo no tipo e exibir "Atualizado
   em" no detalhe, apenas quando diferente de `created_at`.
4. **Top produtos no card do histórico**: exibir
   `highest_consumption_products` como tags no card da listagem.

## Detalhes da Implementação

### 1. API (`services/api.ts`) e tipos (`types/index.ts`)

- Adicionada `deleteProperty(propertyId: number): Promise<void>` que chama
  `DELETE /properties/{propertyId}` via `authFetch` (credentials `include`),
  redireciona para `/login` em `401` e lança `ApiError` com a mensagem do
  backend em caso de falha. Não lê o corpo da resposta no sucesso (`204 No
  Content`).

- `AnalysisHistory` ganhou os campos opcionais:

  - `updated_at?: string`
  - `source?: string` (`"ML"` | `"FALLBACK"`)

- `listAnalyses()` e `fetchAnalysisById()` passaram a mapear `updated_at` e
  `source` do contrato snake_case do backend, com tolerância ao contrato
  anterior (campos ausentes ficam `undefined`).

### 2. ProfilePage: exclusão de imóvel

- Botão **Excluir Imóvel** (classe `btn-danger`, estilos novos em `App.css`)
  renderizado apenas quando há imóvel ativo, desabilitado durante
  salvar/analisar/excluir.

- Modal de confirmação reutilizando o padrão visual do histórico
  (`.hist-modal-overlay` + `.hist-confirm-modal`), com mensagem explicando que
  o imóvel e os aparelhos associados serão removidos e que as análises
  permanecem no histórico.

- `handleDeleteProperty()`:

  1. Chama `deleteProperty(property.id)`.
  2. Recarrega `listProperties()` e seleciona o próximo imóvel ativo (ou o
     primeiro da lista).
  3. Ao selecionar o próximo imóvel, recarrega os aparelhos via
     `listPropertyAppliances()`.
  4. Sem imóveis restantes, **reinicia o formulário completo** (alias, tipo,
     endereço, moradores, área e aparelhos) para o estado inicial. Essa
     redefinição evita que um novo imóvel seja criado com dados obsoletos do
     imóvel excluído (achado de revisão de código).
  5. Em caso de erro, exibe a mensagem no banner de erro e fecha o modal.

### 3. Badge de fonte da análise

- Novo estilo `.analysis-source-badge` em `App.css`: pill com ícone e texto,
  com variação de ícone conforme a origem (`Sparkles` para `ML`,
  `AlertTriangle` para `FALLBACK`).
- Exibido em três pontos:

  - `History.tsx`: no header do modal de detalhe da análise.
  - `ProfilePage.tsx`: no card de resultado da análise (com label "Análise por
    modelo de ML" / "Resultado por fallback").
  - `Dashboard.tsx`: no header do resultado da simulação ("Modelo ML" /
    "Fallback").

### 4. updated_at no detalhe do histórico

- `History.tsx` exibe a linha "Atualizado em {data}" (`.hist-modal-updated`)
  no modal de detalhe, apenas quando `updated_at` existe e difere de
  `created_at` (evita ruído quando a análise nunca foi atualizada).

### 5. Top produtos no card do histórico

- `History.tsx` renderiza `highest_consumption_products` como tags
  (`.dash-sim-product-tag`, reutilizando os estilos de "Maiores consumidores"
  do resultado) dentro do card da listagem, com ícone resolvido por
  `resolveApplianceIcon()`.

## Alternativas consideradas

- **Excluir via endpoint de aparelhos um a um:** inviável, pois o endpoint
  `DELETE /properties/{propertyId}` já encapsula a remoção do imóvel e de seus
  aparelhos no backend (com constraints de chave estrangeira).
- **Não exibir a fonte da análise:** rejeitada, pois o campo `source` distingue
  resultado real do modelo de ML de fallback rule-based, informação relevante
  de transparência para o usuário.
- **Exibir `updated_at` sempre:** rejeitada, pois análises nunca atualizadas
  teriam a linha "Atualizado em" duplicando a data de criação.

## Consequências

- **Positivo:** o usuário passa a poder excluir imóveis, fechando o ciclo de
  gerenciamento de propriedades (criar, editar, trocar, excluir) sem depender
  de backend.
- **Positivo:** transparência sobre a origem da classificação (ML vs fallback)
  em todos os pontos onde o resultado é apresentado.
- **Positivo:** o histórico enriquece a informação por análise (atualização e
  principais consumidores) aproveitando campos já entregues pelo backend, sem
  mudança de contrato.
- **Positivo:** a redefinição completa do formulário após excluir o último
  imóvel previne a criação de um novo imóvel com dados obsoletos (bug evitado
  na revisão).
- **Negativo:** a exclusão é destrutiva e irreversível no backend; mitigado
  pelo modal de confirmação e pela mensagem explícita no card do F073.

## Validação

| Suíte | Resultado |
| --- | --- |
| `npm run typecheck` | sem erros |
| `npm run lint` | 0 warnings |
| `npx vitest run` (unitários) | 175/175 (inclui `deleteProperty`, `updateProperty` e o mapeamento de `updated_at`/`source` em `listAnalyses`) |
| `npx playwright test --browser=firefox` | **77/77** (6 testes novos: excluir imóvel com confirmação, cancelar exclusão, badge ML/FALLBACK no detalhe, updated_at no detalhe, contrato anterior sem updated_at, top produtos no card) |
| `npm run build` | OK |

Commits associados: `30457cd`, `c9e7825`, `3e41293`, `bdc3832`, `8e4e36e`.
