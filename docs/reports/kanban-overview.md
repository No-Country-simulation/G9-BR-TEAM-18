# Relatório de análise do histórico - Quadro Kanban g9-br-team-18-energi-ia

Análise retrospectiva de todo o histórico de commits do repositório para reconstrução de um quadro Kanban no GitHub Projects (v2) representando as entregas realizadas pela equipe.

## Quadro Kanban (GitHub Projects v2)

O board foi criado como um GitHub Project (v2) real na organização No-Country-simulation:

**Nome:** g9-br-team-18-energi-ia
**URL:** <https://github.com/orgs/No-Country-simulation/projects/448>

**Configuração do board:**

- Campo Status: single select com 5 opções (Backlog, Ready, In progress, In review, Done)
- Labels de módulo (`modulo/*`) e tipo (`tipo/*`) mantidas como classificação complementar
- Labels adicionais por card: escopo (MVP/Opcional), tamanho (S/M/L), prioridade (High/Medium/Low)

## Dados da análise

| Métrica | Valor |
|---|---|
| Total de branches analisadas | 4 (dev, homolog, main, NOTEBOOK-UPDATES) |
| Total de commits analisados | 198 |
| Período do histórico | 2026-07-06 a 2026-07-23 |
| Total de autores | 8 |
| Total de PRs encontrados | 6 (todos mesclados) |

## Cards por coluna e categoria (atualizado em 06/08/2026)

| Coluna | Quantidade | | Categoria | Quantidade |
|---|---|---|---|---|
| Done | 126 | | Frontend (F) | 56 |
| In review | 12 | | Backend (B) | 44 |
| In progress | 2 | | Infraestrutura (I) | 20 |
| Ready | 0 | | ML Service / Queries (Q) | 10 |
| Backlog | 1 | | Banco de Dados (M) | 9 |
| **Total** | **141** | | Análise de dados (outros) | 2 |
| | | | **Total** | **141** |

## Movimentações (24/07/2026)

### Done → finalizados

| ID | Título |
|---|---|
| B028 | ACL: MlEnvelope, MlResult, AnalysisMapper |
| B029 | Schema Discovery: MlSchemaRegistry, endpoint categorias |
| B030 | EfficiencyCategory Value Object |
| B031 | Contract Tests para integração ML |
| B032 | Refactor: remover hardcoded, config via env vars |
| F028 | Alinhar catálogo de aparelhos com cobertura ML (PPH) |
| F029 | Corrigir property_type e highestConsumptionCategory |
| B033 | V9 migration: remover aparelhos sem cobertura PPH |
| F030 | Remover dead code (updateApplianceQuantity, demo.test.ts) |
| F031 | Adicionar testes: Login, Register, Navbar (19 testes) |
| B034 | Adicionar testes: PropertyServiceExtended, AnalysisMapperExtended |
| F032 | Corrigir createProperty test e remover demo.test.ts |
| I018 | Atualizar documentação (kanban, ADR-0024, frontend.md, testing.md) |

### In Progress - movidos para In review

| ID | Título |
|---|---|
| B033 | Enriquecer contrato de análise (highestConsumptionCategory, source) |
| B034 | Endpoint batch de aparelhos |
| B035 | Expandir Property com novos campos (address, residents, area) |
| B036 | Endpoint de simulação de análise |
| B037 | ML Service: endpoint /predict/simulate |
| F008 | Unificar páginas de análise e remover dados avançados |
| F009 | Reformular Dashboard com propósito (meta, simulação, progresso) |
| I017 | Atualizar contrato-api.md e glossario.md |
| F028 | Alinhar catálogo de aparelhos com cobertura ML (PPH) |
| F029 | Corrigir property_type e highestConsumptionCategory |
| F030 | Remover dead code |
| F031 | Adicionar testes frontend |
| B034 | Adicionar testes backend |
| I018 | Atualizar documentação |

## Movimentações (25/07/2026)

### Backlog → In review

| ID | Título |
|---|---|
| I019 | Infraestrutura/Base - Enriquecer documentação Swagger/OpenAPI da API |
| M005 | Modelagem Estrutural para Snapshots de Análises |
| B038 | Backend (Endpoints/Services) - Salvar e retornar o histórico de equipamentos |

