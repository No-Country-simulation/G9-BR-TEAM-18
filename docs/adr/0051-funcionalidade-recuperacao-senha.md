# ADR-0051: Funcionalidade de Recuperação de Senha (Forgot Password)

## Status

Pendente

## Contexto

Atualmente, o sistema não possui uma forma de o usuário redefinir sua senha caso a tenha esquecido. A única rota de alteração de senha disponível (`/auth/reset-password`) exige que o usuário já esteja autenticado e conheça sua senha atual.

Para melhorar a experiência do usuário e reduzir a necessidade de intervenção de administradores, é necessário implementar um fluxo seguro de recuperação de senha por e-mail.

Forças e restrições:

- **Segurança:** O sistema não deve revelar se um e-mail está cadastrado ou não na base de dados para evitar ataques de enumeração de contas.
- **Validade temporal:** O link de recuperação deve expirar após um tempo determinado (ex: 1 hora) para mitigar riscos de interceptação.
- **Infraestrutura:** É necessário configurar um serviço de envio de e-mails (SMTP) no backend.

## Decisão

A equipe decidiu por implementar um fluxo assíncrono de recuperação de senha baseado em tokens de uso único enviados por e-mail.

1. **Frontend:** A tela de login receberá um link "Esqueceu sua senha?". Este link levará a uma
   nova página solicitando o e-mail do usuário. Ao enviar, por razões de segurança, a aplicação
   sempre exibirá a mesma mensagem: *"Se este e-mail estiver cadastrado, você receberá uma
   mensagem com as instruções para redefinir sua senha"*, independentemente de o e-mail existir
   no banco.
2. **Backend:** O backend receberá a requisição, buscará o usuário e, se existir, gerará um token
   criptograficamente seguro com validade de 1 hora. Este token será salvo no banco de dados e
   enviado por e-mail com um link para o frontend.
3. **Resgate:** O usuário clicará no link do e-mail, abrindo uma página no frontend onde inserirá a
   nova senha. O backend validará o token, atualizará a senha, invalidará o token utilizado e
   retornará sucesso.

## Consequências

- **Positivo:** Aumenta a autonomia do usuário e melhora a experiência de uso.
- **Positivo:** Protege o sistema contra ataques de enumeração de e-mails.
- **Negativo:** Aumenta a complexidade da infraestrutura, exigindo configuração e manutenção de credenciais SMTP para envio de e-mails.
- **Neutro:** Será necessário criar novas tabelas no banco de dados (Flyway migration) para gerenciar os tokens de recuperação.

## O que precisa ser feito (Tasks)

**Backend:**

1. Criar migration Flyway para tabela `tb_password_reset_token` (token, user_id, expiry_date).
2. Adicionar dependência para envio de e-mail (ex: `spring-boot-starter-mail`) e configurar credenciais SMTP.
3. Criar endpoint público `POST /auth/forgot-password` (recebe e-mail, não retorna erro se o e-mail não existir).
4. Criar endpoint público `POST /auth/reset-password-external` (recebe token e nova senha).

**Frontend:**

1. Adicionar link "Esqueceu sua senha?" na tela `Login.tsx`.
2. Criar página `ForgotPassword.tsx` (solicita e-mail e exibe mensagem padrão de segurança aprovada na ADR).
3. Criar página `ResetPasswordExternal.tsx` (lê token da URL e solicita a nova senha).
