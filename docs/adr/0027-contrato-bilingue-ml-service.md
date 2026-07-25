# ADR-0027: Contrato em Inglês do ML Service para Eliminação de Tradução entre Camadas

## Status

Aceito

## Contexto

O ML Service (Python/FastAPI) atualmente exige que campos categóricos da requisição `POST /predict`
sejam enviados em **português** (`"Casa"`, `"Refrigeracao"`, etc.), enquanto o backend (Java/Spring)
utiliza **inglês** como convenção de código para seus enums (`EquipmentCategory.REFRIGERATION`,
`PropertyType.RESIDENCIAL`) e o frontend (TypeScript/React) mantém **inglês** como padrão interno de código.

Essa divergência linguística força o backend a manter uma camada de tradução manual em `EnergyAnalysisService.buildMlRequest()` - um `switch` que traduz `RESIDENCIAL → "Casa"`, `COMERCIAL → "Comercial"`, e simplesmente ignora o tipo `APARTAMENTO` (que o ML reconhece mas o backend não envia).

O problema é agravado por três fatores:

- **O contrato do ML dita o idioma de todas as camadas:** Qualquer alteração nos valores categóricos do ML (novo tipo de imóvel, nova categoria de consumo) exige alteração coordenada em backend (switch de tradução), frontend (mlCategory) e possivelmente banco de dados.
- **Duplicação de lógica de normalização:** O ML Service já possui em `features.py::normalize_category()` a lógica para normalizar variações de categoria (ex: "refrigeração" e "refrigeracao" → "Refrigeracao"). Fazer o backend replicar essa lógica em sentido inverso (REFRIGERATION → "Refrigeracao") é duplicação desnecessária.
- **Campo não utilizado:** O campo `highest_consumption_products` (top 3 aparelhos) é aceito pelo ML mas nunca enviado pelo backend, justamente porque exigiria tradução dos nomes dos aparelhos para português.

Como o projeto está em fase de desenvolvimento sem clientes reais, **não há necessidade de compatibilidade retroativa** - dados do banco Oracle podem ser recriados e chamadas antigas para o ML Service não precisam ser suportadas.

## Decisão

A equipe decidiu padronizar o contrato do ML Service para **inglês como único idioma aceito nos campos
categóricos**, centralizando toda a normalização linguística exclusivamente no ML Service. O ML Service
passa a normalizar internamente valores em inglês para o formato que o modelo foi treinado (português),
sem que backend ou frontend precisem conhecer ou replicar essa normalização.

A decisão se divide em três mudanças complementares:

### Mudança 1: ML Service aceita apenas inglês nos campos categóricos

O `PredictRequest` passa a esperar valores em inglês para `property_type` e `highest_consumption_category`. O ML Service normaliza internamente via `features.py`.

**`features.py` - nova função `normalize_property_type()` + `normalize_category()` atualizada:**

```python
def normalize_property_type(ptype: object) -> str:
    """Normaliza property_type de inglês para português (formato do modelo)."""
    if not isinstance(ptype, str):
        return "Casa"
    mapping = {
        "residencial": "Casa",
        "apartamento": "Apartamento",
        "comercial": "Comercial",
    }
    return mapping.get(ptype.strip().lower(), "Casa")


def normalize_category(cat: object) -> str:
    """Normaliza highest_consumption_category de inglês para português (formato do modelo)."""
    if not isinstance(cat, str):
        return "Outros"
    mapping = {
        "refrigeration": "Refrigeracao",
        "climate_control": "Climatizacao",
        "climatization": "Climatizacao",
        "technology": "Tecnologia",
        "lighting": "Iluminacao",
        "appliances": "Eletrodomesticos",
        "services": "Servicos",
        "others": "Outros",
    }
    return mapping.get(cat.strip().lower(), "Outros")
```

**`main.py` - `BASE_CONSUMPTION_BY_TYPE` com chaves em inglês:**

```python
BASE_CONSUMPTION_BY_TYPE = {
    "RESIDENCIAL": 250.0,
    "APARTAMENTO": 150.0,
    "COMERCIAL": 500.0,
}
```

**`main.py` - `_run_prediction()` normaliza property_type antes de passar ao modelo:**

