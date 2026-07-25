# Testes - Estratégia e Cobertura

Documentação da estratégia de testes do projeto, incluindo tipos de teste, frameworks, e como executá-los.

## Índice

- [Visão Geral](#visão-geral)
- [Backend - Testes Unitários](#backend---testes-unitários)
- [Backend - Testes de Integração](#backend---testes-de-integração)
- [Backend - Testes de Contrato](#backend---testes-de-contrato)
- [Frontend - Testes](#frontend---testes)
- [ML Service - Testes](#ml-service---testes)
- [Como Executar](#como-executar)
- [Cobertura](#cobertura)

---

## Visão Geral

| Camada | Framework | Tipos de Teste |
|---|---|---|
| Backend | JUnit 5 + Spring Boot Test | Unitários, Integração, Contrato |
| Frontend | Vitest + Testing Library | Unitários, Componentes |
| ML Service | pytest | Unitários, Integração |

## Backend - Testes Unitários

Localizados em `backend/src/test/java/br/com/group18/energiai/`.

### EnergyAnalysisServiceTest

Testa o serviço de análise energética:

- Execução de análise com dados válidos
- Validação de fallback rule-based
- Comportamento com ML Service indisponível
- Simulação de análise (endpoint simulate)

### ApplianceAggregationServiceTest

Testa a agregacao de aparelhos:

- Calculo de distribuicao de potencia por categoria
- Agregacao de multiplos aparelhos com diferentes quantidades e potencias
- Mapeamento de categorias para distribuicao (refrigeration, heating, AC, lighting)

### AnalysisMapperExtendedTest (13 testes)

Testa o mapper da Anti-Corruption Layer:

- Mapeamento completo de resposta do ML
- Recomendacoes vazias/nulas
- Probabilidade como inteiro e string numerica
- Valores de probabilidade fora do intervalo [0, 1]
- Categoria ausente, em branco ou invalida
- Recomendacao como string unica (nao lista)
- Source vazio
- Chaves customizadas de campos

### AuthenticationServiceTest

Testa o serviço de autenticação:

- Registro de novos usuários
- Login com BCrypt
- Login com SHA-256 legado (migração)
- Validação de credenciais inválidas
- Redefinição de senha

### PropertyServiceTest

Testa o serviço de imóveis:

- ForbiddenOperationException ao acessar imóvel de outro usuário

### PropertyServiceExtendedTest (13 testes)

Testa o serviço de imóveis de forma abrangente:

- CRUD completo (create, list, getOwned, update, delete)
- Criacao com/sem campos opcionais (address, residentCount, areaSqm)
- Gerenciamento de aparelhos (addOrUpdate, remove, batch update)
- Casos de erro (propriedade inexistente, aparelho nao encontrado, remocao de item nao vinculado)

### JwtServiceTest

Testa a geração e validação de tokens JWT:

- Geração de token com subject correto
- Validação de token válido
- Rejeição de token expirado
- Rejeição de token com assinatura inválida

## Backend - Testes de Integração

### AuthControllerIntegrationTest

Testa o fluxo completo de autenticação via HTTP:

- Registro → Login → /auth/me → Logout

### PropertyControllerIntegrationTest

Testa o CRUD de imóveis via HTTP:

- Criação com tipo válido (RESIDENCIAL, COMERCIAL)
- Rejeição de tipo inválido (ex: "Casa")
- Consulta de imóveis do usuário

### AnalysisControllerIntegrationTest

Testa o fluxo de análise via HTTP:

- Criação de propriedade → Execução de análise → Verificação de resultado

### DatabasePopulationIntegrationTest

Testa a comunicação completa entre todas as camadas:

- Registro → Criação de imóvel → Adição de aparelhos → Análise → Dashboard

## Backend - Testes de Contrato

### MlContractTest (8 testes)

Testa a compatibilidade do contrato com o ML Service:

- Verifica se o schema do predict request contem todos os campos esperados
- Valida se todas as categorias validas sao aceitas pelo mapper
- Testa valores de probabilidade no intervalo [0, 1]
- Rejeita categorias invalidas, nulas e ausentes
- Rejeita probabilidades invalidas
- Testa case-insensitivity e trim no EfficiencyCategory

### Contract Tests (ADR-0023)

Os testes de contrato validam a compatibilidade entre o ML Service e o backend sem exigir que o ML esteja rodando, testando diretamente o mapper e o value object.

## Frontend - Testes

Localizados em `frontend/src/test/`.

### api.test.ts

Testa as funções do serviço de API:

- `analyzeEnergy`: sucesso e erro
- `login`: sucesso e credenciais inválidas  
- `register`: sucesso e email duplicado
- `listAnalyses`: retorno do histórico
- `fetchDashboard`: dados do dashboard
- `createProperty` / `listProperties`: CRUD de imóveis
- `listPropertyAppliances` / `listAppliances`: catálogo de aparelhos

### AuthContext.test.tsx

Testa o contexto de autenticação com mocking do fetch:

- Login com sucesso (restaura sessão)
- Login com erro (senha inválida)
- Registro seguido de login
- Logout (limpa sessão)
- Redefinição de senha
- Redirecionamento por passwordResetRequired

### PrivateRoute.test.tsx

Testa o componente de proteção de rota:

- Usuário autenticado → renderiza rota
- Usuário não autenticado → redireciona para /login
- Usuário com passwordResetRequired → redireciona para /reset-password

### ResetPasswordPage.test.tsx

Testa a página de redefinição de senha:

- Renderização dos campos
- Validação de senhas diferentes
- Validação de tamanho mínimo
- Submissão com sucesso

### types.test.ts

Testa as constantes e utilitários:

- Mapeamento CATEGORY_DISPLAY
- Constantes PROPERTY_TYPES
- Classe ApiError

## Como Executar

```bash
# Todos os testes do backend
./run.sh test:backend
# ou
cd backend && ./mvnw test

# Todos os testes do frontend
./run.sh test:frontend
# ou
cd frontend && npm test

# Todos os testes
./run.sh test

# Testes específicos do backend
cd backend && ./mvnw test -Dtest="EnergyAnalysisServiceTest"

# Testes de contrato do backend
cd backend && ./mvnw test -Dtest="MlContractTest"
```

## Cobertura

O projeto prioriza testes de serviços (lógica de negócio) e integração (fluxos completos). Controllers têm cobertura via testes de integração com MockMvc.

---

> **Nota:** Consulte o [guia de execução](./guia-execucao.md) para instruções detalhadas de execução dos testes.
