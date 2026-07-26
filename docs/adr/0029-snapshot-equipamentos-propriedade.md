# ADR-0029: Implementação do Histórico de Equipamentos e Tipo de Propriedade (Card B038)

## Status
Aceito

## Contexto
Atualmente, o sistema realizava análises energéticas baseando-se no estado atual dos aparelhos cadastrados na propriedade no momento da requisição. Isso gerava **limitações e inconsistências**:

*   **Inconsistência Histórica**: Se o usuário alterasse, adicionasse ou removesse eletrodomésticos de sua propriedade após uma análise, a listagem de análises passadas refletiria o estado atual e não o estado que motivou aquela análise específica.
*   **Falta de Rastreabilidade do Tipo de Imóvel**: O tipo da propriedade (`propertyType`) não era persistido no histórico da análise, exigindo acoplamentos adicionais ou consultas indiretas para saber se o cálculo pertencia a uma casa, apartamento ou imóvel comercial.
*   **Ausência de Cascata Transacional**: A persistência de dados agregados (como recomendações e inventário de aparelhos) não possuía um gerenciamento robusto de exclusão e reinserção atômica por ID de análise.

## Decisão
Decidimos implementar o **congelamento do estado estrutural** no momento da geração da análise (**Snapshot**), estruturado em camadas (Domínio, Persistência, Serviço e Repositório):

### 1. Camada de Domínio e Modelo (ApplianceSnapshot)
Criação da classe de domínio `ApplianceSnapshot` para representar os dados "congelados" de cada eletrodoméstico no ato da análise:

```java
public class ApplianceSnapshot {
    private Long id;
    private String applianceName;
    private String applianceCategory;
    private Integer quantity;
    private BigDecimal averagePowerWatts;
    private BigDecimal averageDailyUseHours;
    private BigDecimal monthlyConsumptionKwh;
    // Construtores, Getters e Setters
}
```

Adição dos atributos `propertyType` (String) e `appliancesSnapshot` (`List<ApplianceSnapshot>`) na classe de domínio principal `EnergyAnalysis`.

### 2. Persistência e Banco de Dados (Migration V10)
Criação da tabela de persistência para armazenar os snapshots e adição da coluna correspondente na tabela principal de análises:

*   **Migration V10**: Adiciona a coluna `property_type` em `tb_energy_analysis` e cria a tabela `tb_analysis_appliance_snapshot` com chave estrangeira para o histórico de análises.
*   **Entidade JPA (`AnalysisApplianceSnapshotEntity`)**: Mapeamento relacional correspondente à nova tabela.
*   **Repositório JPA (`AnalysisApplianceSnapshotJpaRepository`)**: Métodos de busca e exclusão por `analysisId` em lote (`findByAnalysisIdIn` e `deleteByAnalysisId`).

### 3. Adapters e Mappers
*   **EnergyAnalysisRepositoryAdapter**: Atualizado para persistir e limpar em cascata (dentro da mesma transação `@Transactional`) tanto as recomendações quanto os snapshots de aparelhos. Implementação de buscas em lote para evitar problemas de consultas N+1 na listagem de propriedades.
*   **EnergyAnalysisMapper**: Ajustado para mapear de forma bidirecional o campo `propertyType` entre o domínio e a entidade de banco de dados.

### 4. Regra de Negócio (EnergyAnalysisService)
Modificação no fluxo de execução do caso de uso `GenerateAnalysisUseCase` para capturar e congelar os dados da propriedade e dos aparelhos logo antes da persistência inicial e da chamada ao serviço de Machine Learning:

```java
EnergyAnalysis analysis = new EnergyAnalysis(
        property.getId(), scale(consumptionKwh), peakHourUsage, scale(highConsumptionHours));
analysis.setPropertyType(property.getPropertyType());
analysis.setAppliancesSnapshot(toSnapshots(appliances));

analysis = repository.save(analysis);
```

O método privado `toSnapshots` converte os aparelhos vigentes da propriedade (`PropertyAppliance`) em instâncias de `ApplianceSnapshot`, registrando o nome, categoria, quantidade, potência, horas de uso e consumo mensal calculado.

## Alternativas consideradas

| Alternativa                       | Prós                                                              | Contras                                                                                             |
| :-------------------------------- | :---------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| Congelamento por Snapshot (Escolhido) | Histórico imutável e fiel ao momento em que a análise foi executada | Duplicação de dados históricos no banco de dados                                                    |
| Referência Dinâmica aos Aparelhos Atuais | Menor uso de armazenamento                                        | Alterações ou exclusões futuras corrompem a interpretação das análises passadas                     |
| Salvar JSON bruto dos aparelhos na tabela | Implementação rápida e sem novas tabelas                          | Dificuldade para consultas relacionais e relatórios futuros                                         |

## Consequências
*   **Positivo**: As análises energéticas passam a ser totalmente auditáveis e independentes de modificações futuras no cadastro de eletrodomésticos do usuário.
*   **Positivo**: O tipo de imóvel é preservado diretamente na entidade de análise, agilizando consultas e o envio de dados futuros.
*   **Positivo**: O adaptador de persistência garante transações seguras e otimizadas por meio de operações em lote.
*   **Negativo**: Ligeiro aumento na complexidade de mapeamento e no volume de dados armazenados na base de persistência.
