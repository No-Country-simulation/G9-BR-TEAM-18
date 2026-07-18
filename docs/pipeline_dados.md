# Pipeline de Dados

## Fonte

Arquivo bruto: `consumo_energetico_completo.csv`, dados da **PPH (Pesquisa de Posse de Equipamentos e Hábitos de Uso)**. Contém, por domicílio (`ENTREVISTA`):

- Localização: `REGIAO`, `UF`, `MUNICIPIO`
- Quantidade de cada aparelho (`qtd_*`) — 37 tipos
- Consumo em kWh de cada aparelho (`kwh_*`) — 37 tipos
- Consumo total mensal (`consumo_total_kwh_mes`)
- Custo estimado da conta (`valor_estimado_conta_reais`)

## Colunas finais geradas

O processamento reduz o dataset bruto (78 colunas) para 12 colunas:

| Coluna | Origem | Descrição |
|---|---|---|
| `entrevista` | Real (PPH) | Identificador único do domicílio |
| `regiao`, `uf`, `municipio` | Real (PPH) | Localização geográfica |
| `uso_horario_pico` | **Gerado** | Booleano, sorteado aleatoriamente |
| `horas_alto_consumo` | **Gerado** | Float (0–12h), sorteado aleatoriamente |
| `consumo_total_kwh_mes` | Real (PPH) | Consumo mensal total |
| `valor_estimado_conta_reais` | Real (PPH) | Custo estimado da conta |
| `produtos_maior_consumo` | Derivado | Os 3 aparelhos de maior consumo (kWh), separados por `\|` |
| `categoria_maior_consumo` | Derivado | Categoria do aparelho líder em consumo |
| `quantidade_equipamentos` | Derivado | Soma de todos os `qtd_*` do domicílio |
| `tipo_imovel` | **Gerado** | Casa / Apartamento / Comercio |

## Mapeamento de aparelhos → categorias

Os 37 aparelhos da pesquisa são agrupados em 6 categorias de consumo:

| Categoria | Aparelhos |
|---|---|
| **Refrigeração** | Geladeira, Freezer, Frigobar, Bebedouro |
| **Climatização** | Ar-condicionado, Ar-condicionado Split, Ventilador, Ventilador de Teto, Aquecedor Elétrico |
| **Iluminação** | Lâmpada LED, Fluorescente, Incandescente |
| **Tecnologia** | TV, Computador Desktop, Notebook, Roteador Wi-Fi, Videogame, Caixa de Som |
| **Eletrodomésticos** | Chuveiro Elétrico, Máquina de Lavar, Secadora, Lava-louças, Micro-ondas, Forno Elétrico, Fogão Elétrico, Air Fryer, Cafeteira, Ferro de Passar, Aspirador de Pó, Secador de Cabelo, Liquidificador, Batedeira, Máquina de Costura |
| **Serviços** | Bomba d'Água, Portão Elétrico, Motor de Piscina |

Um domicílio recebe categoria **"Outros"** quando nenhum aparelho individual tem consumo (`kwh`) registrado maior que zero, mesmo com `consumo_total_kwh_mes` preenchido, uma particularidade observada nos dados reais (~32% dos casos), provavelmente relacionada a como a pesquisa foi respondida.

## Variáveis geradas (não presentes na PPH)

Três variáveis não existem no levantamento original e foram geradas artificialmente para viabilizar a análise de eficiência:

- **`uso_horario_pico`**: sorteio aleatório 50/50.
- **`horas_alto_consumo`**: sorteio uniforme entre 0 e 12 horas.
- **`tipo_imovel`**: sorteio ponderado — 45% Casa, 35% Apartamento, 20% Comercio (proporção aproximada de uma amostra domiciliar típica).

**Importante:** por serem geradas, essas três variáveis não carregam sinal real do domicílio, qualquer correlação encontrada entre elas e a categoria de eficiência é fruto da própria lógica de rotulagem (ver `modelo_classificacao.md`), não uma relação real observada nos dados.

## Arquivos gerados pelo pipeline

| Arquivo | Gerado por | Conteúdo |
|---|---|---|
| `ml_processed.csv` | Célula de processamento | Base final, 12 colunas, sem rótulo |
| `rotuled_ml_processed.csv` | Célula de rotulagem | Base final + coluna `categoria` |
| `modelo_categorizacao.joblib` | Célula de treinamento | Pipeline treinado (pré-processamento + Random Forest) |
