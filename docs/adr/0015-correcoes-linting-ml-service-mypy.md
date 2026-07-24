# ADR-0015: Correcoes de Linting no ML Service - Mypy/Ruff

## Status

Aceito

## Contexto

O CI `lint-ml-service` executa `ruff check`, `ruff format --check` e `mypy .` no diretorio
`ml-service/`. A configuracao do mypy no `pyproject.toml` define
`disallow_untyped_defs = true`, o que exige que **toda funcao tenha assinatura tipada**.

Apos a implementacao dos cards anteriores, tres arquivos do ML Service continham 16
violacoes de tipagem:

| Arquivo | Linhas | Tipo de erro |
|---|---|---|
| `features.py` | 23 | `no-untyped-def` - funcao `normalize_category` sem tipo |
| `main.py` | 93, 269, 311, 383 | `no-untyped-def` - funcoes sem tipo de retorno |
| `main.py` | 238 | `union-attr` - `groq_client` pode ser `None` |
| `train_model.py` | 37, 131, 144, 155, 174, 212, 221, 245, 367, 405 | `no-untyped-def` - funcoes sem tipo |

Todas as violacoes sao pre-existentes (nao introduzidas pelos cards B020-B023), mas foram
bloqueadoras no CI por estarem no escopo de verificacao.

## Decisao

A equipe adicionou anotacoes de tipo em todas as funcoes dos tres arquivos:

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

Todas as 10 funcoes receberam tipos nos parametros e retorno: `normalize_category_label`,
`_assign_region_property`, `_estimate_high_consumption_hours`, `_infer_peak_usage`,
`generate_record`, `calculate_inefficiency_index`, `load_labeled_csv`, `load_pph_data`,
`load_feedback`, `generate_synthetic`.

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| **Adicionar tipos (escolhido)** | Respeita `disallow_untyped_defs`, codigo mais seguro | Trabalho manual em 16 funcoes |
| **Remover `disallow_untyped_defs`** | Zero alteracao de codigo | Enfraquece a verificacao de tipos |
| **Adicionar `# type: ignore`** | Correcao rapida, sem alteracao de assinatura | Polui o codigo com suppress comments |

## Consequencias

- **Positivo:** Mypy passa com zero erros
- **Positivo:** Codigo do ML Service agora tem tipagem completa, facilitando manutencao
- **Positivo:** O `assert groq_client is not None` documenta explicitamente a pre-condicao
  de que o cliente Groq deve estar configurado quando a funcao e chamada
- **Neutro:** As anotacoes de tipo usam `Any` em alguns parametros de bibliotecas sem stub
  (`pd.Series` para `_infer_peak_usage`), mas `ignore_missing_imports = true` no mypy
  permite isso