```python
df = pd.DataFrame([{
    ...
    "property_type": normalize_property_type(data.property_type),
    "highest_consumption_category": normalize_category(
        data.highest_consumption_category or "Outros"
    ),
    ...
}])
```

O prompt do Groq em `_generate_recommendations_groq()` é ajustado para usar `normalize_property_type()` antes de referenciar o tipo de imóvel no texto do prompt, garantindo que o LLM sempre receba o nome em português.

**Efeito:** O backend envia `property_type = "RESIDENCIAL"` e `highest_consumption_category = "REFRIGERATION"` sem nenhuma tradução. O ML Service normaliza para português internamente antes de alimentar o modelo. O switch de tradução em `EnergyAnalysisService.buildMlRequest()` é completamente eliminado.

### Mudança 2: Endpoint `/appliance-catalog` para descoberta dinâmica do catálogo

O ML Service expõe um endpoint que lê os datasets de treino e retorna o catálogo completo de aparelhos reconhecidos pelo modelo. Os nomes dos aparelhos permanecem em português pois são dados reais (substantivos), não identificadores de código.

```python
@app.get("/appliance-catalog")
def appliance_catalog():
    """Retorna o catálogo de aparelhos que o modelo reconhece."""
    df_pph = pd.read_csv(os.path.join(BASE_DIR, "data", "pph-data-complete.csv"))
    catalog = []
    APPLIANCE_COLUMNS = {
        "qtd_geladeira":         {"name": "Geladeira",        "ml_category": "REFRIGERATION", "watts": 150,  "hours": 24},
        "qtd_ar_condicionado":   {"name": "Ar-condicionado",  "ml_category": "CLIMATE_CONTROL","watts": 1500, "hours": 8},
        "qtd_ventilador":        {"name": "Ventilador",       "ml_category": "CLIMATE_CONTROL","watts": 100,  "hours": 8},
        "qtd_lampadas":          {"name": "Lâmpada",          "ml_category": "LIGHTING",      "watts": 12,   "hours": 6},
        "qtd_microondas":        {"name": "Micro-ondas",      "ml_category": "APPLIANCES",    "watts": 1200, "hours": 0.5},
        "qtd_air_fryer":         {"name": "Air fryer",        "ml_category": "APPLIANCES",    "watts": 1500, "hours": 0.75},
        "qtd_lavar_secar":       {"name": "Máquina de lavar", "ml_category": "APPLIANCES",    "watts": 500,  "hours": 1.5},
        "qtd_chuveiro_eletrico": {"name": "Chuveiro elétrico","ml_category": "APPLIANCES",    "watts": 5500, "hours": 0.5},
        "qtd_tv":                {"name": "Televisão",        "ml_category": "TECHNOLOGY",    "watts": 150,  "hours": 6},
        "qtd_computadores":      {"name": "Computador",       "ml_category": "TECHNOLOGY",    "watts": 150,  "hours": 8},
        "qtd_videogame":         {"name": "Videogame",        "ml_category": "TECHNOLOGY",    "watts": 200,  "hours": 4},
    }
    for col, info in APPLIANCE_COLUMNS.items():
        if col in df_pph.columns:
            catalog.append(info)
    return {"appliances": catalog}
```

Note que `ml_category` no catálogo já retorna valores em inglês (`"REFRIGERATION"`, `"CLIMATE_CONTROL"`), alinhados ao enum `EquipmentCategory` do backend.

**Efeito:** O `ApplianceController` do backend consome esse endpoint no startup (via `MlSchemaDiscovery`), eliminando o `APPLIANCE_FALLBACK` hardcoded no frontend e as migrations de seed no banco Oracle.

### Mudança 3: Endpoint `/contract` unificado para Schema Discovery completo

Substitui e expande os endpoints atuais `/predict-schema` e `/categories` por um único endpoint que expõe todo o contrato do ML Service em inglês:

```python
@app.get("/contract")
def contract():
    """Retorna o contrato completo do ML Service para descoberta dinâmica."""
    return {
        "version": "3.0.0",
        "property_types": ["RESIDENCIAL", "APARTAMENTO", "COMERCIAL"],
        "efficiency_categories": ["EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO"],
        "consumption_categories": [
            "REFRIGERATION", "CLIMATE_CONTROL", "TECHNOLOGY",
            "LIGHTING", "APPLIANCES", "SERVICES", "OTHERS"
        ],
        "request_schema": PredictRequest.model_json_schema(),
        "response_schema": PredictResponse.model_json_schema(),
    }
```

