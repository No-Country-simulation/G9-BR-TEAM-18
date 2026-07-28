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

## Cards por coluna e categoria

| Coluna | Quantidade | | Categoria | Quantidade |
|---|---|---|---|---|
| Done | 116 | | Backend (B) | 52 |
| In review | 0 | | Infraestrutura (I) | 20 |
| In progress | 0 | | Frontend (F) | 50 |
| Ready | 0 | | ML Service (Q) | 6 |
| Backlog | 15 | | Banco de Dados (M) | 7 |
| **Total** |**116** | | Queries/Views (Q) | 2 |
| | | | **Total** | **137** |

## Movimentações (24/07/2026)

### Done → finalizados

| ID | Título |
|---|---|
| B028 | ACL: MlEnvelope, MlResult, AnalysisMapper |
| B029 | Schema Discovery: MlSchemaRegistry, endpoint categorias |
| B030 | EfficiencyCategory Value Object |
| B031 | Contract Tests para integração ML |
| B032 | Refactor: remover hardcoded, config via env vars |
| F028 | Alinhar catalogo de aparelhos com cobertura ML (PPH) |
| F029 | Corrigir property_type e highestConsumptionCategory |
| B033 | V9 migration: remover aparelhos sem cobertura PPH |
| F030 | Remover dead code (updateApplianceQuantity, demo.test.ts) |
| F031 | Adicionar testes: Login, Register, Navbar (19 testes) |
| B034 | Adicionar testes: PropertyServiceExtended, AnalysisMapperExtended |
| F032 | Corrigir createProperty test e remover demo.test.ts |
| I018 | Atualizar documentacao (kanban, ADR-0024, frontend.md, testing.md) |

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
| F028 | Alinhar catalogo de aparelhos com cobertura ML (PPH) |
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
| M005 | Modelagem Estrutural para Snapshots de Análises[cite: 10] |
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

## Movimentações (26/07/2026) — Rodada 2

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

## Movimentações (27/07/2026) — Rodada 3

### Novos Cards + Conclusão

| ID | Título | Coluna inicial | Coluna final | Commits associados |
|---|---|---|---|---|
| F053 | Backend - Alinhar status análise: FINALIZADO -> CONCLUIDA (DB/backend/frontend) | In progress | Done | 74534a5, ADR-0036 |
| F054 | Backend - Mapeamento EquipmentCategory inglês -> português (DB/ML) | In progress | Done | 74534a5, ADR-0037 |
| B045 | Backend (Migration) - Correção V14: PL/SQL com search_condition_vc | In progress | Done | e65a6c6, ADR-0038 |
| F055 | Frontend - Gráficos Dashboard com granularidade temporal (Mensal/Diário/Hora) | In progress | Done | c904986, ADR-0039 |
| F056 | Frontend - Relatório completo no Histórico com gráfico de consumo por equipamento | In progress | Done | dcf26f0, b790a2a, b4064c4, ADR-0040 |
| F057 | Frontend - Excluir análise no Histórico com confirmação | In progress | Done | 28911de, ADR-0041 |

## Movimentações (27/07/2026) — Rodada 4

### In progress → Done

| ID | Título | Coluna inicial | Coluna final | Commits associados |
|---|---|---|---|---|
| F058 | Frontend/Backend - Alinhamento FE/BE: remover AnalysisForm, expor highestConsumptionProducts, Dashboard usar /simulate | In progress | Done | ada29a3, ADR-0042 |
| F059 | Frontend - Seletor de múltiplos imóveis no ProfilePage (criar/trocar/editar) | In progress | Done | 2c04560 |
| F060 | Frontend - Atualizar dependências vulneráveis (js-yaml, esbuild, npm audit) | In progress | Done | 007c8b2 |
| F061 | Frontend - Seletor de imóveis no Dashboard para simulação correta | In progress | Done | cb37ed4, ADR-0043 |

## Movimentações (27/07/2026) — ADRs 27/28: Contrato em Inglês e Descoberta ML

### Novos Cards em Backlog — ML Service (assignee: guilherme-hermano)

| ID | Título | Issue | ADRs |
|---|---|---|---|
| Q001 | Endpoints de descoberta: GET /contract e GET /appliance-catalog | #127 | ADR-0027, ADR-0028, ADR-0044 |
| Q002 | Funções de normalização EN->PT (normalize_property_type + translate_category) | #136 | ADR-0027, ADR-0028, ADR-0044 |
| Q003 | Ajustar BASE_CONSUMPTION_BY_TYPE em main.py para inglês | #124 | ADR-0027, ADR-0028, ADR-0044 |
| Q004 | Atualizar _store_for_training() para gravar valores traduzidos | #125 | ADR-0027, ADR-0028, ADR-0044 |
| Q005 | Aplicar normalize_property_type() no prompt da Groq | #126 | ADR-0027, ADR-0028, ADR-0044 |
| Q006 | Aplicar translate_category() em _run_prediction() | #131 | ADR-0027, ADR-0028, ADR-0044 |

### Novos Cards em Backlog — Backend (assignee: eduuardo1st)

| ID | Título | Issue | ADRs |
|---|---|---|---|
| B048 | Consumir GET /contract e GET /appliance-catalog no startup | #128 | ADR-0027, ADR-0028 |
| B049 | Remover switch de tradução em EnergyAnalysisService.buildMlRequest() | #129 | ADR-0027, ADR-0028 |
| B050 | Expor GET /contract-info e GET /appliances para o frontend | #130 | ADR-0027, ADR-0028 |

### Novos Cards em Backlog — Frontend (assignee: DessimA)

| ID | Título | Issue | ADRs |
|---|---|---|---|
| F062 | Consumir GET /contract-info e GET /appliances do backend | #132 | ADR-0027, ADR-0028 |
| F063 | Remover PROPERTY_TYPES, CATEGORIES, CATEGORY_ORDER hardcoded | #133 | ADR-0027, ADR-0028 |
| F064 | Substituir APPLIANCE_FALLBACK pelo catálogo do backend | #134 | ADR-0027, ADR-0028 |
| F065 | Ajustar UI: nomes em português com mlCategory em inglês | #135 | ADR-0027, ADR-0028 |

## Movimentações (26/07/2026) — Rodada 5 (Tasks Independentes)

### In progress → Done

| ID | Título | Issue | Commits |
|---|---|---|---|
| F066 | Catálogo de ícones por palavra-chave (appliance-icons.ts) + remover METADATA_BY_NAME | #138 | 6e588db |
| F067 | CATEGORIES e CATEGORY_ORDER dinâmicos no ProfilePage | #139 | 6e588db |
| F068 | Ajustes CSS: Recharts cursor tema escuro + contraste de ícones | #137 | 6e588db |


