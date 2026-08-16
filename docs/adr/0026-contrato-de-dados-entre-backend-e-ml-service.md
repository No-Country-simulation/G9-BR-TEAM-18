# ADR-0026: Contrato de Dados entre Backend e ML Service

## Status

Proposto

## Contexto

O `ml-service` expõe um endpoint `POST /predict` que classifica o perfil de eficiência energética de um imóvel e gera recomendações personalizadas via LLM. O modelo de classificação foi treinado com dados reais de uma pesquisa domiciliar de consumo energético (PPH), combinando duas fontes:

- **`pph-data-complete.csv`**: dados brutos por domicílio, incluindo localização, quantidade e consumo de 11 tipos de aparelhos e hábitos de uso relatados. É a fonte principal das features numéricas e booleanas do modelo.
- **`rotuled-ml-processed.csv`**: gerado a partir de uma extração mais completa da mesma pesquisa, com 37 tipos de aparelhos. Calcula por domicílio os 3 aparelhos de maior consumo e a categoria de consumo predominante. É a única fonte da categoria **"Serviços"**, que o dataset reduzido de 11 aparelhos não consegue calcular sozinho.

Este documento visa orientar sobre o schema de entrada e saída do `ml-service`. Caso haja divergência com qualquer outro ADR do backend ou frontend, deverá ser discutido com o que está definido aqui, já que este documento reflete diretamente o que o modelo foi treinado para receber (baseado nos pontos até o o commit **`d7dd94c`** (22/07/26)).

## Decisão

Formalizar o contrato de entrada do `POST /predict` em três grupos, documentando a origem de cada campo nos dados de treino.

### Campos

| Campo | Tipo | Descrição |
|---|---|---|
| `consumption_kwh` | `float` | Consumo total de energia no mês, em kWh |
| `peak_hour_usage` | `bool` | Uso de equipamentos em horário de pico (tipicamente 18h às 21h) |
| `equipment_quantity` | `int` | Quantidade total de equipamentos elétricos do imóvel |
| `property_type` | `string` (enum: `Casa`, `Apartamento`, `Comercial`) | Tipo do imóvel |
| `high_consumption_hours` | `float` | Horas por dia em consumo elevado (0 a 24) |
| `highest_consumption_category` | `string` (enum: `Refrigeracao`, `Climatizacao`, `Tecnologia`, `Iluminacao`, `Eletrodomesticos`, `Servicos`, `Outros`) | `"Outros"` não é fixo, dado que pode gerar problemas nas recomendações, abre margem para ser excluído das categorias (ADR 0024 registra que isso já foi feito). Entra no classificador como feature categórica |
| `highest_consumption_products` | `list[string]` (até 3 itens) | lista vazia. Não entra no classificador. Usado só como contexto no prompt do LLM, para recomendações mais específicas |

### Campo obsoleto

`daily_consumption_distribution` (watts por refrigeração, aquecimento, AC e iluminação) não é recomendado para novas integrações. É redundante com `highest_consumption_category` e mantido apenas por compatibilidade com implementações anteriores.

### Proveniência dos campos nos dados de treino

| Campo da requisição | Origem no treino | Dataset de origem |
|---|---|---|
| `consumption_kwh` | `consumo_real_medio_kwh_mes` | `pph-data-complete.csv` |
| `peak_hour_usage` | Inferido de colunas `habito_*` (ex: `habito_evita_standby`, `habito_ac_portas_fechadas`) | `pph-data-complete.csv` |
| `equipment_quantity` | Soma das colunas `qtd_*` | `pph-data-complete.csv` |
| `property_type` | Inferido de `REGIAO`, com distribuição proporcional | `pph-data-complete.csv` |
| `high_consumption_hours` | Estimado a partir da intensidade de consumo por equipamento | `pph-data-complete.csv` |
| `highest_consumption_category` | `categoria_maior_consumo`, com fallback calculado de `kwh_categoria_*` | `rotuled-ml-processed.csv` (fallback: `pph-data-complete.csv`) -> ml inclui "serviços", pph-data não.|
| `highest_consumption_products` | `produtos_maior_consumo` | `rotuled-ml-processed.csv`, sem equivalente no outro arquivo |

