# EnergiAI - ML Service

Microsserviço Python de classificação energética, construído com **Python 3.12 + FastAPI + scikit-learn**.
Classifica o perfil de consumo em 5 categorias (Excelente, Bom, Mediano, Ruim, Crítico), gera
recomendações personalizadas (rule-based por aparelho ou via LLM Groq) e expõe o catálogo de aparelhos
reconhecidos pelo modelo.

## Pré-requisitos

- Python 3.12

## Configuração

```bash
cd ml-service
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Variáveis de ambiente (opcionais, exceto as indicadas):

| Variável | Padrão | Descrição |
|---|---|---|
| `GROQ_API_KEY` | - | Chave do Groq (fallback LLM para confiança < 80%) |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Modelo LLM |
| `MODEL_PATH` | `categorization-model.joblib` | Caminho do modelo serializado |
| `TRAINING_LOG_PATH` | `treino_feedback.jsonl` | Log de predições para retreino |
| `RANDOM_SEED` | `42` | Seed de reprodutibilidade do treino |
| `N_SYNTHETIC` | `2000` | Amostras sintéticas geradas no treino |

## Executar

```bash
# Via script da raiz
./run.sh ml-service

# Ou diretamente
cd ml-service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

API em <http://localhost:8000> (docs interativas em <http://localhost:8000/docs>).

## Endpoints principais

| Método | Caminho | Descrição |
|---|---|---|
| `POST` | `/predict` | Predição completa (armazena no log de treinamento) |
| `POST` | `/predict/simulate` | Predição simulada (sem armazenar) |
| `GET` | `/contract` | Contrato completo (categorias, schemas) |
| `GET` | `/appliance-catalog` | Catálogo de aparelhos reconhecidos |
| `GET` | `/status` | Status do modelo, Groq e taxas |

## Re-treinar o modelo

```bash
cd ml-service
python3 train_model.py
```

O treino usa `data/main-dataset.csv` (PPH 2019 consolidado), `data/labeled-energy-base.csv` e
`treino_feedback.jsonl`. O espaço de busca do `RandomizedSearchCV` é restrito para evitar overfitting
(ver [ADR-0057](../docs/adr/0057-expansao-catalogo-aparelhos-feature-engineering.md)).

## Lint e tipagem

```bash
cd ml-service
ruff check .
ruff format --check .
mypy .
```

## Suíte de qualidade

A avaliação black-box do ML Service fica no módulo [ml-qa](../ml-qa/README.md), com cenários por
conjunto de aparelhos e relatórios versionados.

## Documentação

- [Arquitetura do ML Service](../docs/ml-service.md)
- [Contrato de API](../docs/contrato-api.md)
- [Registro de decisões (ADR)](../docs/adr/)
