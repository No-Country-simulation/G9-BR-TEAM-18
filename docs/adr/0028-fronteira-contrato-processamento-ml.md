# ADR-0028: Complemento ao Contrato em Inglês - Fronteira entre API e Processamento Interno do ML Service

## Status

Proposta

## Contexto

O ADR-0027 definiu que o ML Service deve aceitar apenas valores em inglês nos campos categóricos
da requisição (`property_type`, `highest_consumption_category`), centralizando a normalização
para português internamente. No entanto, durante a análise do código-fonte do ML Service,
surgiram dúvidas sobre por que certos identificadores internos permanecem em português e se
isso poderia causar confusão ou retrabalho no backend.

O feedback técnico da equipe de ML revelou três nuances importantes que este ADR complementa:

1. A função `normalize_category()` em `features.py` não pode ser modificada porque é usada
   tanto no treino (dados acentuados em português) quanto na inferência (via `sklearn Pipeline`).
   A solução é **adicionar** uma função de tradução separada, não modificar a existente.
2. O dicionário `BASE_CONSUMPTION_BY_TYPE` existe em três arquivos (`main.py`, `features.py`,
   `train_model.py`). Apenas a cópia em `main.py` deve mudar para inglês.
3. O log de treinamento (`_store_for_training()`) deve armazenar valores em português
   (traduzidos), não crus em inglês, para manter a compatibilidade com `load_feedback()` e
   o `OneHotEncoder` em `train_model.py`.

Este ADR complementa o ADR-0027 esclarecendo a fronteira exata entre o que é **contrato
da API** (inglês) e o que é **processamento interno do ML Service** (português),
incorporando as correções apontadas pelo time responsável pelo ML.

## Decisão

A equipe decidiu formalizar a separação entre **camada de contrato** e **camada de
processamento interno** do ML Service, documentando que o backend nunca precisa conhecer
os detalhes internos do ML. A tradução EN→PT é uma responsabilidade exclusiva do ML
Service, e o backend se relaciona apenas com o contrato em inglês.

### 1. O que o backend vê vs o que o ML processa internamente

```text
┌─ BACKEND (Java) ─────────────┐       ┌─ ML SERVICE ───────────────────────────┐
│                               │       │                                         │
│  Envia para o ML:             │       │  Contrato (inglês)                      │
│  property_type: "RESIDENCIAL" │       │  PredictRequest                         │
│  highest_consumption_category │──HTTP→│  → "RESIDENCIAL", "REFRIGERATION"       │
│  : "REFRIGERATION"            │       │                                         │
│                               │       │  _store_for_training()                 │
│  Recebe do ML:                │       │  → grava em português (traduzido)       │
│  category: "BOM"              │       │    para load_feedback() + OneHotEncoder │
│  recommendations: ["..."]     │←HTTP──│                                         │
│                               │       │  Tradução EN→PT:                       │
│                               │       │  normalize_property_type()              │
│                               │       │  translate_category() (nova função)     │
│                               │       │  → "Casa", "Refrigeracao"               │
│                               │       │                                         │
│                               │       │  Processamento interno (português)      │
│                               │       │  normalize_category() (existe, inalterada)   │
│                               │       │  → acentos PT já normalizados          │
│                               │       │  Modelo .joblib treinado com dados PPH  │
│                               │       │  Fallback _classify_rule_based()        │
│                               │       │  BASE_CONSUMPTION_BY_TYPE em inglês     │
│                               │       │  (só main.py)                          │
└───────────────────────────────┘       └─────────────────────────────────────────┘
```

### 2. `BASE_CONSUMPTION_BY_TYPE` em três arquivos, apenas um muda

O dicionário `BASE_CONSUMPTION_BY_TYPE` está presente em três arquivos, cada um com um
propósito diferente:

| Arquivo | Uso | Deve mudar para inglês? | Motivo |
|---|---|---|---|
| `main.py` | `_classify_rule_based()` - fallback da API | **Sim** | Recebe `data.property_type` cru da requisição, que agora será `"RESIDENCIAL"` (inglês) |
| `features.py` | Definido mas **não usado** (código usa `500.0` hardcoded) | **Não** | Nunca acessado com o valor cru da requisição |
| `train_model.py` | Geração de dados sintéticos e cálculo de ineficiência no treino | **Não** | Usado internamente, nunca recebe dados do backend |

### 3. Por que `normalize_category()` não é modificada

A função `normalize_category()` em `features.py` normaliza **variações de acentuação em
português** (ex: `"Refrigeração"` → `"Refrigeracao"`, `"Serviços"` → `"Servicos"`).
Ela é usada em dois contextos distintos:

1. **Treino do modelo** (`train_model.py`): Os dados do CSV `rotuled-ml-processed.csv`
   chegam com acentos. A `normalize_category()` roda dentro do `sklearn Pipeline` via
   `feature_engineering()` e remove os acentos para compatibilidade com o `OneHotEncoder`.

2. **Inferência** (`main.py`): O `sklearn Pipeline` é carregado do `.joblib` e executa
   automaticamente `feature_engineering()` em toda chamada de `predict()`.

Se `normalize_category()` fosse reescrita para mapear inglês → português:

- **No treino**, os dados acentuados em português não bateriam com nenhuma chave em inglês
  e seriam todos classificados como `"Outros"`, corrompendo o treinamento.
