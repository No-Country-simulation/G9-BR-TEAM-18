# ADR-0057: Expansão do Catálogo de Aparelhos e Feature Engineering para Consumo Individual

## Status

Aceito

## Contexto

O ML Service reconhecia originalmente 11 tipos de aparelho, todos vindos das colunas `qtd_*` da pesquisa PPH 2019 (`pph-data-complete.csv`, consolidado em `main-dataset.csv` pelo M003). Isso limitava tanto o `/appliance-catalog` (endpoint de descoberta consumido pelo backend/frontend)
quanto o cálculo de `equipment_quantity` no treino, apesar de existir uma fonte de dado adicional disponível:

`consumo-energetico-completo.csv`, da mesma base de domicílios (mesma pesquisa, mesmo `ENTREVISTA`/`REGIAO`/`UF`/`MUNICIPIO`), com cobertura de 37 aparelhos.

Além disso, ao ampliar o catálogo, identificou-se um problema em `_generate_recommendations()` (caminho rule-based, usado em ~95% das predições por cair no limiar de confiança ≥80%):
o texto de recomendação era fixo por categoria de consumo (ex: "verifique a vedação da geladeira" para toda a categoria `Refrigeracao`), citando um aparelho específico mesmo quando o domicílio podia ter um aparelho diferente da mesma categoria (ex: só freezer, sem geladeira);

um problema que se agravou diretamente com a expansão do catálogo, já que cada categoria passou a agrupar bem mais aparelhos.

## Decisão

Três frentes de trabalho, executadas em sequência (Q009 → Q010 → Q011), mais uma correção de recomendação decorrente delas.

### 1. Merge dos dados de aparelhos (Q009)

Notebook `Q007_merge_appliance_data.ipynb`, seguindo o mesmo padrão de validação rigorosa do M003 (comparação da sequência completa de `ENTREVISTA`+`REGIAO`+`UF`+`MUNICIPIO` entre os dois arquivos, não só contagem de linha).

Trouxe apenas as colunas `qtd_*`/`kwh_*` de aparelhos com ícone correspondente no catálogo dinâmico do frontend; aparelhos sem ícone (`qtd_ventilador_teto`, `qtd_caixa_som`, `qtd_lava_loucas`, `qtd_secador_cabelo`, `qtd_maquina_costura`) ficaram de fora.

Duas decisões de consolidação, motivadas pelo frontend só ter uma chave de ícone por tipo de aparelho:

- Lâmpadas (`qtd_lampada_led`/`fluorescente`/`incandescente`) não foram incluídas; mantida a coluna genérica `qtd_lampadas` já existente.
- Forno e fogão mantidos como colunas separadas (o frontend tem ícone para cada um).

Resultado substituiu `main-dataset.csv` diretamente (sem manter um nome de versão paralelo).

### 2. Expansão do `/appliance-catalog` (Q010)

`appliance_catalog()`, em `main.py`, passou a ler o `main-dataset.csv` já consolidado, expondo 29 aparelhos (de 11). `qtd_computadores` e `qtd_computador_desktop` (mesmo aparelho, extraído por duas pesquisas diferentes), consolidados numa única entrada `"Computador"` no catálogo.

`ml_category` de todos os aparelhos novos mantido dentro do conjunto já existente no `/contract` (`REFRIGERATION`, `CLIMATE_CONTROL`, `TECHNOLOGY`, `APPLIANCES`, `SERVICES`), sem categoria nova.

Corrigido também um bug pré-existente: `appliance_catalog()` ainda apontava para `pph-data-complete.csv`, removido no M003, causando `FileNotFoundError` em toda chamada ao endpoint.

Valores de `watts`/`hours` dos aparelhos novos são estimativa da equipe de ML, sem fonte de dado real; sinalizados como pendentes de revisão.

### 3. Feature engineering do treino (Q011)

`APPLIANCE_COLUMNS` movido de `main.py` para `features.py`, tornando-se fonte única compartilhada entre `appliance_catalog()` e `PPH_APPLIANCE_QTY_COLUMNS` (agora derivado de `APPLIANCE_COLUMNS.keys()`), eliminando o risco de duas listas divergirem.

`equipment_quantity`, em `load_pph_data()`, passou a somar todas as 29 colunas. Colunas redundantes (`qtd_computadores`/`qtd_computador_desktop`, `qtd_lavar_secar`/`qtd_maquina_lavar`: mesmo aparelho físico, duas extrações) são mescladas via `max()` na coluna canônica antes da soma,
via um novo dicionário `REDUNDANT_APPLIANCE_COLUMNS`, evitando contagem duplicada do mesmo aparelho.

