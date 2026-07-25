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

## Modelos de domínio

Os modelos de domínio estão no pacote `core/domain/model/` e representam os conceitos centrais do negócio:

| Modelo | Função |
|---|---|
| `Property` | Imóvel do usuário: alias, tipo (residencial/comercial), endereço, número de moradores, área em m² |
| `PropertyAppliance` | Relacionamento N:N entre imóvel e aparelho, com quantidade |
| `Appliance` | Catálogo de aparelhos com potência média (W) e horas de uso diário |
| `EnergyAnalysis` | Resultado de uma análise energética: consumo, categoria, probabilidade, recomendações, origem (source), custo estimado |
| `ApplianceType` | Enum de tipos de aparelho (LAMPS, REFRIGERATOR, FAN, AIR_CONDITIONER, etc.) com vínculo à `EquipmentCategory` |
| `EquipmentCategory` | Enum de categorias de equipamento (LIGHTING, REFRIGERATION, CLIMATE_CONTROL, APPLIANCES, TECHNOLOGY) |
| `PropertyType` | Enum de tipos de imóvel válidos (RESIDENCIAL, COMERCIAL) |
| `MlResult` | Objeto de valor que encapsula o resultado do ML Service (category, probability, recommendations, source) |
| `EfficiencyCategory` | Value object que valida categorias de eficiência (EXCELENTE, BOM, MEDIANO, RUIM, CRITICO) |

## Serviços da aplicação

Os serviços no pacote `application/services/` orquestram as operações de negócio:

| Serviço | Responsabilidade |
|---|---|
| `EnergyAnalysisService` | Orquestra a análise energética: coleta dados do imóvel/aparelhos, envia ao ML Service, persiste resultado, expõe simulação |
| `AuthenticationService` | Gerencia registro, login (SHA-256 legado + BCrypt), redefinição de senha e blacklist de tokens |
| `PropertyService` | CRUD de imóveis, vincula/desvincula aparelhos ao imóvel, operação batch de aparelhos |
| `ApplianceAggregationService` | Agrega aparelhos do imóvel em distribuição de potência (refrigeration, heating, AC, lighting watts) para o ML Service |

## Anti-Corruption Layer (ACL)

A integração com o ML Service é isolada por uma camada anti-corrupção composta por:

| Componente | Função |
|---|---|
| `MlServiceClient` | Cliente HTTP que chama os endpoints `/predict` e `/predict/simulate` do ML Service |
| `MlEnvelope` | Container genérico (Map<String, Object>) que desacopla o formato do ML Service |
| `AnalysisMapper` | Traduz o envelope genérico em `MlResult` de domínio, com chaves configuráveis via properties |
| `MlSchemaDiscovery` | Descobre dinamicamente o schema e categorias válidas no startup do backend |
| `MlSchemaRegistry` | Registra e disponibiliza as categorias e schema descobertos |

> **Nota:** Consulte o [glossário do projeto](./glossario.md) para definição dos termos técnicos e o [registro de ADRs](./adr/) para decisões arquiteturais.