Isso importa porque `highest_consumption_products` e, na maioria dos casos,
`highest_consumption_category` dependem do `rotuled-ml-processed.csv`. Hoje esse
arquivo é unido ao `pph-data-complete.csv` por posição de linha, não por um
identificador único, já que `ENTREVISTA` se repete entre reentrevistas do mesmo
domicílio. É uma solução funcional, porém temporária, já registrada como issue de
consolidação de dataset.

### Pontos de atenção para as demais equipes

`property_type` tem 3 valores, não 2. O contrato define `Casa`, `Apartamento` e
`Comercial` como as únicas opções reconhecidas pelo modelo. Qualquer camada de
tradução do backend, por exemplo de valores como `RESIDENCIAL`/`COMERCIAL`,
precisa preservar essa distinção de 3 vias. Enviar só 2 categorias, colapsando
Casa e Apartamento em uma só, reduz a precisão da classificação sem necessidade,
já que o modelo foi treinado reconhecendo os três tipos separadamente.
(ADR 0024 registra a redução de RESIDENCIAL somente para Casa)

`"Servicos"` é uma categoria válida e treinada, mas atualmente inatingível pelo
catálogo do frontend (Conforme aponta ADR 0024). O modelo reconhece consumo de
Serviços, como bomba d'água, portão elétrico e motor de piscina, através do
`rotuled-ml-processed.csv`. Caso o catálogo de aparelhos do frontend não inclua
nenhum item dessa categoria, esse valor nunca será enviado na prática. Isso não
é um erro do contrato, mas uma capacidade do modelo que fica sem uso.
Recomenda-se avaliar a reintrodução de ao menos um aparelho de Serviços no
catálogo, caso o time responsável decida que vale a pena capturar esse sinal.

### Exemplo de requisição

```json
{
  "consumption_kwh": 420.5,
  "peak_hour_usage": true,
  "equipment_quantity": 12,
  "property_type": "Casa",
  "high_consumption_hours": 6.0,
  "highest_consumption_category": "Refrigeracao",
  "highest_consumption_products": ["Geladeira", "Chuveiro Elétrico", "TV"]
}
```

### Exemplo de resposta

```json
{
  "category": "MEDIANO",
  "probability": 0.81,
  "recommendations": [
    "Evite manter a geladeira próxima a fontes de calor, isso reduz o consumo.",
    "Prefira tomar banhos mais curtos para reduzir o uso do chuveiro elétrico.",
    "Desligue a TV da tomada quando não estiver em uso por longos períodos."
  ],
  "source": "model"
}
```

`source` indica se a predição ou recomendação veio do modelo treinado, de um fallback baseado em regras, ou de uma combinação com o modelo de linguagem. É informativo e não precisa ser exibido ao usuário final.

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Contrato com campos obrigatórios e opcionais documentados (escolhida)** | Backend sabe exatamente o mínimo necessário. Campos de contexto do LLM ficam claramente separados dos de classificação | Exige manter a tabela de proveniência atualizada se os datasets de treino mudarem |
| **Backend calcular `highest_consumption_category`/`highest_consumption_products` a partir do inventário de aparelhos do usuário** | Dado mais preciso, vindo do cadastro real do usuário, não de uma média estatística da PPH | Depende do perfil de aparelhos(ver ADR-0011); redundância de lógica se ambos os lados calculassem isso |
| **Manter `daily_consumption_distribution` como formato principal** | Já implementado no `main.py` atual | Redundante com `highest_consumption_category`; não é o formato validado com dados reais de treino |

## Consequências

Backend tem uma referência única e explícita do que é obrigatório, opcional e
obsoleto, o que reduz ambiguidade na integração. Fica claro que
`highest_consumption_products` não afeta a classificação, evitando expectativa
equivocada de que alterá-lo mudaria a `category` retornada. A rastreabilidade
origem-campo facilita entender o impacto de futuras mudanças nos datasets de
treino sobre o contrato de API.

Por outro lado, `highest_consumption_category` e `highest_consumption_products`
dependem de uma junção de dados por posição ainda não consolidada, item já
registrado como issue em aberto. O catálogo de aparelhos do ADR 0024 não cobre
a categoria "Serviços", tornando esse valor teoricamente válido mas inatingível
na prática até uma revisão do catálogo.

`daily_consumption_distribution` permanece aceito por compatibilidade, mas não deve ser usado em novas integrações.
