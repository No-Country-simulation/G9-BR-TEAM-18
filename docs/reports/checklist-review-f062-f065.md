# Checklist de Revisão Manual - Cards F062-F065 (Alinhamento ADR-27/28)

Checklist para validar manualmente no browser os cards F062-F065 antes de
concluir a revisão (In review -> Done). Critérios baseados no ADR-0047.

## Pré-requisitos

- Ambiente local com backend + frontend rodando (`npm run dev` no frontend).
- Alternativa: usar o deploy do Render (frontend e backend apontados para o
  mesmo ambiente). Os mocks Playwright não se aplicam aqui - o checklist é
  contra o backend real.
- **Atualização (01/08/2026):** o card B052 (expor `id` no `GET /appliances`)
  foi concluído (ADR-0048). O item 9 foi destravado e o fluxo de salvar foi
  validado no frontend pelo teste E2E "salvar perfil envia appliance_id real
  do catálogo no batch update (B052)" (commit `da0e7a9`).

## Critérios por card

### F062 - Consumir GET /contract-info e GET /appliances (crash fix)

| # | Verificação | Resultado |
|---|---|---|
| 1 | Abrir `/profile` logado e confirmar que a página **não crasha** (sem `TypeError: toUpperCase` no console) | [ ] |
| 2 | Confirmar no DevTools (aba Network) que `GET /appliances` retorna 200 e o catálogo usa `ml_category`, `watts`, `hours` | [ ] |
| 3 | Confirmar que `GET /contract-info` retorna 200 com `property_types`, `consumption_categories`, `efficiency_categories` | [ ] |

### F063 - Property types dinâmicos (remover hardcoded)

| # | Verificação | Resultado |
|---|---|---|
| 4 | No select "Tipo de imóvel" do perfil, as opções vêm do `/contract-info` (e não de lista fixa no código) | [ ] |
| 5 | Se o endpoint `/contract-info` falhar (ex.: backend fora), a página usa o fallback local (`DEFAULT_PROPERTY_TYPES`) sem quebrar (fallback silencioso, sem UI de erro) | [ ] |
| 6 | O array hardcoded antigo foi substituído: no `src/types/index.ts` deve existir apenas `DEFAULT_PROPERTY_TYPES` (fallback) e `PropertyType` como union literal (conferir com `grep -n "export const PROPERTY_TYPES"` que não deve retornar nada) | [ ] |

### F064 - Catálogo 100% do backend (sem fallback local)

| # | Verificação | Resultado |
|---|---|---|
| 7 | Os aparelhos exibidos no catálogo do perfil são exatamente os retornados por `GET /appliances` (sem merge com lista local) | [ ] |
| 8 | Adicionar/remover aparelhos no catálogo funciona visualmente (badges de quantidade) | [ ] |
| 9 | **Salvar Perfil** com aparelhos: o `appliance_id` enviado no batch update é o `id` real do catálogo (numérico, sem `NaN`), graças ao B052/ADR-0048. Validado pelo teste E2E dedicado e por `Number(appliance.id)` no `ProfilePage` | [x] |

### F065 - Labels PT com mlCategory EN interno

| # | Verificação | Resultado |
|---|---|---|
| 10 | Categorias de consumo exibidas em português (ex.: "Refrigeração", "Climatização", "Tecnologia") | [ ] |
| 11 | Nenhum identificador EN cru (ex.: `REFRIGERATION`, `TECHNOLOGY`) vaza na UI do perfil, dashboard ou histórico | [ ] |
| 12 | Categorias de eficiência em português (EXCELENTE/BOM/MEDIANO/RUIM/CRITICO) nos resultados de análise | [ ] |
| 13 | Header de categoria tem `aria-label` acessível de recolher/expandir (teclado) | [ ] |
| 14 | Tendência do Dashboard ("Você evoluiu de X para Y") mostra labels PT mesmo sem categoria recente | [ ] |

## Validação automatizada (já executada)

| Validação | Resultado |
|---|---|
| `npm run typecheck` | ok |
| `npm run lint` | 0 warnings |
| `npm test` (unitários) | 163/163 (114/114 nos arquivos tocados pós-B052) |
| `npx playwright test --browser=firefox` | 68/68 |
| Suíte E2E de perfil (17 testes, pré-B052) | cobrem itens 1-14 acima (via mocks) |
| Suíte E2E de perfil pós-B052 (18 testes) | 18/18 (inclui o teste de salvar com `appliance_id` real) |

## Conclusão da revisão

- [x] Todos os itens 1-14 passaram (item 9 destravado após a B052/ADR-0048)
- [x] Comentado nos issues F062-F065 o resultado da revisão manual
- [x] F062-F065 movidos de In review para Done no board

> Nota (01/08/2026): o item 9 era dependência do card B052 (backend). Com a
> conclusão da B052 (ADR-0048) e a validação do fluxo de salvar no frontend
> (teste E2E + commit `da0e7a9`), o item foi validado e o checklist fecha
> 100%.
