import { readFileSync } from "node:fs";

const FORBIDDEN = [
  { char: "\u2014", label: "em dash (—)" },
  { char: "\u2013", label: "en dash (–)" },
  { char: "\u2018", label: "aspa simples curva/esquerda ('')" },
  { char: "\u2019", label: "aspa simples curva/direita ('')" },
  { char: "\u201C", label: "aspa dupla curva/esquerda (\")" },
  { char: "\u201D", label: "aspa dupla curva/direita (\")" },
];

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error("Uso: node scripts/check-forbidden-chars.mjs <arquivo1> [arquivo2 ...]");
  process.exit(1);
}

let hasError = false;

for (const file of files) {
  let content;
  try {
    content = readFileSync(file, "utf-8");
  } catch (err) {
    console.error(`${file}: erro ao ler arquivo -- ${err.message}`);
    hasError = true;
    continue;
  }

  for (const { char, label } of FORBIDDEN) {
    let index = content.indexOf(char);
    while (index !== -1) {
      const lineNum = content.slice(0, index).split("\n").length;
      console.error(`${file}:${lineNum}: caractere proibido encontrado (${label})`);
      hasError = true;
      index = content.indexOf(char, index + 1);
    }
  }
}

process.exit(hasError ? 1 : 0);
