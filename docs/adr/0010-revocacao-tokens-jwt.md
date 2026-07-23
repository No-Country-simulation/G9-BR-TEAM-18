# ADR-0010: Revogação de Tokens JWT via Blacklist

## Status

Proposto

## Contexto

O sistema de autenticação atual utiliza JWT armazenado em cookie HttpOnly (`SESSION_TOKEN`), conforme documentado no ADR-0007. O fluxo de logout (`POST /auth/logout`) apenas apaga o cookie no lado do cliente - o token JWT permanece válido até sua expiração natural de 7 dias (`JWT_EXPIRATION_MS=604800000`).

Isso significa que:

- Um token capturado por um atacante (ex: vazamento de log, extensão maliciosa, MITM) continua funcionando mesmo após o usuário fazer logout
- Não há como invalidar tokens emitidos para um dispositivo perdido ou comprometido
- O sistema não atende ao princípio de "logout efetivo", onde o usuário espera que sua sessão seja imediatamente invalidada

Forças concorrentes na decisão:

- **Segurança:** O token precisa ser invalidado no logout para prevenir reuso
- **Performance:** Cada requisição precisa continuar sendo rápida - consultas adicionais ao banco devem ser mínimas
- **Simplicidade:** A solução deve se encaixar na arquitetura atual sem adicionar dependências externas (Redis, Spring Session, etc.)
- **Custo:** Evitar armazenamento externo (Redis) que aumentaria a complexidade operacional

## Decisão

A equipe decidiu implementar uma **blacklist de tokens JWT armazenada no Oracle** (tabela `tb_token_blacklist`), gerenciada pelo Flyway (migration V3).

**Modelo de dados:**

```sql
CREATE TABLE tb_token_blacklist (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    token_hash VARCHAR2(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_tbl_expires_at ON tb_token_blacklist(expires_at);
```

**Fluxo de logout:**

1. `POST /auth/logout` extrai o token JWT do cookie `SESSION_TOKEN`
2. Calcula o hash SHA-256 do token (hex, 64 caracteres)
3. Extrai a data de expiração do próprio JWT
4. Insere `(token_hash, expires_at)` na `tb_token_blacklist`
5. Apaga o cookie (comportamento já existente)

**Validação em cada requisição (`JwtAuthFilter`):**

1. Extrai o token do cookie
2. Calcula o hash SHA-256
3. Verifica se o hash existe na `tb_token_blacklist` com `expires_at > NOW()`
4. Se existir na blacklist: ignora o token (não atribui userId)
5. Se não existir: prossegue com a validação JWT normal (assinatura + expiração)

**Limpeza programada:**

Um método `@Scheduled(cron = "0 0 */6 * * *")` no `TokenBlacklistCleanupService` deleta registros com `expires_at < NOW()` a cada 6 horas (job agendado do Spring), mantendo a tabela enxuta.

**Camadas (Ports & Adapters):**

- `core/ports/out/TokenBlacklistRepositoryPort.java` - interface do domínio
- `infrastructure/adapters/out/persistence/entity/TokenBlacklistEntity.java` - entidade JPA
- `infrastructure/adapters/out/persistence/repository/TokenBlacklistJpaRepository.java` - interface Spring Data
- `infrastructure/adapters/out/persistence/adapter/TokenBlacklistRepositoryAdapter.java` - implementação do port
- `infrastructure/config/TokenBlacklistCleanupService.java` - job de limpeza
- `infrastructure/config/JwtService.java` - método `hashToken()` adicionado
- `infrastructure/config/JwtAuthFilter.java` - verificação da blacklist adicionada
- `infrastructure/adapters/in/web/controllers/AuthController.java` - inserção na blacklist no logout

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Token Blacklist (tabela no Oracle)** | Revogação granular por token; sem dependências externas; padrão de mercado | Consulta extra ao DB por request; tabela requer cleanup periódico |
| **Token Version (coluna `token_version` no `tb_user`)** | Sem tabela extra; sem cleanup necessário | Invalida TODAS as sessões do usuário simultaneamente (não permite multi-sessão); conflito com usuários que usam múltiplos dispositivos |
| **Short-lived JWT (15min) + Refresh Token** | Janela de exposição menor; rotação de tokens | Complexidade maior de implementação; refresh token também precisaria de revogação; maior tráfego de rede |
| **Redis para blacklist** | Consulta O(1) em memória; TTL automático | Dependência externa adicional; aumenta custo operacional; não disponível no ambiente atual |
| **Manter estado atual (sem revogação)** | Nenhum esforço de implementação | Token válido 7 dias após logout - falha de segurança |

## Consequências

- **Positivo:** Logout efetivamente invalida o token - o usuário pode confiar que sua sessão foi encerrada
- **Positivo:** Compatível com o fluxo JWT existente (cookie HttpOnly, `SameSite=Lax`)
- **Positivo:** Não requer novas dependências (usando apenas Oracle + Flyway + Spring Schedule)
- **Positivo:** Permite múltiplas sessões por usuário (cada token é invalidado individualmente)
- **Negativo:** Cada requisição autenticada agora faz uma consulta `SELECT` adicional à `tb_token_blacklist`
- **Negativo:** Tabela cresce com tokens expirados até o cleanup agendado rodar (a cada 6h)
- **Negativo:** O hash SHA-256 do token precisa ser computado em toda requisição (custo desprezível comparado à consulta ao banco)
- **Neutro:** O job de cleanup usa `@Scheduled` do Spring, que é bloqueante na mesma JVM - em cenário de múltiplas instâncias, cada uma executaria o cleanup redundante (aceitável para o MVP)
