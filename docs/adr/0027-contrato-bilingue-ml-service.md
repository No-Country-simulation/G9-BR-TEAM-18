# ADR-0027: Contrato em Inglês do ML Service para Eliminação de Tradução entre Camadas

## Status

Proposta

## Contexto

O ML Service (Python/FastAPI) atualmente exige que campos categóricos da requisição `POST /predict`
sejam enviados em **português** (`"Casa"`, `"Refrigeracao"`, etc.), enquanto o backend (Java/Spring)
utiliza **inglês** como convenção de código para seus enums (`EquipmentCategory.REFRIGERATION`,
`PropertyType.RESIDENCIAL`) e o frontend (TypeScript/React) mantém **inglês** como padrão interno de código.

Essa divergência linguística força o backend a manter uma camada de tradução manual em
`EnergyAnalysisService.buildMlRequest()` - um `switch` que traduz
`RESIDENCIAL → "Casa"`, `COMERCIAL → "Comercial"`, e simplesmente ignora o tipo
`APARTAMENTO` (que o ML reconhece mas o backend não envia).

O problema é agravado por três fatores:

- **O contrato do ML dita o idioma de todas as camadas:** Qualquer alteração nos valores categóricos do ML (novo tipo de imóvel, nova categoria de consumo) exige alteração coordenada em backend (switch de tradução), frontend (mlCategory) e possivelmente banco de dados.
- **Duplicação de lógica de normalização:** O ML Service já possui em `features.py::normalize_category()` a lógica para normalizar variações de categoria (ex: "refrigeração" e "refrigeracao" → "Refrigeracao"). Fazer o backend replicar essa lógica em sentido inverso (REFRIGERATION → "Refrigeracao") é duplicação desnecessária.
- **Campo não utilizado:** O campo `highest_consumption_products` (top 3 aparelhos) é aceito pelo ML mas nunca enviado pelo backend, justamente porque exigiria tradução dos nomes dos aparelhos para português.

## Decisão

A equipe decidiu padronizar o contrato do ML Service para **inglês como único idioma aceito nos campos
categóricos**, centralizando toda a normalização linguística exclusivamente no ML Service. O ML Service
passa a normalizar internamente valores em inglês para o formato que o modelo foi treinado (português),
sem que backend ou frontend precisem conhecer ou replicar essa normalização.

A mudança se concentra em três pontos validados tecnicamente pela equipe de ML:

### 1. Nova função de tradução `translate_category()` (sem modificar `normalize_category()`)

A função existente `normalize_category()` em `features.py` **não é modificada**.
Ela continuará normalizando variações de acentuação em português
(`"Refrigeração"` → `"Refrigeracao"`) porque é usada tanto no treino do modelo
(via `sklearn Pipeline` em `feature_engineering()`) quanto na inferência.
Reescrevê-la para mapear inglês → português quebraria o treino, onde os dados chegam
acentuados em português puro. Em vez disso, uma **nova função de tradução** é criada
exclusivamente para o contrato da API.

**`features.py` - nova função `translate_category()` + nova função `normalize_property_type()`:**

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


def translate_category(cat: object) -> str:
    """Traduz highest_consumption_category de inglês para português.

    Função separada da normalize_category() porque esta é usada no pipeline
    sklearn (treino + inferência) e não deve ser alterada.
    translate_category() é chamada apenas na camada de contrato da API.
    """
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

### 2. `BASE_CONSUMPTION_BY_TYPE` alterado apenas em `main.py`

O dicionário `BASE_CONSUMPTION_BY_TYPE` existe em três arquivos. **Apenas a cópia em `main.py`**
deve ter as chaves alteradas para inglês, porque é a única que recebe o valor cru da requisição
da API via `_classify_rule_based(data)`. As cópias em `features.py` e `train_model.py`
permanecem em português (são usadas internamente para treino e geração de dados sintéticos,
nunca recebendo dados do backend).

```python
# main.py - Única cópia que deve usar inglês
BASE_CONSUMPTION_BY_TYPE = {
    "RESIDENCIAL": 250.0,
    "APARTAMENTO": 150.0,
    "COMERCIAL": 500.0,
}
```

### 3. Log de treinamento armazena valores traduzidos (português)

Atualmente `_store_for_training()` registra `data.property_type` **cru** (sem tradução).
Com a mudança para inglês no contrato, o valor cru passará a ser `"RESIDENCIAL"`. No entanto,
`load_feedback()` em `train_model.py` lê esse campo sem normalização e passa diretamente ao
`OneHotEncoder`, que só reconhece categorias em português (`"Casa"`, `"Apartamento"`, `"Comercial"`).

Portanto, `_store_for_training()` deve gravar os valores **já traduzidos** (português):

```python
def _store_for_training(data: PredictRequest, ...):
    record = {
        "features": {
            "property_type": normalize_property_type(data.property_type),
            #                  ↑ traduzido para português antes de armazenar
            "highest_consumption_category": translate_category(
                data.highest_consumption_category or "Outros"
            ),
            ...                              ↑ traduzido para português
        }
    }
```

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Contrato em inglês + normalização no ML (escolhido)** | Zero tradução no backend/frontend; mapeamento único no ML; contrato previsível | Requer ~30-40 linhas novas no ML Service; quebra compatibilidade retroativa (aceitável em dev) |
| **Modificar `normalize_category()` existente (rejeitado)** | Reaproveita função já existente | Quebra o treino (dados chegam acentuados em PT); quebra o pipeline sklearn na inferência |
| **Manter como está (tradução manual no backend)** | Nenhuma mudança imediata | Frágil; toda alteração no ML exige alteração em várias camadas; switch atual ignora Apartamento |

## Consequências

- **Positivo:** O backend envia `property_type = "RESIDENCIAL"` e
  `highest_consumption_category = "REFRIGERATION"` sem nenhuma tradução. O `switch` de
  tradução é eliminado.
- **Positivo:** `normalize_category()` existente permanece intacta - o treino do modelo
  não é afetado.
- **Positivo:** `translate_category()` é uma adição, não uma modificação, reduzindo risco
  de regressão.
- **Positivo:** O log de treinamento armazena valores em português (traduzidos), mantendo
  `load_feedback()` funcional com o `OneHotEncoder`.
- **Positivo:** Apenas a cópia de `main.py` do `BASE_CONSUMPTION_BY_TYPE` muda para inglês -
  as cópias de `features.py` e `train_model.py` permanecem em português sem impacto.
- **Negativo:** ML Service ganha ~30-40 linhas de código novo (2 funções + comentários).
- **Negativo:** Chamadas antigas para o ML Service com valores em português deixam de
  funcionar (aceitável em ambiente de desenvolvimento).

> **Nota:** Consulte o [glossário do projeto](../glossario.md) para definição dos termos
> utilizados neste documento.