- **Na inferência**, o fluxo seria: `"REFRIGERATION"` → `translate_category()` →
  `"Refrigeracao"` (em `main.py`), e então o pipeline executaria
  `normalize_category("Refrigeracao")` que espera inglês → `"Outros"`.

**Solução:** Criar `translate_category()` como função **nova e separada**, chamada **antes**
do pipeline sklearn. O pipeline continua executando `normalize_category()` normalmente
(que receberá `"Refrigeracao"` sem acentos e passará direto).

### 4. Por que o log de treinamento registra valores em português (traduzidos)

`load_feedback()` em `train_model.py` lê o campo `property_type` do log sem normalização
e passa diretamente ao `OneHotEncoder`, que só reconhece categorias em português
(`"Casa"`, `"Apartamento"`, `"Comercial"`). Se o log armazenasse `"RESIDENCIAL"` (inglês),
a linha seria descartada pelo `OneHotEncoder` por não corresponder a nenhuma categoria
conhecida.

**Solução:** `_store_for_training()` grava os valores **já traduzidos para português**,
garantindo que o `OneHotEncoder` do `load_feedback()` continue funcionando sem alterações.

### 5. Fronteira: o que fica em português vs inglês no ML Service

| Componente | Idioma | Motivo |
|---|---|---|
| **`PredictRequest`** (contrato da API) | Inglês | Backend envia valores nativos dos seus enums |
| **`normalize_property_type()`** | EN→PT | Ponte entre o contrato (inglês) e o modelo (português) |
| **`translate_category()`** | EN→PT | Ponte entre o contrato (inglês) e o modelo (português) - chamada antes do pipeline |
| **`normalize_category()`** (existente) | PT→PT (acentos) | Não modificada - usada no treino e dentro do pipeline sklearn |
| **`BASE_CONSUMPTION_BY_TYPE` em `main.py`** | Inglês | Acessado com `data.property_type` cru (agora inglês) |
| **`BASE_CONSUMPTION_BY_TYPE` em `features.py`** | Português | Inalterado (não usado no pipeline da API) |
| **`BASE_CONSUMPTION_BY_TYPE` em `train_model.py`** | Português | Inalterado (usado no treino, nunca recebe dados da API) |
| **Modelo ML (.joblib)** | Português | Treinado com dados da pesquisa PPH 2019 |
| **Log de treinamento (`_store_for_training`)** | Português (traduzido) | Armazena valores traduzidos para compatibilidade com `load_feedback()` e `OneHotEncoder` |
| **Recomendações (Groq/rule-based)** | Português | Saída exibida ao usuário final |

### 6. O backend nunca precisa saber disso

O backend se relaciona apenas com a **camada de contrato** do ML Service:

- **Envia:** `POST /predict` com `property_type: "RESIDENCIAL"` e
  `highest_consumption_category: "REFRIGERATION"` (inglês)
- **Recebe:** `category: "BOM"`, `probability: 0.85`, `recommendations: ["..."]` (resposta)

O backend **não precisa saber** que internamente o ML Service:

- Traduz `"RESIDENCIAL"` para `"Casa"` via `normalize_property_type()`
- Traduz `"REFRIGERATION"` para `"Refrigeracao"` via `translate_category()`
- Mantém `normalize_category()` original intacta para o treino
- Só alterou as chaves do `BASE_CONSUMPTION_BY_TYPE` no `main.py`
- Armazena o log de treinamento com valores traduzidos para português

Isso é exatamente o objetivo do ADR-0027: **o ML Service é o único ponto de normalização
linguística**, e as demais camadas enviam e recebem dados no idioma do contrato (inglês
para identificadores, português para conteúdo exibível ao usuário).

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Documentar fronteira contrato vs interno (escolhido)** | Elimina dúvidas sobre o que está em cada idioma; backend sabe exatamente o que enviar | Nenhuma - é apenas documentação complementar |
| **Modificar `normalize_category()` em vez de criar `translate_category()` (rejeitado)** | Reaproveita função existente | Quebra o treino (dados acentuados em PT viram "Outros"); quebra o pipeline na inferência |
| **Retreinar o modelo com dados em inglês** | Eliminaria a necessidade de tradução no ML | Custo alto de retreinamento; dados originais estão em português |
| **Não documentar a fronteira** | Nenhum esforço adicional | Dúvidas como esta continuariam surgindo; risco de interpretação errada |

## Consequências

- **Positivo:** Fica claro que o backend nunca precisa conhecer os detalhes internos do ML
  Service - ele se relaciona apenas com o contrato em inglês.
- **Positivo:** `normalize_category()` não é modificada, preservando o treino do modelo e
  o pipeline sklearn.
- **Positivo:** `translate_category()` é uma adição segura que não afeta o fluxo existente.
- **Positivo:** Apenas a cópia de `main.py` do `BASE_CONSUMPTION_BY_TYPE` muda para inglês.
  As cópias de `features.py` e `train_model.py` não são afetadas.
- **Positivo:** O log de treinamento armazena valores traduzidos (português), garantindo
  que `load_feedback()` e o `OneHotEncoder` continuem funcionando sem alterações.
- **Negativo:** Este ADR adiciona um documento complementar que precisa ser mantido
  atualizado se a arquitetura interna do ML Service mudar.
- **Negativo:** O ML Service ganha uma função adicional (`translate_category()`), mas com
  complexidade O(1) e ~15 linhas de código - impacto desprezível.

> **Nota:** Consulte o [glossário do projeto](../glossario.md) para definição dos termos
> utilizados neste documento.
