# EnergiIA

![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.1-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.139-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

Inteligência artificial para análise de consumo energético, classificação de perfis e geração de recomendações personalizadas.

## Sumário

- [Sobre](#sobre)
- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Como executar](#como-executar)
- [Testes](#testes)
- [API REST](#api-rest)
- [Membros](#membros)
- [Documentação complementar](#documentação-complementar)

## Sobre

O consumo de energia representa um dos principais custos para residências e pequenos negócios. A maioria dos consumidores possui pouca visibilidade sobre quais hábitos e equipamentos têm maior impacto na conta de energia.

O **EnergiIA** resolve esse problema ao analisar padrões de consumo, classificar o perfil energético e gerar recomendações personalizadas de redução. O projeto foi desenvolvido pela equipe **G9-BR-TEAM-18** durante o Hackathon **ONE G9-BR (Alura + Oracle + NoCountry)**.

### Problema

Falta de visibilidade sobre o impacto real de hábitos e equipamentos no consumo de energia.

### Objetivo

- Analisar padrões de consumo energético
- Classificar o perfil de consumo utilizando um modelo de Machine Learning
- Gerar recomendações para otimização do consumo
- Estimar o custo mensal com base em uma tarifa de referência
- Disponibilizar os resultados por meio de uma API REST
- Integrar a aplicação com serviços da Oracle Cloud Infrastructure (OCI)

## Funcionalidades

- Classificação do perfil energético em 5 categorias: Excelente, Bom, Mediano, Ruim, Crítico
- Estimativa do custo mensal de energia e emissão de CO₂
- Geração de recomendações personalizadas (via regras ou LLM Groq)
- API REST para análise energética, histórico e dashboard
- Autenticação por sessão JWT em cookie httpOnly + login com Google (SSO)
- Fallback inteligente: modelo ML, Groq ou regras
- Auto-aprimoramento: logs de predições salvos para retreino (`treino_feedback.jsonl`)
- Catálogo de aparelhos sincronizado automaticamente com o ML Service (ADR-0048/0055)
- Suíte de qualidade black-box do ML Service (`ml-qa`) com relatórios versionados

## Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Backend | Java + Spring Boot | 21 / 4.1 |
| Frontend | React + Vite + TypeScript | 19.2 / 8.2 |
| ML Service | Python + FastAPI + scikit-learn | 3.12 / 0.139 |
| Banco | Oracle ATP (Flyway) | - |
| Infraestrutura | Docker Compose | - |

> Requer Node.js 24+, Java 21 (Eclipse Temurin) e Python 3.12+ para execução via script local.

## Como executar

### Via Docker

```bash
docker compose up -d
```

Serviços disponíveis em:

| Serviço | URL |
|---|---|
| Frontend | <http://localhost:5173> |
| Backend | <http://localhost:8080> |
| ML Service | <http://localhost:8000> |
| Swagger UI | <http://localhost:8080/swagger-ui.html> |

> **Atenção:** Em hardware com menos de 12 GB de RAM, prefira a execução via script local.

### Via script local

#### Pré-requisitos

- Java 21 (Eclipse Temurin recomendado)
- Node.js 24+
- Python 3.12+
- Maven (ou use o wrapper `mvnw` incluso)

#### Iniciar os serviços

```bash
# Backend (porta 8080)
./run.sh backend

# ML Service (porta 8000)
./run.sh ml-service

# Frontend (porta 5173)
./run.sh frontend
```

O script `run.sh` gerencia cada serviço individualmente. Consulte o [guia de execução](./docs/guia-execucao.md) para instruções detalhadas.

## Testes

```bash
# Todos os testes
./run.sh test

# Backend (JUnit 5)
cd backend && ./mvnw test

# Frontend (Vitest + Testing Library)
cd frontend && npm test

# Suíte black-box do ML Service (ml-qa)
cd ml-qa && pip install -r requirements.txt && python -m ml_qa.cli
```

> `./run.sh test` executa os testes unitários do backend e do frontend. Os testes E2E (Playwright) e a suíte ml-qa são executados separadamente (ver [guia de execução](./docs/guia-execucao.md)).

## API REST

### `POST /energy-analysis`

**Request** (as respostas usam snake_case):

```json
{
  "property_id": 1,
  "consumption_kwh": 350.75,
  "peak_hour_usage": true,
  "high_consumption_hours": 5.5,
  "highest_consumption_category": "REFRIGERATION"
}
```

**Response:**

```json
{
  "id": 1,
  "property_id": 1,
  "consumption_kwh": 350.75,
  "peak_hour_usage": true,
  "high_consumption_hours": 5.5,
  "estimated_monthly_cost": 263.06,
  "category": "MEDIANO",
  "probability": 0.78,
  "status": "CONCLUIDA",
  "source": "model",
  "recommendations": ["Evite usar equipamentos de maior potência entre 18h e 21h, esse é o horário de pico e costuma pesar mais na conta."]
}
```

Consulte o [contrato de API](./docs/contrato-api.md) para a documentação completa dos endpoints.

## Membros

| Nome | Função | LinkedIn | GitHub |
|---|---|---|---|
| Eduardo Gonçalves | Backend Developer | [LinkedIn](https://www.linkedin.com/in/eduardogoncalvesmesquita/) | [GitHub](https://github.com/eduuardo1st) |
| Guilherme Hermano | Data Engineer | [LinkedIn](https://www.linkedin.com/in/guilherme-ferreira17/) | [GitHub](https://github.com/guilherme-hermano) |
| Gustavo Mendes | Data Scientist | [LinkedIn](https://www.linkedin.com/in/gustavo-silveira-mendes/) | [GitHub](https://github.com/mendesgustavo) |
| Ihago Lamarcks | Data Scientist | [LinkedIn](https://www.linkedin.com/in/ihago-lamarcks1/) | [GitHub](https://github.com/Lamarcks) |
| João Vitor | Software Engineer | [LinkedIn](https://www.linkedin.com/in/joaovitordevv/) | [GitHub](https://github.com/uuhjuao) |
| José Anderson | Backend Developer | [LinkedIn](https://www.linkedin.com/in/dessima/) | [GitHub](https://github.com/DessimA) |
| Juscileia Noleto | Frontend Developer | [LinkedIn](https://www.linkedin.com/in/juscileia-noleto-15j/) | [GitHub](https://github.com/juscileianoleto1) |
| Matheus Carvalho | Backend Developer | [LinkedIn](https://www.linkedin.com/in/matheuscarvalho-/) | [GitHub](https://github.com/matheus-carvalh0) |
| Melissa Mel | Data Engineer | [LinkedIn](https://www.linkedin.com/in/melissa-mel-freitas-vanni) | [GitHub](https://github.com/Mel-Vanni) |

## Documentação complementar

- [Arquitetura hexagonal](./docs/arquitetura-hexagonal.md) - descrição do padrão Ports and Adapters
- [Arquitetura do projeto](./docs/arquitetura.md) - estrutura de diretórios e responsabilidades
- [Contrato de API](./docs/contrato-api.md) - definição dos endpoints
- [Guia de execução](./docs/guia-execucao.md) - instruções detalhadas para Docker e script local
- [Variáveis de ambiente](./docs/environment.md) - referência completa das env vars
- [Banco de dados](./docs/database.md) - esquema e migrações Flyway
- [ML Service](./docs/ml-service.md) - arquitetura, modelo e endpoints do microsserviço Python
- [Frontend](./docs/frontend.md) - arquitetura, componentes e testes da interface
- [Segurança](./docs/security.md) - autenticação, JWT, cookies e SSO
- [CI/CD](./docs/ci-cd.md) - pipelines do GitHub Actions
- [Testes](./docs/testing.md) - estratégia e cobertura
- [Swagger UI](./docs/teste-openapi.md) - guia prático para testar a API no navegador
- [Dependências](./docs/dependency-doc.md) - documentação das bibliotecas
- [Design system](./docs/modulos/design-system.md) - guia de estilo visual do frontend
- [ml-qa](./ml-qa/README.md) - suíte de qualidade do ML Service
- [Licença](./docs/license.md) - termos de uso do projeto
- [ADR](./docs/adr/) - registro de decisões arquiteturais
- [Glossário](./docs/glossario.md) - dicionário de domínio do projeto
