# Relatório de Testes Exaustivos - ML Service

- **Base URL:** `http://localhost:8000`
- **Início:** `2026-08-11T03:38:53.170291+00:00`
- **Duração:** 635.21s

## Resumo

| Métrica | Valor |
|---|---|
| Cenários executados | 124 |
| Aprovados | 122 |
| Falhas | 2 |
| Taxa de sucesso | 98.39% |

## Distribuição de Fontes (origem da classificação)

Mostra **como** o ML Service classificou cada cenário: somente pelo modelo treinado (`model`), com apoio do Groq (`model+groq`, quando a confiança do modelo fica abaixo de 80%), ou caindo para regras.

| Fonte | Cenários | % | Prob. média | Latência média (ms) |
|---|---|---|---|---|
| Modelo + Groq (falhou → regras) | 67 | 54.92% | 65.36% | 271.59 |
| Modelo (confiança ≥ 80%) | 54 | 44.26% | 90.52% | 171.97 |
| Modelo + Groq (confiança < 80%) | 1 | 0.82% | 56.89% | 781.51 |

## Distribuição de Categorias

| Categoria | Cenários | % | Prob. média |
|---|---|---|---|
| BOM | 67 | 54.92% | 78.17% |
| CRITICO | 26 | 21.31% | 81.28% |
| EXCELENTE | 4 | 3.28% | 79.72% |
| MEDIANO | 16 | 13.11% | 67.79% |
| RUIM | 9 | 7.38% | 63.34% |

## Recomendações por Fonte

Quantidade média de recomendações devolvidas por cada origem da classificação: compara o volume gerado pelo modelo, pelo Groq e pelas regras.

| Fonte | Respostas | Média de recomendações | Mín. | Máx. |
|---|---|---|---|---|
| Modelo + Groq (falhou → regras) | 67 | 3.51 | 2 | 5 |
| Modelo (confiança ≥ 80%) | 54 | 3.57 | 1 | 6 |
| Modelo + Groq (confiança < 80%) | 1 | 3.0 | 3 | 3 |

## Inconsistências e Alertas

