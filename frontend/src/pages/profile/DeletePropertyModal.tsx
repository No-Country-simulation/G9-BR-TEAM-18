import { useRef } from "react";
import { LucideIcon } from "../../components/LucideIcon";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { useInertBackground } from "../../hooks/useInertBackground";

interface Props {
  propertyAlias: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Modal de confirmação de exclusão de imóvel (acessibilidade: role=dialog,
 * focus trap, inert no fundo, fechamento por Escape).
 *
 * Só é renderizado enquanto `confirmDelete && property` (no ProfilePage),
 * então os hooks de a11y rodam com `enabled` padrão (true) e são limpos no
 * desmonte.
 */
export function DeletePropertyModal({ propertyAlias, deleting, onCancel, onConfirm }: Props) {
  // Foco no botão "Cancelar" ao abrir o modal e restauração ao fechar (a11y)
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);
  useDialogFocus(true, cancelDeleteRef);

  // Confina a navegação por Tab dentro do diálogo de confirmação (ARIA APG)
  const confirmModalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(confirmModalRef);
  // Isola o conteúdo de fundo do leitor de tela e do foco enquanto aberto (ARIA APG)
  useInertBackground(confirmModalRef);

  // Fecha o modal com Escape; o guard `!deleting` evita fechar no meio da
  // exclusão (callback sempre atual via ref no hook).
  useEscapeKey(() => {
    if (!deleting) onCancel();
  });

  return (
    <div className="hist-modal-overlay" onClick={() => !deleting && onCancel()}>
      <div
        ref={confirmModalRef}
        className="hist-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Confirmar exclusão de imóvel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hist-confirm-icon">
          <LucideIcon name="AlertTriangle" size={32} />
        </div>
        <h3>Excluir imóvel?</h3>
        <p>
          O imóvel "{propertyAlias}" e todos os aparelhos associados serão removidos
          permanentemente. As análises já realizadas continuam no histórico.
        </p>
        <div className="hist-confirm-actions">
          <button
            ref={cancelDeleteRef}
            className="dash-btn dash-btn--secondary"
            disabled={deleting}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button className="hist-btn-delete-confirm" disabled={deleting} onClick={onConfirm}>
            {deleting ? "Excluindo..." : "Sim, excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
