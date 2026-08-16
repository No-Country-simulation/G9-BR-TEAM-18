import { useEffect, type RefObject } from "react";

// Elementos considerados focáveis via Tab (exclui disabled e tabindex=-1)
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Confina a navegação por teclado (Tab/Shift+Tab) dentro de um diálogo modal,
 * seguindo a ARIA Authoring Practices (Keyboard Interaction for dialogs).
 *
 * Enquanto `enabled` for true:
 * - Tab a partir do último elemento focável volta ao primeiro (e vice-versa
 *   com Shift+Tab) — o foco nunca escapa do diálogo;
 * - Se o foco estiver fora do diálogo (ex.: mudança programática), o Tab o
 *   redireciona para o primeiro elemento focável.
 *
 * O contêiner é lido via ref dentro do handler (não capturado no setup), para
 * que o listener continue válido mesmo se o contêiner for anexado/remontado
 * enquanto `enabled` permanece true.
 *
 * Uso:
 *   const dialogRef = useRef<HTMLDivElement>(null);
 *   useFocusTrap(dialogRef, !!confirmDelete);
 *   <div ref={dialogRef} role="dialog">...</div>
 *
 * @param containerRef Ref do elemento do diálogo (o contêiner a confinar).
 * @param enabled      Se true, o trap fica ativo (padrão: true).
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;

    const getFocusable = (container: HTMLElement): HTMLElement[] =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) =>
          // getClientRects() detecta visibilidade (offsetParent é null para
          // position: fixed) — mantém o elemento atualmente focado mesmo se oculto
          el.getClientRects().length > 0 || el === document.activeElement,
      );

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const container = containerRef.current;
      if (!container) return;
      const focusable = getFocusable(container);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      // Foco fora do diálogo (mudança programática): redireciona para o primeiro
      if (!container.contains(active)) {
        e.preventDefault();
        first.focus();
        return;
      }

      // Wrap: Shift+Tab do primeiro -> último; Tab do último -> primeiro
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Fase de captura: intercepta o Tab antes de qualquer outro handler
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [enabled, containerRef]);
}
