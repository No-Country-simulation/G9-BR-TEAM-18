# Checklist de Revisão Manual - Cards F062-F065 (Alinhamento ADR-27/28)

Checklist para validar manualmente no browser os cards F062-F065 antes de
concluir a revisão (In review -> Done). Critérios baseados no ADR-0047.

## Pré-requisitos

- Ambiente local com backend + frontend rodando (`npm run dev` no frontend).
- Alternativa: usar o deploy do Render (frontend e backend apontados para o
  mesmo ambiente). Os mocks Playwright não se aplicam aqui - o checklist é
  contra o backend real.
- O card B052 (expor `id` no `GET /appliances`) ainda está em aberto: o item
  9 do checklist é a limitação conhecida e deve ser marcado como
  "Bloqueado por B052", não como falha do frontend.

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
| 9 | **Salvar Perfil** com aparelhos: esperado falhar com "Erro ao salvar perfil" (o `appliance_id` derivado vira `NaN` -> `null` no batch até o B052 expor `id` no catálogo). Não é regressão do frontend - limitação documentada | [ ] Bloqueado por B052 |

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
| `npm test` (unitários) | 163/163 |
| `npx playwright test --browser=firefox` | 68/68 |
| Suíte E2E de perfil (17 testes) | cobrem itens 1-14 acima (via mocks) |

## Conclusão da revisão

- [ ] Todos os itens acima (exceto 9, bloqueado por B052) passaram
- [ ] Comentar nos issues F062-F065 o resultado da revisão manual
- [ ] Mover F062-F065 de In review para Done no board

> Nota: o item 9 é dependência do card B052 (backend). A conclusão dos cards
> F062-F065 não deve ser bloqueada por ele, desde que a limitação esteja
> registrada nos issues e no ADR-0047.
