# Arquitetura do projeto

Estrutura de diretórios e responsabilidades de cada camada da aplicação EnergiIA, organizada segundo o padrão Ports and Adapters.

## Estrutura de diretórios

```text
br.com.group18.energiai
│
├── core                            # O coração (zero Spring, zero Oracle)
│   ├── domain
│   │   ├── model                   # Objetos de negócio puros (EnergyAnalysis, User, ApplianceItem)
│   │   └── exceptions              # Exceções de regra de negócio
│   │
│   └── ports                       # Interfaces (portas)
│       ├── in                      # Casos de uso da aplicação (ex: GenerateAnalysisUseCase)
│       └── out                     # Contratos de infraestrutura que o domínio necessita
│
├── application                     # Orquestração
│   └── services                    # Implementa as portas "in" com a lógica de orquestração
│
└── infrastructure                  # Mundo externo (depende do Spring)
    ├── adapters
    │   ├── in                      # Adaptadores de entrada (controllers REST, DTOs)
    │   │   └── web
    │   │       ├── controllers     # Endpoints REST (ex: AnalysisController)
    │   │       ├── dto             # Objetos de transferência (RequestDTO, ResponseDTO)
    │   │       └── mapper          # Converte DTO para domínio
    │   │
    │   └── out                     # Adaptadores de saída (persistência, clientes HTTP)
    │       ├── persistence
    │       │   ├── entity          # Entidades JPA (@Entity, @Table)
    │       │   ├── repository      # Interfaces Spring Data JPA
    │       │   ├── adapter         # Implementa as portas "out"
    │       │   └── mapper          # Converte entidade JPA para domínio
    │       │
    │       └── client
    │           ├── python          # Integração HTTP (WebClient ou RestTemplate)
    │           └── adapter         # Implementa o cliente HTTP para a API Python
    │
    └── config                      # Configurações
        ├── exception               # GlobalExceptionHandler (@ControllerAdvice)
        ├── security                # CORS, BCrypt, filtros
        └── BeanConfiguration.java  # Instancia as classes do core no Spring
```

## Descrição das camadas

### Core

Núcleo da aplicação com código Java padrão. Nenhuma anotação de framework é permitida nesta camada.

| Pacote | Responsabilidade |
|---|---|
| `domain/model` | Entidades de negócio ricas com atributos, regras e invariantes |
| `domain/exceptions` | Exceções específicas de domínio, sem dependência HTTP ou banco |
| `ports/in` | Interfaces que definem casos de uso expostos pela aplicação |
| `ports/out` | Interfaces que definem contratos de infraestrutura necessários ao domínio |

### Application

Camada de orquestração que implementa os casos de uso. Instancia a execução, busca dados nas portas de saída, delega regras às entidades de domínio e persiste o resultado.

### Infrastructure

Camada mais externa que integra o núcleo com tecnologias e frameworks.

| Componente | Responsabilidade |
|---|---|
| `adapters/in/web` | Traduz requisições HTTP em chamadas ao núcleo |
| `adapters/out/persistence` | Persistência com JPA e Spring Data |
| `adapters/out/client` | Comunicação HTTP com serviços externos (API Python) |
| `config` | Beans, CORS, handlers globais de exceção |

> **Nota:** Consulte o [glossário do projeto](./glossario.md) para definição dos termos técnicos e o [registro de ADRs](./adr/) para decisões arquiteturais.
