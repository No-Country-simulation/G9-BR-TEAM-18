# Contrato de API

Definição das interfaces de comunicação entre o frontend, o backend (Spring Boot) e a API de inteligência artificial (Python).

## Parte 1: Contratos do frontend (comunicação com o Spring Boot)

### Endpoint: Registro do usuário

**`POST /auth/register`**

```json
// Request
{ "name": "João Silva", "email": "joao@email.com", "password": "senha123" }

// Response 201 Created
{
  "id": 12,
  "name": "João Silva",
  "email": "joao@email.com",
  "token": "eyJhbGciOiJIUzM4NiJ9...",
  "passwordResetRequired": false
}
```

**Nota:** O campo `token` é o mesmo JWT enviado no cookie `SESSION_TOKEN`. Ele é exposto no corpo para facilitar testes fora do navegador (ex: curl, Postman). Para usá-lo, envie o header `Cookie: SESSION_TOKEN=<token>` (o backend autentica exclusivamente via cookie - o header `Authorization: Bearer` não é suportado).

### Endpoint: Login do usuário

**`POST /auth/login`**

```json
// Request
{ "email": "joao@email.com", "password": "senha123" }

// Response 200 OK
{
  "id": 12,
  "name": "João Silva",
  "email": "joao@email.com",
  "token": "eyJhbGciOiJIUzM4NiJ9...",
  "passwordResetRequired": false
}
```

**Nota:** A sessão é gerenciada via cookie `SESSION_TOKEN` (httpOnly, Secure). O campo `token` no corpo é o mesmo JWT do cookie, incluído para facilitar testes fora do navegador.

### Endpoint: Dados do usuário logado

**`GET /auth/me`**

```json
// Response 200 OK
{ "id": 12, "name": "João Silva", "email": "joao@email.com", "passwordResetRequired": false }
```

### Endpoint: Logout

**`POST /auth/logout`** - Invalida o token JWT atual e limpa o cookie de sessão.

### Endpoint: Redefinir senha

**`POST /auth/reset-password`**

```json
// Request
{ "currentPassword": "senha123", "newPassword": "novaSenha456" }

// Response 200 OK
{ "id": 12, "name": "João Silva", "email": "joao@email.com" }
```

### Endpoint: Geração da análise energética

**`POST /energy-analysis`**

```json
// Request (201 Created)
{
  "property_id": 1,
  "consumption_kwh": 420.0,
  "peak_hour_usage": true,
  "high_consumption_hours": 8.5
}

// Response 201 Created
{
  "id": 501,
  "propertyId": 1,
  "consumptionKwh": 420.0,
  "peakHourUsage": true,
  "highConsumptionHours": 8.5,
  "estimatedMonthlyCost": 315.00,
  "category": "MEDIANO",
  "probability": 0.78,
  "status": "CONCLUIDA",
  "source": "model",
  "recommendations": [
    "Reduzir o uso de equipamentos potentes durante os horários de pico (18h às 21h).",
    "Considere substituir equipamentos antigos por modelos mais eficientes.",
    "Distribua o uso de equipamentos ao longo do dia para reduzir o horário de alto consumo."
  ],
  "createdAt": "2026-07-24T10:30:00",
  "updatedAt": "2026-07-24T10:30:05"
}
```

**Categorias válidas:** `EXCELENTE`, `BOM`, `MEDIANO`, `RUIM`, `CRITICO`

**Valores de `status`:** `PENDENTE` (em processamento), `CONCLUIDA` (processada com sucesso), `FALHA` (erro no processamento). Análises simuladas via `/energy-analysis/simulate` retornam `SIMULADO`.

**Valores de `source`:** `model` (classificador treinado), `model+groq` (com fallback LLM), `rule-based` (fallback por regras). O frontend normaliza estes valores exibindo "Modelo ML" para `model*` e "Fallback" para `rule-based*` (ADR-0047).

### Endpoint: Simulação de análise (não persiste)

**`POST /energy-analysis/simulate`**

Mesma entrada/saída de `/energy-analysis`, porém **não persiste o resultado** no banco de dados.
O campo `status` retorna `"SIMULADO"` e `id`/`createdAt`/`updatedAt` vêm `null`.

Útil para testes de cenários "e se" sem poluir o histórico.

### Endpoint: Listar análises do usuário

**`GET /analyses`** - Retorna todas as análises do usuário autenticado, ordenadas por data.

### Endpoint: Buscar análise por ID

