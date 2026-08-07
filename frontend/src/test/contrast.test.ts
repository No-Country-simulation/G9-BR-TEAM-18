import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { CATEGORY_COLORS } from "../types";

/**
 * Testes de contraste WCAG (AA) para os temas claro e escuro.
 *
 * Os estilos vivem em src/styles/*.css (barrel em App.css, regra ≤300 linhas —
 * F075). As variáveis estão em `:root` (tema escuro) e `[data-theme="light"]`
 * no base.css. Este teste concatena todos os arquivos, parseia os blocos de
 * variáveis, resolve var() aninhadas e valida o contraste dos pares críticos.
 *
 * Referência WCAG 2.1: texto normal >= 4.5:1 (AA); texto grande/UI >= 3:1 (AA).
 */

const stylesDir = join(process.cwd(), "src", "styles");
const css = [
  readFileSync(join(process.cwd(), "src", "App.css"), "utf-8"),
  ...readdirSync(stylesDir)
    .filter((f) => f.endsWith(".css"))
    .sort()
    .map((f) => readFileSync(join(stylesDir, f), "utf-8")),
].join("\n");

type Vars = Record<string, string>;

/** Escapa meta-caracteres de regex (necessário pois seletores CSS como `[data-theme=...]` são interpretados como classe de caracteres). */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Extrai o bloco de variáveis de um seletor específico. */
function extractBlock(source: string, selector: string): string {
  const re = new RegExp(`${escapeRegex(selector)}\\s*\\{([^}]*)\\}`, "s");
  const match = source.match(re);
  if (!match) throw new Error(`Bloco CSS não encontrado: ${selector}`);
  return match[1];
}

/** Parseia `--nome: valor;` de um bloco CSS. */
function parseVars(block: string): Vars {
  const vars: Vars = {};
  const re = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    vars[m[1]] = m[2].trim();
  }
  return vars;
}

/**
 * Resolve um valor: se for uma cor literal (#hex) retorna como está;
 * caso contrário resolve var(--x, fallback) recursivamente.
 */
function resolveVar(name: string, vars: Vars, visited = new Set<string>()): string {
  if (name.trim().startsWith("#")) return name.trim();
  if (visited.has(name)) {
    throw new Error(`Referência circular detectada: ${name}`);
  }
  visited.add(name);
  const raw = vars[name];
  if (!raw) throw new Error(`Variável não encontrada: ${name}`);
  const varRe = /var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g;
  return raw.replace(varRe, (_all, inner: string, fallback?: string) => {
    if (inner in vars) {
      return resolveVar(inner, vars, visited);
    }
    if (fallback) return fallback.trim();
    throw new Error(`Var(${inner}) sem valor nem fallback`);
  });
}

/** Converte hex (#rgb, #rrggbb) em { r, g, b } 0-255. */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    throw new Error(`Cor hex inválida: "${hex}"`);
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Luminância relativa WCAG (0-1). */
function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const chan = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

/** Razão de contraste WCAG (1-21). */
function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(hexToRgb(fg));
  const l2 = relativeLuminance(hexToRgb(bg));
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Monta o mapa de variáveis de um tema (resolução é sob demanda, via resolveVar). */
function themeVars(selector: string): Vars {
  return parseVars(extractBlock(css, selector));
}

const dark = themeVars(":root");
const light = themeVars('[data-theme="light"]');

interface Pair {
  /** primeiro plano (texto) — variável do tema ou cor literal */
  fg: string;
  /** fundo — variável do tema ou cor literal */
  bg: string;
  /** razão mínima exigida */
  min: number;
  /** descrição do uso real na UI */
  use: string;
}

/**
 * Pares críticos de texto/fundo.
 * 4.5 = texto normal (AA), 3.0 = texto grande/UI (AA).
 */
