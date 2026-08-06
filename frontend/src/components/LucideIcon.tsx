import { ICON_REGISTRY } from "./iconRegistry";

interface LucideIconProps {
  name: string;
  size?: number;
  className?: string;
}

/**
 * Componente para renderizar dinamicamente um ícone Lucide pelo nome.
 *
 * Exemplo:
 * ```tsx
 * <LucideIcon name="Refrigerator" size={20} className="my-icon" />
 * ```
 *
 * Isso permite que o ícone seja definido por uma string (vinda de
 * catálogo de ícones, API, etc.) em vez de ser hardcoded no JSX.
 *
 * O registry estático vive em iconRegistry.ts (ver lá para como adicionar
 * novos ícones). Defensivo: nomes desconhecidos/ausentes renderizam `null`
 * (nunca crasham).
 */
export function LucideIcon({ name, size = 16, className }: LucideIconProps) {
  const IconComponent = ICON_REGISTRY[name];

  return IconComponent ? <IconComponent size={size} className={className} /> : null;
}
