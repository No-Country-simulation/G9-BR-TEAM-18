# Arquitetura — Análise de Perfil Energético

## Visão geral

O sistema recebe os dados de consumo de um imóvel e devolve três coisas: uma **categoria de eficiência energética**, uma **estimativa financeira** e um conjunto de **recomendações personalizadas** geradas por LLM. O pipeline é dividido em quatro etapas sequenciais:

```
[1] Dados brutos (PPH)
        │
        ▼
[2] Processamento e engenharia de features
        │
        ▼
[3] Classificação (Random Forest)
        │
        ▼
[4] Geração de recomendações (Groq LLM)
        │
        ▼
   Resposta final
```

## Componentes

### 1. Fonte de dados
Dataset real da **PPH (Pesquisa de Posse de Equipamentos e Hábitos de Uso)** — um levantamento de consumo energético domiciliar com posse e consumo (kWh) de 37 tipos de aparelhos por domicílio, além de localização (região, UF, município) e consumo/custo totais mensais.

Ver `pipeline_dados.md` para detalhes do processamento.

### 2. Camada de features
O dataset bruto (78 colunas) é reduzido a 12 colunas relevantes, com três variáveis derivadas geradas artificialmente (`uso_horario_pico`, `horas_alto_consumo`, `tipo_imovel`), já que não existem na pesquisa original.

### 3. Modelo de classificação
Um classificador **Random Forest** treinado sobre um rótulo de eficiência criado internamente (índice composto cortado em quintis). Recebe as features do domicílio e prevê uma entre 5 categorias: `Excelente`, `Bom`, `Mediano`, `Ruim`, `Crítico`.

Ver `modelo_classificacao.md` para a lógica do índice e do treinamento.

### 4. Camada de geração de linguagem
Um LLM hospedado na **Groq** (`llama-3.3-70b-versatile`) recebe a categoria prevista, os dados do domicílio e os aparelhos de maior consumo, e gera 3 recomendações textuais em português.

Ver `recomendacoes_llm.md` para a engenharia de prompt.

## Por que essa divisão em duas "inteligências" (ML + LLM)

Uma decisão de arquitetura central do projeto: **classificação e geração de texto são resolvidas por sistemas diferentes**, não por um único modelo fazendo tudo.

- O **classificador (Random Forest)** decide a categoria — é determinístico, rápido, explicável e não tem risco de alucinação.
- O **LLM (Groq)** só traduz essa decisão já tomada em texto natural — ele nunca decide a categoria por conta própria. Isso evita que o modelo de linguagem "invente" uma classificação diferente da que o sistema de ML calculou, o que geraria inconsistência entre o campo `categoria` da resposta e o teor das recomendações.

## Stack utilizada

| Camada | Tecnologia |
|---|---|
| Manipulação de dados | pandas, numpy |
| Classificação | scikit-learn (Random Forest) |
| Serialização do modelo | joblib |
| Geração de linguagem | API da Groq (SDK `groq`) |
| Ambiente de desenvolvimento | Jupyter Notebook |
| API de produção (planejada) | FastAPI |

## Limitações conhecidas

- `uso_horario_pico`, `horas_alto_consumo` e `tipo_imovel` são **gerados**, não coletados — o dataset real (PPH) não contém essas informações. Qualquer análise que dependa fortemente dessas variáveis carrega essa limitação.
- O rótulo de eficiência (`categoria`) é derivado de um índice de negócio definido pela equipe, não de uma classificação oficial externa — é uma aproximação razoável, não um padrão regulatório validado.
- A dependência da API da Groq introduz uma dependência de internet e de um serviço externo; é necessário um plano de contingência para demonstrações offline.