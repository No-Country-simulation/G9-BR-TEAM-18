# ML Service - Arquitetura e Modelo de Machine Learning

Documentação do microsserviço Python de classificação energética, endpoints, modelo, treinamento e fallback.

## Índice

- [Stack Tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Modelo de Machine Learning](#modelo-de-machine-learning)
- [Classificação Rule-Based](#classificação-rule-based)
- [Fallback Groq (LLM)](#fallback-groq-llm)
- [Endpoints da API](#endpoints-da-api)
- [Treinamento](#treinamento)
- [Feature Engineering](#feature-engineering)
- [Dados](#dados)

---

## Stack Tecnológica

O `requirements.txt` **não fixa versões** (apenas `groq>=1.5.0` e `python-dotenv>=1.1.0`); a tabela lista
versões de referência validadas pela equipe, não um lock. Consulte `ml-service/requirements.txt` para a lista exata.

| Tecnologia | Versão de referência | Função |
|---|---|---|
| Python | 3.12 | Linguagem |
| FastAPI | 0.139 | Framework web |
| Uvicorn | 0.51 | Servidor ASGI |
| Pydantic | 2.13 | Validação de schemas |
| scikit-learn | 1.9 | Modelo Random Forest |
| pandas | 3.0 | Manipulação de dados |
| joblib | 1.5 | Serialização do modelo |
| groq | >=1.5 | Cliente LLM Groq |
| python-dotenv | >=1.1 | Carregamento de variáveis de ambiente |

## Arquitetura

```mermaid
flowchart LR
    A[Backend Spring Boot] -->|POST /predict| B[ML Service FastAPI]
    B --> C{Modelo carregado?}
    C -->|Não| D[Classificação rule-based]
    C -->|Sim| E{Confiança >= 80%?}
    E -->|Sim| F[source = model<br>recomendações rule-based]
    E -->|Não| G{Groq disponível?}
    G -->|Sim| H[Groq gera recomendações<br>source = model+groq]
    G -->|Não| I[source = model (baixa confiança)<br>recomendações rule-based]
    F --> J[Resposta JSON]
    H --> J
    I --> J
    D --> J
```

O ML Service implementa três estratégias, em ordem de prioridade:

1. **Modelo ML** (Random Forest) - classificação principal
2. **Groq (LLM)** - geração de recomendações quando a confiança do modelo é < 80% e a chave está configurada
3. **Regras de negócio** - classificação quando o modelo não está disponível, ou recomendações quando o
   caminho Groq não é acionado/falha

## Modelo de Machine Learning

### Algoritmo

- **RandomForestClassifier** com `RandomizedSearchCV` para otimização de hiperparâmetros
- Calibração de probabilidades via `CalibratedClassifierCV` (método `isotonic`)
- Classificação multiclasse em 5 categorias

### Espaço de busca do RandomizedSearchCV

Restrito para evitar overfitting (ver ADR-0057): `max_depth: [10, 20, 30]`,
`max_features: ["sqrt", "log2"]`, `n_estimators: [200, 300, 400]`,
`min_samples_split: [2, 5]`, `min_samples_leaf: [1, 2]`,
`class_weight: [None, "balanced"]`.

O último retreino (ADR-0057) obteve CV accuracy 0.9796 e test accuracy 0.9802. Os melhores
hiperparâmetros são redefinidos a cada treino pela busca, não são fixados no código.

### Features de Entrada

O pipeline usa 19 features, agrupadas em quatro blocos:

| Grupo | Features |
|---|---|
| Numéricas base | `consumption_kwh`, `equipment_quantity`, `high_consumption_hours`, `refrigeration_watts`, `heating_watts`, `air_conditioning_watts`, `lighting_watts` |
| Booleana | `peak_hour_usage` |
| Categóricas | `property_type` (one-hot), `highest_consumption_category` (one-hot) |
| Derivadas (feature engineering) | `consumption_per_equipment`, `consumption_per_hour`, `normalized_relative_consumption`, `estimated_load`, `total_watts`, `pct_refrigeration`, `pct_heating`, `pct_air_conditioning`, `pct_lighting` |

### Categorias de Saída

| Categoria | Descrição |
|---|---|
| `EXCELENTE` | Consumo muito abaixo da média para o tipo de imóvel |
| `BOM` | Consumo abaixo da média |
| `MEDIANO` | Consumo dentro da média esperada |
| `RUIM` | Consumo acima da média |
| `CRITICO` | Consumo muito acima da média |

## Classificação Rule-Based

Usada quando o modelo ML não está disponível (ou falha). O score é composto por:

- **Consumo relativo**: consumo dividido pela base esperada por tipo de imóvel (Casa: 250 kWh, Apartamento: 150 kWh, Comercial: 500 kWh)
- **Normalizações**: equipamentos (0-25 → 0-1), horas (0-12 → 0-1), horário de pico (0 ou 1)
- **Score composto**: média ponderada das normalizações
- **Limiares**: < 0.2 → EXCELENTE, < 0.4 → BOM, < 0.6 → MEDIANO, < 0.8 → RUIM, >= 0.8 → CRITICO

As recomendações rule-based preferem dicas **específicas por aparelho** (`APPLIANCE_RECOMMENDATIONS`,
uma dica para cada um dos 29 aparelhos do catálogo, escolhida a partir de `highest_consumption_products`),
com fallback genérico por categoria (`CATEGORY_RECOMMENDATIONS`) quando a requisição não informa produtos
ou nenhum bate com o catálogo. Complementos genéricos são adicionados conforme pico, quantidade de
equipamentos, horas de alto consumo e distribuição diária de watts.

## Fallback Groq (LLM)

Quando a confiança do modelo ML é < 80% e a chave `GROQ_API_KEY` está configurada (e o limite de taxa
permite), o serviço chama a API Groq (modelo `llama-3.3-70b-versatile`) para gerar recomendações
personalizadas. O prompt inclui os dados do imóvel, a categoria, os equipamentos de maior consumo
(`highest_consumption_products`) e regras de estilo. Se a chamada falhar ou retornar vazio, as
recomendações caem para o caminho rule-based.

Sem a chave `GROQ_API_KEY`, o serviço funciona apenas com modelo + regras.

## Endpoints da API

| Método | Caminho | Descrição |
|---|---|---|
| `POST` | `/predict` | Predição completa (armazena no log de treinamento) |
| `POST` | `/predict/simulate` | Predição simulada (sem armazenar) |
| `GET` | `/predict-schema` | Schema JSON do PredictRequest (descoberta dinâmica) |
| `GET` | `/contract` | Contrato completo (categorias, tipos de imóvel, schemas) |
| `GET` | `/appliance-catalog` | Catálogo de aparelhos reconhecidos pelo modelo |
| `GET` | `/categories` | Lista de categorias válidas |
| `GET` | `/status` | Status do serviço (modelo carregado, Groq, taxas) |

### POST /predict

**Request:**

```json
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
```

**Response:**

```json
{
  "category": "MEDIANO",
  "probability": 0.78,
  "recommendations": ["Recomendação 1", "Recomendação 2", "Recomendação 3"],
  "source": "model+groq (confidence 76.4%)"
}
```

### POST /predict/simulate

Mesma entrada/saída de `/predict`, porém **não armazena** a requisição no arquivo de log de treinamento
(`treino_feedback.jsonl`).

### GET /predict-schema

Retorna o schema Pydantic do `PredictRequest` (usado pelo backend para validação dinâmica de contrato).

### GET /contract

Retorna o contrato completo: versão, tipos de imóvel, categorias de eficiência, categorias de consumo e
os schemas de request/response. Consumido pelo backend no startup (Schema Discovery, ADR-0021).

### GET /appliance-catalog

Retorna o catálogo de aparelhos que o modelo reconhece, lido de `main-dataset.csv` e derivado de
`APPLIANCE_COLUMNS` (fonte única compartilhada com o treinamento, ADR-0057). Sincronizado
periodicamente pelo backend (ADR-0048/0055).

### GET /categories

```json
{"categories": ["EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO"]}
```

### GET /status

```json
{
  "model_loaded": true,
  "groq_available": true,
  "groq_calls_today": 12,
  "groq_daily_limit": 900,
  "groq_calls_per_minute": 2,
  "groq_minute_limit": 25
}
```

## Treinamento

O script `ml-service/train_model.py` executa o pipeline completo:

1. **Carregamento dos dados**: `main-dataset.csv` (PPH 2019 consolidado), `labeled-energy-base.csv` e `treino_feedback.jsonl`
2. **Feature engineering**: features derivadas via `features.py` (consumo por equipamento, carga estimada, distribuição percentual)
3. **Geração de dados sintéticos**: 2000 amostras por padrão (`N_SYNTHETIC`) para balanceamento de classes
4. **Treinamento**: Random Forest com `RandomizedSearchCV` restrito + `CalibratedClassifierCV` (isotonic)
5. **Avaliação**: acurácia, classification report, distribuição de confiança e sanity check de cenários variados
6. **Serialização**: salva o modelo como `categorization-model.joblib`

### Como re-treinar

```bash
cd ml-service
python3 train_model.py
```

Para reprodutibilidade, use `RANDOM_SEED` (padrão 42). Os hiperparâmetros restritos evitam árvores
sem limite de profundidade (overfitting observado e corrigido na ADR-0057).

## Feature Engineering

O módulo `ml-service/features.py` centraliza o pré-processamento compartilhado entre treino e inferência:

- `feature_engineering(df)`: aplica todas as features derivadas sobre o DataFrame de entrada
- `normalize_category(cat)`: normaliza nomes de categoria de consumo para o padrão do modelo
- `translate_category(cat)`: traduz `highest_consumption_category` do inglês para o português (formato do modelo)
- `normalize_property_type(ptype)`: normaliza tipo de imóvel do inglês para o português
- `APPLIANCE_COLUMNS`: catálogo de aparelhos (29 colunas `qtd_*`) compartilhado com `appliance_catalog()` e `load_pph_data()`
- `REDUNDANT_APPLIANCE_COLUMNS`: colunas redundantes mescladas via `max()` antes da soma de `equipment_quantity`

## Dados

| Arquivo | Conteúdo | Fonte |
|---|---|---|
| `data/main-dataset.csv` | Dados consolidados da PPH 2019 + colunas de aparelhos (29) e de categoria de maior consumo | Merge M003/M004 (ver ADR-0049 e ADR-0057) |
| `data/labeled-energy-base.csv` | Base rotulada com categorias | Gerado pelo notebook |
| `treino_feedback.jsonl` | Log das predições reais para o feedback loop de retreino | Gerado pelo `/predict` |

---

> **Nota:** Consulte o [contrato de API](./contrato-api.md) para detalhes de comunicação com o backend e o
> [guia de execução](./guia-execucao.md) para instruções de execução.
