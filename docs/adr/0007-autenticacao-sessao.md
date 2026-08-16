# ADR-0007: Autenticação com sessão HTTP e hash SHA-256

## Status

Aceito

## Contexto

O projeto precisava de um sistema de autenticação para proteger os endpoints de análise energética e permitir que usuários registrassem e consultassem seu histórico. As restrições eram:

- Simplicidade de implementação para o prazo do hackathon
- Sem dependência de serviços externos de autenticação (Auth0, Firebase, OAuth)
- Compatibilidade com o frontend React sem necessidade de gerenciamento complexo de tokens
- Segurança mínima aceitável para um MVP (senhas não armazenadas em texto puro)
- Estado de sessão acessível entre requisições do mesmo usuário

## Decisão

A equipe decidiu implementar **autenticação baseada em sessão HTTP** com **hash de senha SHA-256 + salt**, sem uso de JWT ou BCrypt.

**Modelo de dados:**

Foi criada a entidade `User` com os campos:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | Long | Identificador único, gerado automaticamente |
| `name` | String | Nome do usuário |
| `email` | String | E-mail único (com validação de duplicidade) |
| `passwordHash` | String | Hash SHA-256 + salt de 16 bytes, codificado em Base64 |

**Fluxo de registro:**

1. O usuário envia `name`, `email` e `password` para `POST /auth/register`
2. O sistema verifica se o e-mail já está cadastrado
3. Gera um salt aleatório de 16 bytes (`SecureRandom`)
4. Concatena salt + senha e aplica SHA-256
5. Armazena salt + hash codificado em Base64
6. Retorna os dados do usuário (sem a senha)

**Fluxo de login:**

1. O usuário envia `email` e `password` para `POST /auth/login`
2. O sistema busca o usuário pelo e-mail
3. Decodifica o salt armazenado, recalcula o hash com a senha fornecida
4. Compara os hashes usando `MessageDigest.isEqual()` (protegido contra timing attack)
5. Se válido, cria uma sessão HTTP e retorna os dados do usuário
6. Se inválido, retorna 401

**Gerenciamento de sessão:**

- Utiliza o mecanismo de sessão padrão do Spring Boot (Jakarta Servlet)
- A sessão é armazenada no servidor (em memória para desenvolvimento, configurável para Redis em produção)
- O ID da sessão é enviado ao frontend via cookie HTTP (`JSESSIONID`)
- O endpoint `GET /auth/me` retorna o usuário logado com base na sessão atual
- O logout remove a sessão (`@Autowired HttpSession`)

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| JWT (JSON Web Token) | Stateless; escalável; não requer armazenamento no servidor | Complexidade de renovação; invalidação difícil; maior superfície de ataque se a chave vazar |
| BCrypt para hash de senha | Algoritmo lento por design, resistente a brute force | Dependência adicional; configuração extra de `BCryptPasswordEncoder` no Spring |
| OAuth2 / SSO (Google, GitHub) | Segurança robusta; sem gerenciamento de senhas | Dependência externa; fluxo de autorização complexo para MVP; necessidade de credenciais OAuth |
| SHA-256 + salt + sessão HTTP | Simples; sem dependências externas; sessão invalidável no servidor | SHA-256 é rápido (vulnerável a GPU brute force se o salt vazar); sessão em memória não escala horizontalmente |

## Consequências

- **Positivo:** Implementação rápida com zero dependências externas de autenticação
- **Positivo:** Sessão HTTP permite controle centralizado de invalidação (logout, timeout)
- **Positivo:** Uso de `SecureRandom` para geração de salt e `MessageDigest.isEqual()` para comparação protegida contra timing attack
- **Negativo:** SHA-256 é computacionalmente rápido, tornando hashes mais vulneráveis a ataques de força bruta em caso de vazamento do banco de dados (BCrypt seria mais seguro)
- **Negativo:** Sessão em memória não escala horizontalmente - múltiplas instâncias do backend exigiriam Redis ou sticky sessions
- **Negativo:** Cookies de sessão HTTP requerem configuração de CORS e SameSite para funcionar com frontend em porta diferente
- **Neutro:** A decisão de não usar JWT significa que o backend mantém estado de sessão, o que é aceitável para o escopo MVP

