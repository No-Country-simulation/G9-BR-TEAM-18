# ADR-0056: Relatórios do ml-qa versionados no repositório (I024)

## Status

Aceito

## Contexto

O módulo `ml-qa` executa suítes de testes exaustivos (black-box) contra o ML
Service e gera relatórios em Markdown e JSON: um relatório consolidado
(`ml-qa-report.md`), um arquivo por análise (`reports/analyses/*.md`, com o
detalhamento por equipamento espelhando o histórico do frontend) e o JSON
completo (`ml-qa-report.json`).

Até o momento, o diretório `reports/` estava no `.gitignore` do módulo, ou
seja, os resultados das rodadas locais **nunca eram compartilhados com a
equipe**. Quando a equipe de ML Service reportava uma alteração (ex.: novos
aparelhos no catálogo, ajuste de limiares, mudança de fallback), era
necessário que o responsável pelo ml-qa rodasse a suíte novamente e
descrevesse os resultados manualmente, sem que a equipe pudesse avaliar
diretamente as análises (payload, equipamentos, categoria, probabilidade,
fonte e recomendações) que produziram cada classificação.

Isso dificultava o diagnóstico de problemas nas análises: a equipe de ML não
tinha acesso aos detalhes de cada cenário executado nem conseguia comparar
comportamentos entre versões do ML Service.

## Decisão

A equipe decidiu **versionar os relatórios gerados pelo ml-qa no
repositório**, removendo `reports/` do `.gitignore` do módulo. A partir de
agora:

1. Cada rodada local executada pelo responsável gera/atualiza
   `ml-qa/reports/` (consolidado, análises individuais e JSON);
2. O responsável registra os relatórios no repositório junto com o código,
   permitindo que toda a equipe avalie os últimos testes executados
   diretamente;
3. Quando a equipe de ML atualiza o ML Service, o responsável roda a suíte
   novamente e envia um novo relatório no próximo commit.

Os relatórios são artefatos **versionados e revisáveis** (como qualquer
documento do projeto), não cache local: o histórico de commits passa a
registrar a evolução do comportamento do ML Service entre versões.

## Regras para os relatórios versionados

- O conteúdo dos relatórios é gerado pelo módulo (não editado à mão);
- Os relatórios devem passar nos mesmos lints de documentação do projeto
  (markdownlint, cspell e `check-forbidden-chars`), garantidos pelo gerador:
  tabelas com colunas alinhadas, ênfase consistente (`_underscore_`), sem
  caracteres proibidos e com as palavras de catálogo/cenários registradas no
  `cspell.json`;
- A suíte deve ser executada com o rate limiting padrão (12 req/min) para não
  estourar o limite gratuito do Groq;
- O arquivo `ml-qa-report.json` permite comparação entre rodadas via
  `git diff`.

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Versionar relatórios (escolhido)** | Equipe avalia os últimos testes no repositório; histórico de comportamento do ML; comparação entre versões via diff do JSON | Relatórios grandes no repositório; necessidade de rodada local para atualizar |
| **Manter reports/ ignorado (estado anterior)** | Repositório enxuto | Equipe sem acesso aos resultados; diagnóstico manual e assíncrono |
| **Publicar relatórios em artefato de CI** | Sem crescimento do repositório | CI do ml-qa ainda não automatizado; sem histórico versionado |

## Consequências

- **Positivo:** A equipe de ML Service pode avaliar os últimos testes
  executados localmente sem depender de descrições manuais.
- **Positivo:** O histórico de commits documenta a evolução do comportamento
  do ML Service entre versões.
- **Positivo:** O JSON versionado permite `git diff` entre rodadas para
  detectar mudanças de classificação.
- **Negativo:** O repositório cresce com os relatórios gerados (1 rodada
  completa gera ~124 arquivos Markdown + 1 JSON).
- **Neutro:** Os relatórios devem continuar passando nos lints de docs; o
  gerador é o responsável por isso (tabelas alinhadas, sem caracteres
  proibidos, cspell atualizado).

## O que mudou

- `ml-qa/.gitignore`: removida a entrada `reports/` (o diretório passa a ser
  versionado).
- `ml-qa/reports/`: relatórios da rodada de 10/08/2026 registrados no
  repositório (`ml-qa-report.md`, `ml-qa-report.json` e
  `reports/analyses/*.md`).
- `cspell.json`: adicionadas palavras de catálogo/cenários presentes nos
  relatórios (`escritorio`, `Portao`, `monotonicidade`, `basica`, etc.).
- `ml-qa/ml_qa/report/markdown_report.py`: ênfase dos rodapés padronizada
  para `_underscore_` (MD049) e tabelas com colunas alinhadas.
- `docs/reports/`: registros de movimentação do quadro Kanban atualizados
  (10/08/2026).
