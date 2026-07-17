# Dependências do projeto

Documentação das bibliotecas configuradas no arquivo `pom.xml` da API, com explicação do propósito de cada dependência e como ela se encaixa na arquitetura hexagonal.

## Gerenciamento de segurança

Bloco utilizado para forçar o Maven a baixar versões específicas e seguras de bibliotecas transitivas, corrigindo alertas de vulnerabilidades (CVEs).

| Dependência | Versão | Propósito |
|---|---|---|
| `commons-io` | 2.18.0 | Biblioteca utilitária para operações de entrada e saída de arquivos |
| `bcprov-jdk18on` | 1.80 | Provedor de criptografia Bouncy Castle |
| `commons-fileupload` | 1.5 | Biblioteca para manipulação de upload de arquivos |

## Núcleo do Spring Boot (starters)

Dependências principais que habilitam os recursos do framework Spring.

| Dependência | Propósito |
|---|---|
| `spring-boot-starter-web` | Criação de APIs RESTful com servidor Apache Tomcat embutido |
| `spring-boot-starter-data-jpa` | Mapeamento objeto-relacional (ORM) com Hibernate |
| `spring-boot-starter-validation` | Validação de dados de entrada com Bean Validation (`@NotNull`, `@Min`, `@Email`) |

## Banco de dados e versionamento

Ferramentas responsáveis pela persistência e evolução do esquema de dados.

| Dependência | Propósito |
|---|---|
| `h2` | Banco de dados H2 em memória para ambiente de desenvolvimento |
| `spring-boot-h2console` | Console web do H2 (obrigatório a partir do Spring Boot 4.x) |

## Utilitários e produtividade

Bibliotecas que reduzem a escrita de código repetitivo (boilerplate).

| Dependência | Versão | Propósito |
|---|---|---|
| `lombok` | - | Geração automática de getters, setters, construtores e builders via anotações |
| `mapstruct` | 1.5.5.Final | Mapeamento automático entre DTOs, entidades de domínio e entidades JPA |

## Integração e documentação

Ferramentas para comunicação com o mundo externo (frontend e IA).

| Dependência | Versão | Propósito |
|---|---|---|
| `springdoc-openapi-starter-webmvc-ui` | 3.0.3 | Geração automática de documentação interativa (Swagger UI) |
| `spring-boot-starter-webflux` | - | Cliente HTTP reativo para comunicação com a API Python de predição |

## Escopo de testes

Bibliotecas restritas ao ambiente de testes, utilizadas para garantir a qualidade do código.

| Dependência | Propósito |
|---|---|
| `spring-boot-starter-test` | Ferramentas e configurações para testes unitários e de integração |
| `spring-boot-starter-webmvc-test` | Testes da camada web (controllers) sem subir o servidor completo |
| `spring-boot-test-autoconfigure` | Auto-configuração para testes do Spring Boot |

> **Nota:** Consulte a [documentação de arquitetura hexagonal](./arquitetura-hexagonal.md) para entender como essas dependências se encaixam na separação de camadas, e o [glossário do projeto](./glossario.md) para definição dos termos técnicos.
