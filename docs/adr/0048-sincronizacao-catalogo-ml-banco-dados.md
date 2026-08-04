# ADR-0048: Sincronização do Catálogo ML com o Banco de Dados (B052)

## Status

Aceito

**Nota:** O erro de violação de constraint (ORA-02290: check constraint (ADMIN.CHK_APPLIANCE_CATEGORY)) relatado no deploy de 01/08/2026 foi resolvido (via sub-issue B053). O ApplianceCatalogSyncService agora mapeia o mlCategory do ML (em inglês) para o português utilizando o método EquipmentCategory.toPortuguese() antes de salvar no banco de dados, respeitando a estruturação da migration V12. O contrato da API (GET /appliances) continua convertendo e retornando a categoria em inglês, mantendo o alinhamento total com a ADR-0027.

## Contexto

O frontend consome `GET /appliances` como única fonte do catálogo de eletrodomésticos (ADR-0047). No entanto, o fluxo de salvar aparelhos no perfil (batch update) exige um `appliance_id` real válido no banco de dados (`tb_appliance`).

Como o catálogo vinha diretamente do ML Service (em memória), ele não possuía o campo `id`. O frontend tentava usar um fallback (slugify), o que quebrava o fluxo resultando em `ResourceNotFoundException`.

## Decisão

Implementar a sincronização (Upsert) do catálogo do ML Service com o banco de dados da aplicação sempre que o sistema é iniciado, e expor o ID real no endpoint.

## Detalhes da Implementação

- **ApplianceCatalogSyncService:** Um listener rodando no startup (`@EventListener(ApplicationReadyEvent.class)`) que lê o catálogo em memória.

- **Upsert Idempotente:** O serviço compara os itens do ML com a tabela `tb_appliance`. Se o aparelho não existir, é inserido; se existir, os valores de potência e horas são atualizados.

- **Normalização de Nomes:** Implementada a classe utilitária `ApplianceNameNormalizer` (NFD + lowercase + trim) para o match entre o ML e o banco, evitando duplicação (ex: "Lâmpada" vs "lampada led").

- **Endpoint Refatorado:** `GET /appliances` passou a buscar os dados diretamente do `ApplianceRepositoryPort` (banco de dados), mapeando para o `ApplianceResponseDTO` enriquecido com o campo `id`.

- **Ajuste de Contrato (Batch Update):** Adicionado o mapeamento `@JsonProperty("appliance_id")` no DTO `ApplianceQuantity` para suportar o `snake_case` enviado pelo frontend.

- **Mapeamento de Categoria e Fallback (Bugfix B053):** Durante a persistência, as categorias (`mlCategory`) em inglês são convertidas para o português utilizando o enum `EquipmentCategory`. Categorias desconhecidas pelo sistema recebem um tratamento de fallback seguro, impedindo falhas (crashes) na inicialização da aplicação.

## Alternativas consideradas

- **Servir catálogo direto do banco (sem sync):** Perderia a descoberta dinâmica do ML Service. Rejeitada.

- **Match por nome request a request:** Deixaria os itens novos do ML sem ID, além de onerar a performance. Rejeitada.

## Consequências

- **Positivo:** Fluxo de salvar aparelhos no frontend totalmente destravado (resolve bloqueio da ADR-0047).

- **Positivo:** Descoberta dinâmica do ML Service mantida e agora com persistência física, garantindo integridade referencial.

- **Positivo:** Mapeamento correto de `snake_case` para `camelCase` estabelecido para o batch update.

- **Positivo:** Inicialização de aplicação segura, tolerante a categorias desconhecidas vindas de integrações externas.

- **Negativo:** Requer sincronização e conversão de dados (`BigDecimal` para tipos primitivos, traduções de Enum) no startup, adicionando uma leve complexidade na inicialização da aplicação.

## O que mudou:

- O Status passou de "Aceito (com correção pendente)" para "Aceito".

- A Nota agora informa que o problema foi devidamente resolvido, explicando a solução do bug.

- Adicionamos o item 6 na seção de Detalhes da Implementação e um novo ponto Positivo nas Consequências documentando a robustez criada pelo seu fallback!