# Contrato de API

Definição das interfaces de comunicação entre o frontend, o backend (Spring Boot) e a API de inteligência
artificial (Python).

> **Formato:** a serialização das respostas do backend é feita em **snake_case** (Jackson
> `property-naming-strategy=SNAKE_CASE`), inclusive campos compostos: `property_id`, `consumption_kwh`,
> `estimated_monthly_cost`, `created_at`. Requisições do frontend também usam snake_case.

## Parte 1: Contratos do frontend (comunicação com o Spring Boot)

Todos os endpoints de auth ficam sob o prefixo `/auth`.

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
  "password_reset_required": false,
  "auth_provider": "LOCAL"
}
```

**Nota:** O campo `token` é o mesmo JWT enviado no cookie `SESSION_TOKEN`. Ele é exposto no corpo para
facilitar testes fora do navegador (ex: curl, Postman). Para usá-lo, envie o header
`Cookie: SESSION_TOKEN=<token>` (o backend autentica exclusivamente via cookie; o header
`Authorization: Bearer` não é suportado).

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
  "password_reset_required": false,
  "auth_provider": "LOCAL"
}
```

**Nota:** A sessão é gerenciada via cookie `SESSION_TOKEN` (httpOnly, Secure conforme `SESSION_SECURE`).
O campo `token` no corpo é o mesmo JWT do cookie.

### Endpoint: Login com Google (SSO)

**`POST /auth/google`** (ADR-0052)

```json
// Request: credential do Google Identity Services (ID Token)
{ "credential": "<id_token_do_google>" }

// Response 200 OK - mesmo formato do login, com auth_provider "GOOGLE"
{
  "id": 12,
  "name": "João Silva",
  "email": "joao@email.com",
  "token": "eyJhbGciOiJIUzM4NiJ9...",
  "password_reset_required": false,
  "auth_provider": "GOOGLE"
}
```

O ID Token é validado no backend com o `GOOGLE_CLIENT_ID` (assinatura, emissor e audiência). Se o e-mail
ainda não existir, o usuário é criado automaticamente. Requer `VITE_GOOGLE_CLIENT_ID` configurado no
frontend (mesmo valor do backend).

### Endpoint: Dados do usuário logado

**`GET /auth/me`**

```json
// Response 200 OK
{ "id": 12, "name": "João Silva", "email": "joao@email.com", "password_reset_required": false, "auth_provider": "LOCAL" }
```

### Endpoint: Preferências do usuário

**`PUT /auth/preferences`**

```json
// Request
{ "consumption_goal": 250, "regularity": "mensal", "peak_hour_usage": true, "high_consumption_hours": 5.5 }

// Response 200 OK
{ "id": 12, "consumption_goal": 250.0, "regularity": "mensal", "peak_hour_usage": 1, "high_consumption_hours": 5.5 }
```

Valores válidos de `regularity`: `instantanea`, `diaria`, `semanal`, `mensal`.

### Endpoint: Logout

**`POST /auth/logout`** - Invalida o token JWT atual (blacklist) e limpa o cookie de sessão.

### Endpoint: Redefinir senha

**`POST /auth/reset-password`**

```json
// Request
{ "currentPassword": "senha123", "newPassword": "novaSenha456" }

// Response 200 OK
{ "id": 12, "name": "João Silva", "email": "joao@email.com" }
```

### Endpoint: Redefinição de senha pelo admin

**`POST /auth/admin/reset-password/{userId}`**

```json
// Request
{ "newPassword": "NovaSenha123!" }

// Response 200 OK
{ "message": "Senha redefinida com sucesso." }
```

Após a redefinição, o flag `password_reset_required` é marcado como `true` e o usuário é direcionado a
`/reset-password` no próximo login.

### Endpoint: Geração da análise energética

**`POST /energy-analysis`**

