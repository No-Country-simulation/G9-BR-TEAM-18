# ADR-0015: Correções de Linting no ML Service - Mypy/Ruff

## Status

Aceito

## Contexto

O CI `lint-ml-service` executa `ruff check`, `ruff format --check` e `mypy .` no diretório
`ml-service/`. A configuração do mypy no `pyproject.toml` define
`disallow_untyped_defs = true`, o que exige que **toda função tenha assinatura tipada**.

Após a implementação dos cards anteriores, três arquivos do ML Service continham 16
violações de tipagem:

| Arquivo | Linhas | Tipo de erro |
|---|---|---|
| `features.py` | 23 | `no-untyped-def` - função `normalize_category` sem tipo |
| `main.py` | 93, 269, 311, 383 | `no-untyped-def` - funções sem tipo de retorno |
| `main.py` | 238 | `union-attr` - `groq_client` pode ser `None` |
| `train_model.py` | 37, 131, 144, 155, 174, 212, 221, 245, 367, 405 | `no-untyped-def` - funções sem tipo |

Todas as violações são pré-existentes (não introduzidas pelos cards B020-B023), mas foram
bloqueadoras no CI por estarem no escopo de verificação.

## Decisão

A equipe adicionou anotações de tipo em todas as funções dos três arquivos:

### features.py

```python
# Antes:
def normalize_category(cat):
# Depois:
def normalize_category(cat: object) -> str:
```

### main.py

- `_groq_register_call()` adicionado `-> None`
- `_store_for_training(...)` adicionado `-> None`
- `predict_consumption(data: PredictRequest)` adicionado `-> PredictResponse`
- `status()` adicionado `-> StatusResponse`
- `_generate_recommendations_groq()`: adicionado `assert groq_client is not None` antes do
  acesso a `groq_client.chat` para resolver o erro `union-attr`

### train_model.py

Todas as 10 funções receberam tipos nos parâmetros e retorno: `normalize_category_label`,
`_assign_region_property`, `_estimate_high_consumption_hours`, `_infer_peak_usage`,
`generate_record`, `calculate_inefficiency_index`, `load_labeled_csv`, `load_pph_data`,
`load_feedback`, `generate_synthetic`.

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Adicionar tipos (escolhido)** | Respeita `disallow_untyped_defs`, código mais seguro | Trabalho manual em 16 funções |
| **Remover `disallow_untyped_defs`** | Zero alteração de código | Enfraquece a verificação de tipos |
| **Adicionar `# type: ignore`** | Correção rápida, sem alteração de assinatura | Polui o código com suppress comments |

## Consequências

- **Positivo:** Mypy passa com zero erros
- **Positivo:** Código do ML Service agora tem tipagem completa, facilitando manutenção
- **Positivo:** O `assert groq_client is not None` documenta explicitamente a pré-condição
  de que o cliente Groq deve estar configurado quando a função é chamada
- **Neutro:** As anotações de tipo usam `object` em alguns parâmetros de bibliotecas sem
  stub (`pd.Series` para `_infer_peak_usage`), mas `ignore_missing_imports = true` no mypy
  permite isso
