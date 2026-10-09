import React, { useRef, useState } from "react";
import "./SearchPanel.css";
import { logger } from "../utils/logger";
import type { SearchSuggestion } from "../utils/searchSuggest";

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
  suggestions: SearchSuggestion[];
  onSuggestionSelect: (value: string) => void;
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
  suggestions,
  onSuggestionSelect,
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
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const hasSuggestions = suggestions.length > 0;
  const isSuggestionsListOpen = suggestionsOpen && hasSuggestions;
  const highlightedId = highlightedIndex !== null ? `suggestion-option-${highlightedIndex}` : undefined;

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
    // Keep the list open while typing, but drop the stale highlight
    setHighlightedIndex(null);
  };

  const handleInputFocus = () => {
    if (hasSuggestions) {
      setSuggestionsOpen(true);
    }
  };

  const handleInputBlur = () => {
    setSuggestionsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      if (!hasSuggestions) return;
      e.preventDefault();
      setSuggestionsOpen(true);
      setHighlightedIndex((prev) =>
        prev === null ? 0 : Math.min(prev + 1, suggestions.length - 1)
      );
      return;
    }

    if (e.key === "ArrowUp") {
      if (!hasSuggestions) return;
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev === null || prev === 0 ? null : prev - 1
      );
      return;
    }

    if (e.key === "Escape") {
      // Close the list without letting outer handlers clear the query
      e.preventDefault();
      e.stopPropagation();
      setSuggestionsOpen(false);
      setHighlightedIndex(null);
      return;
    }

    if (e.key === "Enter") {
      if (isSuggestionsListOpen && highlightedIndex !== null) {
        e.preventDefault();
        const selected = suggestions[highlightedIndex];
        if (selected) {
          onSuggestionSelect(selected.value);
          inputRef.current?.blur();
          setSuggestionsOpen(false);
          setHighlightedIndex(null);
        }
        return;
      }
      e.preventDefault();
      logger.debug('SearchPanel: Enter key pressed, calling onSubmit');
      // Blur the input to dismiss the mobile keyboard
      inputRef.current?.blur();
      onSubmit();
    }
  };

  const clearSearch = () => {
    onClear();
  };

  const handleShowAllClick = () => {
    // Blur input to dismiss mobile keyboard
    inputRef.current?.blur();
    // Collapse the panel for better map visibility
    onToggleCollapse(true);
    // Toggle the show all layers state
    onShowAllToggle();
  };

  const togglePanel = () => {
    onToggleCollapse(!_collapsed);
  };

  const panelClassName = [
    "search-panel",
    _collapsed ? "collapsed" : "",
    isIdle ? "idle" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={panelClassName}>
      <div className="search-header" onClick={togglePanel}>
        <div className="search-icon">
          <span className="search-icon-graphic">🔍</span>
        </div>
        <div className="search-input-preview">{previewText}</div>
        <div className="collapse-icon">▼</div>
      </div>

      <div className="search-content">
        {/* Search indicator */}
        {trimmedAppliedQuery && (
          <div className="search-indicator active" aria-live="polite">
            <span>✓</span>
            <span>
              {searchResults === 1
                ? "1 resultado encontrado"
                : `${searchResults} resultados encontrados`}
            </span>
          </div>
        )}

        {trimmedAppliedQuery && searchResults === 0 && (
          <div className="search-feedback warning" aria-live="polite">
            No encontramos coincidencias para tu búsqueda. Revisa los datos ingresados.
          </div>
        )}

        {/* First-run guidance: only while idle (no typed or applied query) */}
        {isIdle && (
          <div className="search-empty-state" role="note">
            <p className="search-empty-title">Buscá en el barrio</p>
            <p className="search-empty-hint">
              Elegí un tipo de búsqueda y escribí el nombre o número, o tocá Ver Todo para ver todo el mapa.
            </p>
          </div>
        )}

        {/* Search type selector - Row 2: Edificio | Departamento */}
        <div className="search-type-row">
          <button
            className={`type-btn type-btn-row ${_type === "edificio" ? "active" : ""}`}
            onClick={() => handleTypeSelect("edificio")}
          >
            🏢 Edificio
          </button>
          <button
            className={`type-btn type-btn-row ${_type === "departamento" ? "active" : ""}`}
            onClick={() => handleTypeSelect("departamento")}
          >
            🚪 Departamento
          </button>
        </div>

        {/* Search type selector - Row 3: Calle | Plan */}
        <div className="search-type-row">
          <button
            className={`type-btn type-btn-row ${_type === "calle" ? "active" : ""}`}
            onClick={() => handleTypeSelect("calle")}
          >
            🛣️ Calle
          </button>
          <button
            className={`type-btn type-btn-row ${_type === "plan" ? "active" : ""}`}
            onClick={() => handleTypeSelect("plan")}
          >
            📋 Plan
          </button>
        </div>

        {/* Row 4: Input | Ver Todo */}
        <div className="search-input-row">
          <div className="search-input-group">
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              role="combobox"
              aria-expanded={isSuggestionsListOpen}
              aria-controls="search-suggestions-listbox"
              aria-autocomplete="list"
              aria-haspopup="listbox"
              aria-activedescendant={highlightedId}
              placeholder={placeholders[_type]}
              aria-label="Buscar"
              value={_query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            {isSuggestionsListOpen && (
              <ul
                id="search-suggestions-listbox"
                className="search-suggestions"
                role="listbox"
              >
                {suggestions.map((suggestion, i) => (
                  <li
                    key={suggestion.value}
                    id={`suggestion-option-${i}`}
                    role="option"
                    aria-selected={i === highlightedIndex}
                    className="search-suggestion-option"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onSuggestionSelect(suggestion.value);
                      inputRef.current?.blur();
                    }}
                  >
                    {suggestion.value}
                  </li>
                ))}
              </ul>
            )}
            {(_query || trimmedAppliedQuery) && (
              <button className="clear-btn" onClick={clearSearch}>
                ×
              </button>
            )}
          </div>
          <button
            className={`layer-btn layer-btn-row ${showAllLayers ? "active" : ""}`}
            onClick={handleShowAllClick}
          >
            <span className="layer-icon">👁️</span>
            <span>Ver Todo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
