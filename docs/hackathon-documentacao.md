# EnergiAI - Plataforma de Eficiência Energética Residencial

## 1. Visão Geral

EnergiAI é uma plataforma web que ajuda o usuário a entender e reduzir o consumo de energia
da sua residência. A partir de um inventário de aparelhos e de hábitos de uso, a plataforma
estima o consumo mensal em kWh, classifica a eficiência energética do imóvel (EXCELENTE,
BOM, MEDIANO, RUIM ou CRITICO), gera recomendações práticas e permite simular cenários
(troca de aparelhos, mudança de hábitos e horários de pico).

O sistema é composto por três serviços independentes e uma suíte de qualidade:

- **Backend** (Spring Boot 4 + Java 21): API REST, autenticação, regras de negócio e persistência em Oracle.
- **Frontend** (React 19 + Vite): interface web responsiva com temas claro/escuro.
- **ML Service** (FastAPI + scikit-learn): classificação de eficiência, catálogo de aparelhos e retreino do modelo.
- **ml-qa**: suíte black-box que avalia a qualidade das respostas do ML Service.

## 2. Problema e Objetivos

O problema: o usuário residencial não tem visibilidade sobre o próprio consumo, não sabe quais aparelhos mais pesam na conta e onde há desperdício. As recomendações genéricas (ex.: "troque a geladeira") não consideram o inventário real do imóvel.

Objetivos do projeto:

- Estimar consumo por aparelho e por categoria a partir de dados reais (Pesquisa PPH 2019).
- Classificar a eficiência energética do imóvel com modelo de Machine Learning.
- Gerar recomendações contextualizadas ao inventário do usuário (ADR-0057).
- Permitir simulação de cenários e definição de metas de consumo, incluindo horário de pico (Task B051).
- Evoluir continuamente o modelo com feedback real (retreino).

## 3. Arquitetura

```text
Navegador (React)
   │  HTTPS / JSON (snake_case) + cookie de sessão
   ▼
Backend Spring Boot ──► Oracle ATP (Flyway V1-V16)
   │
   │ HTTP
   ▼
ML Service FastAPI  ──► modelo .joblib + Groq (fallback LLM)
```

O frontend consome exclusivamente o backend. O backend consome o ML Service para predição e
sincroniza o catálogo de aparelhos (`/appliance-catalog`). No ML Service, a decisão é:
confiança >= 80% usa o modelo; abaixo disso usa o Groq (LLM) quando configurado; sem Groq,
usa regras de negócio. O resultado informa a `source` (model, model+groq ou rule-based).

## 4. Stack Tecnológica