### In progress → Done (Finalizados)

| ID | Título |
|---|---|
| I020 | Configuração de usuários DEV e TEST no Oracle DB com ORDS |

## Movimentações (26/07/2026)

### Backlog → In progress

| ID | Título |
|---|---|
| F033 | Frontend - Validação de sessão na montagem (auth/me) |
| F034 | Frontend - Remoção de mock data APPLIANCE_FALLBACK |
| F035 | Frontend - Alinhar categorias de aparelhos para inglês (ADR-0027) |
| F036 | Frontend - Consumir endpoint /energy-analysis/categories |
| F037 | Frontend - Adicionar campo status nas análises |

### In progress → Done (Finalizados)

| ID | Título |
|---|---|
| F033 | Frontend - Validação de sessão na montagem (auth/me) |
| F034 | Frontend - Remoção de mock data APPLIANCE_FALLBACK |
| I021 | Infraestrutura/Base - ADR-0030 (session validation + mock removal) |
| F040 | Frontend - Corrigir null safety no Dashboard e ProfilePage |
| F041 | Frontend - Corrigir interpretTrend no Dashboard (NaN% com análises PENDENTE/FALHA) |

### In progress → In review

| ID | Título | Commits associados |
|---|---|---|
| F035 | Frontend - Alinhar categorias de aparelhos (normalização EN/PT) | 2119896 |
| F036 | Frontend - Consumir endpoint /energy-analysis/categories (rank dinâmico) | 594c4cb |
| F037 | Frontend - Adicionar campo status nas análises | fcdcb65 |

### In review → Done

| ID | Título | Commits associados |
|---|---|---|
| F035 | Frontend - Alinhar categorias de aparelhos (normalização EN/PT) | 2119896 |
| F036 | Frontend - Consumir endpoint /energy-analysis/categories (Dashboard + AnalysisForm + ProfilePage) | 594c4cb, 036cb90 |
| F037 | Frontend - Adicionar campo status nas análises | fcdcb65 |
| F038 | Frontend - Corrigir crash no Histórico com valores nulos (null safety) | aa7ba40 |
| F039 | Frontend - Corrigir crash no Histórico com status desconhecido (STATUS_CONFIG) | 75f9a5a |
| F007 | Centralizar PROPERTY_TYPES em types/index.ts | - |
| B033 | Enriquecer contrato de análise (highestConsumptionCategory, source) | - |
| B034 | Endpoint batch de aparelhos | - |
| B035 | Expandir Property (address, residents, area) | - |
| B036 | Endpoint de simulação de análise | - |
| B037 | ML Service: endpoint /predict/simulate | - |
| F008 | Unificar páginas de análise e remover dados avançados | - |
| F009 | Reformular Dashboard (meta, simulação, progresso) | - |
| I017 | Atualizar contrato-api.md e glossario.md | - |
| F024 | Acessibilidade: indicador de foco visível (:focus-visible) | - |
| F025 | Acessibilidade: touch targets mínimos de 36px | - |
| F026 | Responsividade: breakpoints mobile | - |
| F027 | Acessibilidade e tema: ARIA labels, variáveis CSS | - |
| F028 | Alinhar catálogo de aparelhos com cobertura ML (PPH) | - |
| F029 | Correções property_type e highestConsumptionCategory | - |
| I019 | Documentação Swagger/OpenAPI da API | - |
| F042 | Code splitting: React.lazy() para reduzir bundle de 1.15MB para 242kB | c16ae3a |
| F043 | ChunkErrorBoundary para capturar falhas de carregamento lazy | d480b7a |

### Backlog/In progress/In review → Done

| ID | Título | Commits associados |
|---|---|---|
| F044 | Frontend (Testes) - Testes E2E com Playwright (67 testes) | d0984f9, 9d33533, ADR-0031 |
| F045 | Frontend (Bug) - Corrigir 400 ao analisar por consumo com mais de 2 casas decimais | 6f2a784 |

## Movimentações (26/07/2026) - Rodada 2

### Novos Cards + Conclusão

