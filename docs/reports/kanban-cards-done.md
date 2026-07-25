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
| I011 | Infraestrutura/Base - ADR-0018 (normalizacao tipos imovel) | #62 | ADR-0018 |
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
| F028 | Frontend (Telas/Componentes) - Alinhar catalogo de aparelhos com cobertura ML (PPH) | #83 | ADR-0024 |
| F029 | Frontend (Telas/Componentes) - Corrigir property_type e highestConsumptionCategory | #84 | ADR-0024 |
| B033 | Backend (Endpoints/Services) - V9 migration: remover aparelhos sem cobertura PPH | - | ADR-0024 |
| F030 | Frontend (Telas/Componentes) - Remover dead code (updateApplianceQuantity, demo.test.ts) | - | - |
| F031 | Frontend (Telas/Componentes) - Adicionar testes: Login, Register, Navbar (19 testes) | - | - |
| B034 | Backend (Endpoints/Services) - Adicionar testes: PropertyServiceExtended (13), AnalysisMapperExtended (13) | - | - |
| F032 | Frontend (Telas/Componentes) - Corrigir createProperty test e remover demo.test.ts | - | - |
| I018 | Infraestrutura/Base - Atualizar documentacao (kanban, ADR-0024, frontend.md, testing.md) | - | ADR-0024 |
