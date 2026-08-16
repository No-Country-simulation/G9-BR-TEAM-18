# Variáveis de Ambiente

Referência completa de todas as variáveis de ambiente utilizadas pelos três serviços do projeto.

## Índice

- [Convenções](#convenções)
- [API URLs e Portas](#api-urls-e-portas)
- [Backend - Banco de Dados (Oracle ATP)](#backend---banco-de-dados-oracle-atp)
- [Backend - Segurança e JWT](#backend---segurança-e-jwt)
- [Backend - ML Service Integration (ACL)](#backend---ml-service-integration-acl)
- [Backend - Schema Discovery](#backend---schema-discovery)
- [Backend - CORS](#backend---cors)
- [ML Service - Modelo e Treinamento](#ml-service---modelo-e-treinamento)
- [ML Service - Groq LLM](#ml-service---groq-llm)
- [ML Service - Treinamento](#ml-service---treinamento)
- [Frontend - Vite](#frontend---vite)
- [Onde configurar cada variável (deploy)](#onde-configurar-cada-variável-deploy)
- [Obrigatórias (backend não inicia sem elas)](#obrigatórias-backend-não-inicia-sem-elas)
- [GitHub Actions (segredos de CI/CD)](#github-actions-segredos-de-cicd)
- [Configurações de Negócio](#configurações-de-negócio)

---

## Onde configurar cada variável (deploy)

| Camada | Variáveis |
|---|---|
| Backend (serviço no Render / Docker) | Todas as `SPRING_*`, `SPRING_FLYWAY_*`, `JWT_*`, `SESSION_*`, `CORS_ALLOWED_ORIGINS`, `GOOGLE_CLIENT_ID`, `OPENAPI_SERVER_URL`, `SERVER_PORT`, `ML_SERVICE_URL`, `ML_OUTPUT_FIELD_*`, `ML_DEFAULT_CATEGORIES`, `KWH_TARIFF`, `CO2_EMISSION_FACTOR` |
| ML Service (serviço no Render / Docker) | `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_MAX_RPM`, `GROQ_MAX_RPD`, `MODEL_PATH`, `TRAINING_LOG_PATH`, `RANDOM_SEED`, `N_SYNTHETIC`, `FEEDBACK_WEIGHT` |
| Frontend (build args no Render / Docker Compose) | `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`. São argumentos de build: ficam gravadas no pacote estático em build time, não em runtime |
| Docker Compose local | Lê o `.env` da raiz (`env_file`) e injeta nos 3 serviços |
| GitHub Actions (segredos do repositório) | `DOCKER_USERNAME`, `DOCKER_PASSWORD`, `RENDER_DEPLOY_HOOK_URL`, `RENDER_ML_DEPLOY_HOOK_URL` |

## Obrigatórias (backend não inicia sem elas)

Em deploy "flat" (variáveis diretas no serviço, sem Compose), o Spring Boot falha no startup se qualquer placeholder abaixo estiver ausente. As que têm default somente no `docker-compose.yml` estão indicadas na coluna "Padrão".

| Variável | Padrão (só Compose) | Descrição |
|---|---|---|
| `SERVER_PORT` | `8080` | Porta interna do Spring Boot |
| `OPENAPI_SERVER_URL` | - | URL pública do backend (fail-fast de segurança) |
| `SPRING_DATASOURCE_URL` | - | JDBC URL do Oracle ATP |
| `SPRING_DATASOURCE_USERNAME` | - | Usuário do banco (ex.: `ADMIN`) |
| `SPRING_DATASOURCE_PASSWORD` | - | Senha do banco |
| `SPRING_DATASOURCE_DRIVER_CLASS_NAME` | - | `oracle.jdbc.OracleDriver` |
| `SPRING_JPA_DATABASE_PLATFORM` | - | `org.hibernate.dialect.OracleDialect` |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | - | `validate` |
| `SPRING_JPA_SHOW_SQL` | - | `false` (placeholder sem default no properties) |
| `SPRING_FLYWAY_ENABLED` | - | `true` |
| `SPRING_FLYWAY_LOCATIONS` | - | `classpath:db/migration/oracle` |
| `SPRING_FLYWAY_DEFAULT_SCHEMA` | - | `ADMIN` |
| `SPRING_FLYWAY_URL`, `SPRING_FLYWAY_USER`, `SPRING_FLYWAY_PASSWORD` | - | Mesmos valores do datasource (no Render, sem `${VAR}` aninhado) |
| `JWT_SECRET` | - | Chave HMAC de assinatura (mín. 32 caracteres) |
| `JWT_EXPIRATION_MS` | - | Ex.: `604800000` (7 dias) |
| `SESSION_SECURE` | - | `true` em produção (HTTPS) |
| `SESSION_MAX_AGE_SECONDS` | - | Ex.: `604800` |
| `CORS_ALLOWED_ORIGINS` | - | Origem do frontend (produção: `https://energiaia.duckdns.org`) |
| `GOOGLE_CLIENT_ID` | - | Client ID OAuth do Google (validar ID Token) |
| `ML_SERVICE_URL` | `http://ml-service:8000` | URL base do ML Service |
| `ML_OUTPUT_FIELD_CATEGORY`, `ML_OUTPUT_FIELD_PROBABILITY`, `ML_OUTPUT_FIELD_RECOMMENDATIONS`, `ML_OUTPUT_FIELD_SOURCE` | - | Campos do envelope de resposta do ML |
| `ML_DEFAULT_CATEGORIES` | - | `EXCELENTE,BOM,MEDIANO,RUIM,CRITICO` |
| `CO2_EMISSION_FACTOR` | `0.096` | Fator de emissão em kg/kWh |

Com default no próprio código (não quebram o startup): `KWH_TARIFF` (0.75), `SPRING_FLYWAY_BASELINE_ON_MIGRATE` (false) e `SPRING_FLYWAY_BASELINE_VERSION` (0).

## GitHub Actions (segredos de CI/CD)

Não são usadas em runtime, mas são necessárias para os workflows `deploy-backend-dev.yml` e `deploy-ml-dev.yml` publicarem as imagens e dispararem o redeploy no Render:

| Segredo | Uso |
|---|---|
| `DOCKER_USERNAME` | Usuário do Docker Hub (login e tag das imagens) |
| `DOCKER_PASSWORD` | Token de acesso do Docker Hub |
| `RENDER_DEPLOY_HOOK_URL` | Deploy hook do serviço backend no Render |
| `RENDER_ML_DEPLOY_HOOK_URL` | Deploy hook do serviço ML no Render |

## ml-qa e E2E (não entram no deploy)

A suíte `ml-qa` não lê variáveis de ambiente: é configurada por argumentos de linha de comando (`--base-url`, `--scenarios`, `--report-dir`, `--report`, `--max-rpm`). Nos testes E2E do frontend, `BASE_URL` e `CI` são usadas apenas pelo Playwright nos pipelines, não pela aplicação.

---

## Convenções

- O arquivo `.env` na raiz do projeto é carregado pelo Docker Compose
- O ML Service também lê as variáveis `GROQ_*` do seu próprio `.env` em `ml-service/`
- O frontend usa prefixo `VITE_` para expor variáveis ao navegador

## API URLs e Portas

| Variável | Padrão | Serviço | Descrição |
|---|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | Frontend | URL base do backend para requisições AJAX |
| `OPENAPI_SERVER_URL` | - (obrigatória) | Backend | URL base dos servidores expostos no OpenAPI/Swagger. **Sem valor definido o backend não inicia (fail-fast)**. Em produção use a URL pública da API (ex.: `https://apienergiaia.duckdns.org`) para que o Swagger UI e os testes contra o contrato usem o host correto |
| `ML_SERVICE_URL` | `http://ml-service:8000` | Backend | URL base do ML Service para predição |
| `SERVER_PORT` | `8080` | Backend | Porta interna do servidor Spring Boot |
| `ML_SERVICE_PORT` | `8000` | ML Service | Porta interna do servidor FastAPI |
| `FRONTEND_PORT` | `5173` | Frontend | Porta do servidor de produção (serve) |

**Produção (Oracle Cloud):** frontend em `https://energiaia.duckdns.org`, API em
`https://apienergiaia.duckdns.org` (Swagger UI em `/swagger-ui.html`, contrato em
`/api-docs`). Ver [deploy OCI](./deploy-oci.md) e
[ADR-0058](./adr/0058-frontend-hospedado-nginx-vm.md).

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
| `SPRING_FLYWAY_BASELINE_ON_MIGRATE` | `false` | Baseline automático em banco existente (o `.env.example` sugere `true` para o primeiro deploy) |
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

## Backend - Google SSO (OAuth)

| Variável | Padrão | Descrição |
|---|---|---|
| `GOOGLE_CLIENT_ID` | - | Client ID OAuth2 usado para validar o ID Token do login com Google (ADR-0052). Deve ser o mesmo valor do `VITE_GOOGLE_CLIENT_ID` do frontend |

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
| `N_SYNTHETIC` | `2000` | Número de amostras sintéticas geradas (padrão do código; o `.env.example` sugere `4000`) |
| `FEEDBACK_WEIGHT` | `5` | Peso dos dados de feedback no retreinamento |

## Frontend - Vite

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | URL base da API backend |
| `VITE_GOOGLE_CLIENT_ID` | - | Client ID OAuth2 do Google Identity Services (botão "Entrar com Google"). Mesmo valor do `GOOGLE_CLIENT_ID` do backend |

## Configurações de Negócio

| Variável | Padrão | Descrição |
|---|---|---|
| `KWH_TARIFF` | `0.75` | Tarifa de referência em R$/kWh para estimativa de custo |
| `CO2_EMISSION_FACTOR` | `0.096` | Fator de emissão de CO₂ em kg/kWh (base SIN) |

---

> **Nota:** Consulte [guia de execução](./guia-execucao.md) para instruções de configuração do ambiente.
