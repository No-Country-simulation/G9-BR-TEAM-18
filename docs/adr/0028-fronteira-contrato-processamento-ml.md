# ADR-0028: Complemento ao Contrato em Inglês - Fronteira entre API e Processamento Interno do ML Service

## Status

Proposta

## Contexto

O ADR-0027 definiu que o ML Service deve aceitar apenas valores em inglês nos campos categóricos
da requisição (`property_type`, `highest_consumption_category`), centralizando a normalização
para português internamente. No entanto, durante a análise do código-fonte do ML Service,
surgiram dúvidas sobre por que certos identificadores internos permanecem em português e se
isso poderia causar confusão ou retrabalho no backend.

Além disso, o feedback técnico da equipe de ML revelou três nuances importantes que este ADR
complementa:

1. A função `normalize_category()` em `features.py` não pode ser modificada porque é usada
   tanto no treino (dados acentuados em português) quanto na inferência (via `sklearn Pipeline`).
   A solução é **adicionar** uma função de tradução separada, não modificar a existente.
2. O dicionário `BASE_CONSUMPTION_BY_TYPE` existe em três arquivos (`main.py`, `features.py`,
   `train_model.py`). Apenas a cópia em `main.py` deve mudar para inglês.
3. O log de treinamento (`_store_for_training()`) deve armazenar valores em português
   (traduzidos), não crus em inglês, para manter a compatibilidade com `load_feedback()` e
   o `OneHotEncoder` em `train_model.py`.

Este ADR complementa o ADR-0027 esclarecendo a fronteira exata entre o que é **contrato público
da API** (inglês) e o que é **processamento interno do ML Service** (pode usar português),
incorporando as correções apontadas pelo time responsável pelo ML.

## Decisão

