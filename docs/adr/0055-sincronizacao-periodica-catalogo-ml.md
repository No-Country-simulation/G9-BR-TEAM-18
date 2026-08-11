# ADR-0055: Sincronização Periódica do Catálogo com o ML Service (B058)

## Status

Aceito

## Contexto

A ADR-0048 implementou a sincronização do catálogo de aparelhos do ML Service com o banco de
dados, mas apenas **no startup** da aplicação (`@EventListener(ApplicationReadyEvent.class)`).
Esse modelo apresentou um problema prático: quando o ML Service é atualizado (ex.: Q010 expandiu
o catálogo de 11 para 29 aparelhos) **enquanto o backend já está em execução**, os novos
aparelhos nunca são gravados no banco, pois `GET /appliances` lê do banco (não do registry em
memória).

Além disso, o retry em background do Schema Discovery (`MlSchemaDiscovery.startBackgroundRetry`)
atualizava apenas o registry em memória — nunca o banco. No Render (plano gratuito), o ML
Service hiberna fora do horário 14h–0h; se o backend subir nesse período, o fallback carregava
apenas **4 aparelhos** (Geladeira, Ar-condicionado, Lâmpada, Televisão), deixando o catálogo
incompleto mesmo após a reconexão do ML.

Por fim, o ML Service envia nomes de aparelhos **sem acentuação** ("Fogao", "Chuveiro
eletrico"), gerando inconsistência visual com a grafia em português usada no banco e exibida ao
usuário.

## Decisão

A equipe decidiu tornar a sincronização do catálogo **periódica e resiliente**, com três
mudanças no backend:

### 1. Re-sincronização na reconexão em background

O `MlSchemaDiscovery` passou a receber o `ApplianceCatalogSyncService` como dependência. Após
uma reconexão bem-sucedida em background (retry a cada 30s), além de atualizar o registry em
memória, o serviço também chama `syncCatalog()` para re-sincronizar o banco imediatamente:

```java
registry.register(response.getT1(), response.getT2());
catalogSyncService.syncCatalog();
```

Isso garante que, quando o ML Service voltar a ficar disponível, os novos aparelhos cheguem ao
banco (e ao `GET /appliances`) sem exigir restart manual do backend.

### 2. Sincronização periódica agendada

Novo componente `CatalogSyncScheduler` (no padrão do `TokenBlacklistCleanupService`) executa
`syncCatalog()` a cada 6 horas:

```java
@Scheduled(cron = "0 0 */6 * * *")
public void syncCatalogPeriodically() {
    catalogSyncService.syncCatalog();
}
```

O `@EnableScheduling` já está ativo na aplicação. A periodicidade cobre atualizações do ML que
ocorram enquanto o backend está no ar, independentemente da reconexão em background.

### 3. Fallback ampliado e nomes localizados

- O fallback do `MlSchemaRegistry` (`loadDefaultValues()`) passou a conter o catálogo completo
  (29 itens) em vez de apenas 4, reduzindo o impacto quando o ML está indisponível no startup.
- O `ApplianceCatalogSyncService` ganhou um mapa `PT_BR_NAMES` que corrige a acentuação dos
  nomes vindos do ML ("Fogao" → "Fogão", "Chuveiro eletrico" → "Chuveiro Elétrico",
  "Bomba d'agua" → "Bomba d'Água", etc.) ao criar novos aparelhos.

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Sync periódico + reconexão (escolhido)** | Catálogo sempre atualizado sem restart; cobre ML indisponível no boot | Consumo leve de recursos a cada 6h (upsert idempotente) |
| **Manter apenas sync no startup** | Simples (estado anterior) | Novos aparelhos do ML só chegam após restart manual; problema relatado pela equipe |
| **Servir catálogo direto do registry em memória** | Sem necessidade de sync no banco | Perde o `id` persistido (necessário para o batch update, ADR-0048) |

## Consequências

- **Positivo:** Novos aparelhos do ML Service chegam ao frontend sem restart manual do backend.
- **Positivo:** Reconexão em background agora sincroniza o banco automaticamente.
- **Positivo:** Fallback mais completo (29 itens) quando o ML está fora no boot.
- **Positivo:** Nomes exibidos ao usuário mantêm a grafia em português correta.
- **Negativo:** Pequeno overhead periódico (6h) e na reconexão para o upsert idempotente.
- **Neutro:** `MlSchemaDiscovery` agora depende do `ApplianceCatalogSyncService` (sem ciclo, o
  sync lê do registry, que é atualizado antes).

## O que mudou

- `MlSchemaDiscovery`: nova dependência `ApplianceCatalogSyncService` e chamada de
  `syncCatalog()` no callback de reconexão.
- `CatalogSyncScheduler` (novo): `@Scheduled` a cada 6h.
- `MlSchemaRegistry`: fallback ampliado para 29 aparelhos.
- `ApplianceCatalogSyncService`: mapa `PT_BR_NAMES` para acentuação correta.
- Testes: `CatalogSyncSchedulerTest` (novo) e casos de normalização de nomes em
  `ApplianceCatalogSyncServiceTest`; `MlSchemaDiscoveryTest` ajustado para a nova dependência.
