# ADR-0016: Correções de Linting na Documentação - Markdownlint/CSpell

## Status

Aceito

## Contexto

O CI `lint-docs` executa três ferramentas em todos os arquivos `.md` do repositório:

1. **markdownlint-cli2** - verifica regras de estilo markdown (line-length, blank lines,
   fenced code language, etc.)
2. **cspell** - verifica ortografia com dicionários en, pt-BR, typescript, java, python
3. **check-forbidden-chars.mjs** - bloqueia caracteres Unicode proibidos (em dash `--`,
   aspas curvas)

Cinco categorias de violações foram encontradas:

### Markdownlint

- **MD013 (line-length):** ADR-0012 tinha linha de 354 caracteres (limite: 334)
- **MD022/MD032 (blanks around headings/lists):** ADR-0012, ADR-0009, relatório-kanban e
  AGENTS.md tinham listas e cabeçalhos sem linhas em branco ao redor
- **MD031/MD040 (fenced code language):** AGENTS.md e relatório-kanban tinham code fences
  sem especificação de linguagem
- **MD047 (trailing newline):** ADR-0008 e ADR-0009 não terminavam com newline
- **MD058 (blanks around tables):** relatório-kanban tinha tabela sem linha em branco antes

### CSpell (configuração)

O arquivo `cspell.json` importava `@cspell/dict-pt-br/cspell-ext.json`, mas o CI não
instalava o pacote, causando erro de resolução:
```
Failed to resolve configuration file: "@cspell/dict-pt-br/cspell-ext.json"
```

### Caracteres proibidos

ADR-0012 continha 6 ocorrências do caractere em dash (`--`, U+2014) que é proibido pelo
script `check-forbidden-chars.mjs` conforme regra documentada no AGENTS.md.

## Decisão

### Correções de markdownlint

As violações foram corrigidas diretamente nos arquivos:

- **ADR-0012:** Linha longa quebrada em múltiplas linhas; linhas em branco adicionadas
  entre títulos e listas
- **ADR-0009:** Linha em branco adicionada antes de lista numerada
- **ADR-0008/0009:** Newline final adicionado
- **AGENTS.md:** Code fence alterado para ` ```text `; linhas em branco adicionadas entre
  subtítulos e listas
- **relatório-kanban.md:** Code fence alterado para ` ```text `; linhas em branco
  adicionadas entre títulos/listas/tabelas

### Correção de cspell

Adicionado `npm install @cspell/dict-pt-br` ao workflow `lint-docs.yml` para instalar o
dicionário antes de executar o cspell.

### Correção de caracteres proibidos

Em dash (`--`) substituídos por hífen simples (`-`) no ADR-0012.

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Corrigir arquivos (escolhido)** | CI passa, documentação dentro do padrão | Requer editar cada arquivo |
| **Aumentar tolerância nos linters** | Zero edição | Enfraquece padrões de qualidade |
| **Embed de dicionário pt-BR no cspell.json** | Sem dependência externa | Adiciona centenas de palavras ao config |

## Consequências

- **Positivo:** `lint-docs` passa com zero erros
- **Positivo:** Caracteres proibidos removidos, conforme regra do AGENTS.md
- **Positivo:** CSpell funcionando no CI com dicionário pt-BR instalado
- **Neutro:** Workflow de CI ganhou um passo extra (`npm install @cspell/dict-pt-br`),
  adicionando ~2s ao tempo de execução
