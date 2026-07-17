# ADR-0004: Infraestrutura de CI/CD e qualidade de código

## Status

Aceito

## Contexto

O projeto envolve três serviços em linguagens diferentes (Java, TypeScript, Python) e documentação em markdown. A equipe precisava garantir qualidade mínima em cada Pull Request sem depender de revisão manual exclusivamente. Os requisitos eram:

- Verificação automática de estilo e lint para cada linguagem
- Execução de testes a cada PR
- Consistência na documentação (markdownlint, ortografia, caracteres proibidos)
- Gate automatizado para impedir merge de código com erros
- Configuração compartilhada entre todos os membros da equipe

## Decisão

A equipe decidiu implementar uma **pirâmide de qualidade** com três níveis:

**Nível 1 - Pre-commit hooks (Husky + lint-staged):**

Instalado via `package.json` raiz, executa linters apenas nos arquivos alterados antes de cada commit:

- Java: `mvn spotless:apply` (formatação)
- Python: `ruff check --fix && ruff format`
- TypeScript/React: `eslint --fix && prettier --write`
- Markdown: `markdownlint-cli2 --fix`
- YAML: `yamllint`
- Dockerfile: `hadolint`

**Nível 2 - CI em Pull Request (GitHub Actions):**

Nove workflows específicos por área, acionados por caminho de arquivo:

| Workflow | Gatilho | Ação |
|---|---|---|
| `lint-backend` | `backend/**/*.java` | Checkstyle + SpotBugs |
| `test-backend` | `backend/**` | `mvn test` (JUnit 5) |
| `lint-frontend` | `frontend/**/*.{ts,tsx}` | ESLint + Prettier check |
| `test-frontend` | `frontend/**` | `vitest run` |
| `lint-ml-service` | `ml-service/**/*.py` | Ruff check + format |
| `test-ml-service` | `ml-service/**` | pytest |
| `lint-docs` | `**/*.md` | markdownlint + cspell + forbidden-chars |
| `lint-infra` | `**/*.{yml,yaml}` + `**/Dockerfile*` | yamllint + hadolint |
| `deploy-backend-dev` | `backend/**` | Build + deploy no Render |
| `deploy-ml-dev` | `ml-service/**` | Build + deploy no Render |

**Nível 3 - Ferramentas de qualidade compartilhadas:**

- `cspell.json`: Dicionário pt-BR + inglês para verificação ortográfica em código e docs
- `.markdownlint.json`: Regras de marcação para documentação técnica
- `checkstyle.xml` + `spotbugs-exclude.xml`: Estilo Java
- `.hadolint.yaml` + `.yamllint.yml`: Boas práticas de infraestrutura
- `scripts/check-forbidden-chars.mjs`: Script customizado para caracteres proibidos (travessão, aspas curvas)

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| Apenas CI (GitHub Actions) | Centralizado, visível em PRs | Feedback lento (esperar o CI para saber de erros) |
| Apenas pre-commit hooks | Feedback imediato | Não impede merges com erro se o hook for pulado (`--no-verify`) |
| Husky + lint-staged + CI | Feedback imediato + gate obrigatório | Duas camadas de configuração para manter |
| Ferramenta externa (SonarQube, Codacy) | Métricas avançadas de qualidade | Overhead de configuração; nem todos os serviços são suportados |

## Consequências

- **Positivo:** Erros de formatação são corrigidos antes do commit, reduzindo ruído no CI
- **Positivo:** Cada PR valida automaticamente lints e testes antes do merge
- **Positivo:** Gitignore do backend, frontend e ml-service evitam commitar artefatos e dependências
- **Negativo:** Nove workflows de CI exigem manutenção contínua (versões de ferramentas, dependências)
- **Negativo:** O linter de docs gera muitos falsos positivos em arquivos de terceiros (node_modules)
- **Neutro:** A configuração de husky e lint-staged foi adicionada ao `package.json` raiz, exigindo `npm install` para ativar os hooks

> **Nota:** Consulte a [documentação de dependências](../dependency-doc.md) para as bibliotecas de desenvolvimento e o [guia de execução](../guia-execucao.md) para instruções de setup local.
