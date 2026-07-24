# Convenção de IDs dos cards

Cada card recebe um ID no formato:

```text
{PREFIXO}{NNN} {Categoria} - {descrição curta da entrega}
```

## Prefixos e categorias

| Prefixo | Categoria | Quando usar |
|---|---|---|
| B | Backend (Endpoints/Services) | Novos endpoints, regras de negócio, serviços, integrações |
| F | Frontend (Telas/Componentes) | Telas, componentes de UI, páginas, integração com API |
| I | Infraestrutura/Base | Docker, CI/CD, dependências, configuração de ambiente, documentação técnica |
| M | Banco de Dados (Migration) | Migrations Flyway, schemas, seeds, scripts de banco |
| Q | Queries/Views | Notebooks, consultas, relatórios de dados, modelos de ML |

## Regras práticas

- A numeração é sequencial e contínua dentro de cada prefixo, seguindo a ordem cronológica das entregas (ex: M001, M002, M003).
- O prefixo e a categoria devem refletir o domínio principal da entrega, não detalhes secundários (ex: um endpoint novo no backend é `B`, mesmo que toque o banco).
- Se uma entrega tiver componentes em múltiplas categorias, escolha o prefixo do domínio dominante.
- A descrição é curta e começa com letra maiúscula (ex: "Expansão de 3 para 5 categorias de eficiência").

## Exemplos

| ID completo | Explicação |
|---|---|
| `M001 Banco de Dados (Migration) - Migration inicial` | Primeira migration do projeto (prefixo M, sequência 001) |
| `B003 Backend (Endpoints/Services) - Teste de unidade do backend` | Terceiro card de backend (prefixo B, sequência 003) |
| `I004 Infraestrutura/Base - Workflows CI/CD no GitHub Actions` | Quarta entrega de infraestrutura (prefixo I, sequência 004) |
