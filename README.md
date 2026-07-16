# G9-BR-TEAM-18 — EnergIAI

## Inteligência Artificial para Análise de Consumo Energético

O **EnergIAI** é um MVP desenvolvido pela equipe **G9-BR-TEAM-18** durante o Hackathon **ONE G9-BR (Alura + Oracle + NoCountry)**.

O projeto **EnergIAI** tem como objetivo analisar padrões de consumo de energia elétrica, classificar o perfil energético de residências e pequenos estabelecimentos, estimar custos mensais e gerar recomendações para redução do consumo.

---

## Problema

O consumo de energia representa um dos principais custos para residências e pequenos negócios. Entretanto, a maioria dos consumidores possui pouca visibilidade sobre quais hábitos e equipamentos têm maior impacto na conta de energia.

---

## Objetivo

Desenvolver uma solução capaz de:

* Analisar padrões de consumo energético;
* Classificar o perfil de consumo utilizando um modelo de Machine Learning;
* Gerar recomendações para otimização do consumo;
* Estimar o custo mensal com base em uma tarifa de referência;
* Disponibilizar os resultados por meio de uma API REST;
* Integrar a aplicação com serviços da Oracle Cloud Infrastructure (OCI).

---

## Estrutura do Repositório

```text
backend/        -> API Java (Spring Boot)
frontend/       -> interface web (React + Vite)
api-python/     -> notebook, dataset, modelo e API Python (FastAPI)
docker/         -> Dockerfiles
docs/           -> documentação do projeto
```

---

## Funcionalidades

* Classificação do perfil energético:
  * Eficiente
  * Moderado
  * Ineficiente
* Estimativa do custo mensal de energia;
* Geração de recomendações personalizadas;
* API REST para análise energética;
* Integração entre Backend e modelo de Machine Learning;
* Integração com Oracle Cloud Infrastructure (OCI).

---

## Como Executar Localmente (sem Docker)

### Pré-requisitos

- **Java 21** (recomendado: Eclipse Temurin)
- **Node.js 20+**
- **Python 3.12+**
- **Maven** (ou use o wrapper `mvnw` incluso)

### 1. Backend (Spring Boot — porta 8080)

```bash
cd backend/energiai-api
./mvnw spring-boot:run
```

A API ficará disponível em `http://localhost:8080`.
Swagger UI: `http://localhost:8080/swagger-ui.html`
H2 Console: `http://localhost:8080/h2-console`

### 2. Frontend (React + Vite — porta 5173)

```bash
cd frontend
npm install
npm run dev
```

Acessar em `http://localhost:5173`.

### 3. API Python (FastAPI — porta 8000)

```bash
cd api-python
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Script auxiliar `run.sh`

```bash
./run.sh backend      # inicia o backend
./run.sh frontend     # inicia o frontend
./run.sh python-api   # inicia a API Python
./run.sh test         # executa todos os testes
./run.sh build        # compila tudo
```

---

## Testes

### Backend (JUnit 5)

```bash
cd backend/energiai-api
./mvnw test
```

### Frontend (Vitest + Testing Library)

```bash
cd frontend
npm test
```

---

## Docker

```bash
docker compose up -d
```

Serviços:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Python API: `http://localhost:8000`

---

## API REST

### `POST /analise-energetica`

```json
{
  "consumoKwh": 250,
  "usoHorarioPico": true,
  "quantidadeEquipamentos": 12,
  "tipoImovel": "Casa",
  "horasAltoConsumo": 6
}
```

Resposta:

```json
{
  "id": 1,
  "categoria": "ALTO",
  "probabilidade": 0.85,
  "recomendacoes": ["Reduzir o uso de equipamentos potentes durante os horários de pico (18h às 21h)."],
  "custoEstimadoMensal": 187.5,
  "createdAt": "2026-07-15T12:00:00"
}
```

---

## Membros

Eduardo Gonçalves  
Gustavo Mendes  
Guilherme Hermano  
Ihago Lamarcks  
João Vitor  
Juscileia Noleto  
Melissa Mel  
Matheus Carvalho
