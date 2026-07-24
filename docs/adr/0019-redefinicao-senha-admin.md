# ADR-0019: Redefinição de Senha por Administrador

## Status

Aceito

## Contexto

A decisão de adotar um fluxo de **forced password reset** (ADR-0012, card
B023) exige que o usuário conheça a sua senha atual para definir uma nova.
No entanto, se o usuário esquecer a senha atual ou se o administrador
precisar forçar o reset de um usuário específico diretamente (por exemplo,
após uma alteração administrativa no banco de dados ou perda de
credenciais), não havia um canal seguro para redefinir a senha sem requerer
a senha atual.

Adicionalmente, logs de suporte e depuração no filtro de autenticação e no serviço de autenticação eram necessários de forma temporária para monitorar logins e o fluxo de reset de senhas.

## Decisão

Decidimos introduzir um endpoint administrativo de reset de senha e logs estruturados no backend:

### 1. Novo DTO e Endpoint Administrativo

- Criação de `AdminResetPasswordRequestDTO` contendo apenas `@NotBlank` e `@Size(min = 6, max = 255)` no campo `newPassword`.
- Adicionado endpoint `POST /auth/admin/reset-password/{userId}` no `AuthController` que recebe o ID do usuário alvo e a nova senha.
- O endpoint invoca `AuthenticationService.adminResetPassword()`, que gera o hash BCrypt para a nova senha, define a flag `passwordResetRequired` como `false` e persiste as alterações.
- O endpoint administrativo gera e anexa um novo cookie de sessão (`SESSION_TOKEN`) para o usuário afetado.

### 2. Logs Temporários de Auditoria e Diagnóstico

- **JwtAuthFilter**: Log estruturado de nível `debug` rastreando a URI requisitada, a presença ou ausência de token de sessão e o `userId` associado.
- **AuthenticationService**: Log estruturado de nível `info` registrando o tipo de hash utilizado (BCrypt ou SHA-256 legado) e a validade da senha atual submetida.

### 3. Testes de Integração

- Adicionados testes em `AuthControllerIntegrationTest.java` para validar:
  - O sucesso do reset pelo administrador (`shouldAdminResetPassword`).
  - O bloqueio de logins com a senha antiga após o reset administrativo.
  - A resposta correta `404 Not Found` caso o `userId` não exista no sistema.

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Reset administrativo via endpoint dedicado (escolhido)** | Controle e segurança ao contornar a validação da senha antiga; facilidade de auditoria e suporte | Requer permissões de administrador (no futuro, controle RBAC mais estrito) |
| **Envio de e-mail de recuperação automático** | Auto-serviço pelo próprio usuário | Complexidade de infraestrutura de e-mail fora do escopo MVP |
| **Remover validação de senha antiga no reset geral** | Implementação mais simples | Grave vulnerabilidade de segurança (CSRF/Session hijacking) |

## Consequências

- **Positivo:** Mecanismo seguro de recuperação de contas por administradores sem expor ou exigir a senha anterior.
- **Positivo:** Melhor rastreabilidade e facilidade de depuração com logs temporários bem localizados.
- **Positivo:** Garantia de funcionamento atestada por testes automatizados de integração.
