# ADR-0030: Validação de Sessão e Remoção de Mock Data no Frontend

## Status

Proposto

## Contexto

O frontend apresentava dois problemas críticos que comprometiam a consistência dos dados e a experiência do usuário:

1. **Sessão não validada com o backend**: A função `restoreSession()` no `AuthContext` verificava apenas a existência do cookie `SESSION_TOKEN` no navegador (`document.cookie.includes("SESSION_TOKEN=")`), sem confirmar com o backend se a sessão ainda era válida. Quando o banco de dados era limpo (ex: recriação do ambiente de desenvolvimento), o cookie e o `localStorage` ainda existiam, fazendo o frontend acreditar que o usuário estava logado — quando na realidade a conta não existia mais.

2. **Fallback silencioso com dados mockados**: A função `listAppliances()` no `api.ts` utilizava um fallback de 11 aparelhos hardcoded (`APPLIANCE_FALLBACK`) quando a API do backend falhava ou retornava erro. Isso criava uma falsa sensação de funcionamento: o usuário via aparelhos na interface mesmo com o backend indisponível, gerando inconsistências quando tentava salvar ou analisar dados que não existiam no servidor.

Além disso, o `App.tsx` continha uma chamada inútil a `GET /auth/me` com `mode: "no-cors"`, que tornava a resposta opaca (impossível de ler) e o resultado era completamente ignorado.

## Decisão

### 1. Validação de sessão real na montagem

Substituir a verificação client-side do cookie por uma validação real com o backend:

- `restoreSession()` agora restaura o usuário do `localStorage` de forma otimista (sem verificar cookie), para evitar flash de carregamento.
- O `useEffect` de montagem do `AuthProvider` faz uma chamada `GET /auth/me` com `credentials: "include"`.
- Se a resposta for 401 (não autorizado), a função `clearSession()` limpa o `localStorage` e o cookie, e o estado do usuário é definido como `null`.
- Em caso de erro de rede, o usuário em cache é mantido para evitar tela em branco em quedas temporárias — o próximo 401 vindo de qualquer API fará o redirecionamento.
- O estado `loading` só é definido como `false` após a validação, garantindo que rotas privadas aguardem a confirmação.

### 2. Remoção do fallback `APPLIANCE_FALLBACK`

Substituir o array de 11 aparelhos hardcoded por uma arquitetura onde o backend é a única fonte da verdade:

- Remover `APPLIANCE_FALLBACK` e `mergeAppliancesWithBackend()`.
- Criar `enrichAppliance()`, uma função que recebe os dados crus do backend e adiciona metadados de UI (ícone, campo de distribuição de potência) via lookup por nome normalizado.
- `listAppliances()` agora lança erro em caso de falha (em vez de retornar dados falsos), e redireciona para login em caso de 401.
- O `usingFallback` state foi removido dos componentes.
- O campo `backendId` foi removido da interface `ApplianceType` — o `id` agora é `String(backendNumericId)`.
- Em `handleSubmit`, a verificação `if (!usingFallback)` foi removida, e `appliance?.backendId` foi substituído por `Number(appliance.id)`.

### 3. Remoção de código morto no App.tsx

Remover a chamada `fetch(`${API_URL}/auth/me`, { mode: "no-cors" })` que não tinha efeito prático, junto com o import de `useEffect` e a constante `API_URL` que só eram usados por ela.

## Consequências

- **Positivas**: Sessão é validada contra o backend na montagem — contas deletadas do banco resultam em redirecionamento ao login. Catálogo de aparelhos reflete fielmente o que está no backend. Código mais limpo e previsível.

- **Negativas**: Em caso de queda do backend, o catálogo de aparelhos fica indisponível (em vez de mostrar dados falsos). A validação de sessão adiciona uma requisição extra na montagem de cada página.

- **Testes**: Todos os 7 arquivos de teste que usam `AuthProvider` foram atualizados com o padrão `MOCK_NOT_OK` — um mock default que retorna `ok: false` para a chamada de montagem, evitando que o consumo inesperado de mocks `mockResolvedValueOnce` quebrasse os cenários de teste.

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Manter fallback + validação client-side (atual)** | Simples, não requer mudanças | Dados inconsistentes, falsa sensação de funcionamento |
| **Remover fallback + validar sessão (escolhida)** | Backend é fonte única da verdade, sessão robusta | Requer backend disponível para funcionar |
| **Manter fallback mas validar sessão** | Catálogo funciona offline | Inconsistência entre dados mockados e reais |
