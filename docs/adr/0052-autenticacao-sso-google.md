# ADR-0052: Autenticação via Google (SSO)

## Status

Aceito

## Contexto

Atualmente, o projeto utiliza apenas autenticação local nativa (e-mail e senha) gerenciada
através de tokens JWT próprios em cookies HttpOnly. Para reduzir a fricção de entrada de novos
usuários e facilitar o login recorrente, surgiu a demanda de implementar autenticação via
provedores de identidade externos (Single Sign-On), iniciando pelo Google.

Forças e restrições:

- **Usabilidade:** Usuários preferem "Login com 1 clique" em vez de preencher formulários ou digitar senha.
- **Segurança:** O sistema existente baseia sua sessão em cookies HttpOnly. A integração com o Google precisa terminar devolvendo esse mesmo cookie para manter a compatibilidade com o resto do sistema.
- **Base de dados:** É exigido que usuários cadastrados via Google recebam valores padrão para preferências (peak hours, metas).

## Decisão

Implementar autenticação com o Google utilizando o fluxo de **ID Token (Google Identity
Services / Sign In with Google)** em vez do fluxo OAuth2 Authorization Code com redirect.

### Fluxo implementado (Task B057)

1. **Frontend:** As telas de Login e Cadastro exibem o botão "Entrar com Google" do pacote
   `@react-oauth/google` (`GoogleOAuthProvider` + `GoogleLogin`). O Google devolve um
   `credential` (ID Token JWT) diretamente ao navegador.
2. **Frontend → Backend:** O frontend envia o ID Token para `POST /auth/google`
   (`GoogleAuthRequestDTO.credential`).
3. **Backend:** O `GoogleAuthService` valida o ID Token com o `GoogleIdTokenVerifier`
   (bibliotecas `google-api-client`), usando o Client ID configurado como audience.
4. **Mapeamento de Usuário:** O e-mail e nome extraídos do payload são enviados ao
   `AuthenticationService.loginWithGoogle(email, name)`. Se o e-mail já existir, faz login na
   conta existente; caso contrário, cria uma nova conta com `auth_provider = GOOGLE`.
5. **Sessão:** O backend gera o mesmo cookie `SESSION_TOKEN` (JWT nativo) usado no login
   normal, mantendo a compatibilidade com o resto do sistema.

### Variáveis de ambiente

| Variável | Onde | Descrição |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Backend (`${google.client.id}` no `GoogleAuthService`) | Client ID usado como audience na validação do ID Token. Sem ela o backend **não inicia** (fail-fast). |
| `VITE_GOOGLE_CLIENT_ID` | Frontend (`main.tsx`, build arg do Docker) | Client ID usado pelo `GoogleOAuthProvider`. Deve ser o **mesmo valor** de `GOOGLE_CLIENT_ID`. Se ausente, usa fallback `mock-client-id.apps.googleusercontent.com`. |

> **Importante:** O ADR original descrevia o fluxo com `spring-boot-starter-oauth2-client` e
> redirect para `/oauth2/authorization/google`. Essa abordagem **não foi implementada**. O
> fluxo real é o de ID Token descrito acima, sem redirect server-side e sem
> `GOOGLE_CLIENT_SECRET`.

### Como obter um Client ID real

1. Acessar <https://console.cloud.google.com/> e criar/selecionar um projeto.
2. Configurar a tela de consentimento OAuth (APIs e serviços → Tela de consentimento OAuth).
3. Em Credenciais → Criar credenciais → ID do cliente OAuth, escolher "Aplicativo da web".
4. Adicionar as origens de JavaScript autorizadas (`http://localhost:5173` e a URL do frontend
   em produção).
5. Copiar o Client ID e configurar `GOOGLE_CLIENT_ID` (backend) e `VITE_GOOGLE_CLIENT_ID`
   (frontend) com o mesmo valor.

### Comportamento com Client ID mock (desenvolvimento local)

Para desenvolvimento local é aceitável usar `GOOGLE_CLIENT_ID=mock-client-id.apps.googleusercontent.com`
apenas para o backend iniciar e o restante da aplicação funcionar (login e-mail/senha,
catálogo, análises). O botão "Entrar com Google" falhará se clicado até que um Client ID real
seja configurado.

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **ID Token via @react-oauth/google (escolhido)** | Sem redirect server-side; frontend recebe o token diretamente; integração simples com o fluxo de cookie existente | Botão depende do JS do Google carregar; fluxo menos flexível para outros provedores |
| **OAuth2 Authorization Code com spring-boot-starter-oauth2-client** | Fluxo server-side tradicional; suporta refresh tokens | Redirect e estado de sessão adicionais; mais configuração no Spring Security; não foi o caminho adotado |
| **Manter apenas login e-mail/senha** | Zero dependência externa | Não reduz fricção de cadastro |

