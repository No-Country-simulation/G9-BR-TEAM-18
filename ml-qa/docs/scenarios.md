# Cenários do ml-qa (v1)

Referência para interpretar os relatórios (`ml-qa-report.md` /
`ml-qa-report.json`): como cada cenário é gerado e o que ele significa.

## Princípio: só o que é possível em produção

Os cenários refletem o fluxo real (frontend -> backend -> ML). O backend
valida o payload antes de enviá-lo, então o ML **nunca** recebe (no fluxo
atual): campos obrigatórios ausentes, tipos incorretos, valores negativos,
`property_type` fora do contrato ou nomes de aparelhos que não estão no seu
próprio catálogo.

Por isso não existem cenários de "aparelho desconhecido", "tipo errado" ou
"campo faltando". Tudo é derivado de **conjuntos realistas de aparelhos**.

## Como um cenário é construído

1. Escolhe-se um **conjunto de aparelhos** (`scenarios/appliance_sets.py`):
   lista de aparelhos do catálogo do ML com quantidades (ex.: "casa média" =
   geladeira, freezer, lâmpadas, TV, micro-ondas, ar-condicionado, etc.);
2. `aggregate_set()` calcula, como o backend faz:
   - `equipment_quantity` = soma das quantidades;
   - `daily_consumption_distribution` = watts por categoria (refrigeração,
     aquecimento, ar-condicionado, iluminação);
   - `highest_consumption_category` = categoria com maior watts;
   - `highest_consumption_products` = top 3 por consumo mensal estimado
     (watts x horas x quantidade x 30 / 1000);
   - `expected_monthly_kwh` = consumo mensal esperado do inventário;
3. `build_payload()` monta o JSON do `/predict` com os 6 campos obrigatórios
   e os opcionais (categoria e produtos), exatamente como o backend.

Os valores de `consumption_kwh` dos cenários são ancorados no consumo
esperado do conjunto (ex.: 0.5x, 1x, 2x do esperado), de modo que cada
cenário é internamente coerente, ou testa deliberadamente a incoerência.

## Grupos de cenários

### `boundary`: valores-limite

Para cada conjunto de base (casa média, apartamento médio, comércio/loja),
varia um campo por vez mantendo o resto fixo:

- `boundary/<conjunto>/consumption=<kwh>`: consumo de 0.25x a 4x o esperado;
- `boundary/<conjunto>/hours=<h>`: horas de alto consumo em 0, 4, 8, 12, 24;
- `boundary/<conjunto>/peak=true|false`: uso em horário de pico.

Inclui a cadeia `monotonic/<conjunto>/consumption=<kwh>` (mesmo conjunto,
consumo crescente) usada pela verificação de monotonicidade: mais consumo
nunca deveria melhorar a categoria.

### `combinatorial`: matriz de combinações

Cruza os **8 conjuntos realistas** x 3 níveis de consumo (baixo 0.3x,
esperado 1x, alto 2.5x) x uso de pico (true/false):

```text
combinatorial/01-casa-basica-baixo-peak=false
```

E os cenários `threshold/<CAMPO>=<watts>` que testam as fronteiras exatas
dos limiares de recomendação do ML (ar-condicionado 3000 W, aquecimento
5000 W, iluminação 1000 W) em -1 / 0 / +1 W.

### `anomalies`: casos-limite possíveis

Todos esperam HTTP 200 (são válidos, porém extremos):

| Cenário | O que testa |
|---|---|
| `anomaly/edge/consumption-min` | Consumo no mínimo validado (0.01 kWh) |
| `anomaly/edge/consumption-max` | Consumo no máximo validado (99999999.99 kWh) |
| `anomaly/edge/hours-min` / `hours-max` | Horas em 0.0 e 99.99 (extremos da faixa) |
| `anomaly/edge/empty-set` | Imóvel sem aparelhos registrados (quantidade 0, distribuição zerada) |
| `anomaly/edge/optional-absent` | Payload sem `highest_consumption_category` e sem produtos (backend só envia quando presentes) |
| `anomaly/edge/consumption-below-set` | Consumo muito abaixo do que o inventário implicaria |
| `anomaly/edge/consumption-above-set` | Consumo muito acima do que o inventário implicaria |
| `anomaly/edge/peak-low-consumption` | Uso de pico com consumo baixo (estranho, porém válido) |

## Como ler o relatório

### Arquivos por análise (`reports/analyses/`)

Para cada cenário há um arquivo `.md` próprio, espelhando o histórico do
frontend, com:

- **Detalhamento por Equipamento**: tabela com equipamento, quantidade,
  potência (W), uso por dia (h) e consumo mensal (kWh/mês) de cada aparelho
  do conjunto, além do total (a mesma visão que o usuário vê na tela de
  histórico);
- **Payload enviado**: o JSON exato enviado ao `/predict`;
- **Resposta do ML**: categoria, probabilidade, fonte (model / model+groq /
  regras) e as recomendações retornadas;
- **Verificações**: cada check executado e seu resultado.

Isso permite à equipe do ML Service correlacionar o **conjunto de
aparelhos** enviado com a análise retornada e detectar o que causou uma
classificação ou recomendação inesperada.

### Relatório consolidado

A tabela "Detalhamento dos Cenários" mostra cada cenário com a coluna
**Conjunto** (qual inventário foi usado), status HTTP, categoria,
probabilidade, fonte (model / model+groq / regras) e latência. A seção
**"Análises Detalhadas"** aponta o arquivo individual de cada cenário.

A seção **"Inconsistências e Alertas"** destaca:

- consumo informado incoerente com o conjunto de aparelhos (razão < 0.2x
  ou > 3x do esperado);
- categoria suspeita para o consumo relativo (baixo consumo -> RUIM/CRITICO
  ou alto consumo -> EXCELENTE/BOM);
- confiança < 80% sem acionar o Groq (limite de taxa atingido);
- recomendações vazias; falha do Groq; modelo indisponível (fallback por
  regras);
- violações de monotonicidade.

A seção **"Distribuição de Fontes"** mostra quando o ML classifica sozinho
(confiança ≥ 80%), quando recorre ao Groq (< 80%) e quando cai para regras.
