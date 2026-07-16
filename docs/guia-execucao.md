# Guia de Execução - EnergiAI

Este documento descreve as duas formas disponíveis para executar o projeto EnergiAI localmente: via **Docker** ou via **script de linha de comando** (utilizando o arquivo `run.sh`). Cada abordagem possui seus próprios requisitos e particularidades, detalhados a seguir.

---

## Visão Geral dos Serviços

O projeto é composto por três serviços independentes que se comunicam entre si:

| Serviço | Diretório | Porta | Descrição |
|---|---|---|---|
| Backend | `backend/` | 8080 | API Java Spring Boot responsável pelas regras de negócio, persistência e orquestração das análises. |
| Frontend | `frontend/` | 5173 | Interface web React com Vite para interação do usuário. |
| ML Service | `ml-service/` | 8000 | Microsserviço FastAPI responsável pela predição via modelo de machine learning e fallback para LLM (Groq). |

---

## Execução via Docker

### Requisitos Mínimos

- **Docker** (versão 24 ou superior)
- **Docker Compose** (versão 2.24 ou superior)
- **12 GB de RAM** disponível para o Docker

> **Observação importante:** Em hardware com menos de 12 GB de RAM, a execução via Docker pode sofrer com lentidões e travamentos, especialmente durante a construção das imagens e a execução simultânea dos três contêineres. Para máquinas com recursos limitados, recomenda-se a execução via script local.

### Como Executar

```bash
# A partir da raiz do projeto:
docker compose up -d
```

Este comando constrói e inicializa os três serviços em segundo plano. A primeira execução pode demorar alguns minutos enquanto as imagens são baixadas e construídas.

### Verificando os Serviços

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend:** [http://localhost:8080](http://localhost:8080)
- **ML Service:** [http://localhost:8000](http://localhost:8000)
- **Swagger UI:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **H2 Console:** [http://localhost:8080/h2-console](http://localhost:8080/h2-console)

### Parando os Serviços

```bash
docker compose stop
```

Para parar e remover os contêineres:

```bash
docker compose down
```

---

## Execução via Script Local

### Requisitos Mínimos

Para executar o projeto sem Docker, é necessário instalar os seguintes pré-requisitos:

| Requisito | Versão Mínima | Onde Obter |
|---|---|---|
| **Java JDK** | 21 (Eclipse Temurin recomendado) | [https://adoptium.net/](https://adoptium.net/) |
| **Maven** | 3.9 ou utilizar o wrapper (`mvnw`) incluso | Já incluso no projeto |
| **Node.js** | 20 LTS | [https://nodejs.org/](https://nodejs.org/) |
| **Python** | 3.12 | [https://www.python.org/](https://www.python.org/) |
| **Git** | Qualquer versão recente | [https://git-scm.com/](https://git-scm.com/) |

### Verificando as Instalações

```bash
java -version
mvn -version      # ou: ./backend/mvnw -version
node -v
npm -v
python3 --version
git --version
```

### Clonando o Repositório

```bash
git clone https://github.com/No-Country-simulation/G9-BR-TEAM-18.git
cd G9-BR-TEAM-18
```

### Utilizando o Script run.sh

O projeto oferece um script automatizado chamado `run.sh` que gerencia cada serviço individualmente.

#### Iniciar o Backend (Spring Boot — porta 8080)

```bash
./run.sh backend
```

O script utiliza o Maven Wrapper (`mvnw`) para baixar automaticamente a versão correta do Maven e compilar o projeto. Na primeira execução, as dependências serão baixadas, o que pode levar alguns minutos.

Swagger UI disponível em `http://localhost:8080/swagger-ui.html`.
Console do banco H2 disponível em `http://localhost:8080/h2-console`.

#### Iniciar o ML Service (FastAPI — porta 8000)

```bash
./run.sh ml-service
```

O script cria automaticamente um ambiente virtual Python (`venv`), instala as dependências do arquivo `requirements.txt` e inicia o servidor uvicorn.

Dependências do ML Service:

| Biblioteca | Versão | Finalidade |
|---|---|---|
| `fastapi` | 0.139.0 | Framework web para criação da API |
| `uvicorn` | 0.51.0 | Servidor ASGI para execução do FastAPI |
| `pydantic` | 2.13.4 | Validação e serialização de dados |
| `scikit-learn` | 1.9.0 | Algoritmos de machine learning |
| `pandas` | 3.0.3 | Manipulação e análise de dados |
| `numpy` | 2.5.1 | Operações numéricas e matriciais |
| `joblib` | 1.5.3 | Serialização do modelo treinado |
| `groq` | 1.5.0 | Cliente para API Groq (fallback LLM) |
| `python-dotenv` | 1.1.0 | Carregamento de variáveis de ambiente |

#### Iniciar o Frontend (React + Vite — porta 5173)

```bash
./run.sh frontend
```

O script executa `npm install` para baixar as dependências do Node.js e em seguida inicia o servidor de desenvolvimento Vite.

Acessar em `http://localhost:5173`.

#### Iniciar Todos os Serviços

```bash
# Em três terminais separados:
./run.sh backend
./run.sh ml-service
./run.sh frontend
```

### Executando os Testes

```bash
# Testes do backend (JUnit 5):
./run.sh test:backend

# Testes do frontend (Vitest + Testing Library):
./run.sh test:frontend

# Todos os testes:
./run.sh test
```

### Compilando o Projeto

```bash
./run.sh build
```

Compila o backend com Maven e o frontend com Vite, sem iniciar os servidores.

---

## Considerações Finais

- A chave de API do Groq é opcional e deve ser configurada no arquivo `.env` do diretório `ml-service/`. Sem ela, o serviço funciona apenas com o modelo de machine learning e as regras de negócio, sem o fallback para o LLM.
- O banco de dados utilizado é o H2 em memória, o que significa que os dados são perdidos ao reiniciar o backend. Para um ambiente de produção, recomenda-se configurar um banco persistente.
- O modelo de machine learning (`modelo-categorizacao.joblib`) e os datasets sintéticos estão incluídos no repositório para facilitar a reprodução do ambiente de desenvolvimento.
