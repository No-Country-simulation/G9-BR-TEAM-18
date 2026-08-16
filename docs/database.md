# Banco de Dados - Esquema e Migrações

Documentação das tabelas, relacionamentos e migrations do banco Oracle ATP.

## Índice

- [Visão Geral](#visão-geral)
- [Diagrama de Entidades](#diagrama-de-entidades)
- [Tabelas](#tabelas)
- [Migrações (Flyway)](#migrações-flyway)
- [Índices e Constraints](#índices-e-constraints)

---

## Visão Geral

O banco de dados Oracle ATP armazena usuários, imóveis, aparelhos, análises energéticas, snapshots de
equipamentos, recomendações e tokens invalidados. As migrations são gerenciadas pelo Flyway e estão em
`backend/src/main/resources/db/migration/oracle/`. Em desenvolvimento local o mesmo Oracle é usado via
variáveis de ambiente (`SPRING_DATASOURCE_URL`); não há mais banco H2 em memória.

## Diagrama de Entidades

```mermaid
erDiagram
    TB_USER ||--o{ TB_PROPERTY : possui
    TB_PROPERTY ||--o{ TB_PROPERTY_APPLIANCE : contem
    TB_APPLIANCE ||--o{ TB_PROPERTY_APPLIANCE : categorizado
    TB_PROPERTY ||--o{ TB_ENERGY_ANALYSIS : analisado
    TB_ENERGY_ANALYSIS ||--o{ TB_ANALYSIS_RECOMMENDATION : possui
    TB_ENERGY_ANALYSIS ||--o{ TB_ANALYSIS_APPLIANCE_SNAPSHOT : possui
```

## Tabelas

### TB_USER

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| id | NUMBER | PK, gerado por sequence | Identificador único |
| name | VARCHAR2(100) | NOT NULL | Nome do usuário |
| email | VARCHAR2(255) | NOT NULL, UNIQUE | E-mail de login |
| password | VARCHAR2(255) | NOT NULL | Hash BCrypt (ou SHA-256 legado) |
| password_reset_required | NUMBER(1,0) | DEFAULT 0 | Flag para forçar redefinição de senha pelo admin |
| consumption_goal | NUMBER(10,2) | NULLABLE | Meta de consumo (kWh/mês) da preferência do usuário (V11) |
| regularity | VARCHAR2(20) | NULLABLE | Regularidade da análise: instantanea, diaria, semanal, mensal (V11) |
| peak_hour_usage | NUMBER(1,0) | NULLABLE | Uso em horário de pico informado nas preferências (V15) |
| high_consumption_hours | NUMBER(10,2) | NULLABLE | Horas de alto consumo informadas nas preferências (V15) |
| auth_provider | VARCHAR2(50) | DEFAULT 'LOCAL', NOT NULL | Origem da conta: LOCAL ou GOOGLE (SSO, V16) |
| created_at | TIMESTAMP | NOT NULL | Data de criação |
| updated_at | TIMESTAMP | NOT NULL | Data de atualização |

### TB_PROPERTY

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| id | NUMBER | PK | Identificador único |
| user_id | NUMBER | FK → TB_USER.id | Proprietário do imóvel |
| alias | VARCHAR2(100) | NOT NULL | Nome do imóvel (ex: "Minha Casa") |
| property_type | VARCHAR2(50) | NOT NULL, CHECK | RESIDENCIAL, APARTAMENTO, COMERCIAL (V13/ADR-0035) |
| active | NUMBER(1,0) | DEFAULT 1 | Se o imóvel está ativo |
| address | VARCHAR2(255) | NULLABLE | Endereço do imóvel |
| resident_count | NUMBER | NULLABLE | Número de moradores |
| area_sqm | NUMBER | NULLABLE | Área em metros quadrados |
| created_at | TIMESTAMP | NOT NULL | Data de criação |
| updated_at | TIMESTAMP | NOT NULL | Data de atualização |

### TB_APPLIANCE

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| id | NUMBER | PK | Identificador único |
| name | VARCHAR2(100) | NOT NULL | Nome do aparelho |
| appliance_category | VARCHAR2(50) | NOT NULL, CHECK | Categoria (REFRIGERATION, CLIMATE_CONTROL, LIGHTING, APPLIANCES, TECHNOLOGY, SERVICES) |
| average_power_watts | NUMBER | NOT NULL | Potência média em watts |
| average_daily_use_hours | NUMBER | NOT NULL | Horas médias de uso diário |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

O catálogo é sincronizado do ML Service pelo backend (ADR-0048/0055): os registros são atualizados com
os valores de `ml_category`, `watts` e `hours` do `/appliance-catalog`.

### TB_PROPERTY_APPLIANCE

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| id | NUMBER | PK | Identificador único |
| property_id | NUMBER | FK → TB_PROPERTY.id | Imóvel |
| appliance_id | NUMBER | FK → TB_APPLIANCE.id | Aparelho |
| quantity | NUMBER(10,0) | NOT NULL | Quantidade do aparelho no imóvel |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

### TB_ENERGY_ANALYSIS

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| id | NUMBER | PK | Identificador único |
| property_id | NUMBER | FK → TB_PROPERTY.id | Imóvel analisado (o usuário é resolvido via imóvel) |
| consumption_kwh | NUMBER(10,2) | NOT NULL | Consumo informado |
| peak_hour_usage | NUMBER(1,0) | NOT NULL | Uso em horário de pico |
| high_consumption_hours | NUMBER(4,2) | NOT NULL | Horas de alto consumo |
| estimated_monthly_cost | NUMBER(10,2) | NULLABLE | Custo estimado (kWh × tarifa) |
| property_type | VARCHAR2(50) | NULLABLE | Tipo de imóvel capturado no momento da análise (V10) |
| category | VARCHAR2(50) | NULLABLE | Categoria energética |
| probability | NUMBER(5,2) | NULLABLE | Probabilidade da classificação |
| status | VARCHAR2(20) | NOT NULL, CHECK | PENDENTE, CONCLUIDA, FALHA (V14/ADR-0036/0038); simulações usam SIMULADO sem persistir |
| source | VARCHAR2(100) | NULLABLE | Origem: model, model+groq, rule-based (com sufixos descritivos) |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

### TB_ANALYSIS_RECOMMENDATION

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| id | NUMBER | PK | Identificador único |
| analysis_id | NUMBER | FK → TB_ENERGY_ANALYSIS.id (ON DELETE CASCADE) | Análise |
| descricao | VARCHAR2(1000) | NOT NULL | Texto da recomendação |

### TB_ANALYSIS_APPLIANCE_SNAPSHOT

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| id | NUMBER | PK | Identificador único |
| analysis_id | NUMBER | FK → TB_ENERGY_ANALYSIS.id (ON DELETE CASCADE) | Análise |
| appliance_name | VARCHAR2(100) | NOT NULL | Nome do equipamento no momento da análise |
| appliance_category | VARCHAR2(100) | NULLABLE | Categoria do equipamento |
| quantity | NUMBER | NOT NULL, CHECK (> 0) | Quantidade |
| average_power_watts | NUMBER(10,2) | NOT NULL | Potência média |
| average_daily_use_hours | NUMBER(4,2) | NULLABLE | Horas de uso por dia |
| monthly_consumption_kwh | NUMBER(10,2) | NULLABLE | Consumo mensal estimado |

### TB_TOKEN_BLACKLIST

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| token_hash | VARCHAR2(500) | PK | Hash do token JWT invalidado |
| expires_at | TIMESTAMP | NOT NULL | Data de expiração (para limpeza programada) |

## Migrações (Flyway)

As migrações estão em `backend/src/main/resources/db/migration/oracle/`:

| Arquivo | Descrição |
|---|---|
| `V1__initial_schema.sql` | Criação das tabelas: TB_USER, TB_PROPERTY, TB_APPLIANCE, TB_PROPERTY_APPLIANCE, TB_ENERGY_ANALYSIS, TB_ANALYSIS_RECOMMENDATION, TB_TOKEN_BLACKLIST |
| `V2__insert_appliances.sql` | Popula TB_APPLIANCE com dados residenciais (geladeira, ar-condicionado, chuveiro, etc.) |
| `V3__add_residential_appliances.sql` | Aparelhos adicionais (Air Fryer, Computador, Videogame, etc.) |
| `V4__add_token_blacklist.sql` | Cria TB_TOKEN_BLACKLIST para suporte a logout |
| `V5__force_password_reset.sql` | Adiciona coluna `password_reset_required` em TB_USER |
| `V6__normalize_property_type.sql` | Normaliza os valores de `property_type` na TB_PROPERTY |
| `V7__add_source_to_energy_analysis.sql` | Adiciona coluna `source` em TB_ENERGY_ANALYSIS |
| `V8__add_property_fields.sql` | Adiciona colunas `address`, `resident_count`, `area_sqm` em TB_PROPERTY |
| `V9__clean_unused_appliances.sql` | Remove aparelhos sem cobertura no dataset PPH |
| `V10__add_analysis_history_snapshot.sql` | Adiciona `property_type` em TB_ENERGY_ANALYSIS e cria TB_ANALYSIS_APPLIANCE_SNAPSHOT |
| `V11__add_user_preferences.sql` | Adiciona `consumption_goal` e `regularity` em TB_USER |
| `V12__add_service_appliances.sql` | Adiciona aparelhos da categoria Serviços (bomba d'água, portão elétrico, motor de piscina) |
| `V13__add_apartamento_property_type.sql` | Inclui 'APARTAMENTO' no CHECK de `property_type` |
| `V14__align_analysis_status.sql` | Alinha o CHECK de `status` (PENDENTE, CONCLUIDA, FALHA) |
| `V15__add_peak_hour_and_high_consumption_to_users.sql` | Adiciona `peak_hour_usage` e `high_consumption_hours` em TB_USER |
| `V16__add_auth_provider_for_sso.sql` | Adiciona `auth_provider` em TB_USER (default 'LOCAL') para o SSO Google |

## Índices e Constraints

Cada migration adiciona índices apropriados:

- PK em todas as tabelas via sequence/identity Oracle
- FK em TB_PROPERTY (user_id → TB_USER.id), TB_PROPERTY_APPLIANCE (property_id, appliance_id), TB_ENERGY_ANALYSIS (property_id), TB_ANALYSIS_RECOMMENDATION e TB_ANALYSIS_APPLIANCE_SNAPSHOT (analysis_id, ON DELETE CASCADE)
- UNIQUE em TB_USER.email
- CHECK em TB_PROPERTY.property_type (RESIDENCIAL, APARTAMENTO, COMERCIAL), TB_APPLIANCE.appliance_category, TB_ENERGY_ANALYSIS.status

> **Nota:** Consulte o [guia de execução](./guia-execucao.md) para instruções de configuração do banco e o
> [ADR-0009](../docs/adr/0009-banco-oracle-e-precisao.md) sobre a decisão de usar Oracle ATP.