| Severidade | Cenário | Alerta | Detalhe |
|---|---|---|---|
| 🟡 warning | `boundary/casa-media/consumption=1366.88` | categoria suspeita para consumo alto | Consumo 1366.88 kWh (1.50x do esperado do conjunto) retornou BOM (prob 0.78) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `boundary/casa-media/consumption=1822.5` | categoria suspeita para consumo alto | Consumo 1822.5 kWh (2.00x do esperado do conjunto) retornou BOM (prob 0.78) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `boundary/casa-media/consumption=3645` | categoria suspeita para consumo alto | Consumo 3645 kWh (4.00x do esperado do conjunto) retornou BOM (prob 0.7615) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `boundary/apartamento-medio/consumption=1327.86` | categoria suspeita para consumo alto | Consumo 1327.86 kWh (2.00x do esperado do conjunto) retornou BOM (prob 0.7275) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `boundary/apartamento-medio/consumption=2655.72` | categoria suspeita para consumo alto | Consumo 2655.72 kWh (4.00x do esperado do conjunto) retornou BOM (prob 0.8059) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `boundary/comercio-loja/consumption=1769.58` | categoria suspeita para consumo alto | Consumo 1769.58 kWh (1.50x do esperado do conjunto) retornou BOM (prob 0.9732) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `boundary/comercio-loja/consumption=2359.44` | categoria suspeita para consumo alto | Consumo 2359.44 kWh (2.00x do esperado do conjunto) retornou BOM (prob 0.9722) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `boundary/comercio-loja/consumption=4718.88` | categoria suspeita para consumo alto | Consumo 4718.88 kWh (4.00x do esperado do conjunto) retornou BOM (prob 0.9658) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `monotonic/casa-media/consumption=1366.88` | categoria suspeita para consumo alto | Consumo 1366.88 kWh (1.50x do esperado do conjunto) retornou BOM (prob 0.78) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `monotonic/casa-media/consumption=1822.5` | categoria suspeita para consumo alto | Consumo 1822.5 kWh (2.00x do esperado do conjunto) retornou BOM (prob 0.78) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `monotonic/casa-media/consumption=3645` | categoria suspeita para consumo alto | Consumo 3645 kWh (4.00x do esperado do conjunto) retornou BOM (prob 0.7615) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `monotonic/apartamento-medio/consumption=1327.86` | categoria suspeita para consumo alto | Consumo 1327.86 kWh (2.00x do esperado do conjunto) retornou BOM (prob 0.7275) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `monotonic/apartamento-medio/consumption=2655.72` | categoria suspeita para consumo alto | Consumo 2655.72 kWh (4.00x do esperado do conjunto) retornou BOM (prob 0.8059) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `monotonic/comercio-loja/consumption=1769.58` | categoria suspeita para consumo alto | Consumo 1769.58 kWh (1.50x do esperado do conjunto) retornou BOM (prob 0.9732) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `monotonic/comercio-loja/consumption=2359.44` | categoria suspeita para consumo alto | Consumo 2359.44 kWh (2.00x do esperado do conjunto) retornou BOM (prob 0.9722) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `monotonic/comercio-loja/consumption=4718.88` | categoria suspeita para consumo alto | Consumo 4718.88 kWh (4.00x do esperado do conjunto) retornou BOM (prob 0.9658) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `combinatorial/01-casa-basica-baixo-peak=true` | categoria suspeita para consumo baixo | Consumo 83.9 kWh (0.30x do esperado do conjunto) retornou CRITICO (prob 0.8253) - inesperado para um perfil de baixo consumo relativo |
| 🟡 warning | `combinatorial/02-casa-basica-baixo-peak=false` | categoria suspeita para consumo baixo | Consumo 83.9 kWh (0.30x do esperado do conjunto) retornou CRITICO (prob 0.782) - inesperado para um perfil de baixo consumo relativo |
| 🟡 warning | `combinatorial/06-casa-basica-alto-peak=false` | categoria suspeita para consumo alto | Consumo 699.15 kWh (2.50x do esperado do conjunto) retornou EXCELENTE (prob 0.7931) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `combinatorial/07-casa-media-baixo-peak=true` | categoria suspeita para consumo baixo | Consumo 273.38 kWh (0.30x do esperado do conjunto) retornou CRITICO (prob 0.9367) - inesperado para um perfil de baixo consumo relativo |
| 🟡 warning | `combinatorial/12-casa-media-alto-peak=false` | categoria suspeita para consumo alto | Consumo 2278.12 kWh (2.50x do esperado do conjunto) retornou BOM (prob 0.78) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `combinatorial/13-casa-grande-baixo-peak=true` | categoria suspeita para consumo baixo | Consumo 541.66 kWh (0.30x do esperado do conjunto) retornou CRITICO (prob 0.9752) - inesperado para um perfil de baixo consumo relativo |
| 🟡 warning | `combinatorial/19-apartamento-compacto-baixo-peak=true` | categoria suspeita para consumo baixo | Consumo 86.11 kWh (0.30x do esperado do conjunto) retornou CRITICO (prob 0.8042) - inesperado para um perfil de baixo consumo relativo |
| 🟡 warning | `combinatorial/20-apartamento-compacto-baixo-peak=false` | categoria suspeita para consumo baixo | Consumo 86.11 kWh (0.30x do esperado do conjunto) retornou CRITICO (prob 0.7276) - inesperado para um perfil de baixo consumo relativo |
| 🟡 warning | `combinatorial/24-apartamento-compacto-alto-peak=false` | categoria suspeita para consumo alto | Consumo 717.6 kWh (2.50x do esperado do conjunto) retornou EXCELENTE (prob 0.7887) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `combinatorial/25-apartamento-medio-baixo-peak=true` | categoria suspeita para consumo baixo | Consumo 199.18 kWh (0.30x do esperado do conjunto) retornou CRITICO (prob 0.9506) - inesperado para um perfil de baixo consumo relativo |
| 🟡 warning | `combinatorial/30-apartamento-medio-alto-peak=false` | categoria suspeita para consumo alto | Consumo 1659.82 kWh (2.50x do esperado do conjunto) retornou BOM (prob 0.7275) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `combinatorial/31-comercio-loja-baixo-peak=true` | categoria suspeita para consumo baixo | Consumo 353.92 kWh (0.30x do esperado do conjunto) retornou CRITICO (prob 0.8807) - inesperado para um perfil de baixo consumo relativo |
| 🟡 warning | `combinatorial/36-comercio-loja-alto-peak=false` | categoria suspeita para consumo alto | Consumo 2949.3 kWh (2.50x do esperado do conjunto) retornou BOM (prob 0.9722) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `combinatorial/37-comercio-escritorio-baixo-peak=true` | categoria suspeita para consumo baixo | Consumo 339.41 kWh (0.30x do esperado do conjunto) retornou CRITICO (prob 0.9655) - inesperado para um perfil de baixo consumo relativo |
| 🟡 warning | `combinatorial/42-comercio-escritorio-alto-peak=false` | categoria suspeita para consumo alto | Consumo 2828.4 kWh (2.50x do esperado do conjunto) retornou BOM (prob 0.5818) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `combinatorial/43-comercio-restaurante-baixo-peak=true` | categoria suspeita para consumo baixo | Consumo 289.57 kWh (0.30x do esperado do conjunto) retornou CRITICO (prob 0.9489) - inesperado para um perfil de baixo consumo relativo |
| 🟡 warning | `combinatorial/48-comercio-restaurante-alto-peak=false` | categoria suspeita para consumo alto | Consumo 2413.05 kWh (2.50x do esperado do conjunto) retornou BOM (prob 0.9678) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `anomaly/edge/consumption-min` | categoria suspeita para consumo baixo | Consumo 0.01 kWh (0.00x do esperado do conjunto) retornou CRITICO (prob 0.9979) - inesperado para um perfil de baixo consumo relativo |
| 🟡 warning | `anomaly/edge/consumption-max` | categoria suspeita para consumo alto | Consumo 1e+08 kWh (109739.37x do esperado do conjunto) retornou BOM (prob 0.7613) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `anomaly/edge/consumption-below-set` | categoria suspeita para consumo baixo | Consumo 0.01 kWh (0.00x do esperado do conjunto) retornou CRITICO (prob 0.8774) - inesperado para um perfil de baixo consumo relativo |
| 🟡 warning | `anomaly/edge/consumption-above-set` | categoria suspeita para consumo alto | Consumo 9112.5 kWh (10.00x do esperado do conjunto) retornou EXCELENTE (prob 0.614) - inesperado para um perfil de alto consumo relativo |
| 🟡 warning | `anomaly/edge/peak-low-consumption` | categoria suspeita para consumo baixo | Consumo 273.375 kWh (0.30x do esperado do conjunto) retornou CRITICO (prob 0.9367) - inesperado para um perfil de baixo consumo relativo |
| 🟡 warning | `boundary/casa-media/consumption=3645` | consumo incoerente com o conjunto de aparelhos | Consumo informado 3645 kWh está acima do esperado para o inventário (911 kWh, razão 4.00x). Os dados são internamente incoerentes e a análise pode não refletir a realidade |
| 🟡 warning | `boundary/apartamento-medio/consumption=2655.72` | consumo incoerente com o conjunto de aparelhos | Consumo informado 2655.72 kWh está acima do esperado para o inventário (664 kWh, razão 4.00x). Os dados são internamente incoerentes e a análise pode não refletir a realidade |
| 🟡 warning | `boundary/comercio-loja/consumption=4718.88` | consumo incoerente com o conjunto de aparelhos | Consumo informado 4718.88 kWh está acima do esperado para o inventário (1180 kWh, razão 4.00x). Os dados são internamente incoerentes e a análise pode não refletir a realidade |
| 🟡 warning | `monotonic/casa-media/consumption=3645` | consumo incoerente com o conjunto de aparelhos | Consumo informado 3645 kWh está acima do esperado para o inventário (911 kWh, razão 4.00x). Os dados são internamente incoerentes e a análise pode não refletir a realidade |
| 🟡 warning | `monotonic/apartamento-medio/consumption=2655.72` | consumo incoerente com o conjunto de aparelhos | Consumo informado 2655.72 kWh está acima do esperado para o inventário (664 kWh, razão 4.00x). Os dados são internamente incoerentes e a análise pode não refletir a realidade |
| 🟡 warning | `monotonic/comercio-loja/consumption=4718.88` | consumo incoerente com o conjunto de aparelhos | Consumo informado 4718.88 kWh está acima do esperado para o inventário (1180 kWh, razão 4.00x). Os dados são internamente incoerentes e a análise pode não refletir a realidade |
| 🟡 warning | `anomaly/edge/consumption-min` | consumo incoerente com o conjunto de aparelhos | Consumo informado 0.01 kWh está abaixo do esperado para o inventário (911 kWh, razão 0.00x). Os dados são internamente incoerentes e a análise pode não refletir a realidade |
| 🟡 warning | `anomaly/edge/consumption-max` | consumo incoerente com o conjunto de aparelhos | Consumo informado 1e+08 kWh está acima do esperado para o inventário (911 kWh, razão 109739.37x). Os dados são internamente incoerentes e a análise pode não refletir a realidade |
| 🟡 warning | `anomaly/edge/consumption-below-set` | consumo incoerente com o conjunto de aparelhos | Consumo informado 0.01 kWh está abaixo do esperado para o inventário (911 kWh, razão 0.00x). Os dados são internamente incoerentes e a análise pode não refletir a realidade |
| 🟡 warning | `anomaly/edge/consumption-above-set` | consumo incoerente com o conjunto de aparelhos | Consumo informado 9112.5 kWh está acima do esperado para o inventário (911 kWh, razão 10.00x). Os dados são internamente incoerentes e a análise pode não refletir a realidade |
| 🟡 warning | `boundary/casa-media/consumption=227.81` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `boundary/casa-media/consumption=455.62` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `boundary/casa-media/consumption=1366.88` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `boundary/casa-media/consumption=1822.5` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `boundary/casa-media/consumption=3645` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `boundary/casa-media/hours=0` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `boundary/casa-media/hours=12` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `boundary/casa-media/hours=24` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `boundary/casa-media/peak=true` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `boundary/apartamento-medio/consumption=165.98` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `boundary/apartamento-medio/consumption=663.93` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `boundary/apartamento-medio/consumption=995.89` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `boundary/apartamento-medio/consumption=1327.86` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `boundary/apartamento-medio/hours=0` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `boundary/apartamento-medio/hours=4` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `boundary/apartamento-medio/hours=8` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `boundary/apartamento-medio/hours=12` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `boundary/apartamento-medio/hours=24` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `boundary/apartamento-medio/peak=false` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `boundary/comercio-loja/consumption=294.93` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `boundary/comercio-loja/consumption=589.86` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `monotonic/casa-media/consumption=227.81` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `monotonic/casa-media/consumption=455.62` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `monotonic/casa-media/consumption=1366.88` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `monotonic/casa-media/consumption=1822.5` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `monotonic/casa-media/consumption=3645` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `monotonic/apartamento-medio/consumption=165.98` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `monotonic/apartamento-medio/consumption=663.93` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `monotonic/apartamento-medio/consumption=995.89` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `monotonic/apartamento-medio/consumption=1327.86` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `monotonic/comercio-loja/consumption=294.93` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `monotonic/comercio-loja/consumption=589.86` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/02-casa-basica-baixo-peak=false` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/03-casa-basica-esperado-peak=true` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/04-casa-basica-esperado-peak=false` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/06-casa-basica-alto-peak=false` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/09-casa-media-esperado-peak=true` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/11-casa-media-alto-peak=true` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/12-casa-media-alto-peak=false` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/16-casa-grande-esperado-peak=false` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/18-casa-grande-alto-peak=false` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/20-apartamento-compacto-baixo-peak=false` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/21-apartamento-compacto-esperado-peak=true` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/22-apartamento-compacto-esperado-peak=false` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/23-apartamento-compacto-alto-peak=true` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/24-apartamento-compacto-alto-peak=false` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/26-apartamento-medio-baixo-peak=false` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/28-apartamento-medio-esperado-peak=false` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/29-apartamento-medio-alto-peak=true` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/30-apartamento-medio-alto-peak=false` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/32-comercio-loja-baixo-peak=false` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/33-comercio-loja-esperado-peak=true` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/35-comercio-loja-alto-peak=true` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/38-comercio-escritorio-baixo-peak=false` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/40-comercio-escritorio-esperado-peak=false` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/41-comercio-escritorio-alto-peak=true` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/42-comercio-escritorio-alto-peak=false` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/44-comercio-restaurante-baixo-peak=false` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/45-comercio-restaurante-esperado-peak=true` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `combinatorial/47-comercio-restaurante-alto-peak=true` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `threshold/LIGHTING_WATTS=999` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `threshold/LIGHTING_WATTS=1000` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `threshold/LIGHTING_WATTS=1001` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `anomaly/edge/consumption-max` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `anomaly/edge/hours-min` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `anomaly/edge/hours-max` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |
| 🟡 warning | `anomaly/edge/consumption-above-set` | Groq falhou | Chamada ao Groq falhou e as recomendações caíram para regras (source contém 'groq failed') |

## Falhas de Consistência (Monotonicidade)

Para um mesmo perfil, aumentar o consumo **não** deveria melhorar a categoria:

- [consumption] consumo 455.62 -> 589.86: categoria melhorou de MEDIANO para BOM (ordinal 2->1)
- [consumption] consumo 663.93 -> 911.25: categoria melhorou de MEDIANO para BOM (ordinal 2->1)

## Latência

| Métrica | ms |
|---|---|
| Média | 231.67 |
| Mediana | 220.78 |
| p95 | 347.12 |
| p99 | 405.97 |

## Distribuição de Status HTTP

| Status | Quantidade |
|---|---|
| 200 | 122 |

## Cenários Falhos

| Cenário | Status HTTP | Verificação | Mensagem |
|---|---|---|---|
| `boundary/comercio-loja/hours=0` | erro | http_status | Sem resposta (erro de conexão) |
| `consistency/monotonicity` | erro | monotonicity | [consumption] consumo 455.62 -> 589.86: categoria melhorou de MEDIANO para BOM (ordinal 2->1); [consumption] consumo 663.93 -> 911.25: categoria melhorou de MEDIANO para BOM (ordinal 2->1) |

## Análises Detalhadas

Cada cenário possui um arquivo próprio em `analyses/` com o detalhamento por equipamento (como o histórico do frontend), o payload enviado, a resposta do ML e as verificações:

- ✅ [`boundary/casa-media/consumption=227.81`](analyses/boundary-casa-media-consumption-227.81.md)
- ✅ [`boundary/casa-media/consumption=455.62`](analyses/boundary-casa-media-consumption-455.62.md)
- ✅ [`boundary/casa-media/consumption=911.25`](analyses/boundary-casa-media-consumption-911.25.md)
- ✅ [`boundary/casa-media/consumption=1366.88`](analyses/boundary-casa-media-consumption-1366.88.md)
- ✅ [`boundary/casa-media/consumption=1822.5`](analyses/boundary-casa-media-consumption-1822.5.md)
- ✅ [`boundary/casa-media/consumption=3645`](analyses/boundary-casa-media-consumption-3645.md)
- ✅ [`boundary/casa-media/hours=0`](analyses/boundary-casa-media-hours-0.md)
- ✅ [`boundary/casa-media/hours=4`](analyses/boundary-casa-media-hours-4.md)
- ✅ [`boundary/casa-media/hours=8`](analyses/boundary-casa-media-hours-8.md)
- ✅ [`boundary/casa-media/hours=12`](analyses/boundary-casa-media-hours-12.md)
- ✅ [`boundary/casa-media/hours=24`](analyses/boundary-casa-media-hours-24.md)
- ✅ [`boundary/casa-media/peak=true`](analyses/boundary-casa-media-peak-true.md)
- ✅ [`boundary/casa-media/peak=false`](analyses/boundary-casa-media-peak-false.md)
- ✅ [`boundary/apartamento-medio/consumption=165.98`](analyses/boundary-apartamento-medio-consumption-165.98.md)
- ✅ [`boundary/apartamento-medio/consumption=331.96`](analyses/boundary-apartamento-medio-consumption-331.96.md)
- ✅ [`boundary/apartamento-medio/consumption=663.93`](analyses/boundary-apartamento-medio-consumption-663.93.md)
- ✅ [`boundary/apartamento-medio/consumption=995.89`](analyses/boundary-apartamento-medio-consumption-995.89.md)
- ✅ [`boundary/apartamento-medio/consumption=1327.86`](analyses/boundary-apartamento-medio-consumption-1327.86.md)
- ✅ [`boundary/apartamento-medio/consumption=2655.72`](analyses/boundary-apartamento-medio-consumption-2655.72.md)
- ✅ [`boundary/apartamento-medio/hours=0`](analyses/boundary-apartamento-medio-hours-0.md)
- ✅ [`boundary/apartamento-medio/hours=4`](analyses/boundary-apartamento-medio-hours-4.md)
- ✅ [`boundary/apartamento-medio/hours=8`](analyses/boundary-apartamento-medio-hours-8.md)
- ✅ [`boundary/apartamento-medio/hours=12`](analyses/boundary-apartamento-medio-hours-12.md)
- ✅ [`boundary/apartamento-medio/hours=24`](analyses/boundary-apartamento-medio-hours-24.md)
- ✅ [`boundary/apartamento-medio/peak=true`](analyses/boundary-apartamento-medio-peak-true.md)
- ✅ [`boundary/apartamento-medio/peak=false`](analyses/boundary-apartamento-medio-peak-false.md)
- ✅ [`boundary/comercio-loja/consumption=294.93`](analyses/boundary-comercio-loja-consumption-294.93.md)
- ✅ [`boundary/comercio-loja/consumption=589.86`](analyses/boundary-comercio-loja-consumption-589.86.md)
- ✅ [`boundary/comercio-loja/consumption=1179.72`](analyses/boundary-comercio-loja-consumption-1179.72.md)
- ✅ [`boundary/comercio-loja/consumption=1769.58`](analyses/boundary-comercio-loja-consumption-1769.58.md)
- ✅ [`boundary/comercio-loja/consumption=2359.44`](analyses/boundary-comercio-loja-consumption-2359.44.md)
- ✅ [`boundary/comercio-loja/consumption=4718.88`](analyses/boundary-comercio-loja-consumption-4718.88.md)
- ❌ [`boundary/comercio-loja/hours=0`](analyses/boundary-comercio-loja-hours-0.md)
- ✅ [`boundary/comercio-loja/hours=4`](analyses/boundary-comercio-loja-hours-4.md)
- ✅ [`boundary/comercio-loja/hours=8`](analyses/boundary-comercio-loja-hours-8.md)
- ✅ [`boundary/comercio-loja/hours=12`](analyses/boundary-comercio-loja-hours-12.md)
- ✅ [`boundary/comercio-loja/hours=24`](analyses/boundary-comercio-loja-hours-24.md)
- ✅ [`boundary/comercio-loja/peak=true`](analyses/boundary-comercio-loja-peak-true.md)
- ✅ [`boundary/comercio-loja/peak=false`](analyses/boundary-comercio-loja-peak-false.md)
- ✅ [`monotonic/casa-media/consumption=227.81`](analyses/monotonic-casa-media-consumption-227.81.md)
- ✅ [`monotonic/casa-media/consumption=455.62`](analyses/monotonic-casa-media-consumption-455.62.md)
- ✅ [`monotonic/casa-media/consumption=911.25`](analyses/monotonic-casa-media-consumption-911.25.md)
- ✅ [`monotonic/casa-media/consumption=1366.88`](analyses/monotonic-casa-media-consumption-1366.88.md)
- ✅ [`monotonic/casa-media/consumption=1822.5`](analyses/monotonic-casa-media-consumption-1822.5.md)
- ✅ [`monotonic/casa-media/consumption=3645`](analyses/monotonic-casa-media-consumption-3645.md)
- ✅ [`monotonic/apartamento-medio/consumption=165.98`](analyses/monotonic-apartamento-medio-consumption-165.98.md)
- ✅ [`monotonic/apartamento-medio/consumption=331.96`](analyses/monotonic-apartamento-medio-consumption-331.96.md)
- ✅ [`monotonic/apartamento-medio/consumption=663.93`](analyses/monotonic-apartamento-medio-consumption-663.93.md)
- ✅ [`monotonic/apartamento-medio/consumption=995.89`](analyses/monotonic-apartamento-medio-consumption-995.89.md)
- ✅ [`monotonic/apartamento-medio/consumption=1327.86`](analyses/monotonic-apartamento-medio-consumption-1327.86.md)
- ✅ [`monotonic/apartamento-medio/consumption=2655.72`](analyses/monotonic-apartamento-medio-consumption-2655.72.md)
- ✅ [`monotonic/comercio-loja/consumption=294.93`](analyses/monotonic-comercio-loja-consumption-294.93.md)
- ✅ [`monotonic/comercio-loja/consumption=589.86`](analyses/monotonic-comercio-loja-consumption-589.86.md)
- ✅ [`monotonic/comercio-loja/consumption=1179.72`](analyses/monotonic-comercio-loja-consumption-1179.72.md)
- ✅ [`monotonic/comercio-loja/consumption=1769.58`](analyses/monotonic-comercio-loja-consumption-1769.58.md)
- ✅ [`monotonic/comercio-loja/consumption=2359.44`](analyses/monotonic-comercio-loja-consumption-2359.44.md)
- ✅ [`monotonic/comercio-loja/consumption=4718.88`](analyses/monotonic-comercio-loja-consumption-4718.88.md)
- ✅ [`combinatorial/01-casa-basica-baixo-peak=true`](analyses/combinatorial-01-casa-basica-baixo-peak-true.md)
- ✅ [`combinatorial/02-casa-basica-baixo-peak=false`](analyses/combinatorial-02-casa-basica-baixo-peak-false.md)
- ✅ [`combinatorial/03-casa-basica-esperado-peak=true`](analyses/combinatorial-03-casa-basica-esperado-peak-true.md)
- ✅ [`combinatorial/04-casa-basica-esperado-peak=false`](analyses/combinatorial-04-casa-basica-esperado-peak-false.md)
- ✅ [`combinatorial/05-casa-basica-alto-peak=true`](analyses/combinatorial-05-casa-basica-alto-peak-true.md)
- ✅ [`combinatorial/06-casa-basica-alto-peak=false`](analyses/combinatorial-06-casa-basica-alto-peak-false.md)
- ✅ [`combinatorial/07-casa-media-baixo-peak=true`](analyses/combinatorial-07-casa-media-baixo-peak-true.md)
- ✅ [`combinatorial/08-casa-media-baixo-peak=false`](analyses/combinatorial-08-casa-media-baixo-peak-false.md)
- ✅ [`combinatorial/09-casa-media-esperado-peak=true`](analyses/combinatorial-09-casa-media-esperado-peak-true.md)
- ✅ [`combinatorial/10-casa-media-esperado-peak=false`](analyses/combinatorial-10-casa-media-esperado-peak-false.md)
- ✅ [`combinatorial/11-casa-media-alto-peak=true`](analyses/combinatorial-11-casa-media-alto-peak-true.md)
- ✅ [`combinatorial/12-casa-media-alto-peak=false`](analyses/combinatorial-12-casa-media-alto-peak-false.md)
- ✅ [`combinatorial/13-casa-grande-baixo-peak=true`](analyses/combinatorial-13-casa-grande-baixo-peak-true.md)
- ✅ [`combinatorial/14-casa-grande-baixo-peak=false`](analyses/combinatorial-14-casa-grande-baixo-peak-false.md)
- ✅ [`combinatorial/15-casa-grande-esperado-peak=true`](analyses/combinatorial-15-casa-grande-esperado-peak-true.md)
- ✅ [`combinatorial/16-casa-grande-esperado-peak=false`](analyses/combinatorial-16-casa-grande-esperado-peak-false.md)
- ✅ [`combinatorial/17-casa-grande-alto-peak=true`](analyses/combinatorial-17-casa-grande-alto-peak-true.md)
- ✅ [`combinatorial/18-casa-grande-alto-peak=false`](analyses/combinatorial-18-casa-grande-alto-peak-false.md)
- ✅ [`combinatorial/19-apartamento-compacto-baixo-peak=true`](analyses/combinatorial-19-apartamento-compacto-baixo-peak-true.md)
- ✅ [`combinatorial/20-apartamento-compacto-baixo-peak=false`](analyses/combinatorial-20-apartamento-compacto-baixo-peak-false.md)
- ✅ [`combinatorial/21-apartamento-compacto-esperado-peak=true`](analyses/combinatorial-21-apartamento-compacto-esperado-peak-true.md)
- ✅ [`combinatorial/22-apartamento-compacto-esperado-peak=false`](analyses/combinatorial-22-apartamento-compacto-esperado-peak-false.md)
- ✅ [`combinatorial/23-apartamento-compacto-alto-peak=true`](analyses/combinatorial-23-apartamento-compacto-alto-peak-true.md)
- ✅ [`combinatorial/24-apartamento-compacto-alto-peak=false`](analyses/combinatorial-24-apartamento-compacto-alto-peak-false.md)
- ✅ [`combinatorial/25-apartamento-medio-baixo-peak=true`](analyses/combinatorial-25-apartamento-medio-baixo-peak-true.md)
- ✅ [`combinatorial/26-apartamento-medio-baixo-peak=false`](analyses/combinatorial-26-apartamento-medio-baixo-peak-false.md)
- ✅ [`combinatorial/27-apartamento-medio-esperado-peak=true`](analyses/combinatorial-27-apartamento-medio-esperado-peak-true.md)
- ✅ [`combinatorial/28-apartamento-medio-esperado-peak=false`](analyses/combinatorial-28-apartamento-medio-esperado-peak-false.md)
- ✅ [`combinatorial/29-apartamento-medio-alto-peak=true`](analyses/combinatorial-29-apartamento-medio-alto-peak-true.md)
- ✅ [`combinatorial/30-apartamento-medio-alto-peak=false`](analyses/combinatorial-30-apartamento-medio-alto-peak-false.md)
- ✅ [`combinatorial/31-comercio-loja-baixo-peak=true`](analyses/combinatorial-31-comercio-loja-baixo-peak-true.md)
- ✅ [`combinatorial/32-comercio-loja-baixo-peak=false`](analyses/combinatorial-32-comercio-loja-baixo-peak-false.md)
- ✅ [`combinatorial/33-comercio-loja-esperado-peak=true`](analyses/combinatorial-33-comercio-loja-esperado-peak-true.md)
- ✅ [`combinatorial/34-comercio-loja-esperado-peak=false`](analyses/combinatorial-34-comercio-loja-esperado-peak-false.md)
- ✅ [`combinatorial/35-comercio-loja-alto-peak=true`](analyses/combinatorial-35-comercio-loja-alto-peak-true.md)
- ✅ [`combinatorial/36-comercio-loja-alto-peak=false`](analyses/combinatorial-36-comercio-loja-alto-peak-false.md)
- ✅ [`combinatorial/37-comercio-escritorio-baixo-peak=true`](analyses/combinatorial-37-comercio-escritorio-baixo-peak-true.md)
- ✅ [`combinatorial/38-comercio-escritorio-baixo-peak=false`](analyses/combinatorial-38-comercio-escritorio-baixo-peak-false.md)
- ✅ [`combinatorial/39-comercio-escritorio-esperado-peak=true`](analyses/combinatorial-39-comercio-escritorio-esperado-peak-true.md)
- ✅ [`combinatorial/40-comercio-escritorio-esperado-peak=false`](analyses/combinatorial-40-comercio-escritorio-esperado-peak-false.md)
- ✅ [`combinatorial/41-comercio-escritorio-alto-peak=true`](analyses/combinatorial-41-comercio-escritorio-alto-peak-true.md)
- ✅ [`combinatorial/42-comercio-escritorio-alto-peak=false`](analyses/combinatorial-42-comercio-escritorio-alto-peak-false.md)
- ✅ [`combinatorial/43-comercio-restaurante-baixo-peak=true`](analyses/combinatorial-43-comercio-restaurante-baixo-peak-true.md)
- ✅ [`combinatorial/44-comercio-restaurante-baixo-peak=false`](analyses/combinatorial-44-comercio-restaurante-baixo-peak-false.md)
- ✅ [`combinatorial/45-comercio-restaurante-esperado-peak=true`](analyses/combinatorial-45-comercio-restaurante-esperado-peak-true.md)
- ✅ [`combinatorial/46-comercio-restaurante-esperado-peak=false`](analyses/combinatorial-46-comercio-restaurante-esperado-peak-false.md)
- ✅ [`combinatorial/47-comercio-restaurante-alto-peak=true`](analyses/combinatorial-47-comercio-restaurante-alto-peak-true.md)
- ✅ [`combinatorial/48-comercio-restaurante-alto-peak=false`](analyses/combinatorial-48-comercio-restaurante-alto-peak-false.md)
- ✅ [`threshold/AIR_CONDITIONING_WATTS=2999`](analyses/threshold-AIR_CONDITIONING_WATTS-2999.md)
- ✅ [`threshold/AIR_CONDITIONING_WATTS=3000`](analyses/threshold-AIR_CONDITIONING_WATTS-3000.md)
- ✅ [`threshold/AIR_CONDITIONING_WATTS=3001`](analyses/threshold-AIR_CONDITIONING_WATTS-3001.md)
- ✅ [`threshold/HEATING_WATTS=4999`](analyses/threshold-HEATING_WATTS-4999.md)
- ✅ [`threshold/HEATING_WATTS=5000`](analyses/threshold-HEATING_WATTS-5000.md)
- ✅ [`threshold/HEATING_WATTS=5001`](analyses/threshold-HEATING_WATTS-5001.md)
- ✅ [`threshold/LIGHTING_WATTS=999`](analyses/threshold-LIGHTING_WATTS-999.md)
- ✅ [`threshold/LIGHTING_WATTS=1000`](analyses/threshold-LIGHTING_WATTS-1000.md)
- ✅ [`threshold/LIGHTING_WATTS=1001`](analyses/threshold-LIGHTING_WATTS-1001.md)
- ✅ [`anomaly/edge/consumption-min`](analyses/anomaly-edge-consumption-min.md)
- ✅ [`anomaly/edge/consumption-max`](analyses/anomaly-edge-consumption-max.md)
- ✅ [`anomaly/edge/hours-min`](analyses/anomaly-edge-hours-min.md)
- ✅ [`anomaly/edge/hours-max`](analyses/anomaly-edge-hours-max.md)
- ✅ [`anomaly/edge/empty-set`](analyses/anomaly-edge-empty-set.md)
- ✅ [`anomaly/edge/optional-absent`](analyses/anomaly-edge-optional-absent.md)
- ✅ [`anomaly/edge/consumption-below-set`](analyses/anomaly-edge-consumption-below-set.md)
- ✅ [`anomaly/edge/consumption-above-set`](analyses/anomaly-edge-consumption-above-set.md)
- ✅ [`anomaly/edge/peak-low-consumption`](analyses/anomaly-edge-peak-low-consumption.md)

## Detalhamento dos Cenários

Cada cenário executado, com o retorno devolvido pelo ML Service.
A convenção de nomes e o significado de cada código estão em [`docs/scenarios.md`](../docs/scenarios.md).

Legenda das colunas:

- **Conjunto:** perfil realista de aparelhos usado no cenário (como o frontend envia em produção). O payload é derivado do conjunto: `equipment_quantity`, `daily_consumption_distribution`, `highest_consumption_category` e `highest_consumption_products`.
- **Fonte:** `Modelo` = classificação só pelo modelo treinado (confiança ≥ 80%); `Modelo + Groq` = modelo com confiança < 80% apoiado pelo LLM; `Regras` = fallback por regras.
- **Resultado:** ✅ todos os checks passaram · ❌ alguma verificação falhou (ver seção 'Cenários Falhos').

| Cenário | Conjunto | Grupo | HTTP | Categoria | Prob. | Fonte | Latência (ms) | Resultado |
|---|---|---|---|---|---|---|---|---|
| `boundary/casa-media/consumption=227.81` | casa-media | boundary | 200 | BOM | 0.7722 | Modelo + Groq (falhou → regras) | 285 | ✅ |
| `boundary/casa-media/consumption=455.62` | casa-media | boundary | 200 | MEDIANO | 0.5768 | Modelo + Groq (falhou → regras) | 217 | ✅ |
| `boundary/casa-media/consumption=911.25` | casa-media | boundary | 200 | BOM | 0.8349 | Modelo (confiança ≥ 80%) | 169 | ✅ |
| `boundary/casa-media/consumption=1366.88` | casa-media | boundary | 200 | BOM | 0.78 | Modelo + Groq (falhou → regras) | 286 | ✅ |
| `boundary/casa-media/consumption=1822.5` | casa-media | boundary | 200 | BOM | 0.78 | Modelo + Groq (falhou → regras) | 273 | ✅ |
| `boundary/casa-media/consumption=3645` | casa-media | boundary | 200 | BOM | 0.7615 | Modelo + Groq (falhou → regras) | 215 | ✅ |
| `boundary/casa-media/hours=0` | casa-media | boundary | 200 | BOM | 0.721 | Modelo + Groq (falhou → regras) | 342 | ✅ |
| `boundary/casa-media/hours=4` | casa-media | boundary | 200 | BOM | 0.9234 | Modelo (confiança ≥ 80%) | 174 | ✅ |
| `boundary/casa-media/hours=8` | casa-media | boundary | 200 | MEDIANO | 0.8963 | Modelo (confiança ≥ 80%) | 183 | ✅ |
| `boundary/casa-media/hours=12` | casa-media | boundary | 200 | MEDIANO | 0.7852 | Modelo + Groq (falhou → regras) | 283 | ✅ |
| `boundary/casa-media/hours=24` | casa-media | boundary | 200 | MEDIANO | 0.7028 | Modelo + Groq (falhou → regras) | 225 | ✅ |
| `boundary/casa-media/peak=true` | casa-media | boundary | 200 | CRITICO | 0.6427 | Modelo + Groq (falhou → regras) | 224 | ✅ |
| `boundary/casa-media/peak=false` | casa-media | boundary | 200 | BOM | 0.8349 | Modelo (confiança ≥ 80%) | 151 | ✅ |
| `boundary/apartamento-medio/consumption=165.98` | apartamento-medio | boundary | 200 | BOM | 0.7364 | Modelo + Groq (falhou → regras) | 352 | ✅ |
| `boundary/apartamento-medio/consumption=331.96` | apartamento-medio | boundary | 200 | BOM | 0.9035 | Modelo (confiança ≥ 80%) | 212 | ✅ |
| `boundary/apartamento-medio/consumption=663.93` | apartamento-medio | boundary | 200 | MEDIANO | 0.4307 | Modelo + Groq (falhou → regras) | 261 | ✅ |
| `boundary/apartamento-medio/consumption=995.89` | apartamento-medio | boundary | 200 | BOM | 0.7308 | Modelo + Groq (falhou → regras) | 406 | ✅ |
| `boundary/apartamento-medio/consumption=1327.86` | apartamento-medio | boundary | 200 | BOM | 0.7275 | Modelo + Groq (falhou → regras) | 216 | ✅ |
| `boundary/apartamento-medio/consumption=2655.72` | apartamento-medio | boundary | 200 | BOM | 0.8059 | Modelo (confiança ≥ 80%) | 155 | ✅ |
| `boundary/apartamento-medio/hours=0` | apartamento-medio | boundary | 200 | BOM | 0.5329 | Modelo + Groq (falhou → regras) | 310 | ✅ |
| `boundary/apartamento-medio/hours=4` | apartamento-medio | boundary | 200 | BOM | 0.6358 | Modelo + Groq (falhou → regras) | 258 | ✅ |
| `boundary/apartamento-medio/hours=8` | apartamento-medio | boundary | 200 | RUIM | 0.6248 | Modelo + Groq (falhou → regras) | 240 | ✅ |
| `boundary/apartamento-medio/hours=12` | apartamento-medio | boundary | 200 | RUIM | 0.6267 | Modelo + Groq (falhou → regras) | 222 | ✅ |
| `boundary/apartamento-medio/hours=24` | apartamento-medio | boundary | 200 | RUIM | 0.6375 | Modelo + Groq (falhou → regras) | 237 | ✅ |
| `boundary/apartamento-medio/peak=true` | apartamento-medio | boundary | 200 | CRITICO | 0.9763 | Modelo (confiança ≥ 80%) | 165 | ✅ |
| `boundary/apartamento-medio/peak=false` | apartamento-medio | boundary | 200 | MEDIANO | 0.4307 | Modelo + Groq (falhou → regras) | 254 | ✅ |
| `boundary/comercio-loja/consumption=294.93` | comercio-loja | boundary | 200 | BOM | 0.6992 | Modelo + Groq (falhou → regras) | 244 | ✅ |
| `boundary/comercio-loja/consumption=589.86` | comercio-loja | boundary | 200 | BOM | 0.4836 | Modelo + Groq (falhou → regras) | 248 | ✅ |
| `boundary/comercio-loja/consumption=1179.72` | comercio-loja | boundary | 200 | BOM | 0.9839 | Modelo (confiança ≥ 80%) | 193 | ✅ |
| `boundary/comercio-loja/consumption=1769.58` | comercio-loja | boundary | 200 | BOM | 0.9732 | Modelo (confiança ≥ 80%) | 148 | ✅ |
| `boundary/comercio-loja/consumption=2359.44` | comercio-loja | boundary | 200 | BOM | 0.9722 | Modelo (confiança ≥ 80%) | 196 | ✅ |
| `boundary/comercio-loja/consumption=4718.88` | comercio-loja | boundary | 200 | BOM | 0.9658 | Modelo (confiança ≥ 80%) | 186 | ✅ |
| `boundary/comercio-loja/hours=0` | comercio-loja | boundary | erro | - | - | - | - | ❌ |
| `boundary/comercio-loja/hours=4` | comercio-loja | boundary | 200 | BOM | 0.9897 | Modelo (confiança ≥ 80%) | 147 | ✅ |
| `boundary/comercio-loja/hours=8` | comercio-loja | boundary | 200 | MEDIANO | 0.8426 | Modelo (confiança ≥ 80%) | 158 | ✅ |
| `boundary/comercio-loja/hours=12` | comercio-loja | boundary | 200 | MEDIANO | 0.9386 | Modelo (confiança ≥ 80%) | 143 | ✅ |
| `boundary/comercio-loja/hours=24` | comercio-loja | boundary | 200 | MEDIANO | 0.9237 | Modelo (confiança ≥ 80%) | 161 | ✅ |
| `boundary/comercio-loja/peak=true` | comercio-loja | boundary | 200 | RUIM | 0.5689 | Modelo + Groq (confiança < 80%) (`model+groq (confidence 56.9%)`) | 782 | ✅ |
| `boundary/comercio-loja/peak=false` | comercio-loja | boundary | 200 | BOM | 0.9839 | Modelo (confiança ≥ 80%) | 205 | ✅ |
| `monotonic/casa-media/consumption=227.81` | casa-media | boundary | 200 | BOM | 0.7722 | Modelo + Groq (falhou → regras) | 298 | ✅ |
| `monotonic/casa-media/consumption=455.62` | casa-media | boundary | 200 | MEDIANO | 0.5768 | Modelo + Groq (falhou → regras) | 232 | ✅ |
| `monotonic/casa-media/consumption=911.25` | casa-media | boundary | 200 | BOM | 0.8349 | Modelo (confiança ≥ 80%) | 163 | ✅ |
| `monotonic/casa-media/consumption=1366.88` | casa-media | boundary | 200 | BOM | 0.78 | Modelo + Groq (falhou → regras) | 261 | ✅ |
| `monotonic/casa-media/consumption=1822.5` | casa-media | boundary | 200 | BOM | 0.78 | Modelo + Groq (falhou → regras) | 285 | ✅ |
| `monotonic/casa-media/consumption=3645` | casa-media | boundary | 200 | BOM | 0.7615 | Modelo + Groq (falhou → regras) | 222 | ✅ |
| `monotonic/apartamento-medio/consumption=165.98` | apartamento-medio | boundary | 200 | BOM | 0.7364 | Modelo + Groq (falhou → regras) | 278 | ✅ |
| `monotonic/apartamento-medio/consumption=331.96` | apartamento-medio | boundary | 200 | BOM | 0.9035 | Modelo (confiança ≥ 80%) | 149 | ✅ |
| `monotonic/apartamento-medio/consumption=663.93` | apartamento-medio | boundary | 200 | MEDIANO | 0.4307 | Modelo + Groq (falhou → regras) | 299 | ✅ |
| `monotonic/apartamento-medio/consumption=995.89` | apartamento-medio | boundary | 200 | BOM | 0.7308 | Modelo + Groq (falhou → regras) | 361 | ✅ |
| `monotonic/apartamento-medio/consumption=1327.86` | apartamento-medio | boundary | 200 | BOM | 0.7275 | Modelo + Groq (falhou → regras) | 250 | ✅ |
| `monotonic/apartamento-medio/consumption=2655.72` | apartamento-medio | boundary | 200 | BOM | 0.8059 | Modelo (confiança ≥ 80%) | 167 | ✅ |
| `monotonic/comercio-loja/consumption=294.93` | comercio-loja | boundary | 200 | BOM | 0.6992 | Modelo + Groq (falhou → regras) | 291 | ✅ |
| `monotonic/comercio-loja/consumption=589.86` | comercio-loja | boundary | 200 | BOM | 0.4836 | Modelo + Groq (falhou → regras) | 239 | ✅ |
| `monotonic/comercio-loja/consumption=1179.72` | comercio-loja | boundary | 200 | BOM | 0.9839 | Modelo (confiança ≥ 80%) | 207 | ✅ |
| `monotonic/comercio-loja/consumption=1769.58` | comercio-loja | boundary | 200 | BOM | 0.9732 | Modelo (confiança ≥ 80%) | 149 | ✅ |
| `monotonic/comercio-loja/consumption=2359.44` | comercio-loja | boundary | 200 | BOM | 0.9722 | Modelo (confiança ≥ 80%) | 178 | ✅ |
| `monotonic/comercio-loja/consumption=4718.88` | comercio-loja | boundary | 200 | BOM | 0.9658 | Modelo (confiança ≥ 80%) | 149 | ✅ |
| `combinatorial/01-casa-basica-baixo-peak=true` | casa-basica | combinatorial | 200 | CRITICO | 0.8253 | Modelo (confiança ≥ 80%) | 218 | ✅ |
| `combinatorial/02-casa-basica-baixo-peak=false` | casa-basica | combinatorial | 200 | CRITICO | 0.782 | Modelo + Groq (falhou → regras) | 308 | ✅ |
| `combinatorial/03-casa-basica-esperado-peak=true` | casa-basica | combinatorial | 200 | CRITICO | 0.6491 | Modelo + Groq (falhou → regras) | 216 | ✅ |
| `combinatorial/04-casa-basica-esperado-peak=false` | casa-basica | combinatorial | 200 | BOM | 0.3546 | Modelo + Groq (falhou → regras) | 217 | ✅ |
| `combinatorial/05-casa-basica-alto-peak=true` | casa-basica | combinatorial | 200 | RUIM | 0.8474 | Modelo (confiança ≥ 80%) | 161 | ✅ |
| `combinatorial/06-casa-basica-alto-peak=false` | casa-basica | combinatorial | 200 | EXCELENTE | 0.7931 | Modelo + Groq (falhou → regras) | 344 | ✅ |
| `combinatorial/07-casa-media-baixo-peak=true` | casa-media | combinatorial | 200 | CRITICO | 0.9367 | Modelo (confiança ≥ 80%) | 174 | ✅ |
| `combinatorial/08-casa-media-baixo-peak=false` | casa-media | combinatorial | 200 | BOM | 0.8006 | Modelo (confiança ≥ 80%) | 199 | ✅ |
| `combinatorial/09-casa-media-esperado-peak=true` | casa-media | combinatorial | 200 | CRITICO | 0.6427 | Modelo + Groq (falhou → regras) | 267 | ✅ |
| `combinatorial/10-casa-media-esperado-peak=false` | casa-media | combinatorial | 200 | BOM | 0.8349 | Modelo (confiança ≥ 80%) | 148 | ✅ |
| `combinatorial/11-casa-media-alto-peak=true` | casa-media | combinatorial | 200 | CRITICO | 0.5506 | Modelo + Groq (falhou → regras) | 322 | ✅ |
| `combinatorial/12-casa-media-alto-peak=false` | casa-media | combinatorial | 200 | BOM | 0.78 | Modelo + Groq (falhou → regras) | 258 | ✅ |
| `combinatorial/13-casa-grande-baixo-peak=true` | casa-grande | combinatorial | 200 | CRITICO | 0.9752 | Modelo (confiança ≥ 80%) | 171 | ✅ |
| `combinatorial/14-casa-grande-baixo-peak=false` | casa-grande | combinatorial | 200 | MEDIANO | 0.9295 | Modelo (confiança ≥ 80%) | 162 | ✅ |
| `combinatorial/15-casa-grande-esperado-peak=true` | casa-grande | combinatorial | 200 | CRITICO | 0.9236 | Modelo (confiança ≥ 80%) | 151 | ✅ |
| `combinatorial/16-casa-grande-esperado-peak=false` | casa-grande | combinatorial | 200 | MEDIANO | 0.6441 | Modelo + Groq (falhou → regras) | 312 | ✅ |
| `combinatorial/17-casa-grande-alto-peak=true` | casa-grande | combinatorial | 200 | CRITICO | 0.8026 | Modelo (confiança ≥ 80%) | 137 | ✅ |
| `combinatorial/18-casa-grande-alto-peak=false` | casa-grande | combinatorial | 200 | MEDIANO | 0.6195 | Modelo + Groq (falhou → regras) | 335 | ✅ |
| `combinatorial/19-apartamento-compacto-baixo-peak=true` | apartamento-compacto | combinatorial | 200 | CRITICO | 0.8042 | Modelo (confiança ≥ 80%) | 128 | ✅ |
| `combinatorial/20-apartamento-compacto-baixo-peak=false` | apartamento-compacto | combinatorial | 200 | CRITICO | 0.7276 | Modelo + Groq (falhou → regras) | 323 | ✅ |
| `combinatorial/21-apartamento-compacto-esperado-peak=true` | apartamento-compacto | combinatorial | 200 | CRITICO | 0.5193 | Modelo + Groq (falhou → regras) | 208 | ✅ |
| `combinatorial/22-apartamento-compacto-esperado-peak=false` | apartamento-compacto | combinatorial | 200 | BOM | 0.4134 | Modelo + Groq (falhou → regras) | 347 | ✅ |
| `combinatorial/23-apartamento-compacto-alto-peak=true` | apartamento-compacto | combinatorial | 200 | RUIM | 0.4781 | Modelo + Groq (falhou → regras) | 246 | ✅ |
| `combinatorial/24-apartamento-compacto-alto-peak=false` | apartamento-compacto | combinatorial | 200 | EXCELENTE | 0.7887 | Modelo + Groq (falhou → regras) | 234 | ✅ |
| `combinatorial/25-apartamento-medio-baixo-peak=true` | apartamento-medio | combinatorial | 200 | CRITICO | 0.9506 | Modelo (confiança ≥ 80%) | 150 | ✅ |
| `combinatorial/26-apartamento-medio-baixo-peak=false` | apartamento-medio | combinatorial | 200 | BOM | 0.7703 | Modelo + Groq (falhou → regras) | 262 | ✅ |
| `combinatorial/27-apartamento-medio-esperado-peak=true` | apartamento-medio | combinatorial | 200 | CRITICO | 0.9763 | Modelo (confiança ≥ 80%) | 136 | ✅ |
| `combinatorial/28-apartamento-medio-esperado-peak=false` | apartamento-medio | combinatorial | 200 | MEDIANO | 0.4307 | Modelo + Groq (falhou → regras) | 298 | ✅ |
| `combinatorial/29-apartamento-medio-alto-peak=true` | apartamento-medio | combinatorial | 200 | CRITICO | 0.6123 | Modelo + Groq (falhou → regras) | 230 | ✅ |
| `combinatorial/30-apartamento-medio-alto-peak=false` | apartamento-medio | combinatorial | 200 | BOM | 0.7275 | Modelo + Groq (falhou → regras) | 275 | ✅ |
| `combinatorial/31-comercio-loja-baixo-peak=true` | comercio-loja | combinatorial | 200 | CRITICO | 0.8807 | Modelo (confiança ≥ 80%) | 170 | ✅ |
| `combinatorial/32-comercio-loja-baixo-peak=false` | comercio-loja | combinatorial | 200 | BOM | 0.6358 | Modelo + Groq (falhou → regras) | 298 | ✅ |
| `combinatorial/33-comercio-loja-esperado-peak=true` | comercio-loja | combinatorial | 200 | RUIM | 0.5689 | Modelo + Groq (falhou → regras) | 241 | ✅ |
| `combinatorial/34-comercio-loja-esperado-peak=false` | comercio-loja | combinatorial | 200 | BOM | 0.9839 | Modelo (confiança ≥ 80%) | 140 | ✅ |
| `combinatorial/35-comercio-loja-alto-peak=true` | comercio-loja | combinatorial | 200 | RUIM | 0.6731 | Modelo + Groq (falhou → regras) | 303 | ✅ |
| `combinatorial/36-comercio-loja-alto-peak=false` | comercio-loja | combinatorial | 200 | BOM | 0.9722 | Modelo (confiança ≥ 80%) | 150 | ✅ |
| `combinatorial/37-comercio-escritorio-baixo-peak=true` | comercio-escritorio | combinatorial | 200 | CRITICO | 0.9655 | Modelo (confiança ≥ 80%) | 138 | ✅ |
| `combinatorial/38-comercio-escritorio-baixo-peak=false` | comercio-escritorio | combinatorial | 200 | BOM | 0.4572 | Modelo + Groq (falhou → regras) | 263 | ✅ |
| `combinatorial/39-comercio-escritorio-esperado-peak=true` | comercio-escritorio | combinatorial | 200 | CRITICO | 0.9693 | Modelo (confiança ≥ 80%) | 142 | ✅ |
| `combinatorial/40-comercio-escritorio-esperado-peak=false` | comercio-escritorio | combinatorial | 200 | BOM | 0.4967 | Modelo + Groq (falhou → regras) | 263 | ✅ |
| `combinatorial/41-comercio-escritorio-alto-peak=true` | comercio-escritorio | combinatorial | 200 | CRITICO | 0.733 | Modelo + Groq (falhou → regras) | 227 | ✅ |
| `combinatorial/42-comercio-escritorio-alto-peak=false` | comercio-escritorio | combinatorial | 200 | BOM | 0.5818 | Modelo + Groq (falhou → regras) | 252 | ✅ |
| `combinatorial/43-comercio-restaurante-baixo-peak=true` | comercio-restaurante | combinatorial | 200 | CRITICO | 0.9489 | Modelo (confiança ≥ 80%) | 127 | ✅ |
| `combinatorial/44-comercio-restaurante-baixo-peak=false` | comercio-restaurante | combinatorial | 200 | BOM | 0.7943 | Modelo + Groq (falhou → regras) | 276 | ✅ |
| `combinatorial/45-comercio-restaurante-esperado-peak=true` | comercio-restaurante | combinatorial | 200 | CRITICO | 0.5259 | Modelo + Groq (falhou → regras) | 218 | ✅ |
| `combinatorial/46-comercio-restaurante-esperado-peak=false` | comercio-restaurante | combinatorial | 200 | BOM | 0.8996 | Modelo (confiança ≥ 80%) | 141 | ✅ |
| `combinatorial/47-comercio-restaurante-alto-peak=true` | comercio-restaurante | combinatorial | 200 | RUIM | 0.6753 | Modelo + Groq (falhou → regras) | 380 | ✅ |
| `combinatorial/48-comercio-restaurante-alto-peak=false` | comercio-restaurante | combinatorial | 200 | BOM | 0.9678 | Modelo (confiança ≥ 80%) | 134 | ✅ |
| `threshold/AIR_CONDITIONING_WATTS=2999` | comercio-loja | combinatorial | 200 | BOM | 0.817 | Modelo (confiança ≥ 80%) | 516 | ✅ |
| `threshold/AIR_CONDITIONING_WATTS=3000` | comercio-loja | combinatorial | 200 | BOM | 0.817 | Modelo (confiança ≥ 80%) | 315 | ✅ |
| `threshold/AIR_CONDITIONING_WATTS=3001` | comercio-loja | combinatorial | 200 | BOM | 0.817 | Modelo (confiança ≥ 80%) | 164 | ✅ |
| `threshold/HEATING_WATTS=4999` | comercio-loja | combinatorial | 200 | BOM | 0.8082 | Modelo (confiança ≥ 80%) | 143 | ✅ |
| `threshold/HEATING_WATTS=5000` | comercio-loja | combinatorial | 200 | BOM | 0.8082 | Modelo (confiança ≥ 80%) | 139 | ✅ |
| `threshold/HEATING_WATTS=5001` | comercio-loja | combinatorial | 200 | BOM | 0.8082 | Modelo (confiança ≥ 80%) | 137 | ✅ |
| `threshold/LIGHTING_WATTS=999` | comercio-loja | combinatorial | 200 | BOM | 0.7617 | Modelo + Groq (falhou → regras) | 332 | ✅ |
| `threshold/LIGHTING_WATTS=1000` | comercio-loja | combinatorial | 200 | BOM | 0.7617 | Modelo + Groq (falhou → regras) | 220 | ✅ |
| `threshold/LIGHTING_WATTS=1001` | comercio-loja | combinatorial | 200 | BOM | 0.7617 | Modelo + Groq (falhou → regras) | 216 | ✅ |
| `anomaly/edge/consumption-min` | casa-media | anomalies | 200 | CRITICO | 0.9979 | Modelo (confiança ≥ 80%) | 198 | ✅ |
| `anomaly/edge/consumption-max` | casa-media | anomalies | 200 | BOM | 0.7613 | Modelo + Groq (falhou → regras) | 361 | ✅ |
| `anomaly/edge/hours-min` | casa-media | anomalies | 200 | BOM | 0.721 | Modelo + Groq (falhou → regras) | 228 | ✅ |
| `anomaly/edge/hours-max` | casa-media | anomalies | 200 | MEDIANO | 0.6871 | Modelo + Groq (falhou → regras) | 213 | ✅ |
| `anomaly/edge/empty-set` | imovel-vazio | anomalies | 200 | EXCELENTE | 0.9928 | Modelo (confiança ≥ 80%) | 251 | ✅ |
| `anomaly/edge/optional-absent` | casa-media | anomalies | 200 | BOM | 0.8177 | Modelo (confiança ≥ 80%) | 161 | ✅ |
| `anomaly/edge/consumption-below-set` | casa-basica | anomalies | 200 | CRITICO | 0.8774 | Modelo (confiança ≥ 80%) | 145 | ✅ |
| `anomaly/edge/consumption-above-set` | casa-basica | anomalies | 200 | EXCELENTE | 0.614 | Modelo + Groq (falhou → regras) | 288 | ✅ |
| `anomaly/edge/peak-low-consumption` | casa-media | anomalies | 200 | CRITICO | 0.9367 | Modelo (confiança ≥ 80%) | 133 | ✅ |
| `consistency/monotonicity` | - | consistency | erro | - | - | - | - | ❌ |

---
_Gerado automaticamente pelo módulo `ml-qa`._
