import "./SearchPanel.css";

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
  searchQuery,
  searchType,
  appliedQuery,
  appliedType,
  onQueryChange,
  onTypeChange,
  onSubmit,
  onClear,
  onShowAllToggle,
  showAllLayers,
  buildingResults,
  streetResults,
  searchResults,
  collapsed,
  onToggleCollapse,
}: SearchPanelProps) => {
  const placeholders = {
    edificio: "Ej: Torre A, 25B, Edificio 10...",
    departamento: "Ej: 3B, 204, Depto 15...",
    calle: "Ej: Publica P, Pasaje 2...",
    plan: "Ej: 2021, 1234..."
  };

  const previewTexts = {
    edificio: "Buscar edificio...",
    departamento: "Buscar departamento...",
    calle: "Buscar calle...",
    plan: "Buscar plan..."
  };

  const trimmedQuery = searchQuery.trim();
  const trimmedAppliedQuery = appliedQuery.trim();

  const previewText = trimmedAppliedQuery
    ? `Buscando ${appliedType ?? searchType}: ${trimmedAppliedQuery}`
    : trimmedQuery
      ? `Preparar ${searchType}: ${searchQuery}`
      : previewTexts[searchType];

  const isIdle = !trimmedQuery && !trimmedAppliedQuery;

  const handleTypeSelect = (type: SearchType) => {
    if (type !== searchType) {
      onTypeChange(type);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  const clearSearch = () => {
    onClear();
  };

  const togglePanel = () => {
    onToggleCollapse(!collapsed);
  };

  const panelClassName = [
    "search-panel",
    collapsed ? "collapsed" : "",
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
          <div className="search-indicator active">
            <span>✓</span>
            <span>
              {searchResults === 1
                ? "1 resultado encontrado"
                : `${searchResults} resultados encontrados`}
            </span>
          </div>
        )}

        {trimmedAppliedQuery && searchResults === 0 && (
          <div className="search-feedback warning">
            No encontramos coincidencias para tu búsqueda. Revisa los datos ingresados.
          </div>
        )}

        {trimmedAppliedQuery && searchResults > 0 && !showAllLayers && (
          <div className="search-feedback hint">
            Presiona "Ver Todo" para visualizar los resultados sobre el mapa.
          </div>
        )}

        {/* Search type selector - Row 2: Edificio | Departamento */}
        <div className="search-type-row">
          <button
            className={`type-btn type-btn-row ${searchType === "edificio" ? "active" : ""}`}
            onClick={() => handleTypeSelect("edificio")}
          >
            🏢 Edificio
          </button>
          <button
            className={`type-btn type-btn-row ${searchType === "departamento" ? "active" : ""}`}
            onClick={() => handleTypeSelect("departamento")}
          >
            🚪 Departamento
          </button>
        </div>

        {/* Search type selector - Row 3: Calle | Plan */}
        <div className="search-type-row">
          <button
            className={`type-btn type-btn-row ${searchType === "calle" ? "active" : ""}`}
            onClick={() => handleTypeSelect("calle")}
          >
            🛣️ Calle
          </button>
          <button
            className={`type-btn type-btn-row ${searchType === "plan" ? "active" : ""}`}
            onClick={() => handleTypeSelect("plan")}
          >
            📋 Plan
          </button>
        </div>

        {/* Row 4: Input | Ver Todo */}
        <div className="search-input-row">
          <div className="search-input-group">
            <input
              type="text"
              className="search-input"
              placeholder={placeholders[searchType]}
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            {(searchQuery || trimmedAppliedQuery) && (
              <button className="clear-btn" onClick={clearSearch}>
                ×
              </button>
            )}
          </div>
          <button
            className={`layer-btn layer-btn-row ${showAllLayers ? "active" : ""}`}
            onClick={onShowAllToggle}
          >
            <span className="layer-icon">👁️</span>
            <span>Ver Todo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