| ID | Título | Coluna inicial | Coluna final | Commits associados |
|---|---|---|---|---|
| B039 | Backend - Calcular e enviar highest_consumption_products ao ML Service | In progress | Done | 18d185c, b8198e9, 9fa00e8 |
| F046 | Frontend - Adicionar campos peakHourUsage e highConsumptionHours no ProfilePage | In progress | Done | 18d185c, 9fa00e8 |
| F047 | Frontend - Adicionar Apartamento como tipo de imóvel | In progress | Done | 18d185c, 9fa00e8 |
| F048 | Frontend - Exibir highest_consumption_products no resultado da análise | Backlog | Done | 779b864, 18d185c |
| B040 | Backend (Futuro) - Revisar mapeamento de categorias | Backlog | Backlog | - |
| B041 | ML Service (Futuro) - Usar highest_consumption_products no prompt do LLM | Backlog | Backlog | - |
| B038 | Backend - Salvar e retornar histórico de equipamentos | In review | Done | fa301d8, dd65ba8, 04cc961, 531ad45, 58ed788, e11199c |
| M005 | Migration V10 do histórico de análises | In review | Done | e11199c |
| F049 | Frontend - Remover localStorage, preferências via backend | In progress | Done | 1b460ed, ADR-0033 |
| F050 | Frontend - Melhoria visual: ícones específicos por aparelho + contraste tema escuro | In progress | Done | 72da15d |

## Movimentações (27/07/2026)

### Novos Cards + Conclusão

| ID | Título | Coluna inicial | Coluna final | Commits associados |
|---|---|---|---|---|
| B042 | Backend - Correção V12 (ordem SQL: DROP antes de INSERT) | In progress | Done | f6dcd3f |
| F051 | Infra/Base - Correção deploy: Flyway baseline repair + defaults env var | In progress | Done | f6dcd3f, 35ff7b6, 57cbb4a, 98acebc, 7f237ef, f8a863e, 709f725, a749de3, ADR-0034 |
| B043 | Backend - Defaults `${VAR:default}` para env vars do Flyway | In progress | Done | 709f725, a749de3 |
| M006 | Manual: Deletar entrada V12 do flyway_schema_history | In progress | Done | - |
| B044 | Backend - Corrigir CHECK constraint chk_property_type (APARTAMENTO) | In progress | Done | eb3298d, ADR-0035 |

## Movimentações (27/07/2026) - Rodada 3

### Novos Cards + Conclusão

| ID | Título | Coluna inicial | Coluna final | Commits associados |
|---|---|---|---|---|
| F053 | Backend - Alinhar status análise: FINALIZADO -> CONCLUIDA (DB/backend/frontend) | In progress | Done | 74534a5, ADR-0036 |
| F054 | Backend - Mapeamento EquipmentCategory inglês -> português (DB/ML) | In progress | Done | 74534a5, ADR-0037 |
| B045 | Backend (Migration) - Correção V14: PL/SQL com search_condition_vc | In progress | Done | e65a6c6, ADR-0038 |
| F055 | Frontend - Gráficos Dashboard com granularidade temporal (Mensal/Diário/Hora) | In progress | Done | c904986, ADR-0039 |
| F056 | Frontend - Relatório completo no Histórico com gráfico de consumo por equipamento | In progress | Done | dcf26f0, b790a2a, b4064c4, ADR-0040 |
| F057 | Frontend - Excluir análise no Histórico com confirmação | In progress | Done | 28911de, ADR-0041 |

## Movimentações (27/07/2026) - Rodada 4

### In progress → Done

| ID | Título | Coluna inicial | Coluna final | Commits associados |
|---|---|---|---|---|
| F058 | Frontend/Backend - Alinhamento FE/BE: remover AnalysisForm, expor highestConsumptionProducts, Dashboard usar /simulate | In progress | Done | ada29a3, ADR-0042 |
| F059 | Frontend - Seletor de múltiplos imóveis no ProfilePage (criar/trocar/editar) | In progress | Done | 2c04560 |
| F060 | Frontend - Atualizar dependências vulneráveis (js-yaml, esbuild, npm audit) | In progress | Done | 007c8b2 |
| F061 | Frontend - Seletor de imóveis no Dashboard para simulação correta | In progress | Done | cb37ed4, ADR-0043 |

## Movimentações (27/07/2026) - ADRs 27/28: Contrato em Inglês e Descoberta ML

### Novos Cards em Backlog - ML Service (assignee: guilherme-hermano)