`refrigeration_watts`/`heating_watts`/`air_conditioning_watts`/`lighting_watts` não foram alterados; continuam derivados de `kwh_categoria_*` (esquema legado de 5 categorias agregadas, ver ADR-0025), sem relação direta com as colunas de aparelho individuais.

**Correção de overfitting descoberta durante a validação**: um treino de teste com `equipment_quantity` expandido revelou que o `RandomizedSearchCV`, tendo `max_depth: None` e `max_features: None` disponíveis, escolheu árvores sem limite de profundidade.

Isso fez `estimated_load` (derivada de `equipment_quantity`) sozinha responder por 35% da importância do modelo (contra ~16% nos treinos anteriores), e `property_type` parar de diferenciar predições entre Casa/Apartamento/Comercial no sanity check de cenários variados.

Corrigido restringindo o espaço de busca do `RandomizedSearchCV` (`max_depth: [10, 20, 30]`, `max_features: ["sqrt", "log2"]`), sem essas opções ilimitadas.

Modelo retreinado com o dataset e o espaço de busca corrigidos: CV accuracy 0.9796, test accuracy 0.9802; pequena queda frente aos treinos anteriores ao overfitting, aceita como o custo correto de eliminar árvores sem limite.

### 4. Recomendações específicas por aparelho, não por categoria

`_generate_recommendations()` (rule-based) usava um texto fixo por categoria de consumo, citando um aparelho específico (ex: geladeira para toda a categoria `Refrigeracao`).

Com o catálogo expandido, isso se tornou um problema real: cada categoria passou a agrupar vários aparelhos (`REFRIGERATION` agora cobre Geladeira/Freezer/Frigobar/Bebedouro), então a recomendação podia citar um aparelho que o domicílio nem tinha.

Adicionado `APPLIANCE_RECOMMENDATIONS`, com uma dica específica para cada um dos 29 aparelhos do catálogo. `_select_appliance_recommendations()` escolhe a dica de cada item em `highest_consumption_products` (até 3, nome normalizado por acento/maiúscula para o match), substituindo a recomendação de categoria.

`CATEGORY_RECOMMENDATIONS` foi reescrito para não citar nenhum aparelho específico, servindo apenas como fallback genérico quando `highest_consumption_products` não é informado ou nenhum item bate com o catálogo.

O caminho Groq (`_generate_recommendations_groq()`) não precisou de correção equivalente; já usava `highest_consumption_products` reportado pela requisição para citar equipamento, nunca um texto fixo.

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| Merge validado via notebook (escolhida, Q009) | Mesma robustez de validação do M003; sem risco de desalinhamento silencioso | Requer notebook adicional a manter |
| Somar colunas redundantes sem `max()` (rejeitada) | Mais simples | Conta o mesmo aparelho físico duas vezes, inflando `equipment_quantity` artificialmente |
| Manter `max_depth`/`max_features` irrestritos no RandomizedSearchCV (rejeitada) | Espaço de busca maior, potencial de acurácia de treino mais alta | Overfitting real e observado: `property_type` parou de diferenciar predições, `estimated_load` dominou sozinha |
| Recomendação por categoria, sem citar aparelho nenhum, mesmo com produto disponível (rejeitada) | Mais simples, sem risco de citar aparelho errado | Desperdiça o dado de `highest_consumption_products` já disponível na requisição; recomendação fica menos específica que o necessário |

## Consequências

Positivo: catálogo de aparelhos quase triplicou (11 → 29), com fonte única compartilhada entre catálogo e treino, eliminando divergência futura entre as duas listas.

Positivo: `equipment_quantity` reflete melhor o inventário real do domicílio, sem contar aparelho duplicado entre pesquisas.

Positivo: overfitting real foi detectado e corrigido antes do retreino definitivo, evitando promover um modelo com `property_type` inoperante para produção.

Positivo: recomendações rule-based (a maioria das predições em produção) passam a citar o aparelho certo, ou nenhum aparelho quando a informação não permite precisão.

Negativo: `watts`/`hours` dos 18 aparelhos novos são estimativa sem fonte de dado real, pendente de revisão da equipe.

Negativo: `_select_appliance_recommendations()` usa correspondência exata (após normalização de acento/maiúscula) contra o catálogo; variações maiores de nome (plural, sinônimo) não são reconhecidas e caem no fallback genérico. Suficiente para o problema atual, mas não é fuzzy matching.

Nota: consulte a ADR-0025 para a definição original de `highest_consumption_products`, a ADR-0049 para o merge original de dataset (M003) e o uso de `highest_consumption_category` nas recomendações, que esta ADR estende.
