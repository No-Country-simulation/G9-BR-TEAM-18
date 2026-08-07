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

O projeto possui 14 workflows de CI/CD no diretório `.github/workflows/`. Todos os workflows são acionados em pull requests para a branch `dev` e, quando aplicável, em pushes para `main` e `dev`.

## Workflows de Teste

### `test-backend.yml`

| Configuração | Valor |
|---|---|
| Gatilho | PR para `dev` |
| Jobs | `test` (ubuntu-latest) |
| Passos | Checkout → Setup Java 21 (Temurin) → `./mvnw test -pl backend` |
| Cobertura | Testes JUnit 5 (unitários e integração) |

### `test-frontend.yml`

| Configuração | Valor |
|---|---|
| Gatilho | PR para `dev` |
| Jobs | `test` (ubuntu-latest) |
| Passos | Checkout → Setup Node 24 → `npm ci` → `npm test` |
| Cobertura | Testes Vitest + Testing Library |

### `test-ml-service.yml`

| Configuração | Valor |
|---|---|
| Gatilho | PR para `dev` |
| Jobs | `test` (ubuntu-latest) |
| Passos | Checkout → Setup Python 3.12 → `pip install -r ml-service/requirements.txt` → `python -m pytest` |
| Cobertura | Testes Python |

## Workflows de Lint

### `lint-backend.yml`

| Configuração | Valor |
|---|---|
| Gatilho | PR para `dev`, push para `dev` |
| Jobs | `lint` (ubuntu-latest) |
| Ferramentas | Spotless (`./mvnw spotless:check -pl backend`), Checkstyle (`./mvnw checkstyle:check -pl backend`) |
| Observação | O Spotless verifica formatação Palantir Java Format |

### `lint-frontend.yml`

| Configuração | Valor |
|---|---|
| Gatilho | PR para `dev` |
| Jobs | `lint` (ubuntu-latest) |
| Passos | Setup Node 24 → `npm ci` → `npx eslint src/` → `npx prettier --check .` |
| Abrange | ESLint (regras recomendadas + react-hooks + react-refresh) + Prettier |

### `lint-ml-service.yml`

| Configuração | Valor |
|---|---|
| Gatilho | PR para `dev` |
| Jobs | `lint` (ubuntu-latest) |
| Passos | Setup Python 3.12 → `pip install ruff mypy` → `ruff check ml-service/` → `mypy ml-service/` |
| Abrange | Ruff (E, F, I, UP, B) + MyPy (tipagem estrita) |

### `lint-docs.yml`

| Configuração | Valor |
|---|---|
| Gatilho | PR para `dev` |
| Jobs | `lint` (ubuntu-latest) |
| Ferramentas | Markdownlint |
| Abrange | Todos os arquivos `.md` |
| Regras | line_length: 334, HTML permitido, headings sem frontmatter title permitidos |

### `lint-infra.yml`

| Configuração | Valor |
|---|---|
| Gatilho | PR para `dev` |
| Jobs | `lint` (ubuntu-latest) |
| Ferramentas | Hadolint (Dockerfiles), YAMLlint (arquivos YML) |
| Abrange | Dockerfile, docker-compose.yml, workflows |

## Workflows de Deploy

### `deploy-backend-dev.yml`

| Configuração | Valor |
|---|---|
| Gatilho | Push para `dev` (após PR merge) |
| Jobs | `deploy` |
| Destino | Render (<https://energiai-api.onrender.com>) |
| Passos | Checkout → Build Maven → Deploy para Render via webhook |

### `deploy-ml-dev.yml`

| Configuração | Valor |
|---|---|
| Gatilho | Push para `dev` (após PR merge) |
| Jobs | `deploy` |
| Destino | Render (<https://energiai-ml.onrender.com>) |
| Passos | Checkout → Build Docker → Deploy para Render via webhook |

## Workflows de Validação

### `validate-pr-source.yml`

| Configuração | Valor |
|---|---|
| Gatilho | PR aberto/sincronizado para `dev` |
| Função | Valida se a branch de origem tem um nome válido |
| Regras | `feature/*`, `bugfix/*`, `hotfix/*`, `docs/*`, `refactor/*` |

### `revert-direct-push.yml`

| Configuração | Valor |
|---|---|
| Gatilho | Push direto para `main` |
| Função | Proteção contra pushes diretos para `main` |
| Ação | Reverte automaticamente o commit |

---

> **Nota:** Consulte os workflows individuais em `.github/workflows/` para detalhes técnicos de cada pipeline.
