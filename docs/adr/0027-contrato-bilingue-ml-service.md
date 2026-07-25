# ADR-0027: Contrato Bilíngue do ML Service para Redução de Acoplamento entre Camadas

## Status

Proposto

## Contexto

O ML Service (Python/FastAPI) exige que os campos categóricos da requisição `POST /predict`
sejam enviados em **português**, enquanto o backend (Java/Spring) utiliza **inglês** como
convenção de código para seus enums (`EquipmentCategory`, `PropertyType`) e o frontend
(TypeScript/React) mantém **inglês** como padrão interno. Essa divergência linguística força
o backend a manter uma camada de tradução manual em `EnergyAnalysisService.buildMlRequest()`,
um `switch` que traduz `RESIDENCIAL → "Casa"` e ignora o tipo `APARTAMENTO`.

Além disso, três fontes adicionais de acoplamento foram identificadas:

- **Catálogo de aparelhos:** O ML Service possui dados de treino com dezenas de aparelhos (CSVs `pph-data-complete.csv` e `rotuled-ml-processed.csv`), mas não expõe esse catálogo via API. Frontend e backend precisam manter listas hardcoded e migrations manuais que frequentemente ficam desatualizadas.
- **Schema Discovery incompleto:** O endpoint `/categories` expõe apenas as categorias de eficiência energética (`EXCELENTE`, `BOM`, etc.), mas não expõe os tipos de imóvel válidos nem as categorias de consumo esperadas pelo modelo.
- **Campos não enviados:** O campo `highest_consumption_products` (lista dos 3 aparelhos de maior consumo) é aceito pelo ML mas nunca enviado pelo backend, pois exigiria lógica de cálculo e tradução para português.

O problema central é que **quem define o contrato (ML Service) usa um idioma que não é o idioma nativo dos consumidores (backend/frontend)**, gerando uma camada extra de tradução que precisa ser mantida e atualizada manualmente sempre que o ML Service muda.

## Decisão

A equipe decidiu tornar o ML Service **bilíngue** nos campos categóricos e **autodescritivo** quanto ao seu próprio contrato, eliminando a necessidade de tradução e descoberta manual nas camadas consumidoras. A decisão se divide em três mudanças complementares:

### Mudança 1: Aceitar valores em inglês e português nos campos categóricos

O ML Service passa a normalizar internamente tanto valores em português quanto em inglês para os campos `property_type` e `highest_consumption_category`, utilizando o mapeamento já existente em `features.py::normalize_category()`.

**`features.py` - extensão do `normalize_category()`:**

```python
def normalize_category(cat: object) -> str:
    if not isinstance(cat, str):
        return "Outros"
    cat_lower = cat.strip().lower()
    mapping = {
        # Português (já existente)
        "refrigeracao": "Refrigeracao",
        "refrigeração": "Refrigeracao",
        "climatizacao": "Climatizacao",
        "climatização": "Climatizacao",
        "tecnologia": "Tecnologia",
        "iluminacao": "Iluminacao",
        "iluminação": "Iluminacao",
        "eletrodomesticos": "Eletrodomesticos",
        "eletrodomésticos": "Eletrodomesticos",
        "servicos": "Servicos",
        "serviços": "Servicos",
        "outros": "Outros",
        # Inglês (novo)
        "refrigeration": "Refrigeracao",
        "climate_control": "Climatizacao",
        "climatization": "Climatizacao",
        "technology": "Tecnologia",
        "lighting": "Iluminacao",
        "appliances": "Eletrodomesticos",
        "services": "Servicos",
        "others": "Outros",
    }
    return mapping.get(cat_lower, "Outros")
```

**`main.py` - `BASE_CONSUMPTION_BY_TYPE` estendido:**

```python
BASE_CONSUMPTION_BY_TYPE = {
    # Português (compatibilidade retroativa)
    "Casa": 250.0,
    "Apartamento": 150.0,
    "Comercial": 500.0,
    # Inglês (novo)
    "RESIDENCIAL": 250.0,
    "APARTAMENTO": 150.0,
    "COMERCIAL": 500.0,
}
```

A alteração no prompt do Groq troca a comparação literal `"Apartamento"` por uma verificação case-insensitive.

**Efeito:** O backend pode enviar `property_type = "RESIDENCIAL"` e `highest_consumption_category = "REFRIGERATION"` sem nenhuma tradução. Compatibilidade retroativa mantida - chamadas existentes com valores em português continuam funcionando.

### Mudança 2: Endpoint `/appliance-catalog` para descoberta dinâmica do catálogo

O ML Service expõe um endpoint que lê os datasets de treino e retorna o catálogo completo de aparelhos reconhecidos pelo modelo:

