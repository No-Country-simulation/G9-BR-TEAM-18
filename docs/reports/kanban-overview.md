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
| Done | 86 | | Backend (B) | 40 |
| In review | 2 | | Infraestrutura (I) | 19 |
| In progress | 0 | | Frontend (F) | 26 |
| Ready | 0 | | Banco de Dados (M) | 5 |
| Backlog | 0 | | Queries/Views (Q) | 2 |
| **Total** | **88** | | **Total** | **88** |

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
