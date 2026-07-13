# Contrato de API - EnergiAI

Este documento define as interfaces de comunicação entre o Front-end, o Back-end (Spring Boot) e a API de Inteligência Artificial (Python).

---

## Parte 1: Contratos do Front-end (Comunicação com o Spring Boot)

Esta seção define como a interface vai enviar e buscar os dados na API Java.

### 1. Criação do Imóvel
*   **Método:** `POST`
*   **Rota:** `/api/imoveis`

**Request Body:**
```json
{
  "usuario_id": 1,
  "apelido": "Casa Principal",
  "tipo_imovel": "CASA"
}
```
**Response (201 Created):**
```json
{
  "id": 12,
  "usuario_id": 1,
  "apelido": "Casa Principal",
  "tipo_imovel": "CASA",
  "ativo": 1
}
```

### 2. Atualização do Inventário de Equipamentos
*   **Método:** `PUT`
*   **Rota:** `/api/imoveis/{imovelId}/equipamentos`

**Request Body:**
```json
[
  {
    "equipamento_id": 1,
    "quantidade": 1,
    "consumo_diario_total_watts": 8250.0
  },
  {
    "equipamento_id": 2,
    "quantidade": 2,
    "consumo_diario_total_watts": 16800.0
  }
]
```
**Response (200 OK):**
```json
{
  "mensagem": "Inventario atualizado com sucesso"
}
```

### 3. Geração da Análise Energética (Endpoint MVP)
*   **Método:** `POST`
*   **Rota:** `/analise-energetica?imovelId=12`

**Request Body:**
```json
{
  "consumo_kwh": 420.0,
  "uso_horario_pico": true,
  "quantidade_equipamentos": 10,
  "tipo_imovel": "CASA",
  "horas_alto_consumo": 8
}
```
**Response (201 Created):**
```json
{
  "id": 501,
  "imovel_id": 12,
  "consumo_kwh": 420.0,
  "custo_estimado_mensal": 315.00,
  "categoria": "ALTO",
  "probabilidade": 0.8125,
  "status": "CONCLUIDA",
  "recomendacoes": [
    "Reduzir o uso de ar-condicionado",
    "Trocar lâmpadas",
    "Evitar banhos em horario de pico"
  ],
  "created_at": "2026-07-13T16:30:00"
}
```

## Parte 2: Contrato para a Equipe de Ciência de Dados (Python / IA)

Este contrato define a comunicação interna entre o Back-end Java e a API Python de predição.

### 1. Endpoint de Predição (Servidor Python)
*   **Método:** `POST`
*   **Rota sugerida:** `/predict`

**O que o Java vai enviar (Request Body):**
```json
{
  "consumo_kwh": 420.0,
  "uso_horario_pico": true,
  "quantidade_equipamentos": 10,
  "tipo_imovel": "CASA",
  "horas_alto_consumo": 8,
  "inventario_total_watts_dia": 25050.0
}
```
**O que o Python DEVE devolver para o Java (Response 200 OK):**
```json
{
  "categoria": "ALTO",
  "probabilidade": 0.8125,
  "recomendacoes": [
    "Reduzir o uso de ar-condicionado",
    "Trocar lâmpadas",
    "Evitar banhos em horario de pico"
  ]
}
```
