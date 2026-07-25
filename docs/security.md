# Segurança e Autenticação

Documentação dos mecanismos de autenticação, autorização, gerenciamento de sessão e proteção de endpoints.

## Índice

- [Fluxo de Autenticação](#fluxo-de-autenticação)
- [Armazenamento de Senhas](#armazenamento-de-senhas)
- [JWT (JSON Web Token)](#jwt-json-web-token)
- [Sessão via Cookie](#sessão-via-cookie)
- [Blacklist de Tokens](#blacklist-de-tokens)
- [Redefinição de Senha pelo Admin](#redefinição-de-senha-pelo-admin)
- [Proteção de Endpoints](#proteção-de-endpoints)
- [CORS](#cors)

---

## Fluxo de Autenticação

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant B as Backend
    participant ML as ML Service
    
    U->>F: Preenche login
    F->>B: POST /auth/login {email, password}
    B->>B: Valida BCrypt
    B->>B: Gera JWT (7 dias)
    B->>F: Set-Cookie: SESSION_TOKEN=JWT
    F->>F: Armazena user em localStorage
    F->>B: GET /auth/me (cookie incluso)
    B->>B: Valida JWT no filtro
    B->>F: 200 OK {user data}
```

## Armazenamento de Senhas

O sistema suporta dois algoritmos de hash para senhas:

| Algoritmo | Quando usado |
|---|---|
| **BCrypt** (Spring Security Crypto) | Todos os novos registros e redefinições de senha |
| **SHA-256 legado** | Apenas para migração de usuários existentes |

No login, o sistema tenta BCrypt primeiro. Se falhar, tenta SHA-256 legado. Se o SHA-256 funcionar, a senha é atualizada para BCrypt automaticamente.

## JWT (JSON Web Token)

### Configuração

| Parâmetro | Valor |
|---|---|
| Algoritmo | HMAC-SHA384 (`Jwts.SIG.HS384`) |
| Secret | Configurado via `JWT_SECRET` (mín. 32 caracteres) |
| Expiração | 7 dias (configurável via `JWT_EXPIRATION_MS`) |

### Payload

```json
{
  "sub": "user_id",
  "iat": 1700000000,
  "exp": 1700604800
}
```

### Geração

Realizada pelo `JwtService.java` na classe `infrastructure/config/`.

### Validação

O filtro `JwtAuthFilter.java` intercepta todas as requisições (exceto `/auth/**`, `/energy-analysis/categories`, `/appliances`, `/actuator/health`) e:

1. Extrai o token do cookie `SESSION_TOKEN`
2. Valida a assinatura HMAC-SHA384
3. Verifica se o token não está na blacklist
4. Extrai o `userId` do `subject`
5. Adiciona o `userId` ao atributo da requisição

## Sessão via Cookie

| Propriedade | Valor |
|---|---|
| Nome | `SESSION_TOKEN` |
| Path | `/` |
| HttpOnly | Sim (não acessível via JavaScript) |
| Secure | Configurável via `SESSION_SECURE` (true em produção) |
| SameSite | `Lax` |
| Max-Age | 7 dias (configurável via `SESSION_MAX_AGE_SECONDS`) |

O cookie é definido no login/registro e limpo no logout.

## Blacklist de Tokens

Quando o usuário faz logout, o token JWT atual é adicionado à tabela `TB_TOKEN_BLACKLIST` com a data de expiração original. A limpeza de tokens expirados é feita automaticamente a cada hora pelo `TokenBlacklistCleanupService`.

## Redefinição de Senha pelo Admin

O endpoint `POST /auth/admin/reset-password` permite que um administrador force a redefinição de senha de qualquer usuário:

```json
// Request
{ "userId": 5, "newPassword": "NovaSenha123!" }

// Response 200
{ "message": "Senha redefinida com sucesso." }
```

Após a redefinição, o flag `password_reset_required` é marcado como `true`. O usuário, ao fazer login, é redirecionado para `/reset-password` para definir uma nova senha.

## Proteção de Endpoints

| Critério | Endpoints afetados |
|---|---|
| Autenticado (qualquer usuário) | `/properties/**`, `/energy-analysis/**`, `/dashboard`, `/analyses/**` |
| Admin | `/auth/admin/**` |
| Público | `/auth/**`, `/energy-analysis/categories`, `/appliances`, `/actuator/health` |

## CORS

Configurado via `CORS_ALLOWED_ORIGINS` (padrão: `*`). Em produção, deve ser restrito à origem do frontend.

---

> **Nota:** Consulte o [guia de execução](./guia-execucao.md) para configuração das variáveis de ambiente de segurança.
