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

#### Iniciar o Backend (Spring Boot - porta 8080)

```bash
./run.sh backend
```

O script utiliza o Maven Wrapper (`mvnw`) para baixar automaticamente a versão correta do Maven e compilar o projeto. Na primeira execução, as dependências serão baixadas, o que pode levar alguns minutos.

Swagger UI disponível em `http://localhost:8080/swagger-ui.html`.
Console do banco H2 disponível em `http://localhost:8080/h2-console`.

#### Iniciar o ML Service (FastAPI - porta 8000)

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

#### Iniciar o Frontend (React + Vite - porta 5173)

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

---

## Troubleshooting

### Porta já está em uso

**Erro:** `port is already allocated` ou `Address already in use` ao subir o Docker.

**Solução:** Identifique qual processo está usando a porta e interrompa-o, ou altere a porta no `docker-compose.yml` e nos respectivos arquivos de configuração de cada serviço.

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

Se o hardware for limitado, prefira a execução via script local (`./run.sh`).

### H2 Console retorna "Sorry, remote connections ('webAllowOthers') are disabled on this server"

**Causa:** A propriedade `spring.h2.console.settings.web-allow-others` não está habilitada.

**Solução:** Verifique se o arquivo `backend/src/main/resources/application.properties` contém a seguinte linha:

```properties
spring.h2.console.settings.web-allow-others=true
```

Após alterar, reconstrua e reinicie o backend:

```bash
docker compose build backend && docker compose up -d backend
```

### Swagger UI retorna "response status is 500 /v3/api-docs"

**Causa:** Versão incompatível do `springdoc-openapi` com o Spring Boot 4.x (Spring Framework 7.x).

**Solução:** Verifique no `backend/pom.xml` se a versão do `springdoc-openapi-starter-webmvc-ui` é igual ou superior a `3.0.3`. Versões antigas (como `2.5.0`) não são compatíveis.

### H2 Console retorna 404 ou "No static resource"

**Causa:** O módulo `spring-boot-h2console` não está presente no classpath.

**Solução:** Verifique no `backend/pom.xml` se a dependência `spring-boot-h2console` está declarada. Ela é obrigatória a partir do Spring Boot 4.x, pois o H2 Console foi extraído para um módulo separado.

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-h2console</artifactId>
</dependency>
```

### Backend não compila com erro "class, interface, enum, or record expected"

**Causa:** Geralmente ocorre ao importar classes do H2 (`WebServlet`, `JakartaWebServlet`) que não são compatíveis com a versão em uso.

**Solução:** Remova qualquer configuração manual de servlet do H2 (`H2Configuration.java`) e use apenas a auto-configuração do Spring Boot com as propriedades corretas no `application.properties`.

### ML Service não encontra o modelo (modelo-categorizacao.joblib)

**Erro:** `FileNotFoundError: [Errno 2] No such file or directory: 'modelo-categorizacao.joblib'`

**Solução:** Certifique-se de que o arquivo `modelo-categorizacao.joblib` existe dentro do diretório `ml-service/`. Se estiver usando Docker, o arquivo é copiado durante o build. Para execução local, verifique se você está na raiz do projeto ao executar o script.

```bash
ls -la ml-service/modelo-categorizacao.joblib
```

### ML Service não inicia ou erro no Groq

**Erro:** `ImportError: cannot import name 'Groq'` ou `ModuleNotFoundError: No module named 'groq'`

**Solução:** Verifique se o arquivo `ml-service/requirements.txt` contém `groq>=1.5.0`. Remova o ambiente virtual e recrie:

```bash
cd ml-service
rm -rf venv
./run.sh ml-service
```

Para usar o fallback Groq, crie um arquivo `.env` em `ml-service/` com:

```env
GROQ_API_KEY=sua_chave_aqui
```

Sem a chave, o serviço funciona apenas com o modelo de machine learning.

### Frontend não carrega ou erro de CORS

**Sintoma:** O frontend abre mas não consegue se comunicar com o backend, mostrando erros de CORS no console do navegador.

**Solução:** Verifique se o backend está rodando na porta 8080 e se o `WebConfig.java` permite a origem do frontend (porta 5173). A configuração de CORS já está presente no projeto, mas pode ser necessário ajustar a URL se as portas forem alteradas.

### Banco H2: tabelas não encontradas

**Erro:** `Table "ANALISE" not found` ou `Table "ANALISE_ENERGETICA" not found`

**Causa:** O H2 é um banco em memória. Os dados e esquemas são perdidos ao reiniciar o backend.

**Solução:** Verifique se a propriedade `spring.jpa.hibernate.ddl-auto=update` está presente no `application.properties`. Ela garante que as tabelas sejam recriadas automaticamente com base nas entidades JPA.

### Container do backend reinicia em loop

**Sintoma:** O container do backend fica reiniciando constantemente (`Restarting (1) ...`).

**Solução:** Verifique os logs para identificar a causa:

```bash
docker compose logs backend
```

Problemas comuns:

- Porta 8080 já em uso no host
- Falta de memória (veja seção sobre RAM acima)
- Erro de compilação no Maven durante o build

---

## Considerações Finais

- A chave de API do Groq é opcional e deve ser configurada no arquivo `.env` do diretório `ml-service/`. Sem ela, o serviço funciona apenas com o modelo de machine learning e as regras de negócio, sem o fallback para o LLM.
- O banco de dados utilizado é o H2 em memória, o que significa que os dados são perdidos ao reiniciar o backend. Para um ambiente de produção, recomenda-se configurar um banco persistente.
- O modelo de machine learning (`modelo-categorizacao.joblib`) e os datasets sintéticos estão incluídos no repositório para facilitar a reprodução do ambiente de desenvolvimento.
