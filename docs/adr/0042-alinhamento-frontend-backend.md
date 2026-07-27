# ADR-0042: Alinhamento Frontend-Backend (Código Morto, Produtos no DTO, Simulação via ML)

## Status

Aceito

## Contexto

Uma análise de fluxo entre backend e frontend identificou três gaps que comprometiam a
consistência dos dados e a experiência do usuário:

1. **Código morto**: O componente `AnalysisForm.tsx` duplicava a lógica de seleção de
   aparelhos e categorias do `ProfilePage.tsx`, mas não estava mais roteado em nenhuma
   página desde que o `Home.tsx` parou de importá-lo. Representava risco de divergência
   silenciosa e manutenção desnecessária.

2. **Produtos de maior consumo não expostos no DTO**: O backend já calculava os 3
   aparelhos de maior consumo via `ApplianceAggregationService.aggregate()` e os enviava
   ao ML Service, mas o resultado não era devolvido ao frontend. O frontend recalculava
   essa lista do zero em `useMemo`, correndo o risco de mostrar um resultado diferente
   do que foi enviado ao modelo.

3. **Dashboard usava simulação linear**: A seção "Simule sua Economia" calculava
   `reductionKwh * tarifa` localmente, sem consultar o endpoint `/energy-analysis/simulate`
   que já existia no backend e consultava o modelo ML de verdade. O usuário não via se
   a categoria de eficiência mudaria com a redução.

## Decisão

### 1. Remoção do AnalysisForm.tsx

O arquivo `frontend/src/components/AnalysisForm.tsx` foi removido por ser código morto
confirmado (não importado por nenhum outro arquivo). A funcionalidade de seleção de
aparelhos e análise é integralmente coberta pelo `ProfilePage.tsx`.

### 2. Exposição de highestConsumptionProducts no DTO

Adicionado o campo `List<String> highestConsumptionProducts` ao `AnalysisResponseDTO`.

**No `AnalysisController.toResponse()`**: os snapshots de equipamentos são ordenados
por `monthlyConsumptionKwh` decrescente e os 3 primeiros nomes são extraídos.

**No `EnergyAnalysisService.simulate()`**: o resultado de
`aggregation.highestConsumptionProducts()` é passado diretamente ao DTO, eliminando
o recálculo no frontend.

No frontend, os tipos `AnalysisHistory` e `AnalysisResponse` foram atualizados com
o campo `highest_consumption_products`, e as funções `listAnalyses()` e
`fetchAnalysisById()` fazem o parsing do campo.

### 3. Dashboard com simulação real via ML

Substituída a seção de 4 cards pré-calculados (`kWh * tarifa`) por um card interativo
que:

- Mostra o consumo atual
- Permite ao usuário informar um novo consumo alvo
- Chama o endpoint `/energy-analysis/simulate` com os dados da última análise
- Exibe o resultado real do ML (categoria, confiança, custo, maiores consumidores)

Foram removidos: `KWH_TARIFF`, `SAVINGS_RATES`, `savingsSimulation()` e os cards
estáticos. Adicionada: função `simulateEnergy()` na `api.ts` e estado de simulação
no `Dashboard.tsx`.

## Arquivos alterados

### Removidos
- `frontend/src/components/AnalysisForm.tsx`

### Modificados
- `backend/src/main/java/.../dto/AnalysisResponseDTO.java` (novo campo)
- `backend/src/main/java/.../controllers/AnalysisController.java` (top 3 em toResponse)
- `backend/src/main/java/.../services/EnergyAnalysisService.java` (products no simulate)
- `frontend/src/types/index.ts` (novos campos nos tipos)
- `frontend/src/services/api.ts` (mapping + simulateEnergy)
- `frontend/src/pages/Dashboard.tsx` (simulação interativa via ML)
- `frontend/src/App.css` (estilos dash-sim-*)

## Consequências

Positivas:

- Eliminação de código morto reduz superfície de manutenção.
- `highestConsumptionProducts` agora é calculado uma única vez no backend e
  reutilizado em todas as camadas, garantindo consistência com o que foi enviado ao ML.
- A simulação no Dashboard agora passa pelo modelo ML real, mostrando ao usuário
  não apenas a economia financeira mas também a mudança na categoria de eficiência.

Negativas:

- A simulação requer que o usuário tenha ao menos uma análise concluída e uma
  propriedade ativa para funcionar.
- O endpoint `/energy-analysis/simulate` depende do ML Service estar disponível;
  se estiver fora, a simulação falha com erro visível.

## Commit

`ada29a3`