A equipe decidiu formalizar a separação entre **camada de contrato** e **camada de
processamento interno** do ML Service, documentando que o backend nunca precisa conhecer
os detalhes internos do ML. A tradução EN→PT é uma responsabilidade exclusiva do ML
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
│  Recebe do ML:                │       │  │                                       │   │
│  category: "BOM"              │       │  │  _store_for_training()               │   │
│  recommendations: ["..."]     │←HTTP──│  │  → grava VALORES TRADUZIDOS (PT)    │   │
│                               │       │  │    para compatibilidade com          │   │
│                               │       │  │    load_feedback() + OneHotEncoder   │   │
│                               │       │  └──────────────────────────────────────┘   │
│                               │       │                     ↓ (traduz)             │
│                               │       │  ┌── normalização EN→PT ───────────────┐   │
│                               │       │  │  normalize_property_type()           │   │
│                               │       │  │  translate_category() (NOVA!)        │   │
│                               │       │  │  → "Casa", "Refrigeracao"            │   │
│                               │       │  │                                     │   │
│                               │       │  │  normalize_category() (existe)       │   │
│                               │       │  │  → normaliza acentos PT ("Refrige-  │   │
│                               │       │  │    ração" → "Refrigeracao")          │   │
│                               │       │  │  → NÃO modificada (usada no treino)  │   │
│                               │       │  └──────────────────────────────────────┘   │
│                               │       │                     ↓                      │
│                               │       │  ┌── Camada Interna (português) ───────┐   │
│                               │       │  │  Modelo treinado com dados PPH      │   │
│                               │       │  │  → espera "Casa", "Refrigeracao"    │   │
│                               │       │  │                                     │   │
│                               │       │  │  Fallback rule-based:                │   │
│                               │       │  │  _classify_rule_based()             │   │
│                               │       │  │  BASE_CONSUMPTION_BY_TYPE           │   │
│                               │       │  │  → chaves em INGLÊS (só main.py)   │   │
│                               │       │  └──────────────────────────────────────┘   │
└───────────────────────────────┘       └─────────────────────────────────────────────┘
```

### 2. Por que `BASE_CONSUMPTION_BY_TYPE` existe em três arquivos, mas só um muda

O dicionário `BASE_CONSUMPTION_BY_TYPE` está presente em três arquivos, cada um com um
propósito diferente:

| Arquivo | Uso | Deve mudar para inglês? | Motivo |
|---|---|---|---|
| `main.py` | `_classify_rule_based()` - fallback da API | **Sim** | Recebe `data.property_type` cru da requisição, que agora será `"RESIDENCIAL"` (inglês) |
| `features.py` | Definido mas **não usado** (código usa `500.0` hardcoded) | **Não** (ou remover) | Está apenas definido, nunca acessado com o valor cru da requisição |
| `train_model.py` | Geração de dados sintéticos e cálculo de ineficiência no treino | **Não** | Usado internamente, nunca recebe dados do backend |

**Código após ADR-0027 (apenas `main.py` muda):**

```python
# main.py - Recebe data.property_type cru da requisição → chaves em inglês
BASE_CONSUMPTION_BY_TYPE = {
    "RESIDENCIAL": 250.0,
    "APARTAMENTO": 150.0,
    "COMERCIAL": 500.0,
}

def _classify_rule_based(data: PredictRequest) -> tuple[str, float]:
    base = BASE_CONSUMPTION_BY_TYPE.get(data.property_type, 250.0)
    #                            ↑ data.property_type = "RESIDENCIAL" (inglês)
```

**O que não muda:**

```python
# features.py - Permanece em português (ou pode ser limpo se não usado)
BASE_CONSUMPTION_BY_TYPE = {
    "Casa": 250,
    "Apartamento": 150,
    "Comercial": 500,
}

# train_model.py - Permanece em português (dados sintéticos de treino)
BASE_CONSUMPTION_BY_TYPE = {
    "Casa": 250,
    "Apartamento": 150,
    "Comercial": 500,
}
```

### 3. Por que `normalize_category()` não é modificada

A função `normalize_category()` em `features.py` tem a função de normalizar **variações de
acentuação em português** (ex: `"Refrigeração"` → `"Refrigeracao"`, `"Serviços"` →
`"Servicos"`). Ela é usada em dois contextos distintos:

1. **Treino do modelo** (`train_model.py`): Os dados do CSV `rotuled-ml-processed.csv`
   chegam com acentos (`"Refrigeração"`, `"Climatização"`). A `normalize_category()` roda
   dentro do `sklearn Pipeline` via `feature_engineering()` e remove os acentos para
   compatibilidade com o `OneHotEncoder`.

2. **Inferência** (`main.py`): O `sklearn Pipeline` é carregado do `.joblib` e executa
   automaticamente `feature_engineering()` em toda chamada de `predict()`, que por sua vez
   chama `normalize_category()`.

Se `normalize_category()` fosse reescrita para mapear inglês → português:

- **No treino**, os dados acentuados em português não bateriam com nenhuma chave em inglês
  e seriam todos classificados como `"Outros"`, corrompendo o treinamento.
- **Na inferência**, o fluxo seria: `"REFRIGERATION"` → `translate_category()` → `"Refrigeracao"`
  (dentro de `main.py`), e então o pipeline executaria `normalize_category("Refrigeracao")`
  que espera inglês → `"Outros"`.

**Solução:** Criar `translate_category()` como função **nova e separada**, chamada **antes**
do pipeline sklearn. O pipeline continua executando `normalize_category()` normalmente
(que receberá `"Refrigeracao"` sem acentos e passará direto).

```python
# features.py - Função NOVA (não modifica normalize_category existente)
def translate_category(cat: object) -> str:
    """Traduz categoria do inglês (contrato) para português (formato do modelo).
    
    Chamada ANTES do pipeline sklearn. O resultado já sai sem acentos,
    então normalize_category() (dentro do pipeline) passa direto.
    """
    ...

# features.py - Função EXISTENTE (não modificada)
def normalize_category(cat: object) -> str:
    """Normaliza variações de acentuação em português.
    
    Usada dentro do sklearn Pipeline (train_model.py + main.py).
    NÃO deve ser alterada para mapear inglês → português.
    """
    ...
```

### 4. Por que o log de treinamento registra valores em português (traduzidos)

O ADR-0027 propunha originalmente que `_store_for_training()` registrasse `data.property_type`
**cru** (agora em inglês). No entanto, `load_feedback()` em `train_model.py` lê esse campo
sem nenhuma normalização e passa diretamente ao `OneHotEncoder`, que só reconhece categorias
em português (`"Casa"`, `"Apartamento"`, `"Comercial"`).

Se o log armazenasse `"RESIDENCIAL"` (inglês), a linha seria descartada pelo `OneHotEncoder`
por não corresponder a nenhuma categoria conhecida.

**Solução:** `_store_for_training()` deve gravar os valores **já traduzidos para português**:

```python
def _store_for_training(data: PredictRequest, ...):
    record = {
        "features": {
            "property_type": normalize_property_type(data.property_type),
            #                  ↑ "RESIDENCIAL" → "Casa" antes de armazenar
            "highest_consumption_category": translate_category(
                data.highest_consumption_category or "Outros"
            ),
            #                              ↑ "REFRIGERATION" → "Refrigeracao"
            ...
        }
    }
```

**Impacto:** O log continua sendo um dado interno do ML Service. O backend nunca o consulta.
A diferença é que, em vez de armazenar o valor cru em inglês, armazena o valor já traduzido
para garantir que o `OneHotEncoder` do `load_feedback()` continue funcionando sem alterações.

### 5. Fronteira clara: o que fica em português vs inglês no ML Service

| Componente | Idioma | Motivo |
|---|---|---|
| **`PredictRequest`** (contrato da API) | Inglês | Backend envia valores nativos dos seus enums |
| **`/contract`** (schema discovery) | Inglês | Backend descobre o contrato no mesmo idioma que envia |
| **`/appliance-catalog`** (nomes dos aparelhos) | Português | São substantivos do mundo real, não identificadores de código |
| **`normalize_property_type()`** (nova) | EN→PT | Ponte entre o contrato (inglês) e o modelo (português) |
| **`translate_category()`** (nova) | EN→PT | Ponte entre o contrato (inglês) e o modelo (português) - chamada antes do pipeline |
| **`normalize_category()`** (existente) | PT→PT (acentos) | Não modificada - usada no treino e dentro do pipeline sklearn |
| **`BASE_CONSUMPTION_BY_TYPE` em `main.py`** | Inglês | Acessado com `data.property_type` cru (agora inglês) |
| **`BASE_CONSUMPTION_BY_TYPE` em `features.py`** | Português | Inalterado (ou pode ser removido se não usado) |
| **`BASE_CONSUMPTION_BY_TYPE` em `train_model.py`** | Português | Inalterado (usado no treino, nunca recebe dados da API) |
| **`HIGHEST_CONSUMPTION_CATEGORIES`** | Português | Usado internamente após tradução - o dado já foi convertido |
| **Modelo ML (.joblib)** | Português | Treinado com dados da pesquisa PPH 2019 |
| **Log de treinamento (`_store_for_training`)** | Português (traduzido) | Armazena valores traduzidos para compatibilidade com `load_feedback()` e `OneHotEncoder` |
| **Recomendações (Groq/rule-based)** | Português | Saída exibida ao usuário final |

### 6. O backend nunca precisa saber disso

O backend (Java/Spring) se relaciona apenas com a **camada de contrato** do ML Service:

- **Envia:** `POST /predict` com `property_type: "RESIDENCIAL"` e
  `highest_consumption_category: "REFRIGERATION"` (inglês)
- **Recebe:** `category: "BOM"`, `probability: 0.85`, `recommendations: ["..."]` (resposta)

O backend **não precisa saber** que internamente o ML Service:

- Traduz `"RESIDENCIAL"` para `"Casa"` via `normalize_property_type()` antes de passar ao modelo
- Traduz `"REFRIGERATION"` para `"Refrigeracao"` via `translate_category()` (nova função),
  e depois o pipeline executa `normalize_category()` (existente) que passa direto
- Mantém a função `normalize_category()` original intacta para o treino do modelo
- Só alterou as chaves do `BASE_CONSUMPTION_BY_TYPE` no `main.py` - as outras cópias continuam em português
- Armazena o log de treinamento com valores já traduzidos para português

Isso é exatamente o objetivo do ADR-0027: **o ML Service é o único ponto de normalização
linguística**, e as demais camadas enviam e recebem dados no idioma do contrato (inglês
para identificadores, português para conteúdo exibível ao usuário).

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Documentar fronteira contrato vs interno (escolhido)** | Elimina dúvidas sobre o que está em cada idioma; backend sabe exatamente o que enviar | Nenhuma - é apenas documentação complementar |
| **Modificar `normalize_category()` em vez de criar `translate_category()` (rejeitado)** | Reaproveita função existente | Quebra o treino (dados acentuados em PT viram "Outros"); quebra o pipeline na inferência (dupla passagem) |
| **Retreinar o modelo com dados em inglês** | Eliminaria a necessidade de tradução no ML | Custo alto de retreinamento; dados originais estão em português |
| **Forçar português também no contrato** | Eliminaria a tradução (tudo no mesmo idioma) | Backend precisaria de tradução; volta ao problema original do ADR-0027 |
| **Não documentar a fronteira (deixar como está)** | Nenhum esforço adicional | Dúvidas como esta continuariam surgindo; risco de interpretação errada |

## Consequências

- **Positivo:** Fica claro que o backend nunca precisa conhecer os detalhes internos do ML
  Service - ele se relaciona apenas com o contrato em inglês.
- **Positivo:** A função `normalize_category()` existente não é modificada, preservando o
  treino do modelo e o pipeline sklearn.
- **Positivo:** A nova função `translate_category()` é uma adição segura que não afeta o
  fluxo existente.
- **Positivo:** Apenas a cópia de `main.py` do `BASE_CONSUMPTION_BY_TYPE` muda para inglês,
  alinhada ao fluxo da API. As cópias de `features.py` e `train_model.py` não são afetadas.
- **Positivo:** O log de treinamento armazena valores traduzidos (português), garantindo
  que `load_feedback()` e o `OneHotEncoder` continuem funcionando sem alterações.
- **Positivo:** A tabela de fronteira (seção 5) serve como referência rápida para qualquer
  membro da equipe entender o idioma de cada componente.
- **Negativo:** Este ADR adiciona um documento complementar que precisa ser mantido
  atualizado se a arquitetura interna do ML Service mudar.
- **Negativo:** Se no futuro o modelo for retreinado para aceitar inglês diretamente, a
  tradução EN→PT se tornará desnecessária, e este ADR precisará ser revisado.
- **Negativo:** O ML Service ganha uma função adicional (`translate_category()`), mas com
  complexidade O(1) e apenas ~15 linhas de código - impacto desprezível.
- **Futuro:** O `BASE_CONSUMPTION_BY_TYPE` em `features.py` está definido mas não é
  utilizado no código (usa `500.0` hardcoded em vez do dicionário). Recomenda-se
  como limpeza futura: remover o dicionário morto ou corrigir o código para
  usá-lo efetivamente.

> **Nota:** Consulte o [glossário do projeto](../glossario.md) para definição dos termos
> utilizados neste documento.