```json
// Request (201 Created)
{
  "property_id": 1,
  "consumption_kwh": 420.0,
  "peak_hour_usage": true,
  "high_consumption_hours": 8.5,
  "highest_consumption_category": "REFRIGERATION"
}

// Response 201 Created
{
  "id": 501,
  "property_id": 1,
  "consumption_kwh": 420.0,
  "peak_hour_usage": true,
  "high_consumption_hours": 8.5,
  "estimated_monthly_cost": 315.00,
  "category": "MEDIANO",
  "probability": 0.78,
  "status": "CONCLUIDA",
  "source": "model",
  "recommendations": [
    "Verifique a vedação da geladeira e evite deixá-la encostada em paredes ou perto de fontes de calor, isso força o motor a trabalhar mais.",
    "Evite usar equipamentos de maior potência entre 18h e 21h, esse é o horário de pico e costuma pesar mais na conta."
  ],
  "highest_consumption_products": ["Geladeira", "Ar-condicionado"],
  "appliances": [
    {
      "name": "Geladeira",
      "category": "Refrigeração",
      "average_power_watts": 150.0,
      "average_daily_use_hours": 24.0,
      "monthly_consumption_kwh": 108.0
    }
  ]
}
```

- `property_id` é obrigatório; `consumption_kwh`, `peak_hour_usage` e `high_consumption_hours` também.
- `highest_consumption_category` é opcional (inferida a partir do inventário se ausente).
- `equipment_quantity` e `property_type` **não** são enviados pelo frontend: o backend deriva a quantidade
  de equipamentos do inventário do imóvel e o tipo da propriedade.

**Categorias válidas (resultado):** `EXCELENTE`, `BOM`, `MEDIANO`, `RUIM`, `CRITICO`.

**Valores de `status`:** `PENDENTE` (em processamento), `CONCLUIDA` (processada com sucesso),
`FALHA` (erro no processamento). Análises simuladas via `/energy-analysis/simulate` retornam `SIMULADO`.

**Valores de `source`:** `model` (classificador treinado), `model+groq` (com fallback LLM),
`rule-based` (fallback por regras). Em runtime os valores podem vir com sufixos descritivos, ex:
`model (confidence 62.5%)` ou `rule-based (model error)`. O frontend normaliza exibindo "Modelo ML" para
`model*` e "Fallback" para `rule-based*` (ADR-0047).

### Endpoint: Simulação de análise (não persiste)

**`POST /energy-analysis/simulate`**

Mesma entrada/saída de `/energy-analysis`, porém **não persiste o resultado** no banco de dados.
O campo `status` retorna `"SIMULADO"` e `id` vem `null`.

### Endpoint: Listar análises do usuário

**`GET /analyses`** - Retorna todas as análises do usuário autenticado, ordenadas por data (mais recente primeiro).

### Endpoint: Buscar análise por ID

**`GET /analyses/{analysisId}`** - Retorna uma análise específica, validando que pertence ao usuário.
Inclui `appliances` (snapshot dos equipamentos no momento da análise) e `highest_consumption_products`.

### Endpoint: Excluir análise

**`DELETE /analyses/{analysisId}`** - Exclui uma análise do usuário (`204 No Content`).

### Endpoint: Dashboard

**`GET /dashboard`**

```json
// Response 200 OK
{
  "total_analyses": 5,
  "average_consumption_kwh": 320.5,
  "total_estimated_cost": 1200.00,
  "total_co2_emission_kg": 30.72,
  "monthly_consumption": [
    { "month": "jun/2026", "consumption_kwh": 350.0 },
    { "month": "jul/2026", "consumption_kwh": 420.0 }
  ]
}
```

### Endpoint: Categorias válidas (schema discovery)

**`GET /energy-analysis/categories`**

```json
// Response 200 OK
["EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO"]
```

### Endpoint: Informações do contrato (schema discovery)

**`GET /contract-info`**

