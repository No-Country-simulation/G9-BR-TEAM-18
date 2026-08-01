# ADR-0047: Alinhamento do Frontend ao Contrato das ADRs 27 e 28 (F062-F065)

## Status

Aceito

## Contexto

As ADRs 0027 e 0028 definem que o ML Service expõe endpoints de descoberta(`/contract`, `/appliance-catalog`), o backend os consome e expõe`/contract-info` e `/appliances` dinâmicos (B050), e o frontend deve consumirtudo isso dinamicamente, eliminando dados hardcoded (`PROPERTY_TYPES`,`CATEGORIES`, `CATEGORY_ORDER`, `APPLIANCE_FALLBACK`).

O backend concluiu a B050 e passou a expor `GET /contract-info` e`GET /appliances` com o contrato em inglês (ADR-0027): `ml_category`, `watts`,`hours`. Isso quebrou o frontend em produção: a página de perfil crashava com

```
TypeError: Cannot read properties of undefined (reading 'toUpperCase')
    at RD (LucideIcon-*.js)
    at ProfilePage-*.js (Array.map)
```

O crash ocorria porque o frontend ainda esperava o contrato antigo(`appliance_category`, `average_power_watts`) e o `LucideIcon` recebia um nomede ícone `undefined`, chamando `toUpperCase()` sem proteção.

Este ADR documenta o alinhamento completo do frontend (tasks F062 a F065) e avalidação E2E da suíte Playwright com os mocks atualizados, além do novobloqueio identificado no backend (expor `id` no `GET /appliances`).

## Decisão

A equipe decidiu alinhar 100% o frontend ao contrato dinâmico das ADRs 27 e 28,tratando o backend como única fonte de verdade para catálogo de aparelhos etipos de imóvel, mantendo o português apenas na camada de exibição.

### 1. F062 - Corrigir crash e consumir o contrato novo de `/appliances`

- `enrichAppliance()`/`listAppliances()` passaram a mapear `ml_category`,`watts` e `hours` do contrato ADR-0027 (com tolerância ao contrato antigo).

- `appliance-icons.ts` ganhou proteção defensiva contra `undefined`/`null` em`resolveApplianceIcon()` e `getCategoryDisplay()`, eliminando o crash de`toUpperCase()` no `LucideIcon`.

- Testes unitários do novo contrato adicionados em `appliance-icons.test.ts`.

### 2. F063 - Consumir `/contract-info` e remover dados hardcoded

- Novo `fetchContractInfo()` em `services/api.ts` consumindo`GET /contract-info` (property types, categorias de consumo e de eficiência).

- `PROPERTY_TYPES` hardcoded removido de `types/index.ts`; `PropertyType`virou union literal e `DEFAULT_PROPERTY_TYPES` passou a ser o fallback localde segurança caso o endpoint falhe.

- O select "Tipo de imóvel" do `ProfilePage` é alimentado dinamicamente pelo`/contract-info`, com label PT com fallback (`PROPERTY_TYPE_LABELS[t] ?? t`).

### 3. F064 - Catálogo 100% do backend, sem fallback local

- Confirmado que `APPLIANCE_FALLBACK`/`mergeAppliancesWithBackend()`/`METADATA_BY_NAME` já haviam sido removidos (F034, commit `6011bc2`).

- Removido o stub morto `hooks/useCategoryDisplay.ts` (nunca importado, sóreferenciava um merge com fallback local).

- Mocks E2E (`MOCK_APPLIANCES`) atualizados para o contrato ADR-0027.

### 4. F065 - Labels PT na UI, `mlCategory` interno EN

- Auditoria das páginas Profile, Dashboard e History: categorias de consumopassam por `getCategoryDisplay()` (PT) e categorias de eficiência por`CATEGORY_DISPLAY` (PT), sem vazamento de identificadores EN crus na UI.

- `Dashboard.tsx`: adicionado fallback `?? recentCategories[0/1]` na mensagem"Você evoluiu de X para Y" (consistência com os demais pontos de exibição).

- `ProfilePage.tsx`: `aria-label` de recolher/expandir no header de categoria(acessibilidade).

### 5. Validação E2E (Playwright)

A suíte E2E (68 testes) foi executada com os mocks atualizados:

| Validação | Resultado |
| --- | --- |
| `npm run typecheck` | sem erros |
| `npm run lint` | 0 warnings |
| `npm test` (unitários) | 163 testes passando |
| `npx playwright test --browser=firefox` | **68/68 testes passando** |

Nota de ambiente: o Chromium do Playwright exige libs de sistema (`libnspr4`,`libnss3`) que podem faltar em Linux mínimo sem sudo; o Firefox do Playwrightfunciona sem dependências extras. Documentado no `guia-execucao.md`.

### 6. Bloqueio resolvido: `id` no `GET /appliances` (Task B052 concluída)

A Task B052 foi concluída com sucesso, e o fluxo de **salvar aparelhos** no perfil, que dependia do `appliance_id` para o batch update (`PUT /properties/{id}/appliances/batch`), está agora totalmente destravado. O endpoint `GET /appliances` agora expõe o `id` físico real de cada eletrodoméstico, eliminando a necessidade do frontend derivar um ID via slugify como fallback local.

### 7. Revisão concluída (01/08/2026)

A revisão dos cards F062 a F065 foi concluída e todos foram movidos para**Done** no board, com comentário de aprovação nos issues #132, #133, #134e #135 (ADR-0047).

Validação manual executada conforme o[checklist-review-f062-f065.md](../reports/checklist-review-f062-f065.md)(itens 1 a 14 aprovados), além das validações automatizadas da seção 5:

| Card | Issue | Status |
| --- | --- | --- |
| F062 | #132 | Done |
| F063 | #133 | Done |
| F064 | #134 | Done |
| F065 | #135 | Done |

A revisão confirma que a dependência do card B052 para o salvar de aparelhos (seção 6) foi resolvida, destravando completamente o fluxo.

## Alternativas consideradas

| Alternativa | Prós | Contras |
| --- | --- | --- |
| Manter fallback local do catálogo | Sem dependência do backend | Duplica dados; divergência com o backend; fonte de bugs (crash) |
| Consumir 100% do backend (escolhido) | Única fonte de verdade; sem divergência | Depende do backend estar correto |
| Ignorar labels PT e exibir `mlCategory` cru | Menos código de mapeamento | UI em inglês fere o produto |
| Manter hook `useCategoryDisplay` como stub | Nenhum | Código morto que referenciava fallback local |

## Consequências

- **Positivo:** Página de perfil não crasha mais com o contrato novo.

- **Positivo:** `PROPERTY_TYPES` e dados de aparelhos vêm 100% do backend.

- **Positivo:** UI permanece em português com `mlCategory` interno em inglês.

- **Positivo:** Suíte E2E validada (68/68) com mocks alinhados ao contrato.

- **Positivo:** Revisão dos cards F062 a F065 concluída e aprovada(01/08/2026), com checklist manual vinculado (seção 7).

- **Positivo:** O fluxo de salvar aparelhos no perfil foi totalmente destravado com a conclusão da Task B052, que expõe o `id` físico no `GET /appliances`.

- **Neutro:** Fallbacks defensivos (`DEFAULT_PROPERTY_TYPES`, `?? label`)permanecem como camada de segurança, não como fonte de dados.

> **Nota:** Consulte o [glossário do projeto](../glossario.md) para definição dos termos utilizados neste documento.