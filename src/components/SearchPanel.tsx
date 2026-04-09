import React, { useRef } from "react";
import styles from "./SearchPanel.module.css";
import { logger } from "../utils/logger";

export type SearchType = "edificio" | "departamento" | "calle" | "plan";

interface SearchPanelProps {
  searchQuery: string;
  searchType: SearchType;
  appliedQuery: string;
  appliedType: SearchType | null;
  onQueryChange: (query: string) => void;
  onTypeChange: (type: SearchType) => void;
  onSubmit: () => void;
  onClear: () => void;
  onShowAllToggle: () => void;
  showAllLayers: boolean;
  buildingResults: number;
  streetResults: number;
  searchResults: number;
  collapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
}

export const SearchPanel = ({
  searchQuery: _query,
  searchType: _type,
  appliedQuery,
  appliedType,
  onQueryChange,
  onTypeChange,
  onSubmit,
  onClear,
  onShowAllToggle,
  showAllLayers,
  buildingResults: _buildingResults,
  streetResults: _streetResults,
  searchResults,
  collapsed: _collapsed,
  onToggleCollapse,
}: SearchPanelProps) => {
  const placeholders = {
    edificio: "Ej: 86, D, 22 ",
    departamento: "Ej: 543, 204, 15...",
    calle: "Ej: Publica P, Pasaje 2...",
    plan: "Ej: 077, 123..."
  };

  const previewTexts = {
    edificio: "Buscar edificio...",
    departamento: "Buscar departamento...",
    calle: "Buscar calle...",
    plan: "Buscar plan..."
  };

  const inputRef = useRef<HTMLInputElement>(null);

  const trimmedQuery = _query.trim();
  const trimmedAppliedQuery = appliedQuery.trim();

  const previewText = trimmedAppliedQuery
    ? `Buscando ${appliedType ?? _type}: ${trimmedAppliedQuery}`
    : trimmedQuery
      ? `Preparar ${_type}: ${_query}`
      : previewTexts[_type];

  const isIdle = !trimmedQuery && !trimmedAppliedQuery;

  const handleTypeSelect = (type: SearchType) => {
    if (type !== _type) {
      logger.debug('Type changed', { from: _type, to: type });
      logger.debug('Current state', { appliedQuery, appliedType });
      onTypeChange(type);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      logger.debug('SearchPanel: Enter key pressed, calling onSubmit');
      inputRef.current?.blur();
      onSubmit();
    }
  };

  const clearSearch = () => {
    onClear();
  };

  const handleShowAllClick = () => {
    inputRef.current?.blur();
    onToggleCollapse(true);
    onShowAllToggle();
  };

  const togglePanel = () => {
    onToggleCollapse(!_collapsed);
  };

  const panelClassName = [
    styles.searchPanel!,
    _collapsed ? styles.collapsed! : "",
    isIdle ? styles.idle! : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={panelClassName}>
      <div className={styles.searchHeader!} onClick={togglePanel}>
        <div className={styles.searchIcon!}>
          <span className={styles.searchIconGraphic!}>🔍</span>
        </div>
        <div className={styles.searchInputPreview!}>{previewText}</div>
        <div className={styles.collapseIcon!}>▼</div>
      </div>

      <div className={styles.searchContentWrapper!}>
        <div className={styles.searchContent!}>
          {trimmedAppliedQuery && (
            <div className={`${styles.searchIndicator!} ${styles.active!}`}>
              <span>✓</span>
              <span>
                {searchResults === 1
                  ? "1 resultado encontrado"
                  : `${searchResults} resultados encontrados`}
              </span>
            </div>
          )}

          {trimmedAppliedQuery && searchResults === 0 && (
            <div className={`${styles.searchFeedback!} ${styles.warning!}`}>
              No encontramos coincidencias para tu búsqueda. Revisa los datos ingresados.
            </div>
          )}

          <div className={styles.searchTypeRow!}>
            <button
              className={`${styles.typeBtn!} ${styles.typeBtnRow!} ${_type === "edificio" ? styles.active! : ""}`}
              onClick={() => handleTypeSelect("edificio")}
            >
              🏢 Edificio
            </button>
            <button
              className={`${styles.typeBtn!} ${styles.typeBtnRow!} ${_type === "departamento" ? styles.active! : ""}`}
              onClick={() => handleTypeSelect("departamento")}
            >
              🚪 Departamento
            </button>
          </div>

          <div className={styles.searchTypeRow!}>
            <button
              className={`${styles.typeBtn!} ${styles.typeBtnRow!} ${_type === "calle" ? styles.active! : ""}`}
              onClick={() => handleTypeSelect("calle")}
            >
              🛣️ Calle
            </button>
            <button
              className={`${styles.typeBtn!} ${styles.typeBtnRow!} ${_type === "plan" ? styles.active! : ""}`}
              onClick={() => handleTypeSelect("plan")}
            >
              📋 Plan
            </button>
          </div>

          <div className={styles.searchInputRow!}>
            <div className={styles.searchInputGroup!}>
              <input
                ref={inputRef}
                type="text"
                className={styles.searchInput!}
                placeholder={placeholders[_type]}
                value={_query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
              {(_query || trimmedAppliedQuery) && (
                <button className={styles.clearBtn!} onClick={clearSearch}>
                  ×
                </button>
              )}
            </div>
            <button
              className={`${styles.layerBtn!} ${styles.layerBtnRow!} ${showAllLayers ? styles.active! : ""}`}
              onClick={handleShowAllClick}
            >
              <span className={styles.layerIcon!}>👁️</span>
              <span>Ver Todo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
