# ADR-0014: Correções de Linting no Frontend - Prettier/ESLint

## Status

Aceito

## Contexto

O CI `lint-frontend` executa duas verificações obrigatórias:

1. **ESLint** (regra `react-refresh/export-only-export-components`) - exigia que
   componentes que exportam um hook customizado e seu contexto no mesmo arquivo fossem
   separados. Os arquivos `AuthContext.tsx` e `ThemeContext.tsx` exportavam tanto o
   `Provider` quanto os hooks `useAuth`/`useTheme` e os contextos, violando a regra.
2. **Prettier** (`prettier --check`) - diversos arquivos do frontend estavam com
   formatação divergente do padrão configurado (aspas duplas, trailingComma all,
   printWidth 100).

Adicionalmente, o componente `Logo.tsx` continha a função `logoFaviconSvg` que não era
utilizada em nenhum lugar do código, gerando warning de código morto.

## Decisão

A equipe aplicou três correções:

### 1. Separação de contextos e hooks (ESLint react-refresh)

Os arquivos originais foram divididos em quatro arquivos cada:

- `authContext.ts` - exporta apenas `AuthContext` (objeto contexto)
- `useAuth.ts` - exporta apenas o hook `useAuth` customizado
- `AuthContext.tsx` - exporta apenas o componente `AuthProvider`
- (mesmo padrão para `ThemeContext`/`themeContext`/`useTheme`)

Isso satisfaz a regra `react-refresh/export-only-export-components` pois cada arquivo
exporta um único componente/hook.

### 2. Formatação com Prettier

```bash
npx prettier --write .
```

Aplicado em todos os arquivos do frontend para alinhar com a configuração do projeto.

### 3. Remoção de código morto

A função `logoFaviconSvg` foi removida de `Logo.tsx` por ser não utilizada.

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Separação em arquivos (escolhido)** | Compatível com react-refresh, organização clara | Mais arquivos no projeto |
| **Inline no mesmo arquivo com disable comment** | Sem arquivos extras | ESLint desabilitado para a regra - perde proteção |
| **Manter como estava e ignorar warning** | Zero alteração | CI falha, PR não mescla |

## Consequências

- **Positivo:** ESLint passa com zero warnings
- **Positivo:** Prettier passa com formatação consistente
- **Positivo:** Código morto removido reduz bundle size
- **Negativo:** Seis arquivos adicionados ao projeto (`authContext.ts`, `useAuth.ts`,
  `themeContext.ts`, `useTheme.ts`)
- **Negativo:** Todos os arquivos do frontend tiveram alteração de formatação (grande diff
  no git)
