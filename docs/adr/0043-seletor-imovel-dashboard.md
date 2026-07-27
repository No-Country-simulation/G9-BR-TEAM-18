# ADR-0043: Seletor de Imóveis no Dashboard

## Status

Aceito

## Contexto

O Dashboard exibe cards consolidados e gráfico de consumo para todas as análises do
usuário, independentemente do imóvel. A seção "Simule sua Economia" utiliza o endpoint
`/energy-analysis/simulate`, que requer um `propertyId` para carregar os aparelhos do
imóvel e consultar o ML Service.

Com a implementação do suporte a múltiplos imóveis no ProfilePage (ADR-0042), o backend
já retornava a lista completa de propriedades via `GET /properties`. No entanto, o
Dashboard usava apenas a primeira propriedade ativa (`activeProperty`) para a simulação,
sem oferecer ao usuário a possibilidade de escolher qual imóvel simular.

## Decisão

Adicionar um seletor de imóveis no Dashboard, acima da seção "Simule sua Economia",
permitindo que o usuário escolha qual propriedade usar para a simulação.

### Implementação

- Substituído o `useMemo` de `activeProperty` por um estado `selectedPropertyId` +
  `selectedProperty` (derivado via `useMemo` com fallback para `properties[0]`).
- No carregamento inicial, `selectedPropertyId` é inicializado com a propriedade ativa
  ou a primeira da lista.
- Seletor visual com botões estilo "chip" (reaproveitando as classes CSS
  `property-selector` e `property-selector-btn` já existentes do ProfilePage),
  exibido apenas quando `properties.length > 1`.
- Ao trocar de imóvel, o resultado da simulação anterior é limpo
  (`setSimResult(null)`, `setSimError(null)`).
- A chamada a `simulateEnergy()` usa `selectedProperty.id` como `propertyId`.

### Arquivos alterados

- `frontend/src/pages/Dashboard.tsx`

## Consequências

Positivas:

- Usuários com múltiplos imóveis podem simular cenários para cada um deles
  individualmente.
- Código mais explícito: `selectedPropertyId` substitui o `activeProperty` implícito.
- Reuso das classes CSS existentes do seletor de imóveis do ProfilePage.

Negativas:

- O seletor adiciona um elemento visual extra no Dashboard, mas só aparece quando
  o usuário tem mais de um imóvel, minimizando o impacto visual.

## Commit

`cb37ed4`