| ID | Título | Issue | ADRs |
|---|---|---|---|
| Q001 | Endpoints de descoberta: GET /contract e GET /appliance-catalog | #127 | ADR-0027, ADR-0028, ADR-0044 |
| Q002 | Funções de normalização EN->PT (normalize_property_type + translate_category) | #136 | ADR-0027, ADR-0028, ADR-0044 |
| Q003 | Ajustar BASE_CONSUMPTION_BY_TYPE em main.py para inglês | #124 | ADR-0027, ADR-0028, ADR-0044 |
| Q004 | Atualizar _store_for_training() para gravar valores traduzidos | #125 | ADR-0027, ADR-0028, ADR-0044 |
| Q005 | Aplicar normalize_property_type() no prompt da Groq | #126 | ADR-0027, ADR-0028, ADR-0044 |
| Q006 | Aplicar translate_category() em `_run_prediction()` | #131 | ADR-0027, ADR-0028, ADR-0044 |

### Novos Cards em Backlog - Backend (assignee: eduuardo1st)

| ID | Título | Issue | ADRs |
|---|---|---|---|
| B048 | Consumir GET /contract e GET /appliance-catalog no startup | #128 | ADR-0027, ADR-0028 |
| B049 | Remover switch de tradução em EnergyAnalysisService.buildMlRequest() | #129 | ADR-0027, ADR-0028 |
| B050 | Expor GET /contract-info e GET /appliances para o frontend | #130 | ADR-0027, ADR-0028 |

### Novos Cards em Backlog - Frontend (assignee: DessimA)

| ID | Título | Issue | ADRs |
|---|---|---|---|
| F062 | Consumir GET /contract-info e GET /appliances do backend | #132 | ADR-0027, ADR-0028 |
| F063 | Remover PROPERTY_TYPES, CATEGORIES, CATEGORY_ORDER hardcoded | #133 | ADR-0027, ADR-0028 |
| F064 | Substituir APPLIANCE_FALLBACK pelo catálogo do backend | #134 | ADR-0027, ADR-0028 |
| F065 | Ajustar UI: nomes em português com mlCategory em inglês | #135 | ADR-0027, ADR-0028 |

## Movimentações (26/07/2026) - Rodada 5 (Tasks Independentes)

### In progress → Done

| ID | Título | Issue | Commits |
|---|---|---|---|
| F066 | Catálogo de ícones por palavra-chave (appliance-icons.ts) + remover METADATA_BY_NAME | #138 | 6e588db |
| F067 | CATEGORIES e CATEGORY_ORDER dinâmicos no ProfilePage | #139 | 6e588db |
| F068 | Ajustes CSS: Recharts cursor tema escuro + contraste de ícones | #137 | 6e588db |

## Movimentações (28/07/2026) - peak_hour_usage: Persistência e Independência

### Novos Cards em Backlog

| ID | Título | Issue | ADR | Assignee |
|---|---|---|---|---|
| F069 | Frontend - Persistir peak_hour_usage no perfil do usuário | #143 | ADR-0046 | DessimA |
| B051 | Backend - Expor peak_hour_usage nas preferências do usuário | #145 | ADR-0046 | eduuardo1st |
| Q007 | ML Service - Tornar peak_hour_usage feature independente no treino | #144 | ADR-0046 | guilherme-hermano |

## Movimentações (01/08/2026) - Frontend: Alinhamento ADR-27/28 (F062-F065)

### Backlog → In review

| ID | Título | Issue | Commits associados | ADR |
|---|---|---|---|---|
| F062 | Frontend - Consumir GET /contract-info e GET /appliances do backend | #132 | 7f0e60d, b55fc90, b764464, 452977e | ADR-0047 |
| F063 | Frontend - Remover PROPERTY_TYPES, CATEGORIES, CATEGORY_ORDER hardcoded | #133 | 7f0e60d, b764464 | ADR-0047 |
| F064 | Frontend - Substituir APPLIANCE_FALLBACK pelo catálogo do backend | #134 | 7f0e60d, b55fc90 | ADR-0047 |
| F065 | Frontend - Ajustar UI: nomes em português com mlCategory em inglês | #135 | b764464, b305cb2 | ADR-0047 |