**Efeito:** O schema discovery descobre todo o contrato em uma única chamada. Novos tipos de imóvel ou categorias adicionados no ML são detectados automaticamente.

### Mudanças no backend

- `EnergyAnalysisService.buildMlRequest()`: O `switch` de tradução de `property_type` é removido. `property.getPropertyType()` (já em inglês: `"RESIDENCIAL"`, `"APARTAMENTO"`, `"COMERCIAL"`) vai direto ao ML.
- `EquipmentCategory.java`: Os valores do enum (`REFRIGERATION`, `CLIMATE_CONTROL`, etc.) são enviados diretamente como `highest_consumption_category`.
- `highest_consumption_products`: Calculado a partir do inventário do usuário (top 3 aparelhos) e enviado sem tradução - os nomes em português são dados, não código.

### Mudanças no frontend

- `appliances.ts`: `mlCategory` muda de português para inglês (`"Refrigeracao"` → `"REFRIGERATION"`), alinhado ao backend.
- `types/index.ts`: `PROPERTY_TYPES` ganha `"APARTAMENTO"`.
- `AnalysisForm.tsx` e `ProfilePage.tsx`: `CATEGORIES` e `CATEGORY_ORDER` atualizados para usar chaves em inglês.
- UI continua exibindo rótulos em português para o usuário final (`"Refrigeração"`, `"Climatização"`, etc.).

### Banco de Dados

O banco Oracle existente pode ser recriado do zero (projeto em desenvolvimento). As migrations de seed (`V2__insert_appliances.sql`) e de normalização (`V6__normalize_property_type.sql`, `V9__clean_unused_appliances.sql`) podem ser ajustadas para refletir os novos valores em inglês dos enums.

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Contrato em inglês + normalização no ML (escolhido)** | Zero tradução no backend/frontend; mapeamento único no ML; contrato previsível | Requer ~30 linhas novas no ML Service; quebra compatibilidade retroativa (aceitável em dev) |
| **Contrato bilíngue (PT + EN)** | Compatibilidade retroativa total | Duplicação de mapeamentos no ML (~20 entradas vs ~8); mais código para manter |
| **Camada de tradução no backend (MlFieldMapper)** | Mantém o ML inalterado | Todo novo valor exige atualização no mapper; duplica lógica que já existe no ML |
| **Manter como está (tradução manual no backend)** | Nenhuma mudança imediata | Frágil; toda alteração no ML exige alteração em 3 camadas; switch atual ignora Apartamento |

## Consequências

- **Positivo:** O backend envia `property_type = "RESIDENCIAL"` e `highest_consumption_category = "REFRIGERATION"` sem nenhuma tradução. O `switch` de tradução é eliminado.
- **Positivo:** O frontend usa `mlCategory: "REFRIGERATION"` (inglês), alinhado ao enum `EquipmentCategory.REFRIGERATION` do backend.
- **Positivo:** O ML Service é o único ponto de normalização linguística - backend e frontend nunca precisam saber que internamente o modelo usa português.
- **Positivo:** Catálogo de aparelhos descoberto dinamicamente via `/appliance-catalog`, eliminando hardcoded no frontend.
- **Positivo:** Endpoint `/contract` permite descoberta completa do contrato em inglês.
- **Positivo:** Campo `highest_consumption_products` agora pode ser enviado sem necessidade de tradução.
- **Positivo:** Compatibilidade retroativa não é necessária - projeto em desenvolvimento sem clientes reais.
- **Negativo:** ML Service ganha ~30 linhas de código novo (3 endpoints + 2 funções de normalização).
- **Negativo:** Chamadas antigas para o ML Service com valores em português deixam de funcionar (aceitável em ambiente de desenvolvimento).
- **Negativo:** Banco Oracle precisa ser recriado - dados existentes com valores em português perdem a validade.

> **Nota:** Consulte o [glossário do projeto](../glossario.md) para definição dos termos utilizados neste documento.
