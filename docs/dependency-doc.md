# Dependências do Projeto

Documentação das bibliotecas utilizadas em cada serviço do projeto EnergiIA.

## Índice

- [Backend (Java / Spring Boot)](#backend-java--spring-boot)
- [Frontend (React / TypeScript)](#frontend-react--typescript)
- [ML Service (Python / FastAPI)](#ml-service-python--fastapi)
- [Ferramentas de Build e Lint](#ferramentas-de-build-e-lint)

---

## Backend (Java / Spring Boot)

Gerenciado pelo Maven (`backend/pom.xml`).

### Núcleo do Spring Boot

| Dependência | Propósito |
|---|---|
| `spring-boot-starter-web` | API REST com servidor Apache Tomcat embutido |
| `spring-boot-starter-webflux` | Cliente HTTP reativo (WebClient) para comunicação com o ML Service |
| `spring-boot-starter-validation` | Validação de dados de entrada com Bean Validation (`@NotNull`, `@Email`) |
| `spring-boot-starter-data-jpa` | Mapeamento objeto-relacional (ORM) com Hibernate |

### Segurança

| Dependência | Propósito |
|---|---|
| `spring-security-crypto` | Apenas `BCryptPasswordEncoder` (sem auto-configuração Spring Security) |
| `jjwt-api` (0.12.6) | Geração e validação de tokens JWT (HMAC-SHA384) |
| `jjwt-impl` (0.12.6) | Implementação do JJWT |
| `jjwt-jackson` (0.12.6) | Serialização JSON para o JJWT |

### Banco de Dados

| Dependência | Propósito |
|---|---|
| `ojdbc11` | Driver JDBC Oracle |
| `oraclepki` | Suporte a wallets Oracle para conexão segura |

### Migrações

| Dependência | Propósito |
|---|---|
| `flyway-core` | Controle de versão do esquema de banco de dados |
| `flyway-database-oracle` | Suporte Flyway para Oracle |

### Documentação

| Dependência | Versão | Propósito |
|---|---|---|
| `springdoc-openapi-starter-webmvc-ui` | 3.0.3 | Geração automática de documentação OpenAPI/Swagger UI |

### Testes

| Dependência | Propósito |
|---|---|
| `spring-boot-starter-test` | JUnit 5, Mockito,断言, utilitários de teste |
| `spring-boot-test-autoconfigure` | Auto-configuração para testes |
| `spring-boot-starter-webmvc-test` | Testes da camada web (MockMvc) sem servidor completo |

### Build

| Plugin | Versão | Propósito |
|---|---|---|
| `spring-boot-maven-plugin` | - | Empacotamento JAR executável |
| `spotless-maven-plugin` | 2.43.0 | Formatação automática (Palantir Java Format 2.50) |

## Frontend (React / TypeScript)

Gerenciado pelo npm (`frontend/package.json`).

| Dependência | Versão | Propósito |
|---|---|---|
| `react` | ^19 | Biblioteca de UI |
| `react-dom` | ^19 | Renderização DOM |
| `react-is` | ^19 | Identificação de tipos de elementos React |
| `react-router` | ^8 | Roteamento SPA (v8 consolidou o antigo `react-router-dom`) |
| `recharts` | ^3 | Gráficos (Dashboard) |
| `lucide-react` | ^1.29 | Ícones |
| `typescript` | ~6.0.3 | Tipagem estática (pinado com `~` em `6.0.x` para impedir que um futuro `6.1.x` seja instalado automaticamente: o `typescript-eslint@8.66.0` (03/08/2026), a versão mais recente do toolchain de lint, exige `typescript >=4.8.4 <6.1.0`; o TypeScript 7.0.2 não é suportado. Subir para 7.x apenas quando o typescript-eslint ampliar o peer range) |
| `@types/react` | ^19 | Tipos do React |
| `@types/react-dom` | ^19 | Tipos do React DOM |
| `vite` | ^8.2 | Bundler e dev server |
| `@vitejs/plugin-react` | ^6 | Integração React com Vite |
| `eslint` | ^10 | Linter |
| `@eslint/js` | ^10 | Regras core do ESLint (flat config) |
| `typescript-eslint` | ^8 | Regras ESLint para TypeScript |
| `eslint-plugin-react-hooks` | ^7 | Regras para React Hooks |
| `eslint-plugin-react-refresh` | ^0.5 | Regras para HMR |
| `eslint-config-prettier` | ^10 | Integração ESLint + Prettier |
| `prettier` | ^3 | Formatador |
| `vitest` | ^4 | Test runner |
| `@playwright/test` | ^1.62 | Testes E2E (Playwright) |
| `@testing-library/react` | ^16 | Testes de componentes |
| `@testing-library/dom` | ^10 | Utilitários DOM para testes |
| `@testing-library/jest-dom` | ^7 | Matchers DOM para testes |
| `@testing-library/user-event` | ^14.6 | Simulação de eventos de usuário |
| `jsdom` | ^30 | Ambiente DOM para testes |

## ML Service (Python / FastAPI)

Gerenciado pelo pip (`ml-service/requirements.txt`).

> **Nota:** o `requirements.txt` **não pinna versões** (apenas `groq>=1.5.0` e
> `python-dotenv>=1.1.0`). A tabela abaixo lista versões de referência
> (validadas em 03/08/2026), não um lock de versões: a instalação real depende
> do resolvido pelo pip no momento do build.

| Biblioteca | Versão de referência | Propósito |
|---|---|---|
| `fastapi` | 0.139.0 | Framework web |
| `uvicorn` | 0.51.0 | Servidor ASGI |
| `pydantic` | 2.13.4 | Validação de schemas |
| `scikit-learn` | 1.9.0 | Modelo Random Forest + pipeline |
| `pandas` | 3.0.3 | Manipulação de dados |
| `numpy` | 2.5.1 | Operações numéricas |
| `joblib` | 1.5.3 | Serialização do modelo treinado |
| `groq` | 1.5.0 | Cliente API Groq (fallback LLM) |
| `python-dotenv` | 1.1.0 | Carregamento de variáveis de ambiente |

## Ferramentas de Build e Lint

| Ferramenta | Configuração | Propósito |
|---|---|---|
| Checkstyle | `backend/checkstyle.xml` | Padrões de código Java (usado em CI) |
| Spotless | `backend/pom.xml` (plugin) | Formatação automática Java |
| ESLint | `frontend/eslint.config.js` | Lint TypeScript/React |
| Prettier | `frontend/.prettierrc` | Formatação frontend |
| Ruff | `ml-service/pyproject.toml` | Lint Python (E, F, I, UP, B) |
| MyPy | `ml-service/pyproject.toml` | Tipagem estática Python |
| Markdownlint | `.markdownlint.json` | Padrões de documentação |
| Hadolint | `.hadolint.yaml` | Lint de Dockerfiles |
| YAMLlint | `.yamllint.yml` | Lint de arquivos YAML |
| CSpell | `cspell.json` | Verificação ortográfica |

---

> **Nota:** Consulte o [guia de execução](./guia-execucao.md) para instruções de instalação e a [documentação de CI/CD](./ci-cd.md) para detalhes dos pipelines de lint.
