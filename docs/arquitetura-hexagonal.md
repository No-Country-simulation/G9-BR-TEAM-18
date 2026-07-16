# Documentação de Arquitetura: Hexagonal (Ports and Adapters) - EnergiAI

## 1. Visão Geral
O projeto EnergiAI adota a **Arquitetura Hexagonal**, baseada no padrão Ports and Adapters. O objetivo central desta arquitetura é garantir o **desacoplamento absoluto** entre as regras de negócio (domínio) e as dependências tecnológicas externas (frameworks, banco de dados, interfaces de usuário e APIs externas).

Esse isolamento é alcançado através do princípio da **Inversão de Dependência**: todas as dependências sistêmicas apontam para o centro da aplicação. A camada de domínio não possui referências a bibliotecas de infraestrutura, garantindo alta testabilidade e facilidade de manutenção.

## 2. Estrutura de Diretórios e Responsabilidades
A arquitetura está segmentada em três camadas principais: `core`, `application` e `infrastructure`.

### 2.1. Camada `core`
Representa o núcleo da aplicação. Contém estritamente código Java padrão. Nenhuma anotação de framework (como Spring Web ou JPA) é permitida nesta camada.

*   **domain/model**: Contém as entidades de domínio ricas. Estas classes encapsulam os atributos, as regras de negócio estruturais e a validação de invariantes. Devem garantir o seu próprio estado consistente no momento da instanciação.
*   **domain/exceptions**: Contém as exceções específicas do domínio de negócio, utilizadas para sinalizar violações de regras sistêmicas sem depender de classes de erro HTTP ou de banco de dados.
*   **ports/in**: Portas de Entrada (Driving Ports). São interfaces que definem os casos de uso expostos pela aplicação. Representam os contratos das operações que o sistema é capaz de executar.
*   **ports/out**: Portas de Saída (Driven Ports). São interfaces que definem os contratos de infraestrutura que o domínio necessita para operar (ex.: persistência de dados, requisições a APIs externas). O domínio define a assinatura do contrato, mas ignora completamente a sua implementação.

### 2.2. Camada `application`
Atua como a camada de orquestração de casos de uso e fluxo de controle.

*   **services**: Contém as classes que implementam as interfaces definidas em `ports/in`. A responsabilidade desta camada é instanciar a execução dos casos de uso, recuperar dados das portas de saída, delegar a execução da regra de negócio às entidades de domínio (model) e solicitar a persistência ou envio do novo estado processado.

### 2.3. Camada `infrastructure`
É a camada mais externa, responsável por integrar o núcleo da aplicação com tecnologias, frameworks e protocolos de comunicação (I/O).

*   **adapters/in/web**: Adaptadores Primários (Driving Adapters). Traduzem estímulos externos (requisições) em chamadas para o núcleo do sistema.
    *   **controllers**: Endpoints REST que interceptam as requisições HTTP, executam a validação sintática e delegam a execução lógica para a camada `application/services`.
    *   **dto**: Data Transfer Objects. Classes utilizadas para padronizar os contratos de entrada e saída (payloads JSON).
    *   **mapper**: Utilitários de conversão bidirecional entre DTOs e entidades de domínio.
*   **adapters/out**: Adaptadores Secundários (Driven Adapters). Implementam obrigatoriamente as interfaces definidas em `ports/out`.
    *   **persistence**: Responsável pela integração com o banco de dados Oracle.
        *   **entity**: Classes de persistência mapeadas com anotações JPA (`@Entity`, `@Table`).
        *   **repository**: Interfaces que herdam abstrações do ecossistema Spring Data (ex.: `JpaRepository`).
        *   **adapter**: Classes que injetam o repository e implementam a porta de saída de persistência, orquestrando a conversão entre o domínio puro e as entidades JPA.
    *   **client/python**: Responsável pela comunicação HTTP com o modelo preditivo de IA. Contém as interfaces de integração via Spring Cloud OpenFeign.
*   **config**: Diretório destinado às parametrizações da infraestrutura.
    *   Handlers globais de exceção (`@ControllerAdvice` para mapear erros de domínio em status HTTP coerentes).
    *   Configurações de injeção de dependência (registro de Beans do core) e parametrizações sistêmicas (CORS, transações, etc.).

## 3. Diretrizes Práticas de Desenvolvimento
*   **Restrição de Dependência**: O fluxo de controle nas portas de saída sofre inversão. A camada `infrastructure` importa as definições do `core`. O `core` jamais importa pacotes de `infrastructure`.
*   **Isolamento Tecnológico**: Modificações estruturais no banco de dados, atualizações de versão do framework ou alterações de contrato na API em Python devem impactar única e exclusivamente a camada `infrastructure`.
*   **Separação de Validações**:
    *   Validações sintáticas (tipagem, campos nulos, formatações de string) devem ocorrer na camada web (utilizando Bean Validation nos DTOs).
    *   Validações semânticas e lógicas de negócio estrutural (cálculos restritos, estados lógicos permitidos) são de responsabilidade exclusiva das classes em `domain/model`.
