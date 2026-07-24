# ADR-0016: Correcoes de Linting na Documentacao - Markdownlint/CSpell

## Status

Aceito

## Contexto

O CI `lint-docs` executa tres ferramentas em todos os arquivos `.md` do repositorio:

1. **markdownlint-cli2** - verifica regras de estilo markdown (line-length, blank lines,
   fenced code language, etc.)
2. **cspell** - verifica ortografia com dicionarios en, pt-BR, typescript, java, python
3. **check-forbidden-chars.mjs** - bloqueia caracteres Unicode proibidos (em dash `--`,
   aspas curvas)

Cinco categorias de violacoes foram encontradas:

### Markdownlint

- **MD013 (line-length):** ADR-0012 tinha linha de 354 caracteres (limite: 334)
- **MD022/MD032 (blanks around headings/lists):** ADR-0012, ADR-0009, relatorio-kanban e
  AGENTS.md tinham listas e cabecalhos sem linhas em branco ao redor
- **MD031/MD040 (fenced code language):** AGENTS.md e relatorio-kanban tinham code fences
  sem especificacao de linguagem
- **MD047 (trailing newline):** ADR-0008 e ADR-0009 nao terminavam com newline
- **MD058 (blanks around tables):** relatorio-kanban tinha tabela sem linha em branco antes

### CSpell (configuracao)

O arquivo `cspell.json` importava `@cspell/dict-pt-br/cspell-ext.json`, mas o CI nao
instalava o pacote, causando erro de resolucao:
```
Failed to resolve configuration file: "@cspell/dict-pt-br/cspell-ext.json"
```

### Caracteres proibidos

ADR-0012 continha 6 ocorrencias do caractere em dash (`--`, U+2014) que e proibido pelo
script `check-forbidden-chars.mjs` conforme regra documentada no AGENTS.md.

## Decisao

### Correcoes de markdownlint

As violacoes foram corrigidas diretamente nos arquivos:

- **ADR-0012:** Linha longa quebrada em multiplas linhas; linhas em branco adicionadas
  entre titulos e listas
- **ADR-0009:** Linha em branco adicionada antes de lista numerada
- **ADR-0008/0009:** Newline final adicionado
- **AGENTS.md:** Code fence alterado para ` ```text `; linhas em branco adicionadas entre
  subtitulos e listas
- **relatorio-kanban.md:** Code fence alterado para ` ```text `; linhas em branco
  adicionadas entre titulos/listas/tabelas

### Correcao de cspell

Adicionado `npm install @cspell/dict-pt-br` ao workflow `lint-docs.yml` para instalar o
dicionario antes de executar o cspell.

### Correcao de caracteres proibidos

Em dash (`--`) substituidos por hifen simples (`-`) no ADR-0012.

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| **Corrigir arquivos (escolhido)** | CI passa, documentacao dentro do padrao | Requer editar cada arquivo |
| **Aumentar tolerancia nos linters** | Zero edicao | Enfraquece padroes de qualidade |
| **Embed de dicionario pt-BR no cspell.json** | Sem dependencia externa | Adiciona centenas de palavras ao config |

## Consequencias

- **Positivo:** `lint-docs` passa com zero erros
- **Positivo:** Caracteres proibidos removidos, conforme regra do AGENTS.md
- **Positivo:** CSpell funcionando no CI com dicionario pt-BR instalado
- **Neutro:** Workflow de CI ganhou um passo extra (`npm install @cspell/dict-pt-br`),
  adicionando ~2s ao tempo de execucao