const PAIRS: Pair[] = [
  { fg: "--text-primary", bg: "--bg-base", min: 4.5, use: "texto principal sobre fundo base" },
  {
    fg: "--text-primary",
    bg: "--bg-surface",
    min: 4.5,
    use: "texto principal sobre cartões/superfície",
  },
  {
    fg: "--text-primary",
    bg: "--bg-surface-alt",
    min: 4.5,
    use: "texto principal sobre superfície alternativa",
  },
  { fg: "--text-secondary", bg: "--bg-base", min: 4.5, use: "texto secundário sobre fundo base" },
  { fg: "--text-secondary", bg: "--bg-surface", min: 4.5, use: "texto secundário sobre cartões" },
  {
    fg: "--text-secondary",
    bg: "--bg-surface-alt",
    min: 4.5,
    use: "texto secundário sobre superfície alternativa",
  },
  {
    fg: "--on-accent-text",
    bg: "--accent-green",
    min: 4.5,
    use: "texto do botão primário sobre accent-green",
  },
  {
    fg: "--btn-danger-text",
    bg: "--state-error",
    min: 4.5,
    use: "texto do botão danger sobre state-error",
  },
  {
    fg: "--on-accent-text",
    bg: "--accent-cyan",
    min: 4.5,
    use: "texto sobre accents (hover de botões secundários, ícones)",
  },
  {
    fg: "--on-accent-text",
    bg: "--accent-magenta",
    min: 4.5,
    use: "texto sobre accent-magenta (scroll-to-top)",
  },
  {
    fg: "--on-accent-text",
    bg: "--accent-green",
    min: 4.5,
    use: "texto sobre accent-green (chips, check)",
  },
  {
    fg: "--accent-green-bright",
    bg: "--ink",
    min: 4.5,
    use: "texto accent sobre fundo ink (hero-badge, appliance-count-badge, card-qty)",
  },
  { fg: "--accent-cyan", bg: "--bg-base", min: 4.5, use: "links/ícones cyan sobre fundo base" },
  { fg: "--accent-green", bg: "--bg-base", min: 4.5, use: "texto verde sobre fundo base" },
  {
    fg: "--accent-green",
    bg: "--bg-surface",
    min: 4.5,
    use: "texto verde sobre cartões (qty-value, ícones de card selecionado)",
  },
  {
    fg: "--accent-mustard",
    bg: "--bg-base",
    min: 4.5,
    use: "texto mustard (destaques) sobre fundo base",
  },
  {
    fg: "--accent-magenta",
    bg: "--bg-base",
    min: 4.5,
    use: "texto magenta (destaques) sobre fundo base",
  },
  {
    fg: "--state-error",
    bg: "--state-error-bg",
    min: 4.5,
    use: "mensagem de erro sobre fundo de erro",
  },
  {
    fg: "--state-success",
    bg: "--state-success-bg",
    min: 4.5,
    use: "mensagem de sucesso sobre fundo de sucesso",
  },
];

/**
 * Badges de categoria de eficiência: texto ink (escuro, padrão do design
 * system — como o botão primário) sobre CATEGORY_COLORS e sobre os fallbacks
 * usados quando a categoria vem de outro domínio (backend).
 * Aplicam-se a ambos os temas (cores fixas em types/index.ts / inline nos TSX).
 */
const BADGE_COLORS: string[] = [
  ...Object.values(CATEGORY_COLORS),
  "#818cf8", // fallback: categoria do backend não mapeada
  "#9ca3af", // fallback: categoria desconhecida
];
const INK_DARK = "#0a0a0a";
const INK_LIGHT = "#1a1a1a";

const LABELS: Record<string, string> = {
  "--text-primary": "text-primary",
  "--text-secondary": "text-secondary",
  "--bg-base": "bg-base",
  "--bg-surface": "bg-surface",
  "--bg-surface-alt": "bg-surface-alt",
  "--ink": "ink",
  "--accent-green": "accent-green",
  "--accent-cyan": "accent-cyan",
  "--accent-magenta": "accent-magenta",
  "--accent-mustard": "accent-mustard",
  "--accent-green-bright": "accent-green-bright",
  "--state-error": "state-error",
  "--state-success": "state-success",
  "--btn-danger-text": "btn-danger-text",
  "--on-accent-text": "on-accent-text",
};

function describePair(p: Pair): string {
  return `${LABELS[p.fg] ?? p.fg} sobre ${LABELS[p.bg] ?? p.bg} (${p.use})`;
}

describe.each([
  ["dark", dark],
  ["light", light],
] as const)("Contraste WCAG - tema %s", (_themeName, vars) => {
  it.each(PAIRS.map((p) => [p, describePair(p)] as const))("%s", (pair) => {
    const ratio = contrastRatio(resolveVar(pair.fg, vars), resolveVar(pair.bg, vars));
    expect(
      ratio,
      `Contraste ${ratio.toFixed(2)}:1 abaixo de ${pair.min}:1 para ${pair.use}`,
    ).toBeGreaterThanOrEqual(pair.min);
  });
});

describe("Badges de categoria (texto ink, ambos os temas)", () => {
  it.each(
    BADGE_COLORS.flatMap((bg) => [
      [`ink-dark sobre ${bg}`, INK_DARK, bg] as const,
      [`ink-light sobre ${bg}`, INK_LIGHT, bg] as const,
    ]),
  )("%s", (_label, fg, bg) => {
    const ratio = contrastRatio(fg, bg);
    expect(
      ratio,
      `Contraste ${ratio.toFixed(2)}:1 abaixo de 4.5:1 para texto ink sobre badge ${bg}`,
    ).toBeGreaterThanOrEqual(4.5);
  });
});
