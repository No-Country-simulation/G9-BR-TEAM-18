# ADR-0017: Correções de Linting na Infraestrutura - Hadolint/Yamllint

## Status

Aceito

## Contexto

O CI `lint-infra` executa duas ferramentas:

1. **Hadolint** - linter para Dockerfiles (verifica boas práticas de construção de
   imagens)
2. **Yamllint** - linter para arquivos YAML

Duas violações foram identificadas:

### Hadolint DL3016 (frontend/Dockerfile)

O frontend/Dockerfile continha `npm install -g serve` sem pin de versão na linha 13.
O hadolint acusa a regra DL3016 (warning) que exige que versões de pacotes npm sejam
explicitamente definidas. O GitHub Action `hadolint/hadolint-action@v3.1.0` trata este
warning como falha.

### Yamllint (workflows .github/)

O yamllint com configuração `extends: default` acusava três categorias de violações em
todos os arquivos de workflow do GitHub Actions:

- **line-length:** URLs longas e comandos com muitos argumentos excediam o limite de 80
  caracteres
- **document-start:** Arquivos não começavam com `---` (YAML front matter)
- **truthy:** O uso de `on:` (trigger de workflow) era interpretado como valor truthy
  não-booleano

Estas violações são pré-existentes e inerentes ao formato dos workflows do GitHub Actions,
que utilizam URLs longas e a sintaxe `on:` para definição de triggers.

## Decisão

### Hadolint

A versão do pacote `serve` foi explicitada no Dockerfile:

```dockerfile
# Antes:
RUN npm install -g serve

# Depois:
RUN npm install -g serve@14.2
```

### Yamllint

Um arquivo de configuração `.yamllint.yml` foi adicionado na raiz do projeto com as
seguintes regras:

```yaml
extends: default

rules:
  line-length: disable
  document-start: disable
  truthy: disable
```

As três regras foram desabilitadas porque:

- **line-length:** URLs de imagens Docker, comandos de workflow e nomes de pacotes
  frequentemente excedem 80 caracteres sem possibilidade de quebra viável
- **document-start:** O GitHub Actions não exige `---` e a maioria dos templates da
  comunidade omite
- **truthy:** A sintaxe `on:` do GitHub Actions é válida e amplamente utilizada; não há
  risco de confusão com booleanos

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Pinar versão + config yamllint (escolhido)** | CI passa, boas práticas mantidas | Requer configuração extra |
| **Ignorar warnings no hadolint-action** | Zero alteração no Dockerfile | Workaround complexo (`failure-threshold`) |
| **Adicionar `---` e quebrar linhas nos workflows** | Segue regras 100% | Workflows ficam menos legíveis; URLs não são quebráveis |

## Consequências

- **Positivo:** Hadolint passa sem warnings
- **Positivo:** Yamllint passa sem erros nem warnings
- **Positivo:** `.yamllint.yml` documenta as escolhas de configuração para futuros
  desenvolvedores
- **Neutro:** A regra `line-length` foi desabilitada globalmente, o que pode deixar passar
  linhas excessivamente longas em YAMLs não relacionados a workflow
