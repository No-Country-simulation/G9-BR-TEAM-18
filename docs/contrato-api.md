# Contrato de API

Definição das interfaces de comunicação entre o frontend, o backend (Spring Boot) e a API de inteligência artificial (Python).

## Parte 1: Contratos do frontend (comunicação com o Spring Boot)

### Endpoint: Registro do usuário

#### Identificação

| Campo | Valor |
|---|---|
| Método | `POST` |
| Rota | `/auth/register` |

#### Contrato de entrada

```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123"
}
```

#### Contrato de saída

```json
{
  "id": 12,
  "name": "João Silva",
  "email": "joao@email.com"
}
```

**Status:** `201 Created`

### Endpoint: Login do usuário

#### Identificação

| Campo | Valor |
|---|---|
| Método | `POST` |
| Rota | `/auth/login` |

#### Contrato de entrada

```json
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

#### Contrato de saída

```json
{
  "id": 12,
  "name": "João Silva",
  "email": "joao@email.com"
}
```

**Status:** `200 OK`

### Endpoint: Geração da análise energética

#### Identificação

| Campo | Valor |
|---|---|
| Método | `POST` |
| Rota | `/energy-analysis` |

#### Contrato de entrada

```json
{
  "consumption_kwh": 420.0,
  "peak_hour_usage": true,
  "equipment_quantity": 10,
  "property_type": "CASA",
  "high_consumption_hours": 8.5
}
```

#### Contrato de saída

```json
{
  "id": 501,
  "consumption_kwh": 420.0,
  "peak_hour_usage": true,
  "high_consumption_hours": 8.5,
  "estimated_monthly_cost": 315.00,
  "category": "ALTO",
  "probability": 0.8125,
  "recommendations": [
    "Reduzir o uso de ar-condicionado",
    "Trocar lâmpadas",
    "Evitar banhos em horario de pico"
  ],
  "created_at": "2026-07-13T21:30:00"
}
```

**Status:** `201 Created`

## Parte 2: Contrato interno (backend com ML Service)

Este contrato define a comunicação entre o backend Java e a API Python de predição. O Java atua como agregador, agrupando o inventário de equipamentos por categorias de consumo antes de enviar ao modelo preditivo.

### Endpoint: Predição (servidor Python)

#### Identificação

| Campo | Valor |
|---|---|
| Método | `POST` |
| Rota sugerida | `/predict` |

#### Contrato de entrada (enviado pelo Java)

```json
{
  "consumption_kwh": 420.0,
  "peak_hour_usage": true,
  "equipment_quantity": 10,
  "property_type": "CASA",
  "high_consumption_hours": 8.5,
  "daily_consumption_distribution": {
    "REFRIGERATION_WATTS": 1500.0,
    "HEATING_WATTS": 7500.0,
    "AIR_CONDITIONING_WATTS": 4200.0,
    "LIGHTING_WATTS": 800.0
  }
}
```

#### Contrato de saída (devolvido pelo Python)

```json
{
  "category": "ALTO",
  "probability": 0.8125,
  "recommendations": [
    "Reduzir o uso de ar-condicionado",
    "Trocar lâmpadas",
    "Evitar banhos em horario de pico"
  ]
}
```

**Status:** `200 OK`

> **Nota:** Consulte a [arquitetura do projeto](./arquitetura.md) para entender como as camadas se integram, o [guia de execução](./guia-execucao.md) para instruções de deploy, e o [glossário do projeto](./glossario.md) para definição dos termos de domínio.
