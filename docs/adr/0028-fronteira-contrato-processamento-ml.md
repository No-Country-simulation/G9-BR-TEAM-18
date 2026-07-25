# ADR-0028: Complemento ao Contrato em Inglês - Fronteira entre API e Processamento Interno do ML Service

## Status

Proposta

## Contexto

O ADR-0027 definiu que o ML Service deve aceitar apenas valores em inglês nos campos categóricos
da requisição (`property_type`, `highest_consumption_category`), centralizando a normalização
para português internamente. No entanto, durante a análise do código-fonte do ML Service,
surgiram dúvidas sobre por que certos identificadores internos permanecem em português e se
isso poderia causar confusão ou retrabalho no backend.

As principais dúvidas foram:

- O dicionário `BASE_CONSUMPTION_BY_TYPE` em `main.py` contém valores como `"Casa": 250.0` -
  por que em português se o contrato agora é inglês?
- O log de treinamento (`_store_for_training()`) registra `data.property_type` diretamente -
  isso ficará em inglês ou português?
- O backend precisa saber que o ML Service usa português internamente para fazer algum
  tratamento especial?

Este ADR complementa o ADR-0027 esclarecendo a fronteira exata entre o que é **contrato público
da API** (inglês) e o que é **processamento interno do ML Service** (pode usar português).

## Decisão

A equipe decidiu formalizar a separação entre **camada de contrato** e **camada de
processamento interno** do ML Service, documentando que o backend nunca precisa conhecer
os detalhes internos do ML. A normalização EN→PT é uma responsabilidade exclusiva do ML
Service, e o backend se relaciona apenas com o contrato em inglês.

### 1. O que o backend vê vs o que o ML processa internamente

```text
┌─ BACKEND (Java) ─────────────┐       ┌─ ML SERVICE ───────────────────────────────┐
│                               │       │                                             │
│  Envia para o ML:             │       │  ┌── Camada de Contrato (inglês) ──────┐   │
│  property_type: "RESIDENCIAL" │       │  │  PredictRequest                      │   │
│  highest_consumption_category │──HTTP→│  │  → property_type: "RESIDENCIAL"      │   │
│  : "REFRIGERATION"            │       │  │  → highest_consumption_category:     │   │
│                               │       │  │    "REFRIGERATION"                   │   │
│  Recebe do ML:                │       │  └──────────────────────────────────────┘   │
│  category: "BOM"              │       │                     ↓                      │
│  recommendations: ["..."]     │←HTTP──│  ┌── normalização EN→PT ───────────────┐   │
│                               │       │  │  normalize_property_type()           │   │
│                               │       │  │  normalize_category()                │   │
│                               │       │  │  → "Casa", "Refrigeracao"            │   │
│                               │       │  └──────────────────────────────────────┘   │
│                               │       │                     ↓                      │
│                               │       │  ┌── Camada Interna (português) ───────┐   │
│                               │       │  │  Modelo treinado com dados PPH      │   │
│                               │       │  │  → espera "Casa", "Refrigeracao"    │   │
│                               │       │  │                                     │   │
│                               │       │  │  Fallback rule-based:                │   │
│                               │       │  │  _classify_rule_based()             │   │
│                               │       │  │  BASE_CONSUMPTION_BY_TYPE           │   │
│                               │       │  │  → "Casa": 250.0 (língua neutra)    │   │
│                               │       │  └──────────────────────────────────────┘   │
└───────────────────────────────┘       └─────────────────────────────────────────────┘
```

### 2. Por que `BASE_CONSUMPTION_BY_TYPE` usa `"Casa": 250.0` no código atual

O dicionário `BASE_CONSUMPTION_BY_TYPE` é usado exclusivamente pela função de fallback
`_classify_rule_based()`. Essa função recebe o `data.property_type` **cru** (sem normalização).

**Código atual (antes do ADR-0027):**

```python
BASE_CONSUMPTION_BY_TYPE = {
    "Casa": 250.0,
    "Apartamento": 150.0,
    "Comercial": 500.0,
}

def _classify_rule_based(data: PredictRequest) -> tuple[str, float]:
    base = BASE_CONSUMPTION_BY_TYPE.get(data.property_type, 250.0)
    #                            ↑ data.property_type = "Casa" (português)
```

Neste cenário, o backend enviava `"Casa"` (português), e o dicionário tinha chaves em português.
Funcionava porque **contrato e processamento interno estavam no mesmo idioma**.

**Após o ADR-0027:**

```python
BASE_CONSUMPTION_BY_TYPE = {
    "RESIDENCIAL": 250.0,   # ← chave agora em inglês
    "APARTAMENTO": 150.0,   # ← porque data.property_type agora é "RESIDENCIAL"
    "COMERCIAL": 500.0,     # ← (cru, sem normalização)
}

def _classify_rule_based(data: PredictRequest) -> tuple[str, float]:
    base = BASE_CONSUMPTION_BY_TYPE.get(data.property_type, 250.0)
    #                            ↑ data.property_type = "RESIDENCIAL" (inglês)
```

O dicionário `BASE_CONSUMPTION_BY_TYPE` **não contém texto em português** - ele contém:

| Chave | Valor | Natureza do valor |
|---|---|---|
| `"RESIDENCIAL"` | `250.0` | Número: consumo base estimado em kWh/mês |
| `"APARTAMENTO"` | `150.0` | Número: consumo base estimado em kWh/mês |
| `"COMERCIAL"` | `500.0` | Número: consumo base estimado em kWh/mês |

Os valores `250.0`, `150.0` e `500.0` são **números**, não texto. Números não têm idioma.
O mesmo vale para `kWh/mês` - é uma unidade de medida universal.

### 3. Por que o modelo foi treinado com dados em português

