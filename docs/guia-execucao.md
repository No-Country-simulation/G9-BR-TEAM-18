# Guia de execução

Instruções detalhadas para executar o projeto EnergiIA localmente via Docker ou script de linha de comando.

## Sumário

- [Visão geral dos serviços](#visão-geral-dos-serviços)
- [Execução via Docker](#execução-via-docker)
- [Execução via script local](#execução-via-script-local)
- [Troubleshooting](#troubleshooting)
- [Considerações finais](#considerações-finais)

## Visão geral dos serviços

O projeto é composto por três serviços independentes que se comunicam entre si.

| Serviço | Diretório | Porta | Descrição |
|---|---|---|---|
| Backend | `backend/` | 8080 | API Java Spring Boot responsável pelas regras de negócio, persistência e orquestração das análises |
| Frontend | `frontend/` | 5173 | Interface web React com Vite para interação do usuário |
| ML Service | `ml-service/` | 8000 | Microsserviço FastAPI para predição via modelo de machine learning e fallback para LLM (Groq) |

## Acesso em produção

A aplicação está disponível publicamente na Oracle Cloud:

| Recurso | URL |
|---|---|
| Aplicação (frontend) | <https://energiaia.duckdns.org> |
| API / Swagger UI | <https://apienergiaia.duckdns.org/swagger-ui.html> |
| Contrato da API (JSON) | <https://apienergiaia.duckdns.org/api-docs> |

A infraestrutura de produção (VMs, Nginx, DuckDNS, SELinux) está descrita em
[deploy OCI](./deploy-oci.md) e [ADR-0058](./adr/0058-frontend-hospedado-nginx-vm.md).

## Execução via Docker

### Requisitos mínimos

- Docker versão 24 ou superior
- Docker Compose versão 2.24 ou superior
- 12 GB de RAM disponível para o Docker

> **Atenção:** Em hardware com menos de 12 GB de RAM, a execução via Docker pode sofrer com lentidões e travamentos. Para máquinas com recursos limitados, recomenda-se a execução via script local.

### Como executar

```bash
# A partir da raiz do projeto:
docker compose up -d
```

A primeira execução pode demorar alguns minutos enquanto as imagens são baixadas e construídas.

### Verificando os serviços

| Serviço | URL |
|---|---|
| Frontend | <http://localhost:5173> |
| Backend | <http://localhost:8080> |
| ML Service | <http://localhost:8000> |
| Swagger UI | <http://localhost:8080/swagger-ui.html> |

### Parando os serviços

```bash
docker compose stop
```

Para parar e remover os contêineres:

```bash
docker compose down
```

### Executando testes E2E com Playwright

Os testes end-to-end (E2E) validam o comportamento do frontend no navegador sem
dependência do backend real, utilizando mocks de API em todas as chamadas HTTP.

#### Requisitos

- Docker versão 24 ou superior (recomendado)
- Ou Node.js 24 LTS + Playwright browsers instalados (para execução local)

#### Via Docker (recomendado)

```bash
# A partir da raiz do projeto:

# Construir a imagem de testes
docker build -t energiaia-e2e -f frontend/e2e/Dockerfile.e2e .

# Executar a suíte E2E (atualmente 91 cenários)
docker run --rm energiaia-e2e
```

A imagem inclui Playwright + Chromium em um ambiente isolado e reproduzível.
A primeira execução pode demorar alguns minutos para baixar as dependências.

#### Via npm (local)

```bash
cd frontend

# Executar os testes E2E (requer Playwright browsers instalados)
npm run test:e2e
```

Para instalar os browsers do Playwright localmente:

```bash
cd frontend
npx playwright install chromium
```

##### Alternativa: executar com Firefox

Em distribuições Linux mínimas (ex.: servidores e containers), o Chromium pode
não abrir por falta de bibliotecas de sistema (`libnspr4.so`, `libnss3.so`,
`libnssutil3.so`), mesmo com os browsers do Playwright instalados. Sem acesso
`sudo` para instalar essas bibliotecas, é possível executar a mesma suíte com
Firefox, que o Playwright baixa e gerencia da mesma forma:

```bash
cd frontend
npx playwright install firefox
npx playwright test --config=e2e/playwright.config.ts --browser=firefox
```

O flag `--browser=firefox` sobrescreve o browser padrão (Chromium) apenas para
aquela execução, sem alterar a configuração. Os 71 testes da suíte rodam
indistintamente em ambos os browsers.

#### Relatórios e artefatos

Após a execução, os seguintes artefatos são gerados (não versionados):

| Artefato | Descrição |
|---|---|
| `frontend/e2e/test-results/` | Screenshots, traces e vídeos de falha |
| `frontend/e2e/playwright-report/` | Relatório HTML interativo com detalhes de cada teste |

Para visualizar o relatório HTML interativo:

```bash
cd frontend
npx playwright show-report playwright-report
```

## Execução via script local

### Requisitos mínimos

| Requisito | Versão mínima | Onde obter |
|---|---|---|
| Java JDK | 21 (Eclipse Temurin recomendado) | <https://adoptium.net/> |
| Maven | 3.9 ou utilizar o wrapper (`mvnw`) incluso | Já incluso no projeto |
| Node.js | 24 LTS | <https://nodejs.org/> |
| Python | 3.12 | <https://www.python.org/> |
| Git | Qualquer versão recente | <https://git-scm.com/> |

### Verificando as instalações

```bash
java -version
mvn -version      # ou: ./backend/mvnw -version
node -v
npm -v
python3 --version
git --version
```

### Clonando o repositório

```bash
git clone https://github.com/No-Country-simulation/G9-BR-TEAM-18.git
cd G9-BR-TEAM-18
```

### Utilizando o script run.sh

O projeto oferece um script automatizado `run.sh` que gerencia cada serviço individualmente.

#### Iniciar o backend (Spring Boot, porta 8080)

```bash
./run.sh backend
```

Na primeira execução, as dependências serão baixadas. Swagger UI disponível em `<http://localhost:8080/swagger-ui.html>`. Console H2 disponível em `<http://localhost:8080/h2-console>`.

#### Iniciar o ML Service (FastAPI, porta 8000)

```bash
./run.sh ml-service
```

O script cria automaticamente um ambiente virtual Python (`venv`), instala as dependências e inicia o servidor uvicorn.

Dependências do ML Service (`ml-service/requirements.txt`, sem versões fixadas):

| Biblioteca | Versão | Finalidade |
|---|---|---|
| `fastapi` | - | Framework web para criação da API |
| `uvicorn` | - | Servidor ASGI para execução do FastAPI |
| `pydantic` | - | Validação e serialização de dados |
| `scikit-learn` | - | Algoritmos de machine learning |
| `pandas` | - | Manipulação e análise de dados |
| `joblib` | - | Serialização do modelo treinado |
| `groq` | >=1.5.0 | Cliente para API Groq (fallback LLM) |
| `python-dotenv` | >=1.1.0 | Carregamento de variáveis de ambiente |

#### Iniciar o frontend (React + Vite, porta 5173)

```bash
./run.sh frontend
```

Acessar em `<http://localhost:5173>`.

#### Iniciar todos os serviços

```bash
# Em três terminais separados:
./run.sh backend
./run.sh ml-service
./run.sh frontend
```

### Executando os testes

```bash
# Testes do backend (JUnit 5):
./run.sh test:backend

# Testes do frontend (Vitest + Testing Library - unitários):
./run.sh test:frontend

# Testes E2E do frontend (Playwright via Docker):
docker build -t energiaia-e2e -f frontend/e2e/Dockerfile.e2e .
docker run --rm energiaia-e2e

# Todos os testes:
./run.sh test
```

### Compilando o projeto

```bash
./run.sh build
```

Compila o backend com Maven e o frontend com Vite, sem iniciar os servidores.

## Troubleshooting

### Porta já está em uso

**Erro:** `port is already allocated` ou `Address already in use` ao subir o Docker.

**Solução:** Identifique qual processo está usando a porta e interrompa-o, ou altere a porta no `docker-compose.yml` e nos arquivos de configuração de cada serviço.

```bash
# Verificar o que está usando a porta 8080
sudo lsof -i :8080
# Ou no macOS:
lsof -i :8080
```

### Docker com pouca memória RAM

**Sintoma:** Os contêineres iniciam mas ficam extremamente lentos, ou o backend morre com `Killed` ou `Exit code 137`.

**Solução:** Configure o Docker Desktop para usar no mínimo 6 GB de RAM (ideal: 12 GB). Em ambiente Linux, verifique o `swap` e o `vm.overcommit_memory`.

```bash
# Verificar memória disponível
free -h
# Verificar limite de memória do Docker (Linux)
docker info | grep -i memory
```

Se o hardware for limitado, prefira a execução via script local.

### Swagger UI retorna erro 500 em /v3/api-docs

**Causa:** O caminho do JSON do contrato foi alterado para `/api-docs` (configurado via `springdoc.api-docs.path`).

**Solução:** Use <http://localhost:8080/api-docs> para o JSON e <http://localhost:8080/swagger-ui.html> para a UI.

### ML Service não encontra o modelo

**Erro:** `FileNotFoundError: [Errno 2] No such file or directory: 'categorization-model.joblib'`

**Solução:** Certifique-se de que o arquivo `categorization-model.joblib` existe dentro do diretório `ml-service/`.

```bash
ls -la ml-service/categorization-model.joblib
```

### ML Service não inicia ou erro no Groq

**Erro:** `ImportError: cannot import name 'Groq'` ou `ModuleNotFoundError: No module named 'groq'`

**Solução:** Verifique se o `requirements.txt` contém `groq>=1.5.0`. Remova o ambiente virtual e recrie:

```bash
cd ml-service
rm -rf venv
./run.sh ml-service
```

Para usar o fallback Groq, crie um arquivo `.env` em `ml-service/`:

```env
GROQ_API_KEY=sua_chave_aqui
```

Sem a chave, o serviço funciona apenas com o modelo de machine learning.

### Frontend não carrega ou erro de CORS

**Sintoma:** O frontend abre mas não consegue se comunicar com o backend, mostrando erros de CORS no console do navegador.

**Solução:** Verifique se o backend está rodando na porta 8080 e se o `WebConfig.java` permite a origem do frontend (porta 5173).

### Banco Oracle: tabelas não encontradas

**Erro:** `ORA-00942: table or view does not exist` no startup ou ao executar uma análise.

**Causa:** O schema apontado por `SPRING_DATASOURCE_URL` não foi migrado ou o `SPRING_FLYWAY_DEFAULT_SCHEMA` está incorreto.

**Solução:** Verifique se o Flyway rodou todas as migrations (`backend/src/main/resources/db/migration/oracle/`) e se as variáveis `SPRING_DATASOURCE_*` e `SPRING_FLYWAY_*` estão consistentes no `.env`.

### Testes E2E falham com erro de conexão

**Erro:** `TimeoutError: page.goto: net::ERR_CONNECTION_REFUSED` ou
`Error: page.goto: net::ERR_CONNECTION_RESET`.

**Causa:** O Playwright tenta acessar o servidor de desenvolvimento do frontend
na porta 5173, mas ele não está rodando. Os testes E2E com mocks de API não
exigem o backend, mas precisam que o servidor do frontend esteja ativo.

**Solução (Docker):** O `playwright.config.ts` inicia automaticamente o servidor
de desenvolvimento via `webServer` antes dos testes. Certifique-se de usar a
imagem `energiaia-e2e` e executar `docker run --rm energiaia-e2e`.

**Solução (npm local):** Inicie o servidor de desenvolvimento em outro terminal
antes de executar os testes:

```bash
cd frontend && npm run dev
```

Ou utilize a opção `webServer` integrada no Playwright, que inicia e derruba o
servidor automaticamente.

### Testes E2E: Playwright não encontra o Chromium

**Erro:** `Browser chromium not found. Run npx playwright install chromium`.

**Solução:**

```bash
cd frontend
npx playwright install chromium
```

Em ambiente Docker, esse passo já está incluído no `Dockerfile.e2e`.

### Testes E2E: Chromium não abre por bibliotecas de sistema ausentes

**Erro:** `error while loading shared libraries: libnspr4.so: cannot open shared object file`
(ou `libnss3.so` / `libnssutil3.so`) ao iniciar o browser.

**Causa:** O Chromium exige bibliotecas nativas (`libnspr4`, `libnss3`) que
podem não estar instaladas em distribuições Linux mínimas. Instalar os browsers
do Playwright (`npx playwright install chromium`) não resolve, pois o problema
são dependências de sistema operacional, não o browser em si.

**Solução 1 (instalar as bibliotecas):**

```bash
# Debian/Ubuntu (requer sudo):
sudo apt-get install -y libnspr4 libnss3
# Ou via Playwright (requer sudo):
npx playwright install-deps chromium
```

**Solução 2 (sem sudo, usando Firefox):** O Firefox do Playwright tem menos
dependências nativas e costuma funcionar sem instalar nada:

```bash
cd frontend
npx playwright install firefox
npx playwright test --config=e2e/playwright.config.ts --browser=firefox
```

Em ambiente Docker, esse passo já está incluído no `Dockerfile.e2e`.

### Container do backend reinicia em loop

**Sintoma:** O container do backend fica reiniciando constantemente (`Restarting (1) ...`).

**Solução:** Verifique os logs para identificar a causa:

```bash
docker compose logs backend
```

Problemas comuns:

- Porta 8080 já em uso no host
- Falta de memória
- Erro de compilação no Maven durante o build

## Considerações finais

- A chave de API do Groq é opcional e deve ser configurada no arquivo `.env` do diretório `ml-service/` (ou no `.env` da raiz, carregado pelo Docker Compose). Sem ela, o serviço funciona apenas com o modelo de machine learning e as regras de negócio.
- O banco de dados utilizado é o Oracle ATP (também em desenvolvimento), configurado via variáveis `SPRING_DATASOURCE_*` e migrado pelo Flyway. Consulte [environment.md](./environment.md) para a lista completa.
- O modelo de machine learning (`categorization-model.joblib`) e os datasets estão incluídos no repositório para facilitar a reprodução do ambiente de desenvolvimento.
- A suíte de qualidade do ML Service (`ml-qa`) tem [README próprio](../ml-qa/README.md) com instruções de execução e rate limiting.
- Consulte o [README](../README.md) para instruções resumidas de execução.
- Consulte o [glossário do projeto](../docs/glossario.md) para definição dos termos técnicos utilizados neste documento.
