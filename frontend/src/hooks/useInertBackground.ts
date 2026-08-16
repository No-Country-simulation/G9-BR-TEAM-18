import { useLayoutEffect, type RefObject } from "react";

/**
 * Marca o conteúdo de fundo como `inert` enquanto um diálogo modal está aberto
 * (ARIA Authoring Practices — "Modal Dialog": isolando o conteúdo de fundo do
 * leitor de tela e da navegação por teclado).
 *
 * O atributo `inert` é preferível a `aria-hidden="true"` porque, além de
 * remover o conteúdo da árvore de acessibilidade, também impede que ele receba
 * foco (aria-hidden sozinho deixaria o elemento ainda focável por teclado).
 *
 * Caminha do elemento do diálogo para cima até `<body>`, aplicando `inert` em
 * todos os irmãos que não fazem parte do caminho do diálogo (o conteúdo de
 * fundo). Ao fechar/desmontar, restaura apenas os elementos que o hook marcou
 * (não toca em `inert` pré-existente).
 *
 * Uso:
 *   const dialogRef = useRef<HTMLDivElement>(null);
 *   useInertBackground(dialogRef, !!confirmDelete);
 *   <div ref={dialogRef} role="dialog">...</div>
 *
 * @param dialogRef Ref do elemento do diálogo (o conteúdo de fundo é tudo
 *                  que estiver fora dele na hierarquia).
 * @param enabled   Se true, o conteúdo de fundo fica inert (padrão: true).
 */
export function useInertBackground(dialogRef: RefObject<HTMLElement | null>, enabled = true): void {
  useLayoutEffect(() => {
    if (!enabled) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Elementos que este hook marcou como inert (para restaurar no cleanup).
    // Só são restaurados os que o hook adicionou — `inert` pré-existente é
    // preservado (ex.: outro diálogo aberto simultaneamente).
    const inerted: HTMLElement[] = [];

    const isDialogOrOverlay = (el: Element): boolean =>
      el.getAttribute("role") === "dialog" || el.classList.contains("hist-modal-overlay");

    const applyInert = () => {
      // Sobe do diálogo até <body>, marcando os irmãos em cada nível:
      // o conteúdo de fundo é tudo que não está no caminho do diálogo.
      // Guard: não marca overlays/outros diálogos (evita inert mútuo se dois
      // diálogos coexistem — ex.: spinner de loading + modal de confirmação).
      let node: HTMLElement | null = dialog;
      while (node && node !== document.body) {
        const parent: HTMLElement | null = node.parentElement;
        if (!parent) break;
        for (const sibling of Array.from(parent.children)) {
          if (sibling === node) continue;
          const el = sibling as HTMLElement;
          if (isDialogOrOverlay(el)) continue;
          if (!el.hasAttribute("inert")) {
            el.setAttribute("inert", "");
            inerted.push(el);
          }
        }
        node = parent;
      }
    };

    applyInert();

    return () => {
      for (const el of inerted) el.removeAttribute("inert");
    };
  }, [enabled, dialogRef]);
}
