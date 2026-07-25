# ADR-0024: Alinhamento do Catalogo de Aparelhos com Cobertura PPH 2019

## Status

Aceito

## Contexto

O catalogo de aparelhos do frontend continha 52 tipos de aparelhos, mas o modelo de Machine Learning do ML Service foi treinado exclusivamente com dados da pesquisa PPH 2019 (Pesquisa de Posse e Habitos do PROCEL/ELETROBRAS), que cobre apenas 11 tipos de aparelhos.

Isso gerava dois problemas:

1. **Ruido na analise:** O frontend enviava ao ML Service aparelhos que o modelo nao reconhecia, poluindo a distribuicao de consumo e reduzindo a precisao da classificacao.
2. **Falsa expectativa:** O usuario podia cadastrar aparelhos como "Freezer", "Frigobar", "Bomba d'agua" etc., mas esses dados eram ignorados pelo modelo, gerando uma analise inconsistente com o que o usuario esperava.

Os aparelhos sem cobertura PPH incluiam variantes de iluminacao (LED, fluorescente,
incandescente, lustre, abajur, spot), variantes de climatizacao (Split, Ventilador de
teto), eletrodomesticos diversos (Air fryer, Cafeteira, Ferro de passar, Aspirador,
Secador, Liquidificador), tecnologia (OLED TV, Notebook, Monitor, Roteador, Caixa de
som) e a categoria inteira de Servicos (Bomba d'agua, Portao, Interfone, Cancela,
Piscina, CFTV, Sensor, Cerca).

## Decisao

Decidimos reduzir o catalogo de aparelhos de 52 para 12 tipos, mantendo apenas aqueles com cobertura no treinamento do modelo ML (pesquisa PPH 2019):

| Categoria ML | Aparelhos Mantidos | Coluna PPH |
|---|---|---|
| Refrigeracao | Geladeira | qtd_geladeira |
| Climatizacao | Ar-condicionado, Ventilador | qtd_ar_condicionado, qtd_ventilador |
| Iluminacao | Lampada | qtd_lampadas |
| Eletrodomesticos | Micro-ondas, Air fryer, Maquina de lavar, Chuveiro eletrico | qtd_microondas, qtd_air_fryer, qtd_lavar_secar, qtd_chuveiro_eletrico |
| Tecnologia | Televisao, Computador, Videogame | qtd_tv, qtd_computadores, qtd_videogame |

### Decisoes adicionais

1. **"Outros" removido:** A categoria "Outros" foi eliminada porque nao ha como o ML Service analisar aparelhos desconhecidos. Quando o usuario nao seleciona nenhum aparelho, o campo `highestConsumptionCategory` simplesmente nao e enviado ao ML.

2. **Property type traduzido:** O backend traduz `RESIDENCIAL` para `Casa` e `COMERCIAL` para `Comercial` antes de enviar ao ML, pois o modelo espera valores em portugues.

3. **highestConsumptionCategory enviado:** O frontend agora envia a categoria de maior consumo do imovel para o ML Service, permitindo que o modelo utilize essa feature no calculo da probabilidade.

4. **V9 migration:** Criada migration `V9__clean_unused_appliances.sql` que remove `Secadora` (nao presente na PPH), renomeia `Lampada LED` para `Lampada` (consolidacao de variantes), e limpa os vinculos em `tb_property_appliance` para evitar violacao de FK.

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| **Alinhamento PPH (escolhido)** | Dados consistentes com o treinamento do modelo | Perda de aparelhos que usuarios poderiam querer cadastrar |
| **Manter 52 aparelhos (atual)** | Mais opcoes para o usuario | Ruido e inconsistencia na analise; falsa expectativa |
| **Mapear aparelhos para categorias PPH** | Preservaria todos os aparelhos | Complexidade alta; mapeamento heuristico e impreciso |
| **Retreinar modelo com mais aparelhos** | Cobertura completa | Necessitaria dados rotulados adicionais; fora do escopo do MVP |

## Consequencias

- **Positivo:** A analise energetica reflete apenas aparelhos que o modelo ML reconhece, eliminando ruido.
- **Positivo:** A interface do usuario fica mais limpa e focada nos aparelhos relevantes.
- **Positivo:** O campo `highestConsumptionCategory` agora e enviado ao ML, melhorando a precisao.
- **Negativo:** Usuarios que possuiam aparelhos removidos (ex: Freezer, Bomba d'agua) nao conseguem mais cadastra-los.
- **Negativo:** Dados existentes de aparelhos removidos sao perdidos na migration V9.
