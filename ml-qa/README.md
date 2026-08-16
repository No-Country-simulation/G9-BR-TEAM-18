# EnergiAI ML QA

Suíte de testes **black-box** para avaliar a **qualidade das respostas** do
ML Service da EnergiAI e a **coerência entre o conjunto de aparelhos
enviado e a análise retornada**. Fala exclusivamente com a API HTTP do ML
Service (`/predict`) e não modifica nenhuma camada existente.

## Como os cenários são gerados

Os cenários replicam o fluxo real em produção (frontend -> backend -> ML):

1. O usuário monta o **inventário do imóvel** no frontend escolhendo
   aparelhos do catálogo que o backend sincronizou do ML Service;
2. O frontend calcula `equipment_quantity`, a distribuição diária de watts
   por categoria, a categoria de maior consumo e o top 3 de aparelhos por
   consumo mensal;
3. O backend agrega o inventário e monta o payload do `/predict`.

O módulo espelha esse cálculo (`scenarios/appliance_sets.py`): cada cenário
parte de um **conjunto realista de aparelhos** (ex.: "casa média",
"apartamento compacto", "comércio/restaurante") e deriva o payload com os
mesmos valores que o backend enviaria, nunca valores que não chegam ao ML
em produção. Os conjuntos usam os nomes do catálogo publicado pelo próprio
ML Service (`/appliance-catalog`), buscado dinamicamente no início de cada
rodada (fallback para o contrato 3.0.0 se o ML estiver fora).

## O que é avaliado

- **Contrato da resposta:** status HTTP, campos obrigatórios (`category`,
  `probability`, `recommendations`, `source`), categoria válida,
  probabilidade em [0,1], recomendações não vazias e `source` reconhecido;
- **Distribuição de fontes:** quantos cenários foram classificados só pelo
  modelo (`model`, confiança ≥ 80%), com apoio do Groq (`model+groq`),
  com confiança < 80% sem Groq (limite de taxa) e por regras
  (`rule-based`);
- **Coerência com o conjunto de aparelhos:** consumo informado x consumo
  esperado do inventário; categoria x consumo relativo ao conjunto;
  recomendações vazias; falha do Groq; violações de monotonicidade (mais
  consumo nunca deveria melhorar a categoria);
- **Detalhamento completo:** tabela de cada cenário com o conjunto usado,
  status, categoria, probabilidade, fonte e latência.

## Rate limiting (importante)

Cada cenário com confiança < 80% aciona **uma** chamada ao Groq, cujo plano
gratuito limita **25 chamadas por minuto**. Para que o Groq responda com
qualidade em todos os cenários (sem fallback silencioso por estouro de
taxa), o módulo envia no máximo **12 req/min com espaçamento uniforme (5s
entre requisições)**. Mesmo que todos os cenários de um minuto acionem o
Groq, são no máximo 12 chamadas, bem abaixo do limite.

Ajuste com `--max-rpm` (ex.: `--max-rpm 20` para rodar mais rápido,
aceitando margem menor; `--max-rpm 0` desativa o controle, o que não é
recomendado).

## Como executar

Pré-requisito: ML Service rodando localmente (Docker) na porta `8000`:

```bash
cd ../ && docker compose up -d ml-service
```

```bash
cd ml-qa
pip install -r requirements.txt        # runtime
pip install -e ".[dev]"                # + testes (pytest, ruff)
python -m ml_qa.cli                    # rodada completa (~10 min com rate limit)
```

### Opções da CLI

| Flag | Default | Descrição |
|---|---|---|
| `--base-url` | `http://localhost:8000` | URL base do ML Service |
| `--scenarios` | `all` | `all`, `boundary`, `combinatorial`, `anomalies` (ou combinação com vírgula) |
| `--report-dir` | `reports` | Diretório de saída dos relatórios |
| `--report` | `json,markdown` | Formatos: `json`, `markdown`, `none` |
| `--max-rpm` | `12` | Máximo de requisições/minuto ao ML Service (espaçamento uniforme; `0` desativa) |

Exemplos:

```bash
# Somente anomalias, relatório só JSON
python -m ml_qa.cli --scenarios anomalies --report json

# Contra o deploy Render
python -m ml_qa.cli --base-url https://energiai-ml-service.onrender.com
```

## Relatórios

- **Markdown consolidado** (`reports/ml-qa-report.md`): resumo, distribuição
  de fontes/categorias, recomendações por fonte, alertas de inconsistência,
  tabela detalhada de cada cenário (com o conjunto usado) e links para as
  análises individuais;
- **Análises detalhadas** (`reports/analyses/*.md`): um arquivo por cenário,
  espelhando o histórico do frontend, com a tabela **"Detalhamento por
  Equipamento"** (equipamento, qtd, potência, uso/dia, kWh/mês e total),
  payload enviado, resposta do ML (categoria, probabilidade, fonte e
  recomendações) e verificações executadas;
- **JSON** (`reports/ml-qa-report.json`): completo e comparável entre rodadas
  via `git diff` (detecta mudança de comportamento do ML entre versões).

A convenção de nomes e o significado de cada cenário estão em
[`docs/scenarios.md`](docs/scenarios.md).

## Testes do módulo

```bash
cd ml-qa
pytest
```

Os testes usam mocks HTTP e não exigem o ML Service rodando.
