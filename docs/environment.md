# Variáveis de Ambiente

Referência completa de todas as variáveis de ambiente utilizadas pelos três serviços do projeto.

## Índice

- [Convenções](#convenções)
- [API URLs e Portas](#api-urls-e-portas)
- [Backend - Banco de Dados (Oracle ATP)](#backend--banco-de-dados-oracle-atp)
- [Backend - Segurança e JWT](#backend--segurança-e-jwt)
- [Backend - ML Service Integration (ACL)](#backend--ml-service-integration-acl)
- [Backend - Schema Discovery](#backend--schema-discovery)
- [Backend - CORS](#backend--cors)
- [ML Service - Modelo e Treinamento](#ml-service--modelo-e-treinamento)
- [ML Service - Groq LLM](#ml-service--groq-llm)
- [ML Service - Treinamento](#ml-service--treinamento)
- [Frontend - Vite](#frontend--vite)
- [Configurações de Negócio](#configurações-de-negócio)

---

## Convenções

- O arquivo `.env` na raiz do projeto é carregado pelo Docker Compose
- O ML Service também lê as variáveis `GROQ_*` do seu próprio `.env` em `ml-service/`
- O frontend usa prefixo `VITE_` para expor variáveis ao navegador

## API URLs e Portas

| Variável | Padrão | Serviço | Descrição |
|---|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | Frontend | URL base do backend para requisições AJAX |
| `ML_SERVICE_URL` | `http://ml-service:8000` | Backend | URL base do ML Service para predição |
| `SERVER_PORT` | `8080` | Backend | Porta interna do servidor Spring Boot |
| `ML_SERVICE_PORT` | `8000` | ML Service | Porta interna do servidor FastAPI |
| `FRONTEND_PORT` | `5173` | Frontend | Porta do servidor de produção (serve) |

## Backend - Banco de Dados (Oracle ATP)

| Variável | Padrão | Descrição |
|---|---|---|
| `SPRING_DATASOURCE_URL` | - | JDBC URL para Oracle ATP (formato longo com `(description=...)`) |
| `SPRING_DATASOURCE_DRIVER_CLASS_NAME` | `oracle.jdbc.OracleDriver` | Driver JDBC |
| `SPRING_DATASOURCE_USERNAME` | `ADMIN` | Usuário do banco |
| `SPRING_DATASOURCE_PASSWORD` | - | Senha do banco |
| `SPRING_JPA_DATABASE_PLATFORM` | `org.hibernate.dialect.OracleDialect` | Dialeto Hibernate para Oracle |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | `validate` | Estratégia de DDL (validate para produção) |
| `SPRING_JPA_SHOW_SQL` | `false` | Exibe SQL no log |
| `SPRING_FLYWAY_ENABLED` | `true` | Habilita Flyway migrations |
| `SPRING_FLYWAY_LOCATIONS` | `classpath:db/migration/oracle` | Diretório dos scripts SQL de migração |
| `SPRING_FLYWAY_DEFAULT_SCHEMA` | `ADMIN` | Schema Oracle alvo |
| `SPRING_FLYWAY_BASELINE_ON_MIGRATE` | `true` | Baseline automático em banco existente |
| `SPRING_FLYWAY_BASELINE_VERSION` | `0` | Versão de baseline |
| `SPRING_FLYWAY_URL` | `${SPRING_DATASOURCE_URL}` | URL específica para Flyway |
| `SPRING_FLYWAY_USER` | `${SPRING_DATASOURCE_USERNAME}` | Usuário Flyway |
| `SPRING_FLYWAY_PASSWORD` | `${SPRING_DATASOURCE_PASSWORD}` | Senha Flyway |
| `ORACLE_WALLET_LOCATION` | - | Caminho para o wallet Oracle (conexão segura) |

## Backend - Segurança e JWT

| Variável | Padrão | Descrição |
|---|---|---|
| `JWT_SECRET` | - | Chave secreta HMAC-SHA384 para assinar tokens (mín. 32 caracteres) |
| `JWT_EXPIRATION_MS` | `604800000` (7 dias) | Tempo de expiração do token em milissegundos |
| `SESSION_MAX_AGE_SECONDS` | `604800` (7 dias) | Max-Age do cookie de sessão |
| `SESSION_SECURE` | `false` | Cookie Secure flag (true em produção com HTTPS) |

## Backend - ML Service Integration (ACL)

Anti-Corruption Layer: mapeamento dos campos do envelope genérico do ML Service.

| Variável | Padrão | Descrição |
|---|---|---|
| `ML_OUTPUT_FIELD_CATEGORY` | `category` | Chave do campo de categoria no JSON de resposta |
| `ML_OUTPUT_FIELD_PROBABILITY` | `probability` | Chave do campo de probabilidade |
| `ML_OUTPUT_FIELD_RECOMMENDATIONS` | `recommendations` | Chave do campo de recomendações |
| `ML_OUTPUT_FIELD_SOURCE` | `source` | Chave do campo de origem (model/groq/rule-based) |

## Backend - Schema Discovery

| Variável | Padrão | Descrição |
|---|---|---|
| `ML_DEFAULT_CATEGORIES` | `EXCELENTE,BOM,MEDIANO,RUIM,CRITICO` | Fallback de categorias válidas quando ML Service indisponível |

## Backend - CORS

| Variável | Padrão | Descrição |
|---|---|---|
| `CORS_ALLOWED_ORIGINS` | `*` | Origens permitidas (ex: `http://localhost:5173` em produção) |

## ML Service - Modelo e Treinamento

| Variável | Padrão | Descrição |
|---|---|---|
| `MODEL_PATH` | `categorization-model.joblib` | Caminho para o modelo serializado |
| `TRAINING_LOG_PATH` | `treino_feedback.jsonl` | Arquivo de log para feedback loop |

## ML Service - Groq LLM

| Variável | Padrão | Descrição |
|---|---|---|
| `GROQ_API_KEY` | - | Chave de API do Groq (opcional; sem ela, fallback rule-based apenas) |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Modelo LLM a ser utilizado |
| `GROQ_MAX_RPM` | `25` | Limite de requisições por minuto (margem de segurança do free tier: 30 RPM) |
| `GROQ_MAX_RPD` | `900` | Limite de requisições por dia (margem de segurança do free tier: 1000 RPD) |

## ML Service - Treinamento

| Variável | Padrão | Descrição |
|---|---|---|
| `RANDOM_SEED` | `42` | Seed para reprodutibilidade |
| `N_SYNTHETIC` | `4000` | Número de amostras sintéticas geradas |
| `FEEDBACK_WEIGHT` | `5` | Peso dos dados de feedback no retreinamento |

## Frontend - Vite

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | URL base da API backend |

## Configurações de Negócio

| Variável | Padrão | Descrição |
|---|---|---|
| `KWH_TARIFF` | `0.75` | Tarifa de referência em R$/kWh para estimativa de custo |
| `CO2_EMISSION_FACTOR` | `0.096` | Fator de emissão de CO₂ em kg/kWh (base SIN) |

---

> **Nota:** Consulte [guia de execução](./guia-execucao.md) para instruções de configuração do ambiente.
