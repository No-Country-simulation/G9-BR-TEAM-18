# AGENTS.md - EnergiIA

Este arquivo segue o padrão aberto [AGENTS.md](https://agents.md/) (mantido pela Agentic AI Foundation / Linux Foundation).
Ele fornece instruções operacionais para agentes de IA que trabalham neste repositório.
**Não substitui o README.md** - contém apenas o que agentes precisam saber para produzir código correto.

---

## Stack & Arquitetura

- **Backend**: Java 21 (Eclipse Temurin) + Spring Boot 4.1 + Maven Wrapper
- **Frontend**: React 18 + TypeScript 5.5 + Vite 5.4
- **ML Service**: Python 3.12 + FastAPI + scikit-learn (Random Forest calibrado)
- **Banco**: PostgreSQL 16 (dev/local) / Oracle ATP (produção futura) - dual via Flyway
- **Infra**: Docker Compose (4 serviços), GitHub Actions, Husky + lint-staged
- **Arquitetura**: Hexagonal (Ports & Adapters) no backend - `core/` não importa `infrastructure/`

---

## Regras de Código

### Backend (Java)

- Formatação obrigatória via **Palantir Java Format** (Spotless Maven Plugin). Execute `./mvnw spotless:apply` antes de commitar.
- **Checkstyle** ativo - proibido `import *`, complexidade ciclomática ≤ 12, métodos ≤ 80 linhas, parâmetros ≤ 10.
- **SpotBugs** configurado - exclusões ONLY em `spotbugs-exclude.xml` e apenas para `EI_EXPOSE_REP`/`EI_EXPOSE_REP2` em entidades/DTOs.
- Nomenclatura JSON: `SNAKE_CASE` (`spring.jackson.property-naming-strategy=SNAKE_CASE`).
- O core (`core/domain/` e `core/ports/`) NÃO pode importar nada de `infrastructure/`, Spring, JPA, ou qualquer framework.
- DTOs pertencem à camada web (`infrastructure/adapters/in/web/dto/`), não ao domínio.
- Use `@Valid` para validação de entrada nos DTOs; validações semânticas vão no domínio.
- Nunca edite migrations Flyway já aplicadas. Crie uma nova migration com número superior.

### Frontend (React/TypeScript)

- **ESLint 9** (config flat) + **Prettier** (semi, aspas duplas, trailingComma all, printWidth 100).
- TypeScript strict mode ativado - `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`.
- **Proibido `any`**. Use `unknown` em boundaries de API com type guards; use `never` para exaustão em switch.
- Componentes em PascalCase (arquivo e componente); funções/variáveis em camelCase.
- Prefira `React.lazy()` para code splitting de páginas (Dashboard em particular).
- Use contexto (`AuthContext`, `ThemeContext`) para estado global, não prop drilling excessivo.
- Evite `dangerouslySetInnerHTML`. Se inevitável, sanitize com DOMPurify.
- Trate 401 com redirect para `/login`.

### ML Service (Python)

- **Ruff** (line-length 100, quote-style double, target py312) + **mypy** (`disallow_untyped_defs = true`).
- Toda função deve ter assinatura tipada. `Any` é proibido em parâmetros públicos.
- Async para I/O (chamadas HTTP/Groq); sync para CPU (inferência do modelo).
- Use Pydantic v2 para validação de entrada/saída da API.
- O fallback inteligente é: modelo ML → Groq LLM → regras determinísticas. Nunca remova uma camada sem ADR.
- Trate速率 limiting do Groq explicitamente (controle RPM/RPD).

### Documentação (Markdown)

- markdownlint ativo (max line length 334, HTML inline permitido).
- CSpell com dicionários `en`, `pt-BR`, `typescript`, `java`, `python`.
- Script `check-forbidden-chars.mjs` bloqueia aspas curvas e travessões Unicode em `.md`.
- Commits, PRs e merges em **inglês**. O código também em inglês. Apenas este AGENTS.md e documentações de uso (`docs/`) em pt-br.
- **NUNCA use o caractere travessão "—" (U+2014) neste arquivo ou em qualquer documentação do projeto.** Use o hífen comum "-" (U+002D) como substituto. Esta regra está documentada aqui e deve ser respeitada por qualquer agente que editar estes arquivos.

---

## Comandos Essenciais

```bash
# Backend (Spring Boot)
./mvnw spotless:apply          # Formata código (Palantir)
./mvnw test                    # Testes unitários + integração
./run.sh backend               # Sobe servidor na porta 8080

# Frontend (React + Vite)
npm run lint                   # ESLint + Prettier
npm test                       # Vitest
./run.sh frontend              # Sobe servidor na porta 5173

# ML Service (FastAPI)
./run.sh ml-service            # Sobe servidor na porta 8000
ruff check . && ruff format .
mypy .

# Geral
./run.sh test                  # Todos os testes
./run.sh build                 # Compila backend + frontend
npx lint-staged                # Executa linters nos arquivos staged
```

---

## Segurança

- **JWT armazenado em cookie HttpOnly (`SESSION_TOKEN`)** - NUNCA em localStorage. O cookie deve ter `SameSite=Lax` (ou `Strict` para refresh), `Secure=true` em produção.
- **CORS**: `allowCredentials=true`. Em produção, `CORS_ALLOWED_ORIGINS` NUNCA deve ser `*`. Restringir ao domínio do frontend.
- **CSRF**: Desabilitado (stateless JWT) - correto para API REST. Não reativar sem entender as implicações.
- **`ddl-auto`**: `validate` em produção (Oracle), `update` apenas em dev (PostgreSQL). NUNCA usar `create` ou `create-drop` em produção.
- **Senhas**: Hash armazenado no banco. Verificar se `PasswordEncoder` está configurado com bcrypt ou SCrypt.
- **ML Service**: Não exposto publicamente - apenas comunicação interna via docker network. Manter assim.
- **JWT secret**: `JWT_SECRET` em variável de ambiente (nunca hardcoded). Use chave com entropia ≥ 256 bits.

---

## Performance & Otimização

- **N+1 queries**: Verificar se relacionamentos JPA usam `FetchType.LAZY` e se `@EntityGraph` ou `JOIN FETCH` é usado em consultas. Nunca confiar em `spring.jpa.open-in-view=true` (desabilitar em produção).
- **Conexão lazy**: Considere `spring.datasource.connection-fetch=lazy` no Spring Boot 4.1 para adiar conexão física.
- **Frontend**: Use `React.lazy()` + `Suspense` para páginas não críticas. Evite context providers grandes - divida por domínio.
- **Modelo ML**: `categorization-model.joblib` tem 64.55 MB. Considere Git LFS ou download em runtime em vez de trafegar no repositório.
- **Cache**: Predições do ML Service não têm cache. Considere implementar cache em memória (TTL curto) para inputs repetidos.
- **Bundle**: Vite já otimiza por padrão. Monitore com `npm run build -- --report` se disponível.

---

## Resiliência & Tratamento de Erros

- **Backend**: GlobalExceptionHandler cobre 400 (validation), 403, 404, 409, 503 (ML Service unavailable), 500. Toda resposta de erro segue `{"message": "..."}`.
- **Frontend**: `ApiError` com campo `fields` para validação. Tratar 401 com redirect. Tratar erros de rede com fallback silencioso.
- **ML Service**: Fallback inteligente em 3 níveis (ML → Groq → rule-based). Logging via print (migrar para logging estruturado no futuro).
- **Health check**: Docker Compose tem healthcheck para postgres. O ML Service expõe `GET /status`. **Recomendação**: Adicionar health check no docker-compose para backend depender do ML Service estar pronto.

---

## Testes

| Camada | Framework | Comando | Obrigatório |
|--------|-----------|---------|-------------|
| Backend | JUnit 5 | `./mvnw test` | Sim |
| Frontend | Vitest + Testing Library | `npm test` | Sim |
| ML Service | **Nenhum** | - | **Risco alto - implementar pytest** |

- Testes de integração no backend usam contexto Spring (`@SpringBootTest`).
- Testes de componente no frontend usam jsdom + Testing Library.
- ML Service não possui testes automatizados. Prioridade: adicionar testes para `/predict` (validação, fallback, erro).

---

## CI/CD & Qualidade

- **Pre-commit (Husky)**: Executa `lint-staged` - linters específicos por tipo de arquivo.
- **GitHub Actions**:
  - `lint-infra.yml`: Hadolint + yamllint em PRs com Dockerfile/\*.yml
  - `lint-docs.yml`: markdownlint + cspell + check-forbidden-chars em PRs com \*.md
  - `lint-ml-service.yml`: Ruff + mypy em PRs com `ml-service/**`
  - `deploy-ml-dev.yml`: Build Docker + Push + Deploy Render em push na branch `dev`
- **Recomendação**: Adicionar workflows CI para backend (`mvn verify`) e frontend (`npm test + npm run lint`) no GitHub Actions - atualmente rodam apenas localmente.

---

## Trade-offs & Decisões (das ADRs)

| Decisão | Prós | Contras | Referência |
|---------|------|---------|------------|
| Hexagonal (Ports & Adapters) | Domínio isolado de frameworks, testável, substituível | Maior boilerplate, mais arquivos | ADR 0001 |
| Fallback inteligente (ML → Groq → regras) | Resiliência, cobertura mesmo sem modelo | Complexidade, custo do Groq, 3 fontes de verdade | ADR 0003 |
| JWT em cookie vs localStorage | Imune a XSS, envio automático | Vulnerável a CSRF (mitigado por SameSite), `allowCredentials` no CORS | ADR 0007 |
| Oracle + PostgreSQL simultâneo | Portabilidade, cliente pode escolher | Duas bases de migrations para manter, features Oracle sem equivalente direto | ADR 0009 |
| `ddl-auto: update` em dev (vs Flyway-only) | Prototipagem rápida | Pode gerar diferenças entre dev e prod | - |

---

## Restrições ao Agente

- **NÃO** modifique migrations Flyway já aplicadas em qualquer ambiente.
- **NÃO** edite `spotbugs-exclude.xml` sem justificativa documentada.
- **NÃO** adicione novas dependências (Maven, npm, pip) sem aprovação explícita.
- **NÃO** altere configurações de produção (`application.properties` perfis `prod`/`oracle`) sem validação.
- **NÃO** commite tokens, secrets, ou arquivos `.env`.
- **NÃO** remova camadas do fallback inteligente sem criar um novo ADR.

---

## Web Search como Mecanismo de Fallback

**Sempre use web search ao lidar com:**

1. Versões de dependências - verifique a versão estável mais recente antes de sugerir upgrade.
2. Patches de segurança (CVEs) - consulte o banco OSV ou NVD.
3. Breaking changes entre versões de frameworks (ex: Spring Boot 3.x → 4.x, React 18 → 19).
4. Changelogs oficiais antes de modificar configurações de bibliotecas.
5. Práticas recomendadas atualizadas - seu conhecimento de treinamento pode estar desatualizado.
6. Compatibilidade entre versões (ex: Flyway 10.x com Oracle 23c).

Não confie apenas no conhecimento paramétrico. Verifique fontes oficiais (docs.spring.io, react.dev, fastapi.tiangolo.com, scikit-learn.org) quando houver dúvida sobre comportamento atual.

---

## Recomendações de Ajustes na Documentação

Baseado na análise do código vs. documentação atual:

1. **`docs/contrato-api.md`** - Verificar se os endpoints documentados correspondem exatamente aos controllers. Confirmar que campos snake_case nos responses batem com a configuração Jackson.
2. **`docs/adr/`** - ADR 0000 é um template vazio - remover ou preencher. ADRs 0001-0009 não mencionam trade-offs específicos de tecnologia (ex: custo do Groq vs rule-based only).
3. **`docs/guia-execucao.md`** - Verificar se reflete o `run.sh` atual. O script tem comandos para cada serviço, mas o guia pode estar desatualizado.
4. **`docs/dependency-doc.md`** - Verificar se lista todas as dependências reais do `pom.xml` (ex: Oracle PKI, SpringDoc OpenAPI podem estar ausentes).
5. **`README.md`** - Não menciona as ferramentas de qualidade (Husky, lint-staged, Spotless, Checkstyle) - considerar adicionar seção breve.
6. **Testes do ML Service** - Documentação não menciona a ausência de testes. Adicionar nota de risco conhecido.

---

## Docker (Obrigatório)

Todo o projeto (backend + frontend + ml-service + postgres) deve ser executado via `docker compose up -d` durante implementação e testes. Não confiar em `./run.sh all` (que só imprime instruções) nem em execuções isoladas de servidores locais.

---

## Convenções de Commits, PRs e Merges

- **Idioma**: Inglês
- **Formato**: `tipo(escopo): descrição` - ex: `feat(backend): add energy analysis endpoint`, `fix(ml-service): handle null prediction`
- **Tipos**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `security`
- **PRs**: Título em inglês, descrição com contexto e screenshots se aplicável (UI)
- **Merges**: Squash para branches de feature, merge commit para releases

## Fluxo de Branches (Protegidas)

O repositório segue o fluxo de três branches protegidas:

```
dev ──PR──> homolog ──PR──> main
```

### Regras
- **`main`** (default): Recebe apenas PRs vindos de `homolog`. Push direto é bloqueado pelo workflow.
- **`homolog`**: Recebe apenas PRs vindos de `dev`. Push direto é bloqueado pelo workflow.
- **`dev`**: Branch de desenvolvimento ativo. Commits e pushes livres.

### Workflows de enforcement
- `validate-pr-source.yml` — Executa em todo PR para `main`/`homolog` e valida a branch de origem.
- `revert-direct-push.yml` — Executa em push para `main`/`homolog` e rejeita se não for merge commit.

### Procedimento

1. Implemente em `dev` com commits granulares
2. Abra PR de `dev` → `homolog` para validação
3. Após aprovação e merge em `homolog`, abra PR de `homolog` → `main`
4. `main` exige code review com approvals

> **Nota:** O GitHub Free não oferece branch protection nativa para repositórios privados. A proteção é implementada via GitHub Actions (enforcement em CI, não server-side).
