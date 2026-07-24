# ADR-0018: Normalização e Validação Semântica do Tipo de Imóvel

## Status

Aceito

## Contexto

Anteriormente, o tipo de imóvel (`property_type`) era tratado como uma
string livre no banco de dados (`VARCHAR2(50)`). No entanto, o frontend e
os fluxos de análise energética dependem de valores específicos e
normalizados (`RESIDENCIAL` e `COMERCIAL`) para garantir a consistência das
predições do modelo de Machine Learning.

A falta de validação estrita no backend permitia que valores arbitrários
(como "Casa") fossem persistidos, quebrando a integração posterior com o
ML Service. A constraint de validação `chk_property_type` já havia sido
adicionada no banco de dados na migration V3, porém o backend ainda não
validava os dados na entrada da requisição, gerando erros de integridade
(SQL constraints) em runtime.

## Decisão

Decidimos implementar uma validação e normalização estrita de `property_type` de ponta a ponta:

### 1. Frontend

- Criação e centralização do array `PROPERTY_TYPES = ["RESIDENCIAL", "COMERCIAL"] as const` e do tipo `PropertyType` em `types/index.ts`.
- Atualização do `AnalysisForm.tsx` e `ProfilePage.tsx` para importar os tipos centralizados e utilizar `"RESIDENCIAL"` como valor padrão.

### 2. Backend

- Introdução do enum `TipoImovel` (`RESIDENCIAL`, `COMERCIAL`) na camada do core.
- Atualização do DTO `PropertyRequestDTO` para receber `TipoImovel` diretamente, garantindo que o parser do Jackson valide a entrada.
- Adicionado tratamento global em `GlobalExceptionHandler` para a exceção `HttpMessageNotReadableException`, retornando o código de erro `400 Bad Request` com mensagem customizada e clara caso o valor enviado seja inválido.
- Conversão explícita de `TipoImovel.name()` no `PropertyController` ao chamar os serviços de criação e atualização de propriedades.

### 3. Banco de Dados (Migration V6 Oracle)

- Criação da migration `V6__normalize_property_type.sql` para normalizar registros legados com caixa mista ou minúscula para maiúsculas antes de qualquer validação.

### 4. Testes de Integração

- Adicionados testes em `PropertyControllerIntegrationTest.java` para garantir que o tipo `"Casa"` retorne `400 Bad Request` e tipos válidos em caixa alta retornem `201 Created`.

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Validação semântica no DTO com Enum (escolhido)** | Previne a inserção de lixo direto na borda da API; validação automática pelo framework | Retorna erro genérico no Jackson (corrigido com handler global) |
| **Validação por regex/string no DTO** | Flexibilidade na mensagem de erro | Duplicidade de regras e risco de dessincronização |
| **Normalização silenciosa no service (ex: .toUpperCase())** | Tolerante a erros do cliente | Oculta erros de formatação do cliente e pode gerar falso positivo |

## Consequências

- **Positivo:** Consistência absoluta entre os tipos aceitos no frontend, backend e persistência (Oracle).
- **Positivo:** Mensagens de erro de validação claras para o usuário.
- **Positivo:** Proteção ativa das constraints do banco de dados na borda da API.
- **Negativo:** Clientes legados enviando tipos em formato antigo ("Casa") serão rejeitados na API.