```json
// Response 200 OK
{
  "property_types": ["RESIDENCIAL", "APARTAMENTO", "COMERCIAL"],
  "consumption_categories": ["REFRIGERATION", "CLIMATE_CONTROL", "TECHNOLOGY", "LIGHTING", "APPLIANCES", "SERVICES", "OTHERS"],
  "efficiency_categories": ["EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO"]
}
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
  "property_type": "RESIDENCIAL",
  "address": "Rua Exemplo, 123",
  "resident_count": 4,
  "area_sqm": 80.0,
  "active": true
}

// Response
{
  "id": 1,
  "alias": "Minha Casa",
  "property_type": "RESIDENCIAL",
  "active": true,
  "address": "Rua Exemplo, 123",
  "resident_count": 4,
  "area_sqm": 80.0
}
```

**Tipos de imóvel válidos:** `RESIDENCIAL`, `APARTAMENTO`, `COMERCIAL` (migration V13 + ADR-0035).

### Endpoint: Aparelhos do imóvel

**`GET /appliances`** - Lista o catálogo de aparelhos (sincronizado do ML Service, ADR-0048).

```json
// Response
[
  { "id": 1, "name": "Geladeira", "ml_category": "REFRIGERATION", "watts": 150, "hours": 24 }
]
```

**`GET /properties/{id}/appliances`** - Lista os aparelhos vinculados a um imóvel.

**`POST /properties/{id}/appliances`** - Vincula um aparelho.

```json
{ "appliance_id": 1, "quantity": 2 }
```

**`PUT /properties/{id}/appliances/{applianceId}`** - Atualiza a quantidade.

**`PUT /properties/{id}/appliances/batch`** - Atualiza todos os aparelhos de uma vez:

```json
[
  { "appliance_id": 1, "quantity": 2 },
  { "appliance_id": 5, "quantity": 1 }
]
```

Aparelhos não listados são removidos do imóvel.

**`DELETE /properties/{id}/appliances/{applianceId}`** - Remove um aparelho do imóvel.

---

## Parte 2: Contrato interno (backend com ML Service)

Comunicação entre o backend Java e a API Python de predição. O backend usa uma Anti-Corruption Layer
com chaves configuráveis via env vars (`ML_OUTPUT_FIELD_*`, ADR-0020/0026).

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
  "highest_consumption_products": ["Ar-condicionado", "Geladeira", "Chuveiro eletrico"],
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
    "Limpe os filtros do ar-condicionado split regularmente, filtro sujo faz o aparelho consumir bem mais para resfriar o ambiente.",
    "Verifique a vedação da geladeira e evite deixá-la encostada em paredes ou perto de fontes de calor, isso força o motor a trabalhar mais."
  ],
  "source": "model"
}
```

### Endpoint: Predição simulada (sem log de treinamento)

**`POST /predict/simulate`** - Mesma entrada/saída de `/predict`, porém **não armazena** os dados no log
de treinamento (`treino_feedback.jsonl`).

### Endpoint: Schema de descoberta

**`GET /predict-schema`** - Retorna o schema JSON do `PredictRequest` para validação dinâmica.

### Endpoint: Contrato completo

**`GET /contract`** - Retorna versão, tipos de imóvel, categorias de eficiência/consumo e os schemas de
request/response (usado pelo Schema Discovery do backend, ADR-0021).

### Endpoint: Catálogo de aparelhos

**`GET /appliance-catalog`** - Retorna o catálogo de aparelhos reconhecidos pelo modelo
(`{"appliances": [{"name", "ml_category", "watts", "hours"}, ...]}`), sincronizado periodicamente pelo
backend (ADR-0048/0055).

### Endpoint: Categorias válidas

**`GET /categories`**

```json
// Response
{ "categories": ["EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO"] }
```

### Endpoint: Status

**`GET /status`** - Retorna `model_loaded`, `groq_available`, `groq_calls_today`, `groq_daily_limit`,
`groq_calls_per_minute` e `groq_minute_limit`.

---

> **Nota:** Consulte a [arquitetura do projeto](./arquitetura.md) para entender como as camadas se
> integram, o [guia de execução](./guia-execucao.md) para instruções de execução, o
> [guia de teste no Swagger](./teste-openapi.md) para o fluxo passo a passo e o
> [glossário do projeto](./glossario.md) para definição dos termos de domínio.