### Novos Cards em Backlog - Backend (assignee: eduuardo1st)

| ID | Título | Issue | ADRs |
|---|---|---|---|
| B052 | Backend - Expor campo id no GET /appliances (destrava salvar de aparelhos) | #150 | ADR-0027, ADR-0028, ADR-0047 |

## Movimentações (01/08/2026) - Rodada 2: F069 (peak_hour_usage) + bug regularidade + robustez E2E

### Backlog → In progress

| ID | Título | Issue | Commits associados | ADR |
|---|---|---|---|---|
| F069 | Frontend - Persistir peak_hour_usage no perfil do usuário (prep frontend concluída; validação ponta a ponta aguarda B051) | #143 | 9d4178d, 7120d57 | ADR-0046 |

### Notas

- O commit `9d4178d` corrige o bug da regularidade que não carregava quando havia imóvel ativo
  (o return precoce no load pulava o `setRegularity`) e prepara o F069: `fetchPreferences`/
  `updatePreferences` agora aceitam `peak_hour_usage` e `high_consumption_hours`, e o `handleSave`
  persiste os hábitos de consumo. O backend (B051, Ready) ainda ignora esses campos com segurança
  até tratá-los.
- O commit `7120d57` aumenta a janela dos mocks de loading state (300ms -> 1500ms) nos specs de
  dashboard, history e profile, eliminando flakiness por cold-compile do Vite/Firefox: suíte E2E
  completa com 68/68 testes passando.

## Movimentações (01/08/2026) - Rodada 3: Reconciliação board/report (frontend)

### Backlog → Done (código já implementado)

| ID | Título | Issue | Commits associados |
|---|---|---|---|
| F058 | Frontend/Backend - Alinhamento FE/BE: remover AnalysisForm, expor highestConsumptionProducts, Dashboard usar /simulate | #122 | ada29a3 |
| F061 | Frontend (Dashboard) - Seletor de imóveis no Dashboard para simular com a propriedade correta | #123 | cb37ed4 |
| F066 | Frontend - Catálogo de ícones por palavra-chave (appliance-icons.ts) + remover METADATA_BY_NAME | #138 | 6e588db, 63d5fe3, 9e956df, cfc294f, 1c7cd79, 8c5fb0e, d77afde, 2716c3c |
| F067 | Frontend - CATEGORIES e CATEGORY_ORDER dinâmicos no ProfilePage | #139 | 6e588db, 2802818, ccfa9f9 |
| F068 | Frontend - Ajustes CSS: Recharts cursor tema escuro + contraste de ícones | #137 | 6e588db, eebb5b9 |

### Cards criados no board (implementados, sem issue) → Done

| ID | Título | Commits associados |
|---|---|---|
| F059 | Frontend - Seletor de múltiplos imóveis no ProfilePage (criar/trocar/editar) | 2c04560 |
| F060 | Frontend - Atualizar dependências vulneráveis (js-yaml, esbuild, npm audit) | 007c8b2 |

### Notas

- Reconciliação entre o report (que já marcava F058-F061 e F066-F068 como Done desde 27/07) e o
  board do GitHub Projects (que permanecia em Backlog). F059/F060 não possuíam card nem issue:
  foram criados como draft items em Done com os commits 2c04560 e 007c8b2.
- F062-F065 foram movidos para Done após revisão concluída (ver Rodada 4).
- F069 segue em In progress (prep concluída; validação ponta a ponta aguarda B051).

## Movimentações (01/08/2026) - Rodada 4: Review concluída F062-F065

### In review → Done

| ID | Título | Issue | Commits associados | ADR |
|---|---|---|---|---|
| F062 | Frontend - Consumir GET /contract-info e GET /appliances do backend | #132 | 7f0e60d, b55fc90, b764464, 452977e | ADR-0047 |
| F063 | Frontend - Remover PROPERTY_TYPES, CATEGORIES, CATEGORY_ORDER hardcoded | #133 | 7f0e60d, b764464 | ADR-0047 |
| F064 | Frontend - Substituir APPLIANCE_FALLBACK pelo catálogo do backend | #134 | 7f0e60d, b55fc90 | ADR-0047 |
| F065 | Frontend - Ajustar UI: nomes em português com mlCategory em inglês | #135 | b764464, b305cb2 | ADR-0047 |