---

## Atualização (31/07/2026): Exposição do token JWT no corpo da resposta

### Contexto

Após a migração da autenticação para **JWT em cookie `SESSION_TOKEN`** (ver ADR-0010 e
ADR-0025), o token JWT era devolvido apenas no header `Set-Cookie` da resposta. Isso
dificultava a automação de testes fora do navegador (curl, Postman, scripts de
integração), pois o consumidor precisava capturar o valor do cookie manualmente para
reutilizá-lo nas requisições seguintes. Ao mesmo tempo, a equipe queria manter o cookie
como mecanismo primário de autenticação no navegador (sem quebrar o frontend).

Forças concorrentes na decisão:

- **Testabilidade:** Facilitar o consumo da API fora do navegador, expondo o token de
  forma acessível na resposta de login/registro
- **Segurança:** Não ampliar desnecessariamente a superfície de exposição do token
- **Compatibilidade:** Não quebrar o fluxo existente do frontend (que usa o cookie)

### Decisão

A equipe decidiu incluir o campo `token` no corpo da resposta de `POST /auth/register`
e `POST /auth/login`, contendo o mesmo JWT enviado no cookie `SESSION_TOKEN`. O cookie
permanece como mecanismo primário de autenticação; o campo no corpo é uma conveniência
para testes e integrações externas.

**Detalhamento técnico:**

- `LoginResponseDTO` ganhou o campo `token` (String), com anotação `@Schema` para o
  Swagger e `@JsonInclude(Include.NON_NULL)` para omiti-lo quando não houver sessão nova
- `AuthController.createSession()` passou a **retornar** o token JWT (além de definir o
  cookie), e `toResponse(user, token)` o inclui no corpo
- Os endpoints `GET /auth/me` e `PUT /auth/preferences` (que **não** criam sessão nova)
  usam um overload `toResponse(user)` que delega para `toResponse(user, null)`. Com o
  `NON_NULL`, o campo `token` é omitido nessas respostas
- A autenticação continua exclusivamente via cookie: o `JwtAuthFilter` lê apenas o
  header `Cookie: SESSION_TOKEN` (o header `Authorization: Bearer` não é suportado)
- O teste de integração `AuthControllerIntegrationTest` passou a validar a presença do
  campo `token` na resposta de registro

### Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Manter token somente no cookie** | Menor exposição do token; sem mudanças no contrato | Dificulta testes fora do navegador; automação depende de capturar o header `Set-Cookie` |
| **Expor token no corpo (escolhido)** | Testes e integrações externas simples (curl/Postman); contrato autodescritivo | Token trafega também no JSON; superfície de exposição ligeiramente maior |
| **Suportar header `Authorization: Bearer`** | Padrão comum em APIs REST | Exigiria alterar o `JwtAuthFilter`; duplicaria o mecanismo de autenticação sem ganho claro para o MVP |

### Consequências

- **Positivo:** Testes fora do navegador (curl, Postman, scripts) agora obtêm o token
  diretamente no corpo da resposta, sem depender do cookie
- **Positivo:** O frontend continua inalterado e usa exclusivamente o cookie
  `SESSION_TOKEN` via `credentials: "include"`
- **Positivo:** O campo é omitido (`NON_NULL`) nas respostas que não criam sessão,
  mantendo o contrato limpo
- **Negativo:** O token JWT agora também aparece no corpo JSON de login/registro, o que
  amplia ligeiramente a superfície de exposição (ex: logs de proxy/plataforma)
- **Neutro:** A autenticação permanece 100% via cookie; o campo no corpo é redundante
  por design, para fins de testabilidade

> **Nota:** Consulte o [contrato de API](../contrato-api.md) para os endpoints de autenticação e o [guia de execução](../guia-execucao.md) para instruções de configuração do ambiente.
