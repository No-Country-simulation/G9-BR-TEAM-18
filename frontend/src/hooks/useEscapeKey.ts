import { useEffect, useRef } from "react";

/**
 * Fecha diálogos/menus com a tecla Escape (acessibilidade).
 *
 * Adiciona um listener de `keydown` no `window` enquanto `enabled` é true e o
 * remove no cleanup (ou quando `enabled` volta a false). O callback é mantido
 * em um ref, então o listener nunca precisa ser re-registrado a cada render —
 * mesmo que `onEscape` seja uma closure inline criada a cada render.
 *
 * Uso (guards de estado devem ficar dentro do callback — sempre atual via ref):
 *   useEscapeKey(() => {
 *     if (!deleting) setConfirmDelete(false);
 *   }, !!confirmDelete);
 *
 * @param onEscape Callback executado quando a tecla Escape é pressionada.
 * @param enabled  Se true, o listener fica ativo (padrão: true).
 */
export function useEscapeKey(onEscape: () => void, enabled = true): void {
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscapeRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
