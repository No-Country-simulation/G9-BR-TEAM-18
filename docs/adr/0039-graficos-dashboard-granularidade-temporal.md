# ADR-0039: Gráficos no Dashboard com granularidade temporal (Mensal, Diário, Por hora)

## Status

Aceito

## Contexto

O Dashboard exibia apenas um gráfico de consumo mensal, utilizando os dados agregados do backend via endpoint `/dashboard`. O usuário não tinha como visualizar o consumo em outras faixas temporais, limitando a análise a apenas uma perspectiva mensal.

## Decisão

Implementar abas de seleção de período no gráfico do Dashboard, permitindo alternar entre três granularidades:

- **Mensal**: Consumo agregado por mês (já existente, agora via agregação client-side)
- **Diário**: Consumo agregado por dia
- **Por hora**: Distribuição do consumo por hora do dia

### Abordagem técnica

Toda a agregação é feita **client-side** a partir da lista de análises obtida pelo endpoint `/analyses`, que já retorna todas as análises do usuário com `created_at` e `consumption_kwh`. Não foi necessária nenhuma alteração no backend.

A função `aggregateByGranularity()` usa **chaves ordenáveis internamente** para garantir a ordenação cronológica correta dos dados no gráfico:

| Granularidade | Chave de ordenação | Rótulo exibido |
|---|---|---|
| `month` | `ano * 12 + mes` (numérico) | `"jul/2026"` (locale pt-BR) |
| `day` | `ISO date` (`"2026-07-27"`) | `"27 jul"` (locale pt-BR) |
| `hour` | `getHours()` (0-23) | `"14h"` |

Isso evita o problema de tentar converter rótulos localizados (`"jul/2026"`) de volta para `Date` — que resultaria em `Invalid Date` em JavaScript.

### Interface

Um grupo de botões estilo "segmented control" foi adicionado acima do gráfico, permitindo alternar entre as três visualizações. O gráfico (Recharts `BarChart`) é reutilizado — apenas os dados de entrada mudam conforme a granularidade selecionada.

## Arquivos modificados

| Arquivo | Alteração |
|---|---|
| `frontend/src/pages/Dashboard.tsx` | Função de agregação, estado de granularidade, abas na UI |
| `frontend/src/App.css` | Estilos para `.dash-chart-header`, `.dash-granularity-tabs`, `.dash-gran-tab` |

## Commits

| Commit | Descrição |
|---|---|
| (pendente) | Dashboard: abas de granularidade temporal (Mensal/Diário/Hora) |

## Cards relacionados

| ID | Título |
|---|---|
| F055 | Frontend - Gráficos Dashboard com granularidade temporal |
