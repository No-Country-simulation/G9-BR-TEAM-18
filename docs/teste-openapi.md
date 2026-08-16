# Testando a API no Swagger UI (OpenAPI)

Guia prático para testar todo o fluxo da API EnergiIA pela interface interativa do
Swagger UI (OpenAPI). Inclui o passo a passo do fluxo completo de autenticação até o
dashboard, com exemplos de corpo de requisição e instruções para testes fora do navegador.

## Sumário

- [Pré-requisitos](#pré-requisitos)
- [Acessando o Swagger UI](#acessando-o-swagger-ui)
- [Como funciona a autenticação](#como-funciona-a-autenticação)
- [Fluxo completo passo a passo](#fluxo-completo-passo-a-passo)
- [Testando fora do navegador (curl)](#testando-fora-do-navegador-curl)
- [Troubleshooting](#troubleshooting)

---

## Pré-requisitos

- Backend rodando via Docker: `docker compose up -d` (ver [guia de execução](./guia-execucao.md))
- Variável `OPENAPI_SERVER_URL` configurada no `.env` (ver [ambiente](./environment.md))
- Um e-mail válido ainda não cadastrado para criar o usuário de teste

## Acessando o Swagger UI

| Ambiente | URL |
|---|---|
| Local (Docker) | <http://localhost:8080/swagger-ui.html> |
| Local (JSON do contrato) | <http://localhost:8080/api-docs> |
| Produção (OCI) | <https://apienergiaia.duckdns.org/swagger-ui.html> |

> O endereço base exibido nos servidores do contrato é o valor da variável
> `OPENAPI_SERVER_URL`. Se a variável não estiver definida, o backend não inicia
> (fail-fast de segurança).

## Como funciona a autenticação

A API autentica via **cookie de sessão JWT** chamado `SESSION_TOKEN`:

1. `POST /auth/register` ou `POST /auth/login` devolvem o cookie `SESSION_TOKEN`
   no header `Set-Cookie` da resposta
2. O campo `token` do corpo da resposta contém o mesmo JWT do cookie (facilita
   testes fora do navegador)
3. No Swagger UI (mesma origem do backend), o navegador guarda o cookie
   automaticamente e o envia nas requisições seguintes - não é preciso copiar nada

> **Importante:** O backend autentica exclusivamente via cookie
> `Cookie: SESSION_TOKEN=<token>`. O header `Authorization: Bearer` não é suportado
> pelo `JwtAuthFilter`.

## Fluxo completo passo a passo

### 1. Registrar um usuário

Endpoint: `POST /auth/register`

Corpo da requisição:

```json
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "password": "minhaSenha123"
}
```

Resposta esperada: `201 Created`

```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "token": "eyJhbGciOiJIUzM4NiJ9...",
  "password_reset_required": false
}
```

### 2. Fazer login

Endpoint: `POST /auth/login`

```json
{
  "email": "joao@exemplo.com",
  "password": "minhaSenha123"
}
```

Resposta esperada: `200 OK`, com o mesmo formato do registro (inclui `token` e
define o cookie `SESSION_TOKEN`).

### 3. Verificar o usuário autenticado

Endpoint: `GET /auth/me`

Resposta esperada: `200 OK` com os dados do usuário. Se retornar `401`, o cookie
de sessão não está sendo enviado (ver [Troubleshooting](#troubleshooting)).

### 4. Atualizar preferências do usuário

Endpoint: `PUT /auth/preferences`

```json
{
  "consumption_goal": 250,
  "regularity": "mensal"
}
```

Valores válidos de `regularity`: `instantanea`, `diaria`, `semanal`, `mensal`.

Resposta esperada: `200 OK` com os dados atualizados.

### 5. Listar o catálogo de eletrodomésticos

Endpoint: `GET /appliances`

Resposta esperada: `200 OK` com a lista de aparelhos disponíveis. Cada item tem:

```json
{
  "id": 1,
  "name": "Geladeira Frost Free",
  "appliance_category": "REFRIGERATION",
  "average_power_watts": 150.0,
  "average_daily_use_hours": 8.0
}
```

> Anote os `id` dos aparelhos que deseja vincular na propriedade (passo 7).

### 6. Criar uma propriedade

Endpoint: `POST /properties`

```json
{
  "alias": "Minha Casa",
  "property_type": "RESIDENCIAL",
  "active": true,
  "address": "Rua das Flores, 123",
  "resident_count": 4,
  "area_sqm": 120.5
}
```

Valores válidos de `property_type`: `RESIDENCIAL`, `APARTAMENTO`, `COMERCIAL`.

Resposta esperada: `201 Created` com o `id` da propriedade criada.

> Anote o `id` da propriedade para usar nos passos seguintes.

### 7. Vincular eletrodomésticos à propriedade

**Opção A - adicionar um a um:** `POST /properties/{propertyId}/appliances`

```json
{
  "appliance_id": 1,
  "quantity": 2
}
```

**Opção B - atualizar todos de uma vez (batch):**
`PUT /properties/{propertyId}/appliances/batch`

```json
[
  { "appliance_id": 1, "quantity": 2 },
  { "appliance_id": 5, "quantity": 1 }
]
```

> No batch, aparelhos não listados são **removidos** da propriedade.

Resposta esperada: `200 OK` / `201 Created` com os aparelhos vinculados.

### 8. Executar uma análise energética

Endpoint: `POST /energy-analysis`

```json
{
  "property_id": 1,
  "consumption_kwh": 350.75,
  "peak_hour_usage": true,
  "high_consumption_hours": 5.5,
  "highest_consumption_category": "REFRIGERATION"
}
```

- `highest_consumption_category` é opcional (inferida se ausente). O valor esperado é
  uma **categoria de aparelho** (ex: `REFRIGERATION`, `CLIMATE_CONTROL`, `LIGHTING`),
  das mesmas listadas no catálogo do passo 5
- As categorias `EXCELENTE`, `BOM`, `MEDIANO`, `RUIM`, `CRITICO` são o **resultado**
  da análise (campo `category` da resposta), não valores de entrada

Resposta esperada: `201 Created` com `category`, `probability`, `source`
(`model`, `model+groq` ou `rule-based`) e `recommendations`.

### 9. Listar o histórico de análises

Endpoint: `GET /analyses`

Resposta esperada: `200 OK` com a lista de análises do usuário, ordenadas por data.

### 10. Buscar uma análise específica

Endpoint: `GET /analyses/{analysisId}`

Resposta esperada: `200 OK` com o detalhe da análise (inclui `appliances` e
`highest_consumption_products`).

### 11. Consultar o dashboard

Endpoint: `GET /dashboard`

Resposta esperada: `200 OK` com métricas agregadas:

```json
{
  "total_analyses": 1,
  "average_consumption_kwh": 350.75,
  "total_estimated_cost": 263.06,
  "total_co2_emission_kg": 33.67,
  "monthly_consumption": []
}
```

### 12. Simular uma análise (sem persistir)

Endpoint: `POST /energy-analysis/simulate`

Mesmo corpo do passo 8. Resposta esperada: `200 OK` com `status: "SIMULADO"` e
`id`/`created_at` nulos. Útil para testar cenários "e se" sem poluir o histórico.

### 13. Consultar as categorias válidas

Endpoint: `GET /energy-analysis/categories`

Resposta esperada: `200 OK` com o array de categorias:

```json
["EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO"]
```

### 14. Excluir uma análise

Endpoint: `DELETE /analyses/{analysisId}`

Resposta esperada: `204 No Content`. Use o `id` retornado no passo 9.

### 15. Encerrar a sessão

Endpoint: `POST /auth/logout`

Resposta esperada: `200 OK`. O token é adicionado à blacklist e o cookie é limpo.

> A partir daqui, `GET /auth/me` deve retornar `401`.

## Testando fora do navegador (curl)

O campo `token` do corpo da resposta de login/registro é o mesmo JWT do cookie.
Para reutilizá-lo fora do navegador:

**Opção A - cookie jar (recomendado):**

```bash
# Salva o cookie no arquivo
curl -c cookies.txt -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@exemplo.com","password":"minhaSenha123"}'

# Envia o cookie automaticamente
curl -b cookies.txt http://localhost:8080/auth/me
```

**Opção B - token do corpo da resposta:**

```bash
# Captura o token do JSON da resposta
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@exemplo.com","password":"minhaSenha123"}' \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['token'])")

# Usa o token no header Cookie
curl -H "Cookie: SESSION_TOKEN=$TOKEN" http://localhost:8080/auth/me
```

## Troubleshooting

| Problema | Causa provável | Solução |
|---|---|---|
| `401` em endpoints protegidos | Cookie `SESSION_TOKEN` não está sendo enviado | No Swagger UI, faça login/registro primeiro e confirme o `Set-Cookie` no header da resposta; fora do navegador, use o cookie jar ou o header `Cookie` |
| `401` logo após o logout | Token na blacklist | Faça login novamente para obter um novo token/cookie |
| Backend não inicia | `OPENAPI_SERVER_URL` ausente | Defina a variável no `.env` (fail-fast de segurança) |
| `409` no registro | E-mail já cadastrado | Use outro e-mail no corpo da requisição |
| `400` com `fields` no corpo | Validação de campos | Verifique os campos obrigatórios e valores permitidos descritos nos passos acima |

> **Nota:** Consulte o [contrato de API](./contrato-api.md) para a especificação
> completa dos endpoints e o [ADR-0007](./adr/0007-autenticacao-sessao.md) para os
> detalhes da decisão de autenticação por sessão JWT.
