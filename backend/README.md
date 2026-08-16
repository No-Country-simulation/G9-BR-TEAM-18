# EnergiAI - Backend

API REST do EnergiAI, construída com **Java 21 + Spring Boot 4.1** seguindo **Arquitetura Hexagonal**
(Ports and Adapters). Responsável pelas regras de negócio, autenticação, persistência (Oracle ATP via
Flyway) e orquestração das análises com o ML Service.

## Pré-requisitos

- Java 21 (Eclipse Temurin recomendado)
- Maven 3.9+ (ou o wrapper `mvnw` incluso)

## Variáveis de ambiente

O backend é configurado exclusivamente por variáveis de ambiente (fail-fast no startup). Copie o
`.env.example` da raiz do repositório para `.env` e preencha os valores. Referência completa em
[docs/environment.md](../docs/environment.md).

Variáveis obrigatórias: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`,
`SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`, `OPENAPI_SERVER_URL`, `GOOGLE_CLIENT_ID`.

## Executar

```bash
# Via script da raiz (usa o mvnw)
./run.sh backend

# Ou diretamente
cd backend
./mvnw spring-boot:run

# Ou via Docker Compose (a partir da raiz)
docker compose up -d backend
```

- API: <http://localhost:8080>
- Swagger UI: <http://localhost:8080/swagger-ui.html>
- JSON do contrato: <http://localhost:8080/api-docs>

## Testes

```bash
cd backend
./mvnw test
```

## Estrutura

- `core/` - domínio puro (sem Spring): modelos, exceções, portas
- `application/` - serviços de orquestração (casos de uso)
- `infrastructure/` - adapters web/persistência, Anti-Corruption Layer do ML Service e configuração

## Documentação

- [Contrato de API](../docs/contrato-api.md)
- [Arquitetura do projeto](../docs/arquitetura.md)
- [Banco de dados e migrações](../docs/database.md)
- [Segurança e autenticação](../docs/security.md)
- [Registro de decisões (ADR)](../docs/adr/)
