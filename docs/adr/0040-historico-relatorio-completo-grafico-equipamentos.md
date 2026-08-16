# ADR-0040: Relatório completo de análise no Histórico com gráfico de consumo por equipamento

## Status

Aceito

## Contexto

A página de Histórico exibia apenas uma lista com informações básicas de cada análise
(classificação, consumo, custo). Para ver detalhes completos - como recomendações e consumo por
equipamento - o usuário precisava acessar o Dashboard e encontrar a análise específica. Não havia
uma visualização clara de quanto cada equipamento estava consumindo.

## Decisão

Implementar um modal de detalhes ao clicar em qualquer item do Histórico, exibindo:

1. **Relatório completo**: classificação, consumo, custo, probabilidade, horário de pico, data
2. **Gráfico de consumo por equipamento**: gráfico de barras horizontal (Recharts) mostrando o consumo mensal estimado de cada equipamento
3. **Recomendações personalizadas**: lista de recomendações geradas pelo ML Service

### Abordagem técnica

- O endpoint `/analyses/{id}` já existia no backend e retorna o `AnalysisResponseDTO` completo com a lista de `appliances` (snapshots dos equipamentos no momento da análise)
- Foi adicionada a função `fetchAnalysisById()` no serviço de API do frontend
- O tipo `AnalysisHistory` foi estendido com o campo opcional `appliances: ApplianceSnapshot[]`
- O gráfico usa `BarChart` horizontal do Recharts, ordenado do maior consumo para o menor
- O modal é aberto ao clicar em um item da lista e fechado ao clicar fora ou no botão de fechar

## Arquivos modificados

| Arquivo | Alteração |
|---|---|
| `frontend/src/types/index.ts` | Interface `ApplianceSnapshot` + campo `appliances` em `AnalysisHistory` |
| `frontend/src/services/api.ts` | Função `fetchAnalysisById()` |
| `frontend/src/pages/History.tsx` | Modal de detalhes com `AnalysisDetail` + `ApplianceChart` |
| `frontend/src/App.css` | Estilos para modal, grade de estatísticas, gráfico, recomendações |

## Commits

| Commit | Descrição |
|---|---|
| (pendente) | Histórico: relatório completo + gráfico de consumo por equipamento |

## Cards relacionados

| ID | Título |
|---|---|
| F056 | Frontend - Relatório completo no Histórico com gráfico de consumo por equipamento |
