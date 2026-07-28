# ADR-0045: Implementação do Contrato em Inglês no ML Service

## Status
Aceito

## Contexto

As ADR-0027 e ADR-0028 definiram a decisão de padronizar o contrato do `POST /predict` do ML Service para inglês nos campos `property_type` e `highest_consumption_category`, com tradução EN→PT centralizada exclusivamente no ML Service, além dos endpoints de descoberta `GET /contract` e `GET /appliance-catalog`. A ADR-0028 complementou esclarecendo a fronteira entre o que é contrato público (inglês) e o que é processamento interno do ML Service (português), incorporando três correções técnicas apontadas pela equipe de ML: a criação de uma função de tradução separada em vez de modificar `normalize_category()`, a restrição da mudança de `BASE_CONSUMPTION_BY_TYPE` para inglês apenas à cópia usada em `main.py`, e o ajuste de `_store_for_training()` para gravar valores já traduzidos.

Este ADR documenta a implementação de fato dessas decisões no código do `ml-service`, incluindo dois ajustes adicionais identificados durante a revisão técnica do time de ML antes da implementação: a necessidade de aplicar `normalize_property_type()` também no prompt de recomendações da Groq (não previsto na primeira versão da ADR-0027), e a confirmação de que `translate_category()` precisa ser aplicada dentro de `_run_prediction()`, antes da chamada ao modelo.

Consulte também a ADR-0044 para o contexto de descoberta dinâmica de contrato no lado do backend, que consome os endpoints aqui implementados.

## Decisão

Implementar as mudanças definidas nas ADR-0027 e ADR-0028 no `ml-service`, em cinco commits incrementais, cada um isolando uma responsabilidade específica.

### 1. Funções de tradução EN→PT em `features.py`

Adicionadas `normalize_property_type()` e `translate_category()`, sem nenhuma alteração na `normalize_category()` existente:

```python
def normalize_property_type(ptype: object) -> str:
    """Normaliza property_type de ingles para portugues (formato do modelo)."""
    if not isinstance(ptype, str):
        return "Casa"
    mapping = {
        "residencial": "Casa",
        "apartamento": "Apartamento",
        "comercial": "Comercial",
    }
    return mapping.get(ptype.strip().lower(), "Casa")


def translate_category(cat: object) -> str:
    """Traduz highest_consumption_category de ingles para portugues.
    Funcao separada da normalize_category() porque esta e usada no pipeline
    sklearn (treino + inferência) e não deve ser alterada.
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

Commit: `7aa4bc5`.

### 2. Endpoints de descoberta em `main.py`

Adicionados `GET /contract` e `GET /appliance-catalog`, conforme especificado na ADR-0027 seção A. Os endpoints antigos `/predict-schema` e `/categories` foram mantidos, sem remoção neste momento.

Commit: `f04cb51`.

### 3. Contrato do `/predict` em inglês

`BASE_CONSUMPTION_BY_TYPE` em `main.py` alterado para chaves em inglês (`RESIDENCIAL`, `APARTAMENTO`, `COMERCIAL`). As cópias em `features.py` e `train_model.py` permanecem em português, sem alteração, conforme ADR-0028 seção 2.

`_run_prediction()` passou a aplicar `normalize_property_type()` e `translate_category()` antes de montar o `DataFrame` enviado ao modelo:

```python
"property_type": normalize_property_type(data.property_type),
"highest_consumption_category": translate_category(
    data.highest_consumption_category or "Outros"
),
```

Commit: `35b4d1b`. Esta mudança é retroativamente incompatível: o `/predict` deixa de aceitar valores em português.

### 4. Tradução no prompt da Groq

Identificado durante a revisão técnica que `_generate_recommendations_groq()` interpola `data.property_type` diretamente no texto do prompt, que contém regras escritas em português (ex: "se for Apartamento, não sugira painel solar"). Sem tradução, um valor em inglês não bateria com essas regras. Corrigido aplicando `normalize_property_type()` antes de montar o prompt:

```python
property_type_pt = normalize_property_type(data.property_type)
```

Commit: `4d82d10`.

### 5. Log de feedback traduzido

`_store_for_training()` passou a gravar os valores já traduzidos, em vez dos valores crus da requisição:

```python
"property_type": normalize_property_type(data.property_type),
"highest_consumption_category": translate_category(
    data.highest_consumption_category or "Outros"
),
```

Isso preserva a compatibilidade com `load_feedback()` e o `OneHotEncoder` em `train_model.py`, que só reconhecem categorias em português e não fariam nenhuma tradução de volta caso o log passasse a acumular valores em inglês.

Commit: `4707476`.

## Validação

Após a implementação, `train_model.py` foi executado novamente e não apresentou nenhuma alteração de comportamento (distribuição de dados, hiperparâmetros e acurácia idênticos ao treino anterior), confirmando que as mudanças ficaram isoladas em `features.py` e `main.py`, sem efeito sobre o pipeline de treino.

## Alternativas consideradas

Já documentadas nas ADR-0027 e ADR-0028. Nenhuma alternativa nova foi avaliada nesta etapa, que é de implementação, não de decisão de arquitetura.

## Consequências

Positivo: as decisões das ADR-0027 e ADR-0028 estão implementadas e verificadas, com o pipeline de treino confirmado como não afetado.

Positivo: dois pontos que não estavam explícitos na primeira versão da ADR-0027 (tradução no prompt da Groq e confirmação da aplicação de `translate_category()` em `_run_prediction()`) foram identificados antes da implementação e incorporados na versão final aprovada, evitando um retrabalho.

Negativo: os endpoints antigos `/predict-schema` e `/categories` continuam no código, redundantes com `/contract`. A remoção fica para uma limpeza futura, a critério do time.

Negativo: o `/predict` já não aceita mais valores em português a partir do commit `35b4d1b`, exigindo que qualquer chamada manual ou de teste feita durante a transição use os valores em inglês.

Nota: consulte a ADR-0027, ADR-0028 e ADR-0044 para o contexto completo da decisão e da descoberta dinâmica de contrato entre ML Service, backend e frontend.