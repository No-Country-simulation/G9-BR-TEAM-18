import { useEffect, useRef, type RefObject } from "react";

/**
 * Gestão de foco para diálogos modais (WCAG 2.4.3 / ARIA Authoring Practices).
 *
 * Ao abrir o diálogo (`open === true`), guarda o elemento que possuía o foco
 * e move o foco para `focusTargetRef` (ex.: botão "Cancelar"). Ao fechar
 * (`open === false`) ou desmontar o componente, restaura o foco ao elemento
 * original — mantendo o contexto de navegação por teclado do usuário.
 *
 * Uso:
 *   const cancelRef = useRef<HTMLButtonElement>(null);
 *   useDialogFocus(isOpen, cancelRef);
 *   <button ref={cancelRef}>Cancelar</button>
 */
export function useDialogFocus(open: boolean, focusTargetRef: RefObject<HTMLElement | null>): void {
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    // Guarda quem tinha o foco antes de abrir o diálogo
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    // Move o foco para o alvo (botão "Cancelar", botão de fechar, etc.)
    focusTargetRef.current?.focus();
    return () => {
      // Restaura o foco ao fechar (open -> false) ou ao desmontar.
      // Só restaura se o elemento original ainda estiver no DOM: após uma
      // exclusão confirmada, o elemento que abriu o diálogo pode ter sido
      // removido junto com a linha/item (.focus() em nó desconectado é no-op).
      const previous = previouslyFocusedRef.current;
      if (previous && document.contains(previous)) {
        previous.focus();
      }
      previouslyFocusedRef.current = null;
    };
  }, [open, focusTargetRef]);
}
