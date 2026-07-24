# ADR-0012: Password Reset Obrigatório com Validação de Senha Atual

## Status

Aceito

## Contexto

A migração de SHA-256 para BCrypt (ADR-0010, card B022) torna as senhas existentes ilegíveis — hashes SHA-256 não podem ser convertidos para BCrypt pois o algoritmo é one-way e o salt é diferente por natureza. Todos os usuários precisam redefinir a senha para que ela seja armazenada com BCrypt.

Além disso, o endpoint de reset precisa de proteção adicional: sem validação da senha atual, um atacante que obteve acesso ao cookie JWT (via session hijacking, XSS, etc.) poderia trocar a senha sem conhecer a original. A exigência da senha atual funciona como segunda prova de identidade — o atacante precisaria do JWT E da senha para completar o reset.

Forças concorrentes:

- **Segurança:** O reset não pode ser feito apenas com posse do JWT — a senha atual deve ser exigida como prova adicional
- **UX:** Usuários precisam lembrar a senha atual uma última vez antes de trocá-la
- **Compatibilidade reversa:** Hashes SHA-256 legados continuam funcionando para login até o reset
- **Cobertura:** Todos os usuários existentes devem passar pelo fluxo de reset exatamente uma vez

## Decisão

A equipe decidiu implementar um fluxo de **forced password reset** que exige a senha atual como validação, com os seguintes componentes:

### Banco de Dados (Migration V5)

```sql
ALTER TABLE tb_user ADD password_reset_required NUMBER(1) DEFAULT 0;
UPDATE tb_user SET password_reset_required = 1;
```

Todos os registros existentes recebem a flag como `1`. Novos usuários nascem com `0`.

### Backend

**Modelo de domínio (`User`):**
- Adicionado campo `passwordResetRequired` (boolean)

**Login (`POST /auth/login`):**
- O `LoginResponseDTO` agora inclui `passwordResetRequired` no JSON de resposta
- O frontend redireciona para `/reset-password` se a flag for `true`

**Endpoint de reset (`POST /auth/reset-password`):**
- Requer autenticação via JWT (cookie `SESSION_TOKEN`)
- Recebe `{ currentPassword, newPassword }`
- Verifica `currentPassword` contra o hash armazenado (BCrypt ou SHA-256 legado)
- Se inválido → HTTP 403 Forbidden
- Se válido → hash BCrypt da `newPassword`, salva, limpa flag, gera novo JWT

**Hybrid auth:**
- `AuthenticationService.login()` tenta BCrypt primeiro; se o hash não for BCrypt (não começa com `$2`), usa verify SHA-256 legado
- `AuthenticationService.resetPassword()` segue a mesma lógica híbrida para verificar a senha atual

### Frontend

**`PrivateRoute.tsx`:**
- Redireciona para `/reset-password` se `user.passwordResetRequired === true` (exceto se já estiver na rota de reset)

**`ResetPasswordPage.tsx`:**
- Formulário com 3 campos: senha atual, nova senha, confirmar nova senha
- Validações: nova senha >= 6 caracteres, confirmação deve bater
- Submete para `POST /auth/reset-password`
- Redireciona para `/` após sucesso

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Reset sem senha atual** | UX simples; 1 campo a menos | Vulnerável a session hijacking — atacante com cookie JWT troca a senha |
| **Reset com senha atual (escolhido)** | Atacante precisa da senha mesmo com JWT roubado | UX levemente mais longa (1 campo extra) |
| **Token de reset por e-mail** | Segurança máxima; não depende de JWT | Requer infra de e-mail (SMTP, template); fora do escopo MVP |
| **Obrigar nova conta** | Implementação trivial; sem dívida técnica | Perde dados existentes (propriedades, análises); péssima UX |

## Consequências

- **Positivo:** Migração segura de SHA-256 para BCrypt sem perder usuários existentes
- **Positivo:** Dupla validação (JWT + senha atual) no endpoint de reset
- **Positivo:** Usuários novos já nascem com BCrypt + flag `false` — não passam pelo fluxo
- **Positivo:** Route guard no frontend impede acesso a qualquer rota protegida (exceto /reset-password) enquanto a flag estiver ativa
- **Negativo:** Usuários existentes precisam lembrar a senha atual uma última vez
- **Negativo:** Se o usuário esquecer a senha, não consegue fazer reset sozinho (não há "esqueci minha senha" — fora do escopo MVP)
- **Neutro:** Migration V5 adiciona coluna e seta flag para todos os registros existentes
