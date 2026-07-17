# Contrato de API - EnergiAI

Este documento define as interfaces de comunicação entre o Front-end, o Back-end (Spring Boot) e a API de Inteligência Artificial (Python).

---

## Parte 1: Contratos do Front-end (Comunicação com o Spring Boot)

### 1. Registro do Usuário

* **Método:** `POST`
* **Rota:** `/auth/register`

**Request Body:**

```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Response (201 Created):**

```json
{
  "id": 12,
  "name": "João Silva",
  "email": "joao@email.com"
}
```

### 2. Login do Usuário

* **Método:** `POST`
* **Rota:** `/auth/login`

**Request Body:**

```json
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Response (200 OK):**

```json
{
  "id": 12,
  "name": "João Silva",
  "email": "joao@email.com"
}
```

### 3. Geração da Análise Energética (Endpoint MVP)

* **Método:** `POST`
* **Rota:** `/energy-analysis`

**Request Body:**

```json
{
  "consumption_kwh": 420.0,
  "peak_hour_usage": true,
  "equipment_quantity": 10,
  "property_type": "CASA",
  "high_consumption_hours": 8.5
}
```

**Response (201 Created):**

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

## Parte 2: Contrato para a Equipe de Ciência de Dados (Python / IA)

Este contrato define a comunicação interna entre o Back-end Java e a API Python de predição. O Java atua como agregador, agrupando o inventário de equipamentos por categorias de consumo antes de enviar para o modelo preditivo.

### 1. Endpoint de Predição (Servidor Python)

* **Método:** `POST`
* **Rota sugerida:** `/predict`

**O que o Java vai enviar (Request Body):**

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

**O que o Python DEVE devolver para o Java (Response 200 OK):**

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