### Notas

- Revisão manual executada conforme [checklist-review-f062-f065.md](checklist-review-f062-f065.md)
  (itens 1-14 aprovados) e validações automatizadas: E2E 68/68 (Firefox), typecheck, lint 0,
  unit 163/163. Comentado nos issues #132-#135.
- Limitação registrada: o salvar de aparelhos no perfil continua dependendo do card B052
  (expor `id` no GET /appliances). Não bloqueia a conclusão dos cards F062-F065.

## Movimentações (01/08/2026) - Rodada 5: B052 concluída e validação do salvar no frontend

### In review → Done

| ID | Título | Issue | Commits associados | ADR |
|---|---|---|---|---|
| B052 | Backend - Expor campo id no GET /appliances (destrava salvar de aparelhos) | #150 | 31ce8c1, 3f13969 | ADR-0048 |

### Novo card → Done

| ID | Título | Issue | Commits associados | ADR |
|---|---|---|---|---|
| F070 | Frontend - Consumir id real do GET /appliances (B052) e validar salvar de aparelhos | #151 | da0e7a9 | ADR-0047, ADR-0048 |

### Notas

- B052 revisada (backend): `ApplianceCatalogSyncService` (upsert NFD no startup), `ApplianceResponseDTO`
  com `id`, `@JsonProperty("appliance_id")` no `ApplianceQuantity` e `ApplianceControllerTest` atualizado
  (commits 31ce8c1/3f13969, ADR-0048).
- F070 (frontend) destrava o último critério de aceite da B052: mocks E2E espelham o contrato com `id`
  e o novo teste E2E de salvar perfil valida `appliance_id` numérico real no batch update (commit da0e7a9).
- Suites: typecheck ok, lint 0, unit 114/114 nos arquivos tocados (163 no total), E2E profile 18/18 (Firefox).
- Comentado no issue #150. Checklist item 9 destravado (ADR-0047 seção 6 atualizada).
- Contagens: o diff In review 4→5 / Ready 1→0 reflete movimentações de backend feitas por
  Eduardo no mesmo intervalo (B048, B049, B050 e M003/Analise-PPH movidos para In review).

## Movimentações (01/08/2026) - Rodada 6: Deploy quebrado no Render (B052 revertida)

### Done → Backlog (regressão)

| ID | Título | Issue | Motivo |
|---|---|---|---|
| B052 | Backend - Expor campo id no GET /appliances (destrava salvar de aparelhos) | #150 | Crash no startup do Render: `ORA-02290 CHK_APPLIANCE_CATEGORY` no `ApplianceCatalogSyncService` (mlCategory EN vs constraint PT) |

### Novos cards em Backlog

| ID | Título | Issue | ADR |
|---|---|---|---|
| B053 | Backend - Corrigir crash do ApplianceCatalogSyncService (CHK_APPLIANCE_CATEGORY) - sub-issue B052 | #152 | ADR-0048 |
| B054 | Backend - Corrigir NPE no MlSchemaRegistry.register (lista nula no retry do Schema Discovery) | #153 | ADR-0028 |

### Notas

- Deploy de 01/08/2026: o backend quebra no startup porque o sync da B052 grava `mlCategory` em
  inglês (`REFRIGERATION`...) em `tb_appliance.appliance_category`, mas a constraint
  `chk_appliance_category` (V12) só aceita português (`'Refrigeração'`...). Fix proposto no B053:
  mapear via `EquipmentCategory.toPortuguese()` antes do save.
- B054 (não relacionado à B052): NPE no retry do Schema Discovery quando o ML responde listas nulas.
- O card F070 (frontend) permanece Done - o consumo do `id` está correto e validado por mocks/E2E;
  a validação ponta a ponta em produção fica condicionada à correção B053.

## Movimentações (06/08/2026) - Frontend: F069 Done + Sessão Node 24/deps/CI

### In review → Done

| ID | Título | Issue | Commits associados | ADR |
|---|---|---|---|---|
| F069 | Frontend - Persistir peak_hour_usage no perfil do usuário | #143 | 9d4178d, 7120d57, 8ea109a | ADR-0046 |

### Novos cards em Done (draft items, implementados e validados na sessão)

