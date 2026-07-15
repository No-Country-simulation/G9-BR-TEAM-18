# Documentação de Dependências - Projeto EnergiAI

Este documento detalha as dependências configuradas no arquivo `pom.xml` da nossa API, explicando o propósito de cada biblioteca e como ela se encaixa na Arquitetura Hexagonal e nos requisitos do hackathon.

## 1. Gerenciamento de Segurança (Dependency Management)
Bloco utilizado para forçar o Maven a baixar versões específicas e seguras de bibliotecas transitivas, corrigindo alertas de vulnerabilidades (CVEs) apontados por ferramentas de análise estática.

* **`commons-io` (v2.18.0):** Biblioteca utilitária para operações de entrada e saída de arquivos.
* **`bcprov-jdk18on` (v1.80):** Provedor de criptografia Bouncy Castle.
* **`commons-fileupload` (v1.5):** Biblioteca para manipulação de upload de arquivos.

## 2. O Núcleo do Spring Boot (Starters)
Estas são as dependências principais que habilitam os recursos do framework Spring.

* **`spring-boot-starter-webmvc`:** Habilita a criação de APIs RESTful. Embutido com o servidor Apache Tomcat, é responsável por expor nossos endpoints (Controllers) e lidar com requisições HTTP (GET, POST, etc).
* **`spring-boot-starter-data-jpa`:** Fornece as ferramentas de mapeamento objeto-relacional (ORM) usando o Hibernate. Facilita a comunicação com o banco de dados através de interfaces de repositório, permitindo salvar e buscar dados sem escrever SQL manualmente para operações básicas.
* **`spring-boot-starter-validation`:** Habilita a validação de dados de entrada na API (Bean Validation). Permite utilizar anotações como `@NotNull`, `@Min` e `@Email` nos nossos DTOs para garantir que requisições malformadas sejam bloqueadas antes de chegarem à regra de negócio.

## 3. Banco de Dados e Versionamento
Ferramentas responsáveis pela persistência e evolução do esquema de dados.

* **`ojdbc11` (Oracle JDBC Driver):** O driver oficial da Oracle. É a ponte de comunicação que permite que o código Java se conecte e envie comandos para o nosso Oracle Database hospedado na OCI.
* **`flyway-core` & `flyway-database-oracle`:** Ferramentas de versionamento de banco de dados (Migrations). O Flyway garante que as tabelas e colunas sejam criadas automaticamente no banco de dados a partir de scripts de maneira controlada, mantendo o banco de todos os desenvolvedores sincronizado.

## 4. Utilitários e Produtividade
Bibliotecas que reduzem a escrita de código repetitivo (boilerplate) e aceleram o desenvolvimento.

* **`lombok`:** Atua em tempo de compilação para gerar automaticamente métodos como `getters`, `setters`, `constructors` e `builders` através de anotações (ex: `@Data`, `@AllArgsConstructor`). Deixa as classes mais limpas.
* **`mapstruct` (v1.5.5.Final):** Gerador de código para mapeamento entre objetos. Na nossa Arquitetura Hexagonal, ele automatiza a conversão de DTOs para Entidades de Domínio e de Entidades de Domínio para Entidades JPA, evitando que tenhamos que escrever essas conversões linha por linha.

## 5. Integração e Documentação
Ferramentas para comunicação com o mundo externo (Front-end e IA).

* **`springdoc-openapi-starter-webmvc-ui` (v2.5.0):** Gera automaticamente a documentação interativa da nossa API (Swagger UI). Permite que a equipe de Front-end visualize e teste os endpoints disponíveis diretamente pelo navegador.
* **`spring-cloud-starter-openfeign` (v4.1.2):** Cliente HTTP declarativo. Facilita a comunicação do nosso Back-end em Java com a API da Inteligência Artificial em Python. Basta criar uma interface com a rota do Python, e o Feign gerencia a requisição e a serialização do JSON por baixo dos panos.

## 6. Escopo de Testes (`scope: test`)
Bibliotecas restritas ao ambiente de testes, utilizadas para garantir a qualidade do código (não vão para produção).

* **`spring-boot-starter-data-jpa-test`:** Fornece ferramentas e configurações para testar repositórios e a camada de persistência.
* **`spring-boot-starter-validation-test`:** Facilita a criação de testes focados nas validações de entrada de dados.
* **`spring-boot-starter-webmvc-test`:** Permite testar a camada web (Controllers) de forma isolada, simulando requisições HTTP sem precisar subir o servidor completo.