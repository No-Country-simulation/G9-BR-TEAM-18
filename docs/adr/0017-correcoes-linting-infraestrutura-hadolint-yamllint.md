# ADR-0017: Correcoes de Linting na Infraestrutura - Hadolint/Yamllint

## Status

Aceito

## Contexto

O CI `lint-infra` executa duas ferramentas:

1. **Hadolint** - linter para Dockerfiles (verifica boas praticas de construcao de
   imagens)
2. **Yamllint** - linter para arquivos YAML

Duas violacoes foram identificadas:

### Hadolint DL3016 (frontend/Dockerfile)

O frontend/Dockerfile continha `npm install -g serve` sem pino de versao na linha 13.
O hadolint acusa a regra DL3016 (warning) que exige que versoes de pacotes npm sejam
explicitamente definidas. O GitHub Action `hadolint/hadolint-action@v3.1.0` trata este
warning como falha.

### Yamllint (workflows .github/)

O yamllint com configuracao `extends: default` acusava tres categorias de violacoes em
todos os arquivos de workflow do GitHub Actions:

- **line-length:** URLs longas e comandos com muitos argumentos excediam o limite de 80
  caracteres
- **document-start:** Arquivos nao comecavam com `---` (YAML front matter)
- **truthy:** O uso de `on:` (trigger de workflow) era interpretado como valor truthy
  nao-booleano

Estas violacoes sao pre-existentes e inerentes ao formato dos workflows do GitHub Actions,
que utilizam URLs longas e a sintaxe `on:` para definicao de triggers.

## Decisao

### Hadolint

A versao do pacote `serve` foi explicitada no Dockerfile:

```dockerfile
# Antes:
RUN npm install -g serve

# Depois:
RUN npm install -g serve@14.2
```

### Yamllint

Um arquivo de configuracao `.yamllint.yml` foi adicionado na raiz do projeto com as
seguintes regras:

```yaml
extends: default

rules:
  line-length: disable
  document-start: disable
  truthy: disable
```

As tres regras foram desabilitadas porque:

- **line-length:** URLs de imagens Docker, comandos de workflow e nomes de pacotes
  frequentemente excedem 80 caracteres sem possibilidade de quebra viavel
- **document-start:** O GitHub Actions nao exige `---` e a maioria dos templates da
  comunidade omite
- **truthy:** A sintaxe `on:` do GitHub Actions e valida e amplamente utilizada; nao ha
  risco de confusao com booleanos

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| **Pinar versao + config yamllint (escolhido)** | CI passa, boas praticas mantidas | Requer configuracao extra |
| **Ignorar warnings no hadolint-action** | Zero alteracao no Dockerfile | Workaround complexo (`failure-threshold`) |
| **Adicionar `---` e quebrar linhas nos workflows** | Segue regras 100% | Workflows ficam menos legiveis; URLs nao sao quebraveis |

## Consequencias

- **Positivo:** Hadolint passa sem warnings
- **Positivo:** Yamllint passa sem erros nem warnings
- **Positivo:** `.yamllint.yml` documenta as escolhas de configuracao para futuros
  desenvolvedores
- **Neutro:** A regra `line-length` foi desabilitada globalmente, o que pode deixar passar
  linhas excessivamente longas em YAMLs nao relacionados a workflow
