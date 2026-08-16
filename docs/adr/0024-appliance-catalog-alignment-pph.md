# ADR-0024: Alinhamento do Catalogo de Aparelhos com Cobertura PPH 2019

## Status

Aceito

## Contexto

O catálogo de aparelhos do frontend continha 52 tipos de aparelhos, mas o modelo de Machine Learning do ML Service foi treinado exclusivamente com dados da pesquisa PPH 2019 (Pesquisa de Posse e Hábitos do PROCEL/ELETROBRAS), que cobre apenas 11 tipos de aparelhos.

Isso gerava dois problemas:

1. **Ruído na análise:** O frontend enviava ao ML Service aparelhos que o modelo não reconhecia, poluindo a distribuição de consumo e reduzindo a precisão da classificação.
2. **Falsa expectativa:** O usuário podia cadastrar aparelhos como "Freezer", "Frigobar", "Bomba d'água" etc., mas esses dados eram ignorados pelo modelo, gerando uma análise inconsistente com o que o usuário esperava.

Os aparelhos sem cobertura PPH incluíam variantes de iluminação (LED, fluorescente,
incandescente, lustre, abajur, spot), variantes de climatização (Split, Ventilador de
teto), eletrodomésticos diversos (Air fryer, Cafeteira, Ferro de passar, Aspirador,
Secador, Liquidificador), tecnologia (OLED TV, Notebook, Monitor, Roteador, Caixa de
som) e a categoria inteira de Serviços (Bomba d'água, Portão, Interfone, Cancela,
Piscina, CFTV, Sensor, Cerca).

## Decisão

Decidimos reduzir o catálogo de aparelhos de 52 para 12 tipos, mantendo apenas aqueles com cobertura no treinamento do modelo ML (pesquisa PPH 2019):

| Categoria ML | Aparelhos Mantidos | Coluna PPH |
|---|---|---|
| Refrigeracao | Geladeira | qtd_geladeira |
| Climatizacao | Ar-condicionado, Ventilador | qtd_ar_condicionado, qtd_ventilador |
| Iluminacao | Lâmpada | qtd_lampadas |
| Eletrodomesticos | Micro-ondas, Air fryer, Máquina de lavar, Chuveiro elétrico | qtd_microondas, qtd_air_fryer, qtd_lavar_secar, qtd_chuveiro_eletrico |
| Tecnologia | Televisão, Computador, Videogame | qtd_tv, qtd_computadores, qtd_videogame |

### Decisões adicionais

1. **"Outros" removido:** A categoria "Outros" foi eliminada porque nao ha como o ML Service analisar aparelhos desconhecidos. Quando o usuário nao seleciona nenhum aparelho, o campo `highestConsumptionCategory` simplesmente nao e enviado ao ML.

2. **Property type traduzido:** O backend traduz `RESIDENCIAL` para `Casa` e `COMERCIAL` para `Comercial` antes de enviar ao ML, pois o modelo espera valores em português.

3. **highestConsumptionCategory enviado:** O frontend agora envia a categoria de maior consumo do imóvel para o ML Service, permitindo que o modelo utilize essa feature no calculo da probabilidade.

4. **V9 migration:** Criada migration `V9__clean_unused_appliances.sql` que remove `Secadora` (não presente na PPH), renomeia `Lampada LED` para `Lampada` (consolidação de variantes), e limpa os vínculos em `tb_property_appliance` para evitar violação de FK.

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| **Alinhamento PPH (escolhido)** | Dados consistentes com o treinamento do modelo | Perda de aparelhos que usuários poderiam querer cadastrar |
| **Manter 52 aparelhos (atual)** | Mais opções para o usuário | Ruido e inconsistência na analise; falsa expectativa |
| **Mapear aparelhos para categorias PPH** | Preservaria todos os aparelhos | Complexidade alta; mapeamento heurístico e impreciso |
| **Retreinar modelo com mais aparelhos** | Cobertura completa | Necessitaria dados rotulados adicionais; fora do escopo do MVP |

## Consequências

- **Positivo:** A analise energetica reflete apenas aparelhos que o modelo ML reconhece, eliminando ruido.
- **Positivo:** A interface do usuário fica mais limpa e focada nos aparelhos relevantes.
- **Positivo:** O campo `highestConsumptionCategory` agora e enviado ao ML, melhorando a precisão.
- **Negativo:** Usuários que possuíam aparelhos removidos (ex: Freezer, Bomba d'água) não conseguem mais cadastrá-los.
- **Negativo:** Dados existentes de aparelhos removidos são perdidos na migration V9.
