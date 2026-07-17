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

> **Nota:** Consulte o [contrato de API](../contrato-api.md) para os endpoints de autenticação e o [guia de execução](../guia-execucao.md) para instruções de configuração do ambiente.
