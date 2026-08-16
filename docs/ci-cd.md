# CI/CD - Integração e Deploy Contínuos

Documentação dos pipelines de CI/CD configurados no GitHub Actions.

## Índice

- [Visão Geral](#visão-geral)
- [Workflows de Teste](#workflows-de-teste)
- [Workflows de Lint](#workflows-de-lint)
- [Workflows de Deploy](#workflows-de-deploy)
- [Workflows de Validação](#workflows-de-validação)

---

## Visão Geral

O projeto possui 12 workflows de CI/CD no diretório `.github/workflows/`. Os pipelines de teste e lint são acionados em pull requests (por caminhos alterados) e em pushes para `dev`; os deploys são acionados por push para `dev`; `revert-direct-push` protege `main` e `homolog`.

## Workflows de Teste

### `test-backend.yml`

| Configuração | Valor |
|---|---|
| Gatilho | PR para `dev` (paths: backend/**) |
| Jobs | `test` (ubuntu-latest) |
| Passos | Checkout → Setup Java 21 (Temurin) → `cd backend && mvn -B test` (exclui os testes de integração Oracle via `-Dtest`) |
| Cobertura | Testes JUnit 5 (unitários e integração com MockMvc) |

### `test-frontend.yml`

| Configuração | Valor |
|---|---|
| Gatilho | PR para `dev` (paths: frontend/**) |
| Jobs | `test` (ubuntu-latest) |
| Passos | Checkout → Setup Node 24 → `npm ci` → `npm run test` |
| Cobertura | Testes Vitest + Testing Library |

### `test-ml-service.yml`

| Configuração | Valor |
|---|---|
| Gatilho | PR para `dev` (paths: ml-service/**) |
| Jobs | `test` (ubuntu-latest) |
| Passos | Checkout → Setup Python 3.12 → `pip install -r ml-service/requirements.txt` → `cd ml-service && pytest tests/ -v` (tolera ausência de testes) |
| Cobertura | Validação de instalação/importação do ML Service (a suíte de qualidade fica no `ml-qa`) |

## Workflows de Lint

### `lint-backend.yml`

| Configuração | Valor |
|---|---|
| Gatilho | PR para `dev`, push para `dev` (paths: backend/**) |
| Jobs | `static-analysis` (ubuntu-latest) |
| Ferramentas | `mvn -B validate process-classes` + `mvn -B spotless:check` |
| Observação | O Spotless verifica formatação Palantir Java Format |

### `lint-frontend.yml`

| Configuração | Valor |
|---|---|
| Gatilho | PR para `dev` (paths: frontend/**) |
| Jobs | `lint` (ubuntu-latest) |
| Passos | Setup Node 24 → `npm ci` → `npm run lint` + `npm run typecheck` + `npm run format:check` |
| Abrange | ESLint + TypeScript (`tsc`) + Prettier |

### `lint-ml-service.yml`

| Configuração | Valor |
|---|---|
| Gatilho | PR para `dev` (paths: ml-service/**) |
| Jobs | `ruff-mypy` (ubuntu-latest) |
| Passos | Setup Python 3.12 → `pip install ruff mypy` → `cd ml-service && ruff check . && ruff format --check .` → `cd ml-service && mypy .` |
| Abrange | Ruff (E, F, I, UP, B) + formatação + MyPy (tipagem estrita) |

### `lint-docs.yml`

| Configuração | Valor |
|---|---|
| Gatilho | PR para `dev`, push para `dev` (paths: **/*.md) |
| Jobs | `docs` (ubuntu-latest) |
| Ferramentas | Markdownlint (`markdownlint-cli2`), CSpell (`@cspell/dict-pt-br`) e `check-forbidden-chars` |
| Abrange | Todos os arquivos `.md` versionados |
| Regras | line_length: 334, HTML permitido, sem em dash/aspas curvas, ortografia com dicionário pt-BR |

### `lint-infra.yml`

| Configuração | Valor |
|---|---|
| Gatilho | PR para `dev`, push para `dev` (paths: Dockerfiles e *.yml/*.yaml) |
| Jobs | `hadolint` + `yamllint` (ubuntu-latest) |
| Ferramentas | Hadolint (backend/Dockerfile, frontend/Dockerfile), YAMLlint |
| Abrange | Dockerfiles, docker-compose.yml, workflows |

## Workflows de Deploy

### `deploy-backend-dev.yml`

| Configuração | Valor |
|---|---|
| Gatilho | Push para `dev` (paths: backend/**) |
| Jobs | `build-and-push` |
| Destino | Docker Hub (imagem `energiai-backend:dev`) + deploy hook do Render (homologação) |
| Passos | Checkout → Login Docker Hub → Build/Push da imagem Docker → disparo do Deploy Hook no Render |

### `deploy-ml-dev.yml`

| Configuração | Valor |
|---|---|
| Gatilho | Push para `dev` (paths: ml-service/**) |
| Jobs | `build-and-push` |
| Destino | Docker Hub (imagem `energiai-ml-service:dev`) + deploy hook do Render (homologação) |
| Passos | Checkout → Login Docker Hub → Build/Push da imagem Docker → disparo do Deploy Hook no Render |

## Workflows de Validação

### `validate-pr-source.yml`

| Configuração | Valor |
|---|---|
| Gatilho | PR aberto/sincronizado para `homolog` e `main` |
| Função | Garante o fluxo de promoção dev → homolog → main |
| Regras | PR para `homolog` deve vir apenas de `dev`; PR para `main` deve vir apenas de `homolog` |

### `revert-direct-push.yml`

| Configuração | Valor |
|---|---|
| Gatilho | Push direto para `main` e `homolog` |
| Função | Proteção contra pushes diretos nas branches protegidas |
| Ação | Reverte automaticamente o commit |

---

> **Nota:** Consulte os workflows individuais em `.github/workflows/` para detalhes técnicos de cada pipeline.