**`GET /analyses/{analysisId}`** - Retorna uma análise específica, validando que pertence ao usuário.

### Endpoint: Dashboard

**`GET /dashboard`**

```json
// Response 200 OK
{
  "totalAnalyses": 5,
  "averageConsumptionKwh": 320.5,
  "totalEstimatedCost": 1200.00,
  "totalCo2EmissionKg": 30.72,
  "monthlyConsumption": [
    { "month": "jun/2026", "consumptionKwh": 350.0 },
    { "month": "jul/2026", "consumptionKwh": 420.0 }
  ]
}
```

### Endpoint: Categorias válidas (schema discovery)

**`GET /energy-analysis/categories`**

```json
// Response 200 OK
["EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO"]
```

### Endpoint: CRUD de imóveis (properties)

**`POST /properties`** - Criar imóvel
**`GET /properties`** - Listar imóveis
**`PUT /properties/{id}`** - Atualizar imóvel
**`DELETE /properties/{id}`** - Excluir imóvel

```json
// POST /properties Request (alias é o nome do imóvel)
{
  "alias": "Minha Casa",
  "propertyType": "RESIDENCIAL",
  "address": "Rua Exemplo, 123",
  "residentCount": 4,
  "areaSqm": 80.0,
  "active": true
}

// Response
{
  "id": 1,
  "alias": "Minha Casa",
  "propertyType": "RESIDENCIAL",
  "active": true,
  "address": "Rua Exemplo, 123",
  "residentCount": 4,
  "areaSqm": 80.0
}
```

**Tipos de imóvel válidos:** `RESIDENCIAL`, `APARTAMENTO`, `COMERCIAL` (migration V13)

### Endpoint: Aparelhos do imóvel

**`GET /appliances`** - Lista o catálogo de aparelhos disponíveis.

**`GET /properties/{id}/appliances`** - Lista os aparelhos vinculados a um imóvel.

**`POST /properties/{id}/appliances`** - Vincula um aparelho.

**`PUT /properties/{id}/appliances/{applianceId}`** - Atualiza quantidade.

**`PUT /properties/{id}/appliances/batch`** - Atualiza todos os aparelhos de uma vez:

```json
// Request
[
  { "applianceId": 1, "quantity": 2 },
  { "applianceId": 5, "quantity": 1 }
]
```

Aparelhos não listados são removidos do imóvel.

**`DELETE /properties/{id}/appliances/{applianceId}`** - Remove um aparelho do imóvel.

---

## Parte 2: Contrato interno (backend com ML Service)

Comunicação entre o backend Java e a API Python de predição.

### Endpoint: Predição

**`POST /predict`**

```json
// Request (enviado pelo backend)
{
  "consumption_kwh": 420.0,
  "peak_hour_usage": true,
  "equipment_quantity": 10,
  "property_type": "RESIDENCIAL",
  "high_consumption_hours": 8.5,
  "highest_consumption_category": "CLIMATE_CONTROL",
  "daily_consumption_distribution": {
    "REFRIGERATION_WATTS": 1500.0,
    "HEATING_WATTS": 7500.0,
    "AIR_CONDITIONING_WATTS": 4200.0,
    "LIGHTING_WATTS": 800.0
  }
}

// Response 200 OK
{
  "category": "MEDIANO",
  "probability": 0.78,
  "recommendations": [
    "Reduzir o uso de ar-condicionado ou ajustar a temperatura para 23°C.",
    "Evitar banhos longos ou com o chuveiro elétrico na potência máxima.",
    "Avalie a real necessidade de todos os equipamentos ligados simultaneamente."
  ],
  "source": "model"
}
```

### Endpoint: Predição simulada (sem log de treinamento)

**`POST /predict/simulate`** - Mesma entrada/saída de `/predict`, porém **não armazena** os dados no log de treinamento (`treino_feedback.jsonl`).

### Endpoint: Schema descoberta

**`GET /predict-schema`** - Retorna o schema JSON do `PredictRequest` para validação dinâmica.

### Endpoint: Categorias válidas

**`GET /categories`**

```json
// Response
{ "categories": ["EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO"] }
```

### Endpoint: Status

**`GET /status`** - Retorna status do modelo, Groq disponível e limites de taxa.

---

> **Nota:** Consulte a [arquitetura do projeto](./arquitetura.md) para entender como as camadas se integram, o [guia de execução](./guia-execucao.md) para instruções de deploy, e o [glossário do projeto](./glossario.md) para definição dos termos de domínio.