```python
@app.get("/appliance-catalog")
def appliance_catalog():
    """Retorna o catálogo de aparelhos que o modelo reconhece, extraído dos datasets de treino."""
    df_pph = pd.read_csv(os.path.join(BASE_DIR, "data", "pph-data-complete.csv"))
    df_rotuled = pd.read_csv(os.path.join(BASE_DIR, "data", "rotuled-ml-processed.csv"))
    catalog = []
    # Mapeamento das colunas qtd_* do CSV para nome, categoria ML, potência e uso
    APPLIANCE_COLUMNS = {
        "qtd_geladeira":        {"name": "Geladeira",        "ml_category": "Refrigeracao",    "watts": 150,  "hours": 24},
        "qtd_ar_condicionado":  {"name": "Ar-condicionado",  "ml_category": "Climatizacao",    "watts": 1500, "hours": 8},
        "qtd_ventilador":       {"name": "Ventilador",       "ml_category": "Climatizacao",    "watts": 100,  "hours": 8},
        "qtd_lampadas":         {"name": "Lâmpada",          "ml_category": "Iluminacao",      "watts": 12,   "hours": 6},
        "qtd_microondas":       {"name": "Micro-ondas",      "ml_category": "Eletrodomesticos","watts": 1200, "hours": 0.5},
        "qtd_air_fryer":        {"name": "Air fryer",        "ml_category": "Eletrodomesticos","watts": 1500, "hours": 0.75},
        "qtd_lavar_secar":      {"name": "Máquina de lavar", "ml_category": "Eletrodomesticos","watts": 500,  "hours": 1.5},
        "qtd_chuveiro_eletrico":{"name": "Chuveiro elétrico","ml_category": "Eletrodomesticos","watts": 5500, "hours": 0.5},
        "qtd_tv":               {"name": "Televisão",        "ml_category": "Tecnologia",      "watts": 150,  "hours": 6},
        "qtd_computadores":     {"name": "Computador",       "ml_category": "Tecnologia",      "watts": 150,  "hours": 8},
        "qtd_videogame":        {"name": "Videogame",        "ml_category": "Tecnologia",      "watts": 200,  "hours": 4},
    }
    for col, info in APPLIANCE_COLUMNS.items():
        if col in df_pph.columns:
            catalog.append(info)
    return {"appliances": catalog}
```

**Efeito:** O `ApplianceController` do backend passa a consumir esse endpoint no startup (via `MlSchemaDiscovery`), eliminando a dependência do catálogo hardcoded no frontend (`appliances.ts::APPLIANCE_FALLBACK`) e das migrations de seed no banco Oracle. Qualquer alteração nos datasets de treino do ML reflete automaticamente.

### Mudança 3: Endpoint `/contract` unificado para Schema Discovery completo

Substitui e expande os endpoints atuais `/predict-schema` e `/categories` por um único endpoint que expõe todo o contrato do ML Service:

```python
@app.get("/contract")
def contract():
    """Retorna o contrato completo do ML Service para descoberta dinâmica."""
    return {
        "version": "2.1.0",
        "property_types": ["RESIDENCIAL", "APARTAMENTO", "COMERCIAL"],
        "efficiency_categories": ["EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO"],
        "consumption_categories": [
            "Refrigeracao", "Climatizacao", "Tecnologia",
            "Iluminacao", "Eletrodomesticos", "Servicos", "Outros"
        ],
        "request_schema": PredictRequest.model_json_schema(),
        "response_schema": PredictResponse.model_json_schema(),
    }
```

Os endpoints anteriores `/predict-schema` e `/categories` são mantidos por compatibilidade, mas o endpoint `/contract` passa a ser a fonte única de verdade.

**Efeito:** O `MlSchemaDiscovery` no backend faz uma única chamada no startup e descobre: tipos de imóvel, categorias de eficiência, categorias de consumo, schema de request e schema de response. Novos valores adicionados em qualquer um desses enums pelo time de ML são automaticamente detectados.

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **ML bilíngue + self-describing (escolhido)** | Backend e frontend enviam valores nativos; descoberta automática; compatibilidade retroativa | Requer ~60 linhas novas no ML Service |
| **Camada de tradução no backend (MlFieldMapper)** | Mantém o ML inalterado | Todo novo valor exige atualização no mapper; duplica lógica |
| **Padronizar ML para inglês** | Único idioma em todo o sistema | Quebra compatibilidade com chamadas existentes; exige possível retreino |
| **GraphQL como camada intermediária** | Contrato flexível por design | Complexidade excessiva; infra nova para sustentar |
| **Manter como está (tradução manual)** | Nenhuma mudança imediata | Frágil; toda alteração no ML exige alteração em 3 camadas |

## Consequências

- **Positivo:** O backend pode enviar `property_type = "RESIDENCIAL"` e `highest_consumption_category = "REFRIGERATION"` sem nenhuma tradução, eliminando o `switch` em `EnergyAnalysisService.buildMlRequest()`.
- **Positivo:** O frontend pode usar `mlCategory: "REFRIGERATION"` (inglês) como valor interno, alinhado ao enum `EquipmentCategory.REFRIGERATION` do backend.
- **Positivo:** O catálogo de aparelhos é descoberto dinamicamente via `/appliance-catalog`, eliminando o `APPLIANCE_FALLBACK` hardcoded no frontend e as migrations de seed no Oracle.
- **Positivo:** O endpoint `/contract` unificado permite que o backend descubra todo o contrato do ML em uma única chamada, incluindo tipos de imóvel, categorias de consumo e schemas de request/response.
- **Positivo:** Compatibilidade retroativa total - chamadas existentes com valores em português continuam funcionando sem alteração.
- **Positivo:** O campo `highest_consumption_products` agora pode ser enviado pelo backend sem necessidade de tradução, melhorando a qualidade das recomendações do Groq.
- **Negativo:** O ML Service ganha ~60 linhas de código novo (3 endpoints + mapeamento).
- **Negativo:** O mapeamento de sinônimos (ex: `climate_control` e `climatization` apontando para `Climatizacao`) precisa ser mantido atualizado se novas categorias forem adicionadas.
- **Negativo:** Os endpoints antigos `/predict-schema` e `/categories` tornam-se duplicados e devem ser removidos em versão futura.

> **Nota:** Consulte o [glossário do projeto](../glossario.md) para definição dos termos utilizados neste documento.
