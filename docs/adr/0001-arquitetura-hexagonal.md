# ADR-0001: Adoção da arquitetura hexagonal (Ports and Adapters)

## Status

Aceito

## Contexto

O projeto iniciou como uma API Spring Boot monolítica sem separação clara entre regras de negócio e infraestrutura. As classes de domínio estavam misturadas com anotações JPA e Spring, dificultando a testabilidade e a manutenção. A equipe precisava de uma arquitetura que:

- Isolasse as regras de negócio de frameworks externos
- Permitisse testar o núcleo sem depender de banco de dados ou servidor web
- Facilita-se a substituição de componentes de infraestrutura (banco H2 para Oracle, HTTP client para Feign)
- Suportasse a integração com serviços externos (ML Service em Python, OCI)

## Decisão

A equipe decidiu adotar a **Arquitetura Hexagonal (Ports and Adapters)** como padrão arquitetural do backend, segmentando o código em três camadas:

1. **core** - Núcleo com código Java puro, sem anotações de framework
   - `domain/model`: Entidades de negócio ricas com invariantes e regras estruturais
   - `ports/in`: Interfaces que definem casos de uso (Driving Ports)
   - `ports/out`: Interfaces que definem contratos de infraestrutura (Driven Ports)

2. **application** - Orquestração de casos de uso
   - `services`: Implementa as portas de entrada, coordenando fluxo entre domínio e infraestrutura

3. **infrastructure** - Integração com tecnologias externas
   - `adapters/in/web`: Controllers REST e DTOs
   - `adapters/out/persistence`: Repositórios JPA, entidades e mappers
   - `adapters/out/client`: Cliente HTTP para o ML Service
   - `config`: Beans do Spring, CORS, handlers de exceção

A injeção de dependência é feita via `BeanConfiguration.java` na camada de infraestrutura, que ensina o Spring a instanciar as classes do core sem que o core dependa do Spring.

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| Arquitetura em camadas tradicional (Controller > Service > Repository) | Simples, conhecida pela equipe | Acoplamento forte a framework; dificuldade de testar regras sem subir o Spring; substituição de componentes requer mudanças em várias camadas |
| Clean Architecture (Robert C. Martin) | Maior rigor na separação de círculos | Curva de aprendizado alta; overengineering para o escopo do MVP; muitos círculos de dependência |
| Microsserviços | Escalabilidade independente por serviço | Complexidade operacional inviabilizada pelo prazo do hackathon; necessidade de orquestração e observabilidade |
| Hexagonal (Ports and Adapters) | Desacoplamento real; testabilidade; fácil substituição de adaptadores | Exige disciplina para manter as regras de dependência; mais arquivos de mapeamento |

## Consequências

- **Positivo:** As regras de negócio podem ser testadas sem Spring, banco ou servidor HTTP
- **Positivo:** A substituição do H2 por Oracle (OCI) impacta apenas a camada de infraestrutura
- **Positivo:** A integração com o ML Service em Python é feita por um adaptador específico sem contaminar o domínio
- **Negativo:** Aumento no número de arquivos devido a mappers e adaptadores (DTO, Entity, Domain, Mapper)
- **Negativo:** Necessidade de configuração explícita dos beans do core no `BeanConfiguration.java`
- **Neutro:** Membros da equipe precisaram aprender o padrão, mas a documentação gerada em `docs/arquitetura-hexagonal.md` reduz a curva

> **Nota:** Consulte a [estrutura de diretórios](../arquitetura.md) para a organização das camadas e o [glossário do projeto](../glossario.md) para definição dos termos técnicos.
