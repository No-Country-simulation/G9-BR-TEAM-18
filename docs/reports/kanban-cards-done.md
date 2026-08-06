# Lista completa de cards (Done)

| ID | Título | Issue | ADR relacionado |
|---|---|---|---|
| I001 | Infraestrutura/Base - Estrutura inicial do projeto | #7 | - |
| B001 | Backend (Endpoints/Services) - Backend MVP com arquitetura hexagonal | #8 | ADR-0001 |
| F001 | Frontend (Telas/Componentes) - Frontend inicial React + Vite | #9 | - |
| B002 | Backend (Endpoints/Services) - ML Service inicial FastAPI | #10 | - |
| I002 | Infraestrutura/Base - Docker e script de execução local | #11 | ADR-0005 |
| B003 | Backend (Endpoints/Services) - Testes de unidade e integração do backend | #12 | - |
| Q001 | Queries/Views - Notebook de análise energética com EDA e modelo ML | #13 | - |
| Q002 | Queries/Views - Dados PPH 2019 e reestruturação do notebook | #14 | - |
| B004 | Backend (Endpoints/Services) - Expansão de 3 para 5 categorias de eficiência | #15 | ADR-0006 |
| B005 | Backend (Endpoints/Services) - Fallback Groq no ML Service | #16 | ADR-0003 |
| B006 | Backend (Endpoints/Services) - Integração backend com ML Service via WebClient | #17 | ADR-0003 |
| B007 | Backend (Endpoints/Services) - Aprimoramento do modelo ML com novas features | #18 | ADR-0006 |
| B008 | Backend (Endpoints/Services) - Autenticação por sessão no backend | #19 | ADR-0007 |
| B009 | Backend (Endpoints/Services) - Correções de deploy no Render | #20 | ADR-0005 |
| I003 | Infraestrutura/Base - Linters e ferramentas de qualidade | #21 | ADR-0004 |
| I004 | Infraestrutura/Base - Workflows de CI/CD no GitHub Actions | #22 | ADR-0004 |
| B010 | Backend (Endpoints/Services) - Remoção de código morto InMemoryAnaliseRepository | #23 | - |
| B011 | Backend (Endpoints/Services) - Padronização de nomes português para inglês | #24 | ADR-0002 |
| B012 | Backend (Endpoints/Services) - Análise por aparelhos específicos | #25 | ADR-0006 |
| I005 | Infraestrutura/Base - Containerização do ML Service com Docker | #26 | ADR-0005 |
| B013 | Backend (Endpoints/Services) - Script de treinamento do modelo ML | #27 | - |
| I006 | Infraestrutura/Base - Documentação arquitetural (ADRs 1 a 7) | #28 | - |
| I007 | Infraestrutura/Base - Reformatação da documentação do projeto | #29 | - |
| M001 | Banco de Dados (Migration) - Migração de H2 para PostgreSQL com Flyway | #30 | ADR-0009 |
| B014 | Backend (Endpoints/Services) - Associação de análises com usuários | #31 | - |
| B015 | Backend (Endpoints/Services) - Correções de validação e integração | #32 | - |
| B016 | Backend (Endpoints/Services) - Autenticação JWT | #33 | ADR-0007 |
| B017 | Backend (Endpoints/Services) - Redesign do domínio Property | #34 | ADR-0008 |
| B018 | Backend (Endpoints/Services) - Testes de integração do novo domínio | #35 | ADR-0008 |
| I008 | Infraestrutura/Base - ADR do redesign Property e migração Oracle | #36 | ADR-0009 |
| B019 | Backend (Endpoints/Services) - Aplicação de formatação Spotless | #37 | - |
| M002 | Banco de dados (Migration) - Redução de escopo dos imóveis e junção dos datasets | #38 | - |
| F002 | Frontend (Telas/Componentes) - Catálogo de aparelhos extraído para módulo compartilhado | #44 | ADR-0011 |
| F003 | Frontend (Telas/Componentes) - Funções CRUD expandidas na api.ts | #45 | ADR-0011 |
| F004 | Frontend (Telas/Componentes) - Página de perfil (/profile) com catálogo visual e persistência | #46 | ADR-0011 |
| F005 | Frontend (Telas/Componentes) - Análise automática com reescrita do AnalysisPage | #47 | ADR-0011 |
| F006 | Frontend (Telas/Componentes) - Dashboard aprimorado com última análise e tendência | #48 | ADR-0011 |
| I009 | Infraestrutura/Base - ADRs 0010 e 0011 (revogação JWT e perfil) | #49 | ADR-0010, ADR-0011 |
| M003 | Banco de Dados (Migration) - Migration V4 tb_token_blacklist | #50 | ADR-0010 |
| B020 | Backend (Endpoints/Services) - Token blacklist repository (ports + adapters + JPA) | #51 | ADR-0010 |
| B021 | Backend (Endpoints/Services) - Logout com invalidação JWT + job cleanup | #52 | ADR-0010 |
| B022 | Backend (Endpoints/Services) - Troca de SHA-256 para BCrypt no hash de senha | #53 | ADR-0010 |
| B023 | Backend (Endpoints/Services) - Forced password reset with current password verification | #56 | ADR-0012 |
| I010 | Infraestrutura/Base - ADR-0012 (forced password reset) | #57 | ADR-0012 |
| F007 | Frontend (Telas/Componentes) - Centralizar PROPERTY_TYPES em types/index.ts | #58 | ADR-0018 |
| B026 | Backend (Endpoints/Services) - Validar propertyType com enum TipoImovel | #59 | ADR-0018 |
| M004 | Banco de Dados (Migration) - Migration V6 normalize property type | #60 | ADR-0018 |
| B027 | Backend (Endpoints/Services) - Integration tests for property type validation | #61 | ADR-0018 |
| I011 | Infraestrutura/Base - ADR-0018 (normalização tipos imóvel) | #62 | ADR-0018 |
| B024 | Backend (Endpoints/Services) - Admin reset password endpoint | #63 | ADR-0019 |
| B025 | Backend (Endpoints/Services) - Integration tests for password reset and admin reset | #64 | ADR-0019 |
| I012 | Infraestrutura/Base - ADR-0019 (admin password reset) | #65 | ADR-0019 |
| I013 | Infraestrutura/Base - ADR-0020 (Anti-Corruption Layer ML) | #68 | ADR-0020 |
| I014 | Infraestrutura/Base - ADR-0021 (Schema Discovery) | #69 | ADR-0021 |
| I015 | Infraestrutura/Base - ADR-0022 (Value Objects Eficiência) | #67 | ADR-0022 |
| I016 | Infraestrutura/Base - ADR-0023 (Contract Testing ML) | #66 | ADR-0023 |
| B028 | Backend (Endpoints/Services) - ACL: MlEnvelope, MlResult, AnalysisMapper | - | ADR-0020 |
| B029 | Backend (Endpoints/Services) - Schema Discovery: MlSchemaRegistry, endpoint categorias | - | ADR-0021 |
| B030 | Backend (Endpoints/Services) - EfficiencyCategory Value Object | - | ADR-0022 |
| B031 | Backend (Endpoints/Services) - Contract Tests para integração ML | - | ADR-0023 |
| B032 | Backend (Endpoints/Services) - Refactor: remover hardcoded, config via env vars | - | ADR-0020 |
| F028 | Frontend (Telas/Componentes) - Alinhar catálogo de aparelhos com cobertura ML (PPH) | #83 | ADR-0024 |
| F029 | Frontend (Telas/Componentes) - Corrigir property_type e highestConsumptionCategory | #84 | ADR-0024 |
| B033 | Backend (Endpoints/Services) - V9 migration: remover aparelhos sem cobertura PPH | - | ADR-0024 |
| F030 | Frontend (Telas/Componentes) - Remover dead code (updateApplianceQuantity, demo.test.ts) | - | - |
| F031 | Frontend (Telas/Componentes) - Adicionar testes: Login, Register, Navbar (19 testes) | - | - |
| B034 | Backend (Endpoints/Services) - Adicionar testes: PropertyServiceExtended (13), AnalysisMapperExtended (13) | - | - |
| F032 | Frontend (Telas/Componentes) - Corrigir createProperty test e remover demo.test.ts | - | - |
| I018 | Infraestrutura/Base - Atualizar documentação (kanban, ADR-0024, frontend.md, testing.md) | - | ADR-0024 |
| I020 | Infraestrutura/Base - Configuração de usuários DEV e TEST no Oracle DB com ORDS | #89 | - |
| F008 | Frontend - Unificar páginas de análise e remover dados avançados | #76 | - |
| F009 | Frontend - Reformular Dashboard com propósito (meta, simulação, progresso) | #77 | - |
| F024 | Frontend - Acessibilidade: foco visível (:focus-visible) | #79 | - |
| F025 | Frontend - Acessibilidade: touch targets mínimos de 36px | #82 | - |
| F026 | Frontend - Responsividade: breakpoints mobile | #81 | - |
| F027 | Frontend - Acessibilidade e tema: ARIA labels, variáveis CSS | #80 | - |
| F033 | Frontend - Validação de sessão na montagem (auth/me) | #92 | ADR-0030 |
| F034 | Frontend - Remoção de mock data APPLIANCE_FALLBACK | #96 | ADR-0030 |
| F035 | Frontend - Alinhar categorias de aparelhos para inglês (ADR-0027) | #93 | ADR-0027 |
| F036 | Frontend - Consumir endpoint /energy-analysis/categories | #95 | ADR-0027 |
| F037 | Frontend - Adicionar campo status nas análises | #94 | ADR-0027 |
| F038 | Frontend - Corrigir crash no Histórico com valores nulos (null safety) | #97 | - |
| F039 | Frontend - Corrigir crash no Histórico com status desconhecido | #98 | - |
| F040 | Frontend - Corrigir null safety no Dashboard e ProfilePage | #99 | - |
| F041 | Frontend - Corrigir interpretTrend no Dashboard (NaN% com PENDENTE/FALHA) | #100 | - |
| F042 | Frontend - Code splitting com React.lazy() (bundle 1.15MB -> 242kB) | #101 | - |
| F043 | Frontend - ChunkErrorBoundary para falhas de carregamento lazy | #102 | - |
| F044 | Frontend - Testes E2E com Playwright (67 testes) | #103 | ADR-0031 |
| F045 | Frontend - Corrigir 400 ao analisar com mais de 2 casas decimais | #104 | - |
| F046 | Frontend - Adicionar campos peakHourUsage e highConsumptionHours no ProfilePage | #106 | ADR-0046 |
| F047 | Frontend - Adicionar Apartamento como tipo de imóvel | #109 | ADR-0035 |
| F048 | Frontend - Exibir highest_consumption_products no resultado da análise | #110 | - |
| F049 | Frontend - Remover localStorage, preferências via backend | #111 | ADR-0033 |
| F050 | Frontend - Ícones específicos por aparelho + contraste tema escuro | #112 | - |
| F055 | Frontend - Gráficos Dashboard com granularidade temporal | #118 | ADR-0039 |
| F056 | Frontend - Relatório completo no Histórico com gráfico por equipamento | #119 | ADR-0040 |
| F057 | Frontend - Excluir análise no Histórico com confirmação | #120 | ADR-0041 |
| F058 | Frontend/Backend - Alinhamento FE/BE (remover AnalysisForm, Dashboard usar /simulate) | #122 | ADR-0042 |
| F059 | Frontend - Seletor de múltiplos imóveis no ProfilePage | - | ADR-0043 |
| F060 | Frontend - Atualizar dependências vulneráveis (js-yaml, esbuild, npm audit) | - | ADR-0043 |
| F061 | Frontend - Seletor de imóveis no Dashboard | #123 | ADR-0043 |
| F062 | Frontend - Consumir GET /contract-info e GET /appliances do backend | #132 | ADR-0047 |
| F063 | Frontend - Remover PROPERTY_TYPES, CATEGORIES, CATEGORY_ORDER hardcoded | #133 | ADR-0047 |
| F064 | Frontend - Substituir APPLIANCE_FALLBACK pelo catálogo do backend | #134 | ADR-0047 |
| F065 | Frontend - Ajustar UI: nomes em português com mlCategory em inglês | #135 | ADR-0047 |
| F066 | Frontend - Catálogo de ícones por palavra-chave + remover METADATA_BY_NAME | #138 | - |
| F067 | Frontend - CATEGORIES e CATEGORY_ORDER dinâmicos no ProfilePage | #139 | - |
| F068 | Frontend - Ajustes CSS: Recharts cursor tema escuro + contraste de ícones | #137 | - |
| F070 | Frontend - Consumir id real do GET /appliances (B052) e validar salvar de aparelhos | #151 | ADR-0047, ADR-0048 |
| F069 | Frontend - Persistir peak_hour_usage no perfil do usuário | #143 | ADR-0046 |
| F071 | Frontend - Atualizar para Node 24 e dependências @latest (TS 6.0.3 pinado, engines Node 24) | - | - |
| F072 | Frontend - Otimizar LucideIcon (registry estático 529kB -> 22kB) + dead code (knip, F030) | - | - |
| I022 | Infraestrutura/Base - CI: rodar linters frontend/docs/infra em push direto para dev | - | - |
