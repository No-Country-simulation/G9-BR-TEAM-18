# ADR-0006: Expansão do modelo de classificação para 5 categorias

## Status

Aceito

## Contexto

O modelo de classificação energético inicial utilizava apenas 3 categorias (Baixo, Médio, Alto), o que limitava a granularidade da análise e a utilidade das recomendações para o usuário. Além disso, os dados de entrada eram limitados a consumo total em kWh, sem considerar a distribuição por tipo de equipamento.

A equipe de ciência de dados e a equipe de backend identificaram as seguintes necessidades:

- Categorias mais granulares para permitir recomendações específicas
- Inventário de equipamentos por tipo para calcular a distribuição de consumo
- Alinhamento com benchmarks do setor elétrico (5 categorias e padrão)

## Decisão

A equipe decidiu expandir o sistema de classificação com duas mudanças principais:

**1. Expansão de 3 para 5 categorias energéticas:**

| Categoria | Descrição |
|---|---|
| EXCELENTE | Consumo muito abaixo da média para o tipo de imóvel |
| BOM | Consumo abaixo da média, práticas adequadas |
| MEDIANO | Consumo dentro da média esperada |
| RUIM | Consumo acima da média, necessário revisar hábitos |
| CRITICO | Consumo muito acima da média, ação urgente necessária |

**2. Inventário de equipamentos com agregação por categoria:**

Foi criado o enum `ApplianceType` com 46 tipos de equipamentos mapeados para 7 categorias de consumo do ML Service e 4 campos de distribuição de potência:

- **7 categorias do ML Service:** Iluminação, Refrigeração, Climatização, Eletrodomésticos, Tecnologia, Serviços, Outros
- **4 campos de distribuição de potência:** `REFRIGERATION_WATTS`, `HEATING_WATTS`, `AIR_CONDITIONING_WATTS`, `LIGHTING_WATTS`

O serviço `ApplianceAggregationService` agrega o inventário do usuário e calcula a distribuição de consumo por categoria antes de enviar ao ML Service. Cada equipamento possui valores estimados de potência (watts) e horas de uso diário, permitindo calcular o consumo estimado por equipamento.

**3. Novos campos nos DTOs de entrada:**

O endpoint `/energy-analysis` passou a aceitar:

- `highest_consumption_category`: Categoria de maior consumo selecionada pelo usuário
- `refrigeration_watts`, `heating_watts`, `air_conditioning_watts`, `lighting_watts`: Distribuição de potência calculada pelo frontend

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| Manter 3 categorias | Simples; modelo existente funcionando | Pouca granularidade; recomendações genéricas |
| Expandir para 5 categorias no backend apenas (sem ML) | Simples de implementar | Sem suporte probabilístico do modelo |
| 5 categorias + inventário de equipamentos | Recomendações precisas e contextualizadas; alinhamento com o setor | Maior complexidade no frontend (seleção de equipamentos) e no modelo (mais features) |
| 7+ categorias (uma por tipo de equipamento) | Máxima granularidade | Overfitting do modelo; interface de usuário sobrecarregada |

## Consequências

- **Positivo:** Usuários recebem classificação mais precisa e recomendações específicas para seus equipamentos
- **Positivo:** O inventário de equipamentos permite calcular a pegada de cada tipo de aparelho
- **Positivo:** As 5 categorias se alinham com sistemas de classificação do setor elétrico (PROCEL, INMETRO)
- **Negativo:** O frontend precisou ser redesenhado para incluir a interface de seleção de equipamentos (DemoTool)
- **Negativo:** O modelo de ML precisou ser retreinado com as novas features e categorias
- **Negativo:** A migração exigiu atualização de todos os componentes: modelo, backend, frontend e documentação
- **Neutro:** O modelo antigo com 3 categorias foi substituído, mas as predições anteriores permanecem no banco

> **Nota:** Consulte o [modelo de domínio](../arquitetura.md) para detalhes do `ApplianceType` e o [contrato de API](../contrato-api.md) para os novos campos dos DTOs.
