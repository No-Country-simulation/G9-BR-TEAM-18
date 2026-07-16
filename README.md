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
backend/                -> API Java (Spring Boot) — regras de negócio, persistência
frontend/               -> interface web (React + Vite)
ml-service/             -> microsserviço de ML (FastAPI) — predição, modelo, inferência
  data/                 -> datasets sintéticos para treino
docker/                 -> Dockerfiles
docs/                   -> documentação do projeto
```

---

## Funcionalidades

* Classificação do perfil energético em 5 categorias:
  * Excelente / Bom / Mediano / Ruim / Crítico
* Estimativa do custo mensal de energia;
* Geração de recomendações personalizadas (via regras ou LLM Groq);
* API REST para análise energética;
* Fallback inteligente: modelo ML → Groq → regras;
* Auto-aprimoramento: logs de baixa confiança salvos para retreino.

---

## Como Executar Localmente (sem Docker)

### Pré-requisitos

- **Java 21** (recomendado: Eclipse Temurin)
- **Node.js 20+**
- **Python 3.12+**
- **Maven** (ou use o wrapper `mvnw` incluso)

### 1. Backend (Spring Boot — porta 8080)

```bash
cd backend
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

### 3. ML Service (FastAPI — porta 8000)

```bash
cd ml-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Script auxiliar `run.sh`

```bash
./run.sh backend       # inicia o backend
./run.sh frontend      # inicia o frontend
./run.sh ml-service    # inicia o ML Service
./run.sh test          # executa todos os testes
./run.sh build         # compila tudo
```

---

## Testes

### Backend (JUnit 5)

```bash
cd backend
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
- ML Service: `http://localhost:8000`

---

## API REST

### `POST /analise-energetica`

```json
{
  "consumo_kwh": 250,
  "uso_horario_pico": true,
  "quantidade_equipamentos": 12,
  "tipo_imovel": "Casa",
  "horas_alto_consumo": 6
}
```

Resposta:

```json
{
  "id": 1,
  "categoria": "MEDIANO",
  "probabilidade": 0.78,
  "recomendacoes": ["Reduzir o uso de equipamentos potentes durante os horários de pico (18h às 21h)."],
  "custo_estimado_mensal": 187.5,
  "created_at": "2026-07-15T12:00:00"
}
```

---

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
