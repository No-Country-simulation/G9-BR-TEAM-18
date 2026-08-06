# ADR-0052: Autenticação via Google (SSO)

## Status

Pendente

## Contexto

Atualmente, o projeto utiliza apenas autenticação local nativa (e-mail e senha) gerenciada através de tokens JWT próprios em cookies HttpOnly. Para reduzir a fricção de entrada de novos usuários e facilitar o login recorrente, surgiu a demanda de implementar autenticação via provedores de identidade externos (Single Sign-On), iniciando pelo Google.

Forças e restrições:
- **Usabilidade:** Usuários preferem "Login com 1 clique" em vez de preencher formulários ou digitar senha.
- **Segurança:** O sistema existente baseia sua sessão em cookies HttpOnly. A integração com o Google precisa terminar devolvendo esse mesmo cookie para manter a compatibilidade com o resto do sistema.
- **Base de dados:** Atualmente é exigido que o usuário defina preferências (peak hours, metas). Precisamos garantir que usuários cadastrados via Google recebam valores padrão.

## Decisão

Implementar autenticação com o Google utilizando OAuth2/OpenID Connect. 

1. **Frontend:** Serão adicionados botões de "Entrar com Google" nas telas de Login e Cadastro. Ao clicar, o frontend redirecionará o usuário para o endpoint de autorização do backend.
2. **Backend:** O backend será configurado como um cliente OAuth2 (usando `spring-boot-starter-oauth2-client`). Ele gerenciará o redirecionamento para o Google, o recebimento do código de autorização e a troca pelos dados do perfil (e-mail, nome).
3. **Mapeamento de Usuário:** Se o e-mail recebido do Google já existir, o backend fará login na conta existente. Se não existir, o backend criará uma nova conta (sem senha ou com senha gerada aleatória), configurando preferências padrão.
4. **Sessão:** Ao final do fluxo, o backend gerará o mesmo cookie `SESSION_TOKEN` (JWT nativo) usado no login normal e redirecionará o usuário de volta ao Dashboard do frontend.

## Consequências

- **Positivo:** Aumento previsto na taxa de conversão de cadastros por reduzir a fricção (menos campos para preencher).
- **Positivo:** O fluxo mantém a segurança atual do sistema baseada em cookies HttpOnly, sem expor tokens ao JavaScript.
- **Negativo:** Usuários criados via Google não terão uma senha nativa para usar caso a API do Google caia. (Para contornar isso, futuramente eles poderão usar a funcionalidade da ADR-0051).
- **Neutro:** Necessidade de criar e configurar credenciais na Google Cloud Console e definir as URIs de redirecionamento para dev e prod.

## O que precisa ser feito (Tasks)

**Backend:**
1. Adicionar dependência `spring-boot-starter-oauth2-client`.
2. Adicionar variáveis de ambiente (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) no `application.properties`.
3. Configurar o Spring Security para aceitar OAuth2 Login, implementando um `AuthenticationSuccessHandler` que crie/busque o usuário pelo e-mail e gere o cookie JWT de sessão, seguido de um HTTP 302 Redirect para o frontend (Dashboard).
4. (Opcional) Ajustar o banco para permitir usuários sem senha nativa (`password_hash` anulável) se a política exigir, ou gerar senhas aleatórias grandes.

**Frontend:**
1. Adicionar botão "Continuar com Google" estilizado na tela de `Login.tsx` e `Register.tsx`.
2. Configurar o redirecionamento do botão apontando diretamente para a rota do backend (ex: `http://localhost:8080/oauth2/authorization/google`).
3. O fluxo de callback será tratado totalmente pelo backend, o frontend apenas precisa estar preparado para carregar o estado do usuário ao cair no Dashboard.

