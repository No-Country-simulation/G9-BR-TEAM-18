import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ApplianceItem, ApplianceType } from "../../types";
import { getCategoryDisplay, sortCategories } from "../../data/appliance-icons";
import { LucideIcon } from "../../components/LucideIcon";

interface Props {
  applianceTypes: ApplianceType[];
  selectedAppliances: ApplianceItem[];
  onAdd: (typeId: string) => void;
}

export function ApplianceCatalog({ applianceTypes, selectedAppliances, onAdd }: Props) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const dynamicCategoryOrder = useMemo(() => {
    const cats = new Set(applianceTypes.map((t) => t.mlCategory));
    return sortCategories(Array.from(cats));
  }, [applianceTypes]);

  const categoriesLoaded = useRef(false);

  // Abre automaticamente as 3 primeiras categorias quando os dados carregam
  useEffect(() => {
    if (dynamicCategoryOrder.length > 0 && !categoriesLoaded.current) {
      categoriesLoaded.current = true;
      setOpenCategories(new Set(dynamicCategoryOrder.slice(0, 3)));
    }
  }, [dynamicCategoryOrder]);

  const filteredTypes = useMemo(() => {
    if (!searchTerm.trim()) return applianceTypes;
    const term = searchTerm
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return applianceTypes.filter(
      (t) =>
        t.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .includes(term) || t.mlCategory.toLowerCase().includes(term),
    );
  }, [applianceTypes, searchTerm]);

  function toggleCategory(cat: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  const appliancesByCategory = (cat: string) => filteredTypes.filter((t) => t.mlCategory === cat);

  return (
    <>
      <div className="appliance-search">
        <LucideIcon name="Search" size={16} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Buscar aparelho..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            className="search-clear"
            onClick={() => setSearchTerm("")}
            aria-label="Limpar busca"
          >
            ✕
          </button>
        )}
      </div>

      <div className="appliance-catalog">
        {dynamicCategoryOrder.map((cat) => {
          const catInfo = getCategoryDisplay(cat);
          const appliances = appliancesByCategory(cat);
          if (appliances.length === 0) return null;
          const isOpen = openCategories.has(cat);
          return (
            <div key={cat} className="appliance-category">
              <button
                type="button"
                className="appliance-category-header"
                onClick={() => toggleCategory(cat)}
                aria-label={isOpen ? `Recolher ${catInfo.label}` : `Expandir ${catInfo.label}`}
                style={{ "--cat-color": catInfo.color } as CSSProperties}
              >
                <span className="category-icon">
                  <LucideIcon name={catInfo.icon} size={18} />
                </span>
                <span className="category-label">{catInfo.label}</span>
                <span className="category-count">{appliances.length}</span>
                {isOpen ? (
                  <LucideIcon name="ChevronDown" size={16} />
                ) : (
                  <LucideIcon name="ChevronRight" size={16} />
                )}
              </button>
              {isOpen && (
                <div className="appliance-grid">
                  {appliances.map((t) => {
                    const selected = selectedAppliances.find((s) => s.type === t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`appliance-card ${selected ? "selected" : ""}`}
                        onClick={() => !selected && onAdd(t.id)}
                        aria-label={
                          selected
                            ? `${t.name} - ${selected.quantity}x selecionado`
                            : `Adicionar ${t.name} - ${t.powerWatts}W`
                        }
                        title={`${t.name} - ${t.powerWatts}W, ~${t.dailyUsageHours}h/dia`}
                      >
                        <LucideIcon name={t.icon} size={22} className="appliance-card-icon" />
                        <span className="appliance-card-name">{t.name}</span>
                        <span className="appliance-card-watts">{t.powerWatts}W</span>
                        {selected && (
                          <span className="appliance-card-qty">{selected.quantity}x</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