## Consequências

- **Positivo:** Login com Google em 1 clique nas telas de Login e Cadastro.
- **Positivo:** O fluxo mantém a segurança atual do sistema baseada em cookies HttpOnly, sem expor tokens ao JavaScript.
- **Positivo:** Usuários criados via Google recebem preferências padrão (via `loginWithGoogle`).
- **Negativo:** Usuários criados via Google não têm senha nativa para usar caso a API do Google caia (endereçável futuramente via ADR-0051).
- **Negativo:** O backend não inicia sem `GOOGLE_CLIENT_ID` configurado (fail-fast), exigindo documentação clara da variável (ver .env.example).
- **Neutro:** Necessidade de criar credenciais na Google Cloud Console e manter o mesmo Client ID no backend e no frontend.

## Configuração de Credenciais Google OAuth

### Fluxo utilizado

- A aplicação utiliza o fluxo **ID Token (implícito)**: o frontend obtém o token do Google e o backend o valida.

### Variáveis de ambiente necessárias

| Variável | Onde é usada | Tipo |
|----------|-------------|------|
| `GOOGLE_CLIENT_ID` | Backend (`application.properties` → `GoogleAuthService`) | Runtime |
| `VITE_GOOGLE_CLIENT_ID` | Frontend (`main.tsx` → `GoogleOAuthProvider`) | Build-time |

### Arquivos de configuração alterados

- `backend/src/main/resources/application.properties`: Adicionada a propriedade `google.client.id=${GOOGLE_CLIENT_ID}`
- `.env.example`: Documentadas ambas as variáveis na seção obrigatória
- `docker-compose.yml`: Adicionados `GOOGLE_CLIENT_ID` (backend env) e `VITE_GOOGLE_CLIENT_ID` (frontend build arg)

### Google Cloud Console

- **Projeto:** Criado no Google Cloud Console
- **Status:** Publicado (qualquer conta Google pode fazer login)
- **Origens JavaScript autorizadas:**
  - `https://energiaia.duckdns.org` (produção atual)
  - `https://energiai-frontend.onrender.com` (legado)
  - `https://energiai-backend.onrender.com` (legado)
  - `http://localhost:5173`
- **URIs de redirecionamento autorizados:**
  - `https://energiaia.duckdns.org` (produção atual)
  - `https://energiai-frontend.onrender.com` (legado)
  - `https://energiai-backend.onrender.com` (legado)
  - `http://localhost:5173`

---

## Deploy no Render

Para que o Google SSO funcione no ambiente de produção, é necessário configurar as seguintes variáveis de ambiente **manualmente** no painel do Render:

| Serviço | Variável | Tipo |
|---------|----------|------|
| **Backend** | `GOOGLE_CLIENT_ID` | Environment Variable |
| **Frontend** | `VITE_GOOGLE_CLIENT_ID` | Build Arg / Env Var |

> Após adicionarmos `VITE_GOOGLE_CLIENT_ID` no Frontend do Render, é necessário fazer um **re-deploy manual**.

---

## ☁️ Migração para OCI (Oracle Cloud Infrastructure)

Quando o projeto migrar do Render para a OCI, os seguintes passos devem ser seguidos:

- **Variáveis de ambiente no OCI:**
  - Configurar `GOOGLE_CLIENT_ID` e `VITE_GOOGLE_CLIENT_ID` no serviço de deploy utilizado (OCI Container Instances, OKE, ou VM)

- **Google Cloud Console: Atualizar URLs autorizadas**:
  - Editar o Client ID OAuth existente
  - **Adicionar** os novos domínios OCI em *Origens JavaScript autorizadas* e *URIs de redirecionamento autorizados*

- **CORS no backend:**
  - Atualizar a variável `CORS_ALLOWED_ORIGINS` para incluir o novo domínio do frontend na OCI

> O Client ID **não muda** na migração. Apenas as URLs autorizadas no Google Cloud Console precisam ser atualizadas para refletir os novos domínios.

---

## Notas de Segurança

- O `GOOGLE_CLIENT_ID` é considerado uma credencial pública (exposta no HTML do frontend), mas **deve ser protegido por domínios autorizados** no Google Cloud Console para evitar uso indevido.
- Toda validação de integridade do token é feita no backend via `GoogleIdTokenVerifier`, que verifica a assinatura criptográfica e a audience do token contra o Client ID configurado.