- **Frontend**: React 19, Vite, TypeScript, React Router, Recharts, @react-oauth/google, Vitest e Playwright.
- **Backend**: Spring Boot 4, Java 21, Spring Security, Flyway, JUnit/Mockito, Testcontainers e Maven.
- **ML Service**: Python, FastAPI, scikit-learn (RandomForest + calibração isotônica), pandas, joblib e Groq SDK.
- **Banco de dados**: Oracle Autonomous Transaction Processing (ATP).
- **Infra/CI**: GitHub Actions (12 workflows), Docker, Docker Hub e Oracle Cloud (VMs + Nginx + Let's Encrypt + Object Storage).

## 5. Funcionalidades Principais

- **Autenticação**: registro e login por e-mail/senha, **SSO Google** (validação de ID Token, ADR-0052), logout, reset de senha e reset por administrador.
- **Perfil do imóvel**: cadastro com tipo, área e moradores; inventário de aparelhos a partir do catálogo (37 tipos com consumo em watts e horas de uso).
- **Análise de consumo**: 19 features (perfil + hábitos) geram categoria, probabilidade e recomendações por aparelho.
- **Dashboard**: estatísticas, metas, gráficos de consumo e simulação de cenários.
- **Histórico**: análises passadas com detalhamento por aparelho e exclusão.
- **Preferências (B051)**: meta de consumo, regularidade, uso em horário de pico e horas de alto consumo, persistidas via `GET /auth/me` e `PUT /auth/preferences`.
- **Catálogo dinâmico**: sincronizado do ML Service, com fallback no contrato 3.0.0.

## 6. Backend (Spring Boot + Java 21)

Arquitetura **hexagonal**: `core/domain` (modelos e regras), `application` (casos de uso e DTOs) e `infrastructure` (controllers, persistência, clientes HTTP).

- **Segurança**: JWT (HMAC-SHA384) em cookie HttpOnly, com `SameSite=Lax` (dev) ou `SameSite=None + Secure` (produção), CORS configurável e blacklist de tokens de logout.
- **API principal**: `/auth/*` (register, login, google, logout, reset-password, admin/reset-password/{userId}, me, preferences), `/properties` e `/properties/{id}/appliances` (CRUD), `/energy-analysis` (+ `/simulate`, `/categories`), `/analyses`, `/dashboard`.
- **Banco**: Oracle ATP com **Flyway V1 a V16** (schema, catálogo de aparelhos, blacklist, preferências, snapshot de histórico, status de análise, auth_provider, horário de pico).

**Task B051 (entrega recente)**: a migration `V15__add_peak_hour_and_high_consumption_to_users.sql`
adiciona `peak_hour_usage` (boolean) e `high_consumption_hours` (decimal) em `tb_user`; a
entidade `User` e o DTO `UserPreferences` foram atualizados; `GET /auth/me` retorna as
preferências e `PUT /auth/preferences` as salva. O teste de integração foi refatorado para
`AuthControllerTest` com `@WebMvcTest` + Mockito, eliminando a dependência de banco Oracle e
de variáveis de ambiente no teste (roda em milissegundos e valida o contrato HTTP).

## 7. ML Service (FastAPI + scikit-learn)

- Modelo RandomForest com **calibração isotônica** e espaço de busca restrito do RandomizedSearchCV.
- 19 features derivadas do perfil do imóvel e dos hábitos; 5 categorias de eficiência.
- **Retreino contínuo**: predições e feedback são registrados em JSONL e usados no retreino (amostras sintéticas + feedback ponderado).
- **Groq como fallback**: confiança < 80% consulta um LLM (rate limit 25 RPM / 900 RPD) para melhorar a recomendação.
- **Endpoints**: `/predict`, `/predict/simulate`, `/predict-schema`, `/contract`, `/appliance-catalog`, `/categories`, `/status`.

## 8. Banco de Dados

Oracle ATP (produção). Migrações Flyway versionadas (V1-V16). Tabelas principais: `tb_user`
(inclui `auth_provider`, `peak_hour_usage`, `high_consumption_hours`), `tb_property`,
`tb_appliance`, `tb_energy_analysis`, `tb_analysis_recommendation`,
`tb_analysis_appliance_snapshot` e `tb_token_blacklist`. Em testes de CI, o backend usa
PostgreSQL via Testcontainers.

## 9. Frontend (React 19 + Vite)

Rotas: `/` (home), `/login`, `/register`, `/reset-password`, `/dashboard`, `/history` e `/profile`. Login com **popup do Google** e restauração de sessão via `GET /auth/me`. Temas claro/escuro com contraste **WCAG AA** validado por teste automatizado (52 pares de contraste).

## 10. Qualidade e Testes

- **Backend**: testes unitários de controller com `@WebMvcTest` + Mockito e testes de integração com Testcontainers; lint com Checkstyle e SpotBugs.
- **Frontend**: Vitest (componentes, contexto de auth e contraste de cores), Playwright E2E (91 cenários), ESLint e Prettier.
- **ml-qa**: suíte black-box que valida contrato, coerência entre aparelhos e consumo,
  distribuição de fontes (model/groq/regras) e violações de monotonicidade.
- **Docs**: markdownlint, cspell (pt-BR) e checagem de caracteres proibidos.

## 11. CI/CD

12 workflows no GitHub Actions: lint de cada serviço (backend, frontend, docs, infra e ML), testes automatizados e deploy de backend/ML (imagem no Docker Hub + deploy hook no Render). Regras de proteção da branch `dev` com validação da origem do PR.

## 12. Como Rodar Localmente

Pré-requisitos: Java 21, Node.js 24, Python 3.12, Docker (opcional) e arquivo `.env` (modelo em `.env.example`).

```bash
# Backend (porta 8080)
cd backend && ./mvnw spring-boot:run

# ML Service (porta 8000)
cd ml-service && pip install -r requirements.txt && uvicorn main:app --port 8000

# Frontend (porta 5173)
cd frontend && npm install && npm run dev
```

Ou, com Docker: `docker compose up --build`. Todos os serviços também podem ser iniciados por `./run.sh all`.

## 13. Deploy (Produção)

- **Backend e ML Service**: containers Docker em VMs da Oracle Cloud (backend em `163.176.54.241` e ML em `137.131.219.48`), com Nginx + Let's Encrypt para HTTPS.
- **Frontend**: build estático servido pelo **Nginx na VM do backend** em `https://energiaia.duckdns.org`, consumindo a API em `https://apienergiaia.duckdns.org`. O bucket `energiaia-frontend` do **Oracle Object Storage** guarda o `dist/` como artefato/backup.
- Variáveis críticas: `SPRING_DATASOURCE_*`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `CORS_ALLOWED_ORIGINS`, `SESSION_SECURE`, `OPENAPI_SERVER_URL`, `VITE_API_URL`, `GROQ_API_KEY` (detalhes em `docs/environment.md`).

## 14. Estrutura do Repositório

```text
backend/       API Spring Boot (hexagonal, migrações Flyway, testes)
frontend/      Aplicação React/Vite (páginas, componentes, E2E)
ml-service/    ML Service FastAPI (modelo, features, retreino)
ml-qa/         Suíte black-box de qualidade do ML
docs/          ADRs, guias, contrato da API, ambiente e deploy
scripts/       Scripts de apoio (deploy OCI, checagem de docs)
.github/       Workflows de CI/CD
```

## 15. Links

- **Repositório**: [No-Country-simulation/G9-BR-TEAM-18](https://github.com/No-Country-simulation/G9-BR-TEAM-18)
- **Aplicação (produção)**: [https://energiaia.duckdns.org](https://energiaia.duckdns.org)
- **API / Swagger (produção)**: [https://apienergiaia.duckdns.org/api-docs](https://apienergiaia.duckdns.org/api-docs)
- **Documentação**: `docs/` (ADR-0052 SSO, ADR-0057 catálogo, contrato da API, guia de execução, variáveis de ambiente, deploy OCI)
- **Vídeo demo**: [Vídeo no Youtube da Demo](https://youtu.be/SaB99nh2dFM?feature=shared)

---

Projeto desenvolvido pela equipe G9-BR-TEAM-18 durante o Hackathon ONE.
