# Modelo de Classificação

## Problema

O dataset da PPH não vem com um rótulo de "eficiência energética", é preciso criar esse rótulo antes de treinar qualquer classificador supervisionado. A solução foi dividida em duas etapas independentes: **rotulagem** (criar a verdade de referência) e **classificação** (treinar um modelo que aprende a prever esse rótulo a partir dos dados de entrada, sem precisar recalcular a fórmula a cada previsão).

## Etapa 1 — Índice de ineficiência (rotulagem)

Um índice composto (0 a 1) combina quatro variáveis, com pesos definidos por lógica de negócio:

| Variável | Peso | Transformação aplicada |
|---|---|---|
| Consumo relativo ao tipo de imóvel | 40% | `consumo_total_kwh_mes / consumo_base_do_tipo_de_imovel`, normalizado |
| Uso em horário de pico | 25% | Booleano convertido para 0/1 |
| Quantidade de equipamentos | 20% | Normalizado pelo máximo da base |
| Horas de alto consumo | 15% | Normalizado pelo máximo da base |

**Por que consumo relativo, e não consumo bruto:** 800 kWh num imóvel Comercial é proporcionalmente baixo, mas seria extremamente alto numa Casa. Sem essa normalização por tipo de imóvel, o índice ficaria dominado só pela escala de consumo, e imóveis maiores sempre pareceriam "ineficientes" mesmo sendo econômicos para o próprio porte.

Valores de referência de consumo por tipo de imóvel (usados na normalização):
```python
CONSUMO_BASE_POR_TIPO = {
    "Casa": 200,
    "Apartamento": 130,
    "Comercio": 600,
}
```

## Etapa 2 — Corte em categorias (quintis)

O índice é cortado em **5 faixas de tamanho igual** (`pd.qcut`, quintis), garantindo ~20% da base em cada categoria — evita o desbalanceamento que ocorreria com limiares fixos arbitrários:

```
Excelente → Bom → Mediano → Ruim → Crítico
```

**Histórico da nomenclatura:** a equipe considerou nomear as categorias com letras (A–E, inspirado na etiqueta do INMETRO) e com uma escala de "saúde energética" antes de decidir pelo estilo de conceito/boletim escolar (`Excelente/Bom/Mediano/Ruim/Crítico`), por ser mais familiar ao público brasileiro sem remeter diretamente à escala regulatória oficial.

## Etapa 3 — Treinamento do classificador

**Modelo escolhido: Random Forest** (`n_estimators=200`).

### Comparação realizada

O requisito do projeto permitia Regressão Logística, Random Forest ou Árvore de Decisão. Os três foram comparados formalmente antes da escolha final:

| Modelo | Observação |
|---|---|
| **Random Forest** | Melhor acurácia geral nos testes realizados; captura relações não-lineares entre as variáveis |
| Regressão Logística | Probabilidades nativamente mais calibradas; competitivo em acurácia em alguns testes |
| Árvore de Decisão | Mais fácil de visualizar, mas tende a overfitar com poucos dados; pior desempenho nos testes |

### Features usadas no treinamento

```python
COLUNAS_NUMERICAS = ["consumo_total_kwh_mes", "quantidade_equipamentos", "horas_alto_consumo"]
COLUNAS_CATEGORICAS = ["tipo_imovel"]
COLUNAS_BOOLEANAS = ["uso_horario_pico"]
```

### Colunas explicitamente excluídas do treinamento

| Coluna | Motivo da exclusão |
|---|---|
| `entrevista` | Identificador, sem valor preditivo |
| `regiao`, `uf`, `municipio` | Alta cardinalidade, sem tratamento definido para geografia |
| `valor_estimado_conta_reais` | **Vazamento de dados** — é diretamente proporcional a `consumo_total_kwh_mes`; incluir geraria uma correlação artificial e não ensinaria o modelo a generalizar |

### Pipeline de pré-processamento

```python
ColumnTransformer([
    ("num", StandardScaler(), COLUNAS_NUMERICAS + COLUNAS_BOOLEANAS),
    ("cat", OneHotEncoder(handle_unknown="ignore"), COLUNAS_CATEGORICAS),
])
```

O modelo final é salvo como um **pipeline único** (`modelo_categorizacao.joblib`), incluindo pré-processamento — qualquer novo dado de entrada passa pelo mesmo scaler/encoder automaticamente ao chamar `.predict()`.

## Uso em produção

```python
modelo = joblib.load("modelo_categorizacao.joblib")
categoria = modelo.predict(dados_novo_cliente_df)[0]
probabilidade = modelo.predict_proba(dados_novo_cliente_df).max()
```

O índice de quintis **não é recalculado em produção** — ele existiu só para gerar o rótulo de treino. Em produção, o classificador prevê a categoria diretamente a partir das features brutas do cliente.
