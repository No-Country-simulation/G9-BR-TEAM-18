# ADR-0031: Infraestrutura de Testes E2E com Playwright

## Status

Aceito

## Contexto

O frontend do EnergIAI possuía 65 testes unitários (Vitest + Testing Library) que
cobriam componentes isolados, contexto de autenticação e chamadas de API. No entanto,
não existia nenhum teste que validasse o comportamento real do usuário no navegador
- fluxos completos como navegação entre páginas, preenchimento de formulários,
interação com o catálogo de aparelhos, exibição de gráficos no dashboard e tratamento
de erros de rede.

Essa lacuna gerava quatro problemas principais:

1. **Falsos positivos em CI**: Testes unitários passavam mesmo quando componentes
   interagiam de forma inesperada, pois cada componente era testado de forma isolada
   sem o contexto real de renderização e roteamento.

2. **Regressões visuais não detectadas**: Mudanças no CSS, na ordem de renderização
   ou em bibliotecas como Recharts podiam quebrar a interface sem que os testes
   unitários percebessem.

3. **Fluxos críticos sem cobertura**: Login, registro, criação de perfil, adição de
   aparelhos e visualização do dashboard - fluxos que dependem de múltiplos
   componentes e chamadas de API - não eram testados de forma integrada.

4. **Dependência do backend real**: Testar manualmente exigia que o backend, banco
   Oracle e ML Service estivessem rodando, o que tornava o ciclo de teste lento e
   propenso a falhas de ambiente.

## Decisão

Implementar uma suíte de testes end-to-end com Playwright que roda via Docker, sem
dependência do backend real, utilizando mocks de API em todas as chamadas HTTP.

### Arquitetura dos Testes

```
frontend/e2e/
├── playwright.config.ts        # Config do Playwright (Docker + local)
├── helpers/
│   └── mocks.ts                # Mock data, pt() helper, setupAuthenticatedMocks
├── auth.spec.ts                # 13 testes - login, registro, rotas privadas
├── navigation.spec.ts          # 6 testes - navbar, tema, roteamento público
├── dashboard.spec.ts           # 12 testes - loading, dados, tendência, simulação
├── history.spec.ts             # 10 testes - loading, lista, badges de status
├── profile.spec.ts             # 17 testes - formulário, catálogo, busca, CRUD
├── error-handling.spec.ts      # 7 testes - erros de API, Error Boundary, 404
├── loading.spec.ts             # 2 testes - lazy loading, fallback
└── Dockerfile.e2e              # Dockerfile com Playwright + Chromium
```

### Mecanismo de Mock

Todas as chamadas HTTP do frontend são interceptadas em nível de rede pelo Playwright
(`page.route()`), usando URLs exatas (`http://localhost:8080/...`) para maior precisão:

- **setupPublicMocks()**: Mocks para páginas públicas (appliances, categories).
- **setupAuthenticatedMocks()**: Mocks para páginas autenticadas (auth/me, properties,
  analyses, dashboard) + dados de exemplo realistas.
- **setLoggedIn()**: Usa `page.addInitScript()` para definir o `localStorage` antes
  do carregamento da página, evitando o `SecurityError` do `page.evaluate()` em
  páginas vazias (`about:blank`).

### Helper pt() para Português

A função `pt()` (exportada de `helpers/mocks.ts`) converte texto em português para
uma expressão regular que ignora variações de acentuação:

```typescript
// "análise" → /an[aáàâã]l[iíì]s[eéèê]/i
pt("análise") → /an[aáàâã]l[iíì]s[eéèê]/i
```

Isso permite que os testes correspondam a textos em português independentemente de
acentuação, evitando falsos negativos causados por diferenças de encoding entre o
código fonte e a renderização no navegador.

### Distribuição por Cenário

| Categoria | Testes | Cenários Cobertos |
|---|---|---|
| Navegação e Páginas Públicas | 6 | Home, Navbar autenticado/não, alternador de tema, roteamento |
| Autenticação | 13 | Login (sucesso, erro, loading, reset de senha), Registro (validação, sucesso, erro, duplicidade), Rotas privadas (redirect sem auth) |
| Dashboard | 12 | Loading, estado vazio, dados reais (cards, gráfico), tendência (melhorou/piorou), meta, simulação de economia, badges PENDENTE/FALHA |
| Histórico | 10 | Loading, estado vazio, lista com dados, badges (CONCLUIDA/PENDENTE/FALHA/DESCONHECIDO), navegação ao clicar |
| Profile Page | 17 | Loading, formulário de imóvel, catálogo de aparelhos, busca por nome, adicionar/remover aparelhos, regularidade, botões Salvar/Analisar |
| Tratamento de Erros | 7 | Falha de API (Dashboard/History/Profile), servidor offline, Error Boundary (chunk fallback), 404, tema resiliente |
| Estados de Carregamento | 2 | Lazy loading de páginas, fallback de carregamento |

Total: **67 testes**.

### Dockerfile

O `Dockerfile.e2e` usa a imagem oficial `mcr.microsoft.com/playwright:v1.50.0-noble`
como base, instala as dependências do frontend e os browsers Chromium para a versão
do Playwright instalada, resultando em um ambiente de teste portável e reproduzível.

```dockerfile
FROM mcr.microsoft.com/playwright:v1.50.0-noble
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
RUN npx playwright install chromium
COPY frontend/ .
CMD ["npx", "playwright", "test", "--config=e2e/playwright.config.ts"]
```

### Configuração Git

Os artefatos gerados pelos testes não são versionados:

- `frontend/e2e/test-results/` - screenshots, traces e vídeos de falha
- `frontend/e2e/playwright-report/` - relatório HTML interativo
- `frontend/e2e/playwright/.cache/` - cache do Playwright
- `frontend/test-results/` - artefatos de execuções anteriores

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Playwright com Docker (escolhido)** | Portável, reproduzível, 67 testes em lote, mocks de rede | Requer Docker; 1.5GB de imagem |
| **Cypress** | Interface gráfica interativa, comunidade maior | Sem suporte nativo a Docker; mais lento; sem suporte a múltiplas abas |
| **Playwright local (npm)** | Mais leve, integração com IDE | Falhas por diferenças de SO/browser; dependência de instalação global |
| **Testes manuais com roteiro** | Zero custo de manutenção de código | Não reproduzível; propenso a erro humano; impraticável para CI |

## Consequências

- **Positivo:** 67 testes E2E rodando via Docker que validam o comportamento real do
  frontend sem dependência do backend, banco ou ML Service.
- **Positivo:** Mocks de API em nível de rede permitem testar cenários de erro
  (401, 500, servidor offline) que seriam difíceis de reproduzir com o backend real.
- **Positivo:** O helper `pt()` garante que os testes funcionam com texto em português
  independentemente de acentuação.
- **Positivo:** A imagem Docker é portável - qualquer membro da equipe pode executar
  os mesmos testes no mesmo ambiente.
- **Negativo:** A imagem Docker pesa ~1.5GB devido ao Chromium + dependências do
  Playwright.
- **Negativo:** Manter os mocks sincronizados com o backend real exige atualização
  quando novos endpoints ou campos são adicionados.
- **Negativo:** Testes E2E são mais lentos que testes unitários (~2-3 minutos para
  67 testes via Docker).
