# Frontend - Arquitetura e Componentes

Documentação da interface web React com TypeScript, Vite, React Router, Recharts e Lucide.

## Índice

- [Stack Tecnológica](#stack-tecnológica)
- [Estrutura de Diretórios](#estrutura-de-diretórios)
- [Roteamento](#roteamento)
- [Páginas](#páginas)
- [Componentes Compartilhados](#componentes-compartilhados)
- [Fluxo de Autenticação](#fluxo-de-autenticação)
- [Camada de Serviços (API)](#camada-de-serviços-api)
- [Tipos e Constantes](#tipos-e-constantes)
- [Tema](#tema)
- [Testes](#testes)

---

## Stack Tecnológica

| Tecnologia | Versão | Função |
|---|---|---|
| React | 19 | Biblioteca de UI |
| TypeScript | ~5.7 | Tipagem estática |
| Vite | ~6 | Bundler e dev server |
| React Router | 7 | Roteamento SPA |
| Recharts | ~2 | Gráficos (Dashboard) |
| Lucide React | ~0.47 | Ícones |
| Vitest | ~3 | Test runner (unitários) |
| Testing Library | ~16 | Testes de componentes |
| Playwright | ~1.50 | Testes E2E (navegador) |

## Estrutura de Diretórios

```text
frontend/src/
├── components/        # Componentes reutilizáveis
│   ├── AnalysisSourceBadge.tsx  # Badge de fonte da análise (ML/Fallback)
│   ├── LucideIcon.tsx    # Ícone com registry estático
│   ├── Navbar.tsx          # Barra de navegação superior
│   ├── Footer.tsx          # Rodapé
│   ├── Hero.tsx            # Seção hero da landing page
│   ├── FeatureCards.tsx    # Cards de funcionalidades
│   ├── HowItWorks.tsx      # Passo a passo do funcionamento
│   ├── TechStack.tsx       # Exibição da stack tecnológica
│   ├── Logo.tsx            # Componente do logotipo
│   ├── PrivateRoute.tsx    # Guard de autenticação
│   └── ScrollToTop.tsx     # Botão flutuante de scroll ao topo
├── context/           # Contextos React
│   ├── AuthContext.tsx      # Provedor de autenticação
│   ├── authContext.ts       # Definição do contexto de auth
│   ├── useAuth.ts          # Hook de acesso ao contexto de auth
│   ├── ThemeContext.tsx     # Provedor de tema (dark/light)
│   ├── themeContext.ts      # Definição do contexto de tema
│   └── useTheme.ts         # Hook de acesso ao contexto de tema
├── data/              # Dados estáticos
│   └── appliances.ts       # Catálogo fallback de aparelhos
├── pages/             # Componentes de página (roteadas)
│   ├── Home.tsx            # Landing page
│   ├── Login.tsx           # Login
│   ├── Register.tsx        # Cadastro
│   ├── Dashboard.tsx       # Dashboard com métricas e gráficos
│   ├── ProfilePage.tsx     # Perfil do usuário + análise
│   ├── History.tsx         # Histórico de análises
│   └── ResetPasswordPage.tsx  # Redefinição de senha
├── services/          # Comunicação com o backend
│   └── api.ts              # Todas as chamadas HTTP
├── types/             # Tipos e constantes
│   └── index.ts            # Interfaces, tipos, constantes de UI
├── e2e/               # Testes end-to-end (Playwright)
│   ├── playwright.config.ts
│   ├── helpers/
│   │   └── mocks.ts
│   ├── auth.spec.ts
│   ├── navigation.spec.ts
│   ├── dashboard.spec.ts
│   ├── history.spec.ts
│   ├── profile.spec.ts
│   ├── error-handling.spec.ts
│   └── Dockerfile.e2e
├── test/              # Testes unitários
│   ├── setup.ts
│   ├── api.test.ts
│   ├── AuthContext.test.tsx
│   ├── PrivateRoute.test.tsx
│   ├── ResetPasswordPage.test.tsx
│   └── types.test.ts
├── App.tsx            # Componente raiz com roteamento
├── App.css            # Estilos globais
└── main.tsx           # Entry point
```

## Roteamento

Definido em `App.tsx` com React Router v7:

| Caminho | Página | Acesso |
|---|---|---|
| `/` | Home (landing page) | Público |
| `/register` | Register | Público |
| `/login` | Login | Público |
| `/reset-password` | ResetPasswordPage | Autenticado |
| `/profile` | ProfilePage | Autenticado |
| `/history` | History | Autenticado |
| `/dashboard` | Dashboard | Autenticado |

Todas as rotas autenticadas são protegidas pelo componente `PrivateRoute`.

## Páginas

### Home

Landing page pública composta por:

- **Hero**: Chamada principal com botão CTA para análise
- **FeatureCards**: Três cards (Classificação ML, Recomendações Inteligentes, Estimativa Financeira)
- **HowItWorks**: Fluxo em 4 passos (cadastro, coleta, classificação, recomendações)
- **AnalysisForm**: Formulário de análise energética (simplificado, sem necessidade de login)
- **TechStack**: Exibição da stack (React, Spring Boot, Python/ML)
- **Footer**: Links e créditos

### ProfilePage

Página autenticada que concentra:

- Dados do imóvel (tipo, endereço, moradores, área)
- Gerenciamento de aparelhos (catálogo, busca, seleção por categoria, batch update)
- Regularidade da análise (instantânea, diária, semanal, mensal)
- Análise do momento (consumo, categoria, recomendações)
- Última análise armazenada no perfil

### Dashboard

Página autenticada com métricas agregadas:

- Total de análises, média de consumo, custo total, emissão de CO₂
- Gráfico de consumo mensal (Recharts BarChart)
- Indicador de tendência (melhorou/piorou)
- Progresso entre categorias ao longo do tempo
- Simulação de economia (redução de X kWh → economia em R$)
- Atalhos para nova análise e histórico

### History

Página autenticada que lista todas as análises realizadas.

### Login / Register

Formulários de autenticação com validação e exibição de erros de campo.

### ResetPasswordPage

Página para redefinição de senha (após login com `passwordResetRequired: true`).

## Componentes Compartilhados

| Componente | Função |
|---|---|
| `Navbar` | Navegação superior com links condicionais (logado vs. anônimo), alternador de tema, efeito de digitação |
| `Footer` | Rodapé com links de navegação e documentação |
| `PrivateRoute` | Guard de rota que redireciona para `/login` se não autenticado |
| `ScrollToTop` | Botão flutuante que aparece ao scroll abaixo de 300px |
| `AnalysisForm` | Formulário reutilizável de análise (usado na Home) |
| `Hero` | Seção de destaque da landing page |
| `Logo` | Renderização do logotipo EnergiIA |

## Fluxo de Autenticação

1. **Registro**: `POST /auth/register` → cria usuário, inicia sessão (cookie `SESSION_TOKEN`)
2. **Login**: `POST /auth/login` → valida credenciais, retorna cookie de sessão
3. **Sessão**: O cookie `SESSION_TOKEN` (httpOnly) é enviado automaticamente pelo navegador
4. **Restauração**: Ao recarregar a página, `AuthContext` verifica se o cookie existe e restaura o usuário do `localStorage`
5. **Logout**: `POST /auth/logout` → invalida token, limpa cookie e `localStorage`
6. **Redefinição de senha**: Se o backend retornar `passwordResetRequired: true`, o usuário é redirecionado para `/reset-password`

O `AuthContext` expõe o hook `useAuth()` com:

- `user: User | null` - dados do usuário logado
- `loading: boolean` - estado de carregamento inicial
- `login(email, password): Promise<boolean>` - retorna `true` se reset de senha for necessário
- `register(name, email, password): Promise<void>`
- `logout(): void`
- `resetPassword(currentPassword, newPassword): Promise<void>`

## Camada de Serviços (API)

Todas as chamadas HTTP estão centralizadas em `services/api.ts`. A função `authFetch()` adiciona automaticamente o cabeçalho `Content-Type` e `credentials: "include"` para envio do cookie de sessão.

Funções exportadas:

| Função | Endpoint | Descrição |
|---|---|---|
| `login()` | `POST /auth/login` | Autenticação |
| `register()` | `POST /auth/register` | Cadastro |
| `createProperty()` | `POST /properties` | Criar imóvel |
| `listProperties()` | `GET /properties` | Listar imóveis |
| `updateProperty()` | `PUT /properties/{id}` | Atualizar imóvel |
| `deleteProperty()` | `DELETE /properties/{id}` | Excluir imóvel |
| `listPropertyAppliances()` | `GET /properties/{id}/appliances` | Listar aparelhos do imóvel |
| `batchUpdateAppliances()` | `PUT /properties/{id}/appliances/batch` | Atualizar lote de aparelhos |
| `listAppliances()` | `GET /appliances` | Catálogo de aparelhos |
| `analyzeEnergy()` | `POST /energy-analysis` | Executar análise |
| `simulateEnergy()` | `POST /energy-analysis/simulate` | Simular análise (sem persistir) |
| `listAnalyses()` | `GET /analyses` | Histórico de análises |
| `fetchAnalysisById()` | `GET /analyses/{id}` | Buscar análise por ID |
| `deleteAnalysis()` | `DELETE /analyses/{id}` | Excluir análise |
| `fetchDashboard()` | `GET /dashboard` | Dados do dashboard |
| `fetchPreferences()` | `GET /auth/me` | Preferências (regularidade, pico) |
| `updatePreferences()` | `PUT /auth/preferences` | Atualizar preferências |
| `fetchCategories()` | `GET /energy-analysis/categories` | Categorias válidas |
| `fetchContractInfo()` | `GET /contract-info` | Tipos de imóvel e categorias (schema discovery) |

## Tipos e Constantes

Centralizados em `types/index.ts`:

- **Interfaces de domínio**: `User`, `AnalysisRequest`, `AnalysisResponse`, `AnalysisHistory`, `DashboardData`
- **Tipos de dados**: `PropertyType` (`RESIDENCIAL` | `APARTAMENTO` | `COMERCIAL`), `Regularity`, `HighestConsumptionCategory`
- **Tipos de aparelho**: `ApplianceType`, `ApplianceItem`, `PropertyAppliance`
- **Constantes de UI**: `CATEGORY_COLORS`, `CATEGORY_DISPLAY`, `DEFAULT_PROPERTY_TYPES`, `REGULARITY_OPTIONS`
- **Classe de erro**: `ApiError` com suporte a `fields` para erros de validação

## Tema

Gerenciado pelo `ThemeContext`, suporta dois temas:

| Tema | Descrição |
|---|---|
| Dark (padrão) | Fundo escuro com acentos neon |
| Light | Fundo claro com cores adaptadas |

A preferência é persistida em `localStorage` (chave `energiai-theme`) e respeita `prefers-color-scheme` na inicialização.

## Testes

### Testes Unitários (Vitest + Testing Library)

Localizados em `frontend/src/test/` e executados com Vitest + Testing Library:

| Arquivo | O que testa |
|---|---|
| `api.test.ts` | Chamadas HTTP (analyzeEnergy, login, register, listProperties, CRUD de aparelhos) |
| `AuthContext.test.tsx` | Fluxo de autenticação (login, registro, logout, reset de senha) |
| `PrivateRoute.test.tsx` | Proteção de rotas (autenticado/não autenticado/reset pendente) |
| `ResetPasswordPage.test.tsx` | Validação de formulário de redefinição de senha |
| `Login.test.tsx` | Testes da pagina de login (6 testes: render, erros, navegação) |
| `Register.test.tsx` | Testes da pagina de cadastro (7 testes: validação, erros, navegação) |
| `Navbar.test.tsx` | Testes da barra de navegação (6 testes: estados autenticado/anonimo) |
| `types.test.ts` | Constantes de UI e classe ApiError |

### Testes E2E (Playwright)

Localizados em `frontend/e2e/` e executados com Playwright via Docker. Total: **68 testes**.

| Categoria | Testes | Cenários Cobertos |
|---|---|---|
| Navegação e Páginas Públicas | 6 | Home, Navbar autenticado/não, alternador de tema, roteamento |
| Autenticação | 13 | Login (sucesso, erro, loading, reset de senha), Registro (validação, sucesso, erro, duplicidade), Rotas privadas |
| Dashboard | 12 | Loading, vazio, dados reais (cards, gráfico), tendência, meta, simulação, badges de status |
| Histórico | 10 | Loading, vazio, lista com dados, badges (CONCLUIDA/PENDENTE/FALHA/DESCONHECIDO), navegação |
| Profile Page | 17 | Loading, formulário de imóvel, catálogo, busca, adicionar/remover, regularidade, botões |
| Tratamento de Erros | 7 | Falha de API, Error Boundary (chunk fallback), 404, tema resiliente |
| Estados de Carregamento | 2 | Lazy loading de páginas, fallback de carregamento |

Para executar os testes E2E:

```bash
# Via Docker (recomendado):
docker build -t energiaia-e2e -f frontend/e2e/Dockerfile.e2e .
docker run --rm energiaia-e2e

# Via npm (requer browsers Playwright instalados):
cd frontend && npm run test:e2e
```

> **Alternativa de browser:** em Linux com bibliotecas de sistema do Chromium
> ausentes (`libnspr4.so`, `libnss3.so`), instale o Firefox do Playwright
> (`npx playwright install firefox`) e rode a suíte com
> `npx playwright test --config=e2e/playwright.config.ts --browser=firefox`.
> Consulte o [guia de execução](./guia-execucao.md) para detalhes.

---

> **Nota:** Consulte o [design system](./modulos/design-system.md) para diretrizes visuais e o [contrato de API](./contrato-api.md) para definição detalhada dos endpoints.
