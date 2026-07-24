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

## Convenção de IDs dos cards

Cada card recebe um ID no formato:
```
{PREFIXO}{NNN} {Categoria} - {descrição curta da entrega}
```

### Prefixos e categorias

| Prefixo | Categoria | Quando usar |
|---|---|---|
| B | Backend (Endpoints/Services) | Novos endpoints, regras de negócio, serviços, integrações |
| F | Frontend (Telas/Componentes) | Telas, componentes de UI, páginas, integração com API |
| I | Infraestrutura/Base | Docker, CI/CD, dependências, configuração de ambiente, documentação técnica |
| M | Banco de Dados (Migration) | Migrations Flyway, schemas, seeds, scripts de banco |
| Q | Queries/Views | Notebooks, consultas, relatórios de dados, modelos de ML |

### Regras práticas
- A numeração é sequencial e contínua dentro de cada prefixo, seguindo a ordem cronológica das entregas (ex: M001, M002, M003).
- O prefixo e a categoria devem refletir o domínio principal da entrega, não detalhes secundários (ex: um endpoint novo no backend é `B`, mesmo que toque o banco).
- Se uma entrega tiver componentes em múltiplas categorias, escolha o prefixo do domínio dominante.
- A descrição é curta e começa com letra maiúscula (ex: "Expansão de 3 para 5 categorias de eficiência").

### Exemplos
| ID completo | Explicação |
|---|---|
| `M001 Banco de Dados (Migration) - Migration inicial` | Primeira migration do projeto (prefixo M, sequência 001) |
| `B003 Backend (Endpoints/Services) - Teste de unidade do backend` | Terceiro card de backend (prefixo B, sequência 003) |
| `I004 Infraestrutura/Base - Workflows CI/CD no GitHub Actions` | Quarta entrega de infraestrutura (prefixo I, sequência 004) |

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
| Done | 43 | | Backend (B) | 24 |
| In review | 0 | | Infraestrutura (I) | 10 |
| In progress | 0 | | Frontend (F) | 6 |
| Ready | 0 | | Banco de Dados (M) | 3 |
| Backlog | 0 | | Queries/Views (Q) | 2 |
| **Total** | **43** | | **Total** | **45** |

## Lista completa de cards

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
| B023 | Backend (Endpoints/Services) - Forced password reset with current password verification | - | ADR-0012 |
| I010 | Infraestrutura/Base - ADR-0012 (forced password reset) | - | ADR-0012 |

## Pontos verificados pela análise de diffs

1. **Merges do fluxo homolog-dev** - O commit 22e18f7 ("Merge branch 'homolog' into dev") tem mensagem genérica, mas seu diff revela apenas mudanças de Dockerfile e docker-compose, já capturadas pelo card I002. Os commits 48f82e8 e 189d05e possuem mensagens descritivas detalhadas.

2. **NOTEBOOK-UPDATES como branch de consulta** - Referência de Data Science. O conteúdo é reescrito no padrão de `dev` antes da integração. Os commits 759a169, 17fff74 e 866b583 são material de consulta, não entregas pendentes.

    Fluxo: `dev` (Render) > `homolog` (OCI) > `main` (produção).

3. **Classificação de escopo, tamanho e prioridade por estimativa** - Estes atributos foram atribuídos com base na análise de contexto, pois não há métrica objetiva no histórico para determiná-los com precisão.