| ID | Título | Commits associados |
|---|---|---|
| F071 | Frontend - Atualizar para Node 24 e dependências @latest (TS 6.0.3 pinado, engines Node 24, audit 0) | 86be85a, 1545925, 2f02742 |
| F072 | Frontend - Otimizar LucideIcon com registry estático (529kB -> 22kB) + remoção de dead code (knip, F030) | 8ed8f23, 3502ca2, 70b164b |
| I022 | Infraestrutura/Base - CI: rodar linters de frontend/docs/infra em push direto para dev | 75620bb |

### Notas

- F069: frontend concluído e revisado. O perfil persiste e restaura os hábitos de consumo
  (peak_hour_usage/high_consumption_hours) via PUT /auth/preferences e GET /auth/me, consumindo
  o contrato do B051. Suítes verdes: E2E 71/71 (Firefox), unit 169/169, typecheck, lint 0,
  build, audit 0. Comentado na issue #143.
- F071: Node 24 em Dockerfiles, workflows (node-version 20/22 -> 24) e engines `>=24.15.0`
  (jsdom@30 exige 24.15+); dependências @latest (lucide-react 1.29, vite 8.2.1, jest-dom 7,
  jsdom 30, react-is 19). TypeScript travado em `~6.0.3` por compatibilidade com
  typescript-eslint@8.66.0 (peer `>=4.8.4 <6.1.0`; TS 7 incompatível). Removidos o flag
  `--legacy-peer-deps` (Dockerfiles/workflows) e overrides desnecessários. npm audit 0.
- F072: knip 0 exports não utilizados; F030 (dead code: addApplianceToProperty, demo.test.ts
  duplicado) concluído nesta sessão; LucideIcon com registry estático de ~55 ícones
  (chunk de 529kB para 22kB), mantendo fallback para nomes desconhecidos.
- I022: lint-frontend, test-frontend, lint-docs e lint-infra agora disparam em push direto para
  `dev` (além de PR), espelhando o lint-backend. Push que altera apenas `.github/workflows/**`
  não dispara (comportamento do GitHub Actions com path filters), validado no push 75620bb.
- Contagens do board refletem também movimentações de backend/ML feitas pela equipe desde
  01/08: B048-B054 e Q007 em In review, Q008 e análise de datasets PPH em In progress.

## Movimentações (06/08/2026) - Rodada 2: Novo card F073 (Backlog)

### Novo card em Backlog

| ID | Título | Issue | Escopo |
|---|---|---|---|
| F073 | Frontend - Excluir imóvel + polimentos (badge fonte, updatedAt, top produtos no histórico) | #158 | Excluir imóvel (DELETE /properties/{id}); badge source ML/FALLBACK; updated_at no detalhe; highest_consumption_products no card do histórico |

### Notas

- Criado após análise backend x frontend (06/08): o endpoint DELETE /properties/{propertyId}
  já existe no PropertyController (com ownership check) mas não é consumido pelo frontend
  (nenhuma função no api.ts nem UI - ProfilePage só permite criar/trocar/editar).
- Os polimentos aproveitam campos que o backend já retorna: source (ML/FALLBACK),
  updated_at (AnalysisResponseDTO) e highest_consumption_products (hoje exibido só no
  resultado da análise - F048).

## Movimentações (06/08/2026) - Rodada 3: F073 implementado (Backlog → In review)

### Backlog → In review

| ID | Título | Issue | Commits associados |
|---|---|---|---|
| F073 | Frontend - Excluir imóvel + polimentos (badge fonte, updatedAt, top produtos no histórico) | #158 | 30457cd, c9e7825, 3e41293, bdc3832, 8e4e36e |

### Notas

- Implementado e validado: `deleteProperty` no api.ts (DELETE /properties/{id}); botão
  Excluir Imóvel no ProfilePage com modal de confirmação e reset do formulário; badge de
  fonte ML/FALLBACK no detalhe do histórico, no resultado do perfil e na simulação do
  dashboard; linha "Atualizado em" (updated_at) no detalhe; top produtos consumidores no
  card do histórico.
- Suítes verdes: unit 175/175, E2E 77/77 (Firefox), typecheck, lint 0, build OK.
- Comentado na issue #158; card movido para In review.
