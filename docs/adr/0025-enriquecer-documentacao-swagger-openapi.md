# ADR-0025: Enriquecimento da Documentação Swagger/OpenAPI da API

## Status

Aceito

## Contexto

A API do EnergIAI utilizava `springdoc-openapi-starter-webmvc-ui` (v3.0.3) para gerar
automaticamente a documentação OpenAPI/Swagger, mas **nenhuma configuração ou anotação
de documentação havia sido adicionada**. A interface Swagger UI exibia apenas endpoints
genéricos sem descrições, sem exemplos de requisição/resposta, sem esquemas de segurança
e sem detalhamento de códigos de erro.

Esse cenário gerava três problemas principais:

1. **Dificuldade de integração:** Novos membros da equipe e consumidores externos da API
   precisavam ler o código-fonte ou a documentação estática (`contrato-api.md`) para
   entender o funcionamento dos endpoints, reduzindo a produtividade.

2. **Falta de contexto sobre autenticação:** A API utiliza autenticação por cookie de
   sessão JWT (`SESSION_TOKEN`), mas o Swagger UI não documentava esse mecanismo.
   Desenvolvedores não sabiam como testar endpoints protegidos pela interface interativa.

3. **Ausência de exemplos e erros:** Os modelos de requisição e resposta não possuíam
   exemplos, descrições de campos, ou documentação dos possíveis códigos de erro HTTP
   (400, 401, 403, 404, 409, 503) retornados pelo `GlobalExceptionHandler`.

## Decisão

A equipe decidiu enriquecer a documentação OpenAPI/Swagger em três frentes complementares:

### 1. Bean de Configuração OpenAPI (`OpenApiConfig.java`)

Criado um `@Configuration` com um bean `OpenAPI` contendo:

- **Informações da API:** título ("EnergIAI API"), descrição detalhada com visão geral
  do sistema e formato de erros, versão (1.0.0), contato da equipe e licença MIT.
- **Servidores:** Endpoint de desenvolvimento (`http://localhost:8080`).
- **Esquema de segurança:** Esquema `apiKey` no cookie `SESSION_TOKEN`, permitindo que
  o Swagger UI exiba o cadeado de autenticação nos endpoints protegidos.
- **Tags:** Quatro grupos organizadores (Autenticação, Propriedades, Eletrodomésticos e
  Análise Energética) com descrições em português.

### 2. Anotações nos Controllers

Adicionadas em todos os 4 controllers da API:

| Controller | Endpoints | Anotações |
|---|---|---|
| `AuthController` | 6 endpoints | `@Tag`, `@Operation`, `@ApiResponses`, `@SecurityRequirement` |
| `PropertyController` | 9 endpoints | `@Tag`, `@Operation`, `@ApiResponses`, `@SecurityRequirement` |
| `ApplianceController` | 1 endpoint | `@Tag`, `@Operation`, `@ApiResponse` |
| `AnalysisController` | 6 endpoints | `@Tag`, `@Operation`, `@ApiResponses`, `@SecurityRequirement` |

Cada endpoint recebeu:

- `@Operation` com `summary` e `description` detalhando o propósito e comportamento
- `@ApiResponse(s)` documentando os possíveis códigos de retorno (201, 200, 204, 400,
  401, 403, 404, 409, 503)
- `@SecurityRequirement(name = "sessionCookie")` nos endpoints que exigem autenticação

### 3. Anotações `@Schema` nos DTOs

Todos os 11 DTOs de requisição e resposta receberam `@Schema` com:

- `description` explicando o propósito do campo
- `example` com valores realistas em português
- `minLength`/`maxLength`/`minimum`/`maximum` quando aplicável
- `allowableValues` para campos do tipo enumerado

DTOs documentados: `LoginRequestDTO`, `LoginResponseDTO`, `RegisterRequestDTO`,
`PropertyRequestDTO`, `PropertyResponseDTO`, `AnalysisRequestDTO`,
`AnalysisResponseDTO`, `ApplianceResponseDTO`, `PropertyApplianceRequestDTO`,
`PropertyApplianceResponseDTO`, `ResetPasswordRequestDTO`,
`AdminResetPasswordRequestDTO`.

### 4. Configuração do Swagger UI

Adicionadas ao `application.properties`:

```properties
springdoc.api-docs.path=/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.swagger-ui.tryItOutEnabled=true
springdoc.swagger-ui.displayRequestDuration=true
springdoc.swagger-ui.defaultModelsExpandDepth=3
springdoc.swagger-ui.docExpansion=list
springdoc.swagger-ui.tagsSorter=alpha
```

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **SpringDoc + anotações nos controllers/DTOs (escolhido)** | Documentação gerada automaticamente a partir do código; sempre sincronizada; suporte a Try It Out | Requer manutenção das anotações junto com o código |
| **Documentação estática manual (contrato-api.md)** | Independência total do framework | Facilmente dessincronizada; sem interface interativa |
| **Swagger annotations do Swagger 2.x** | Mesma funcionalidade | Dependência legada; springdoc é o padrão moderno para Spring Boot 3 |
| **OpenAPI spec YAML/JSON manual** | Controle total sobre a spec | Duplicação de esforço; facilmente dessincronizada |

## Consequências

- **Positivo:** A interface Swagger UI agora exibe descrições detalhadas de todos os
  endpoints, com exemplos de requisição e resposta, melhorando significativamente a
  experiência de integração.
- **Positivo:** Desenvolvedores podem testar endpoints protegidos diretamente pelo
  Swagger UI, autenticando-se via `POST /auth/register` ou `POST /auth/login` e
  obtendo o cookie `SESSION_TOKEN`.
- **Positivo:** A documentação está sempre sincronizada com o código, pois as
  anotações fazem parte do código-fonte.
- **Positivo:** Configuração do Swagger UI otimizada para usabilidade
  (`tryItOutEnabled`, `displayRequestDuration`, `docExpansion=list`).
- **Negativo:** Necessidade de manter as anotações atualizadas conforme novos
  endpoints e DTOs são adicionados.
- **Negativo:** Adição de imports e anotações aumenta ligeiramente o tamanho do
  código-fonte dos controllers e DTOs.
