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
    │   │       ├── controllers     # Endpoints REST (Auth, Analysis, Property, Appliance, ContractInfo)
    │   │       ├── dto             # Objetos de transferência (RequestDTO, ResponseDTO)
    │   │       └── security        # SessionUserResolver (usuário da sessão por request)
    │   │
    │   └── out                     # Adaptadores de saída (persistência)
    │       ├── persistence
    │       │   ├── entity          # Entidades JPA (@Entity, @Table)
    │       │   ├── repository      # Interfaces Spring Data JPA
    │       │   ├── adapter         # Implementa as portas "out"
    │       │   └── mapper          # Converte entidade JPA para domínio
    │
    ├── client                       # Anti-Corruption Layer do ML Service
    │   ├── MlServiceClient          # Cliente HTTP dos endpoints do ML
    │   ├── MlEnvelope               # Container genérico (Map<String, Object>)
    │   ├── MlPredictionAdapter      # Implementa a porta out de predição
    │   ├── AnalysisMapper           # Traduz o envelope em MlResult
    │   ├── MlSchemaDiscovery        # Descoberta do schema/contrato no startup
    │   ├── MlSchemaRegistry         # Registro das categorias/schema descobertos
    │   └── dto                      # DTOs de resposta do ML (contrato, catálogo)
    │
    └── config                       # Configurações
        ├── GlobalExceptionHandler   # @ControllerAdvice
        ├── JwtService/JwtAuthFilter # Geração e validação de tokens JWT
        ├── WebConfig                # CORS
        ├── OpenApiConfig            # Configuração do Swagger/OpenAPI
        ├── ApplicationBeansConfig   # Instancia as classes do core no Spring
        └── CatalogSyncScheduler     # Sincronização periódica do catálogo (ADR-0055)
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
| `Property` | Imóvel do usuário: alias, tipo (RESIDENCIAL/APARTAMENTO/COMERCIAL), endereço, número de moradores, área em m² |
| `PropertyAppliance` | Relacionamento N:N entre imóvel e aparelho, com quantidade |
| `Appliance` | Catálogo de aparelhos com potência média (W) e horas de uso diário |
| `ApplianceCatalogItem` | Item do catálogo sincronizado do ML Service (ml_category, watts, hours) |
| `ApplianceSnapshot` | Snapshot de equipamentos capturado no momento de uma análise |
| `EnergyAnalysis` | Resultado de uma análise energética: consumo, categoria, probabilidade, recomendações, origem (source), custo estimado |
| `EquipmentCategory` | Enum de categorias de equipamento (LIGHTING, REFRIGERATION, CLIMATE_CONTROL, APPLIANCES, TECHNOLOGY, SERVICES) |
| `PropertyType` | Enum de tipos de imóvel válidos (RESIDENCIAL, APARTAMENTO, COMERCIAL) |
| `User` | Usuário da aplicação, com preferências (consumption_goal, regularity, peak_hour_usage, high_consumption_hours) e provider de autenticação (LOCAL/GOOGLE) |
| `MlResult` | Objeto de valor que encapsula o resultado do ML Service (category, probability, recommendations, source) |
| `EfficiencyCategory` | Value object que valida categorias de eficiência (EXCELENTE, BOM, MEDIANO, RUIM, CRITICO) |
| `ApplianceNameNormalizer` | Utilitário de normalização de nomes de aparelhos (acentos/maiúsculas) |

## Serviços da aplicação

Os serviços no pacote `application/services/` orquestram as operações de negócio:

| Serviço | Responsabilidade |
|---|---|
| `EnergyAnalysisService` | Orquestra a análise energética: coleta dados do imóvel/aparelhos, envia ao ML Service, persiste resultado, expõe simulação |
| `AuthenticationService` | Gerencia registro, login (SHA-256 legado + BCrypt), redefinição de senha e blacklist de tokens |
| `GoogleAuthService` | Valida o ID Token do Google e cria/autentica o usuário (SSO, ADR-0052) |
| `PropertyService` | CRUD de imóveis, vincula/desvincula aparelhos ao imóvel, operação batch de aparelhos |
| `ApplianceAggregationService` | Agrega aparelhos do imóvel em distribuição de potência (refrigeration, heating, AC, lighting watts) para o ML Service |
| `ApplianceCatalogSyncService` | Sincroniza o catálogo de aparelhos com o ML Service (startup e agendado, ADR-0048/0055) |
| `DashboardService` | Calcula as métricas agregadas do dashboard (totais, médias, consumo mensal, CO2) |

## Anti-Corruption Layer (ACL)

A integração com o ML Service é isolada por uma camada anti-corrupção composta por:

| Componente | Função |
|---|---|
| `MlServiceClient` | Cliente HTTP que chama os endpoints `/predict`, `/predict/simulate`, `/contract` e `/appliance-catalog` do ML Service |
| `MlEnvelope` | Container genérico (Map<String, Object>) que desacopla o formato do ML Service |
| `MlPredictionAdapter` | Implementa a porta de saída `EnergyPredictionPort` usando o cliente HTTP |
| `AnalysisMapper` | Traduz o envelope genérico em `MlResult` de domínio, com chaves configuráveis via properties (`ML_OUTPUT_FIELD_*`) |
| `MlSchemaDiscovery` | Descobre dinamicamente o schema, categorias e catálogo no startup do backend |
| `MlSchemaRegistry` | Registra e disponibiliza as categorias e schema descobertos |

> **Nota:** Consulte o [glossário do projeto](./glossario.md) para definição dos termos técnicos e o [registro de ADRs](./adr/) para decisões arquiteturais.
