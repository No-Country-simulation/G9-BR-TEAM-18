/**
 * Hook useCategoryDisplay
 *
 * Encapsula a lógica de exibição de categorias de CONSUMO (ex: REFRIGERATION,
 * CLIMATE_CONTROL, …), centralizando o acesso a label, ícone e cor.
 *
 * Atualmente opera 100% com fallback local (appliance-icons.ts).
 * Quando o backend expuser /contract-info (ADR-0027), este hook será o
 * ponto único para fazer merge dos dados remotos com o fallback local,
 * sem precisar alterar página nenhuma.
 */

import { useMemo } from "react";
import {
  getCategoryDisplay as localGetDisplay,
  sortCategories as localSortCategories,
  type CategoryDisplay,
} from "../data/appliance-icons";

export type { CategoryDisplay };

// ── Estado para futuro merge com dados do backend ──
// Quando o backend expuser /contract-info (ADR-0027), importar useState/useEffect:
// const [remoteLabels, setRemoteLabels] = useState<Record<string,string>|null>(null);
// useEffect(() => { fetchRemoteCategories().then(setRemoteLabels).catch(() => {}); }, []);
// O merge aconteceria dentro de getDisplay / sortCategories abaixo.

/**
 * Hook useCategoryDisplay
 *
 * Encapsula a lógica de exibição de categorias de CONSUMO (ex: REFRIGERATION,
 * CLIMATE_CONTROL, …), centralizando o acesso a label, ícone e cor.
 *
 * Atualmente opera 100% com fallback local (appliance-icons.ts).
 * Quando o backend expuser /contract-info, este hook será o
 * ponto único para fazer merge dos dados remotos com o fallback local,
 * sem precisar alterar página nenhuma.
 *
 * Uso:
 * ```tsx
 * const { getDisplay, sortCategories } = useCategoryDisplay();
 * const info = getDisplay("REFRIGERATION"); // { label, icon, color }
 * const ordenado = sortCategories(["LIGHTING", "REFRIGERATION"]);
 * ```
 */
export function useCategoryDisplay() {
  const getDisplay = useMemo(
    () =>
      (cat: string): CategoryDisplay =>
        localGetDisplay(cat),
    [], // remoteLabels entraria nas deps futuramente
  );

  const sortCategories = useMemo(
    () =>
      (cats: string[]): string[] =>
        localSortCategories(cats),
    [],
  );

  const getIcon = (cat: string): string => getDisplay(cat).icon;
  const getColor = (cat: string): string => getDisplay(cat).color;

  return { getDisplay, sortCategories, getIcon, getColor };
}
