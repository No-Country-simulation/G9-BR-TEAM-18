# ADR-0009: Adoção do Oracle Database e Estado Transacional da Análise

## Status

Aceito

## Contexto

Durante o desenvolvimento do módulo de análise energética, dois problemas técnicos precisavam ser resolvidos para a evolução do sistema:
1. **Banco de Dados de Produção:** O sistema estava usando PostgreSQL, mas a homologação para o ambiente de produção exigia compatibilidade com o Oracle Cloud Infrastructure (OCI). O Oracle exige sintaxes específicas e não possui tipo lógico (`boolean`) nativo.
2. **Imprecisão Numérica:** Os campos de energia (watts, kWh) e custos operavam com o tipo `Double`. Cálculos financeiros e de potência com ponto flutuante sofriam de imprecisão nativa, exigindo tratamentos manuais de arredondamento.
3. **Falta de Rastreabilidade:** O serviço enviava dados para a IA em Python, mas se a requisição falhasse, o histórico daquela tentativa de análise era completamente perdido.

## Decisão

A equipe padronizou a infraestrutura de dados e refatorou os tipos de cálculo da seguinte forma:

1. **Migração Oficial para Oracle Database:** O `application.properties` foi atualizado para adotar drivers `ojdbc11` e o dialeto Oracle.
    - Criamos pastas de migrações separadas no Flyway (`db/migration/oracle/` e `db/migration/postgresql/`).
    - Campos booleanos (`active`, `peakHourUsage`) foram mapeados nativamente como `Integer` (0 e 1) nos Mappers do Java.
2. **Substituição de `Double` por `BigDecimal`:** Todos os dados de consumo (`consumptionKwh`), tempo (`highConsumptionHours`), probabilidade e custos migraram para `BigDecimal` usando `setScale(2, HALF_UP)`, garantindo precisão matemática absoluta.
3. **Máquina de Estado na Análise:** O `EnergyAnalysisService` passou a operar com rastreabilidade. Ao solicitar uma análise, ela é imediatamente salva com status `PENDENTE`. Após o processamento da IA, ocorre um *update* para `FINALIZADO` (sucesso) ou `FALHA` (erro no `MlServiceClient`).

## Consequências

- **Positivo:** A aplicação tem suporte total e pronto para *deploy* na nuvem OCI (Oracle).
- **Positivo:** Eliminação dos riscos de arredondamentos incorretos em valores monetários e quilowatts.
- **Positivo:** Alta rastreabilidade e auditoria: agora é possível consultar no banco exatamente quantas análises falharam devido a indisponibilidades do serviço Python.
- **Neutro:** Migrações DDL do Flyway agora precisam ser desenvolvidas e mantidas em duas sintaxes (Oracle e PostgreSQL).