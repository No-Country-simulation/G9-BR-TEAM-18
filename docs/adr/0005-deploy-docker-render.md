# ADR-0005: Deploy em múltiplos ambientes com Docker e Render

## Status

Aceito

## Contexto

O projeto precisava ser implantado em um ambiente acessível para validação do hackathon. A equipe considerou múltiplas plataformas de deploy e abordagens de containerização. Os requisitos eram:

- Deploy gratuito ou de baixo custo
- Suporte a três serviços distintos (Java, Node, Python)
- Facilidade de reprodução do ambiente local para desenvolvimento
- Configuração de variáveis de ambiente separada por ambiente
- Deploy automático a partir do GitHub

## Decisão

A equipe decidiu usar **Docker Compose para desenvolvimento local** e **Render para deploy em produção**, com workflows separados para backend e ML Service.

**Docker Compose (desenvolvimento local):**

- Arquivo `docker-compose.yml` na raiz orquestra os três serviços
- Variáveis de ambiente compartilhadas via `env_file: ./.env`
- Portas mapeadas: 5173 (frontend), 8080 (backend), 8000 (ML Service)
- Build local com Dockerfiles específicos em cada diretório

**Render (produção):**

- Backend e ML Service implantados como serviços web separados no Render
- Frontend implantado como Static Site no Render
- Workflows `deploy-backend-dev.yml` e `deploy-ml-dev.yml` acionados por push na branch dev
- Health checks configurados para detectar falhas de inicialização
- Variáveis de ambiente configuradas diretamente no painel do Render

**Estrutura de Dockerfiles:**

| Serviço | Dockerfile | Base | Porta |
|---|---|---|---|
| Backend | `backend/Dockerfile` | `eclipse-temurin:21-jdk` | 8080 |
| Frontend | `frontend/Dockerfile` | `node:24-alpine` (multi-stage) | 5173 |
| ML Service | `ml-service/Dockerfile` | `python:3.12-slim` | 8000 |

**Variáveis de ambiente:**

```env
ML_SERVICE_URL=http://ml-service:8000
CORS_ALLOWED_ORIGINS=http://localhost:5173
KWH_TARIFF=0.75
GROQ_API_KEY=<opcional>
```

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| Apenas Docker Compose (deploy manual) | Simples; controle total | Sem deploy automático; sem URL pública |
| Apenas Render (sem Docker local) | Deploy simples | Inconsistência entre dev e produção |
| Docker Compose + Render | Ambiente local idêntico ao produção; deploy automático | Duas configs de deploy para manter; limite de recursos no Render free tier |
| AWS ECS / Google Cloud Run | Maior escalabilidade | Custo; complexidade de configuração para o escopo do hackathon |
| Heroku | Simples; bom para monólitos | Custo elevado para múltiplos serviços; suporte limitado a containers |

## Consequências

- **Positivo:** Ambiente de desenvolvimento idêntico ao de produção (mesmo Dockerfile)
- **Positivo:** Deploy automático a cada push na branch dev
- **Negativo:** Limite de recursos do Render free tier (512 MB RAM, CPU compartilhado) exige imagens otimizadas
- **Negativo:** O frontend React precisou excluir arquivos de teste do build (`tsconfig.build.json`) para caber no limite do Render
- **Negativo:** O backend precisou de `.dockerignore` para não incluir `.mvn/` e `target/` na imagem
- **Neutro:** Docker Compose requer 12 GB de RAM recomendados para execução local dos três serviços

> **Nota:** Consulte o [guia de execução](../guia-execucao.md) para instruções detalhadas de deploy e troubleshooting.