O modelo de Machine Learning (`categorization-model.joblib`) foi treinado com dados da
Pesquisa de Posse e Hábitos (PPH) 2019 do PROCEL/ELETROBRAS. Esses dados estão em português
porque são originários de uma pesquisa brasileira:

- Colunas dos CSVs: `qtd_geladeira`, `qtd_chuveiro_eletrico`, etc.
- Categorias: `"Refrigeracao"`, `"Climatizacao"`, etc.
- Tipos de imóvel inferidos: `"Casa"`, `"Apartamento"`, `"Comercial"`

O modelo **aprendeu** a associar o texto `"Casa"` a um determinado perfil de consumo.
Se alimentarmos o modelo com `"RESIDENCIAL"`, ele não reconhecerá - por isso a normalização
é necessária. Isso não é um problema de arquitetura, é uma característica de qualquer modelo
de ML treinado com dados categóricos: os valores precisam ser os mesmos do treinamento.

### 4. Por que o log de treinamento (`_store_for_training`) registrará valores em inglês

Atualmente, `_store_for_training()` armazena `data.property_type` diretamente:

```python
def _store_for_training(data: PredictRequest, ...):
    record = {
        "features": {
            "property_type": data.property_type,  # ← valor CRU, sem normalização
            ...
        }
    }
```

Com a mudança do ADR-0027, `data.property_type` será `"RESIDENCIAL"` (inglês). O log de
treinamento passará a registrar valores em inglês. Isso é **intencional** e benéfico:

- Se no futuro o modelo for retreinado, os logs já estarão no formato que o novo contrato
  espera (inglês).
- O log é um dado interno do ML Service - o backend nunca o consulta.
- A normalização EN→PT continuará sendo aplicada antes de passar os dados ao modelo.

### 5. Fronteira clara: o que fica em português vs inglês no ML Service

| Componente | Idioma | Motivo |
|---|---|---|
| **`PredictRequest`** (contrato da API) | Inglês | Backend envia valores nativos dos seus enums |
| **`/contract`** (schema discovery) | Inglês | Backend descobre o contrato no mesmo idioma que envia |
| **`/appliance-catalog`** (nomes dos aparelhos) | Português | São substantivos do mundo real, não identificadores de código |
| **`normalize_property_type()`** | EN→PT | Ponte entre o contrato (inglês) e o modelo (português) |
| **`normalize_category()`** | EN→PT | Ponte entre o contrato (inglês) e o modelo (português) |
| **`BASE_CONSUMPTION_BY_TYPE`** | Inglês | Acessado com `data.property_type` cru (agora inglês) |
| **`HIGHEST_CONSUMPTION_CATEGORIES`** | Português | Usado internamente após normalização - o dado já foi convertido |
| **Modelo ML (.joblib)** | Português | Treinado com dados da pesquisa PPH 2019 |
| **Log de treinamento** | Inglês | Registra o valor cru recebido (agora inglês) |
| **Recomendações (Groq/rule-based)** | Português | Saída exibida ao usuário final |

### 6. O backend nunca precisa saber disso

O backend (Java/Spring) se relaciona apenas com a **camada de contrato** do ML Service:

- **Envia:** `POST /predict` com `property_type: "RESIDENCIAL"` e
  `highest_consumption_category: "REFRIGERATION"` (inglês)
- **Recebe:** `category: "BOM"`, `probability: 0.85`, `recommendations: ["..."]` (resposta)

O backend **não precisa saber** que internamente o ML Service:

- Normaliza `"RESIDENCIAL"` para `"Casa"` antes de passar ao modelo
- Mantém um dicionário `BASE_CONSUMPTION_BY_TYPE` com chaves outrora em português
- Usa um modelo treinado com dados da PPH 2019 em português

Isso é exatamente o objetivo do ADR-0027: **o ML Service é o único ponto de normalização
linguística**, e as demais camadas enviam e recebem dados no idioma do contrato (inglês
para identificadores, português para conteúdo exibível ao usuário).

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Documentar fronteira contrato vs interno (escolhido)** | Elimina dúvidas sobre o que está em cada idioma; backend sabe exatamente o que enviar | Nenhuma - é apenas documentação complementar |
| **Retreinar o modelo com dados em inglês** | Eliminaria a necessidade de normalização no ML | Custo alto de retreinamento; dados originais estão em português |
| **Forçar português também no contrato** | Eliminaria a normalização (tudo no mesmo idioma) | Backend precisaria de tradução; volta ao problema original do ADR-0027 |
| **Não documentar a fronteira (deixar como está)** | Nenhum esforço adicional | Dúvidas como esta continuariam surgindo; risco de interpretação errada |

## Consequências

- **Positivo:** Fica claro que o backend nunca precisa conhecer os detalhes internos do ML
  Service - ele se relaciona apenas com o contrato em inglês.
- **Positivo:** O dicionário `BASE_CONSUMPTION_BY_TYPE` com chaves `"RESIDENCIAL"` (inglês)
  está correto e alinhado ao que o `_classify_rule_based()` recebe como entrada crua.
- **Positivo:** O log de treinamento registrará valores em inglês, facilitando um eventual
  retreinamento do modelo com o novo formato de contrato.
- **Positivo:** A tabela de fronteira (seção 5) serve como referência rápida para qualquer
  membro da equipe entender o idioma de cada componente.
- **Negativo:** Este ADR adiciona um documento complementar que precisa ser mantido
  atualizado se a arquitetura interna do ML Service mudar.
- **Negativo:** Se no futuro o modelo for retreinado para aceitar inglês diretamente, a
  normalização EN→PT se tornará desnecessária, e este ADR precisará ser revisado.

> **Nota:** Consulte o [glossário do projeto](../glossario.md) para definição dos termos
> utilizados neste documento.
