# ADR-0037: Mapeamento EquipmentCategory (Inglês) para Valores do Banco (Português)

## Status

Aceito

## Contexto

O enum `EquipmentCategory` no backend está definido em inglês:

```java
public enum EquipmentCategory {
    LIGHTING,
    REFRIGERATION,
    CLIMATE_CONTROL,
    APPLIANCES,
    TECHNOLOGY,
    SERVICES
}
```

Porém, a CHECK constraint `chk_appliance_category` na tabela `tb_appliance` (definida na V12) e os dados de catálogo inseridos nas migrations V2, V3 e V12 usam valores em português com acentos:

```sql
CHECK (appliance_category IN (
    'Iluminação', 'Refrigeração', 'Climatização',
    'Eletrodomésticos', 'Tecnologia', 'Serviços'
))
```

Além disso, o ML Service espera receber e retorna categorias em português sem acentos (ex.: `"Refrigeracao"`, `"Iluminacao"`, `"Servicos"`).

Atualmente não existe uma camada de mapeamento entre o enum em inglês e os valores em português, o que torna o código frágil: qualquer nova categoria adicionada ao catálogo precisaria ser sincronizada manualmente em três representações diferentes.

## Decisão

Adicionar métodos de mapeamento bidirecional diretamente no enum `EquipmentCategory`:

1. **`toPortuguese()`**: retorna o valor em português com acentos, usado para persistência no banco e exibição.
2. **`fromPortuguese(String)`**: método estático que converte um valor em português (com ou sem acentos) de volta para o enum correspondente.

### Mapeamento definido

| Enum (Inglês) | Português (DB) | ML Service (sem acentos) |
|---|---|---|
| `LIGHTING` | `Iluminação` | `Iluminacao` |
| `REFRIGERATION` | `Refrigeração` | `Refrigeracao` |
| `CLIMATE_CONTROL` | `Climatização` | `Climatizacao` |
| `APPLIANCES` | `Eletrodomésticos` | `Eletrodomesticos` |
| `TECHNOLOGY` | `Tecnologia` | `Tecnologia` |
| `SERVICES` | `Serviços` | `Servicos` |

### Uso nos adapters de persistência

O mapeamento será usado nos seguintes pontos:

- `ApplianceEntity` / mapper: ao ler do banco, converter a String portuguesa para o enum usando `fromPortuguese()`.
- `AnalysisApplianceSnapshotDTO`: garantir que os valores de categoria retornados na API usem o formato correto.
- `EnergyAnalysisService.buildMlRequest()`: ao montar o envelope para o ML Service, usar os valores em português.

## Alternativas consideradas

1. **Traduzir o enum para português**: descartado porque o ADR-0027 estabelece que o código deve permanecer em inglês, apenas dados e exibição para o usuário final devem estar em português.

2. **Manter sem mapeamento**: descartado porque torna o código frágil e dificulta a manutenção futura. Qualquer novo aparelho ou categoria exigiria sincronização manual em três lugares.

## Consequências

- O código fica mais robusto: o enum em inglês é a única fonte da verdade, e os métodos de mapeamento garantem a conversão correta.
- Facilita a adição de novas categorias: basta adicionar o valor no enum e no mapeamento.
- Nenhuma alteração no ML Service é necessária.
- As migrations existentes continuam funcionando sem alterações.
