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
  onLayerToggle: (layer: "calles" | "todo") => void;
  showBuildings: boolean;
  showStreets: boolean;
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
  onLayerToggle,
  showBuildings,
  showStreets,
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

  const disableBuildingsButton = !trimmedAppliedQuery || buildingResults === 0;
  const disableStreetsButton = !trimmedAppliedQuery || streetResults === 0;

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

  const handleLayerClick = (layer: "calles" | "todo") => {
    if (layer === "calles") {
      if (disableStreetsButton) {
        return;
      }
      onLayerToggle("calles");
      return;
    }

    if (disableBuildingsButton) {
      return;
    }

    onLayerToggle("todo");
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

        {trimmedAppliedQuery && searchResults > 0 && !showBuildings && !showStreets && (
          <div className="search-feedback hint">
            Selecciona una capa para visualizar los resultados sobre el mapa.
          </div>
        )}

        {/* Search type selector */}
        <div className="search-type-selector">
          <button
            className={`type-btn ${searchType === "edificio" ? "active" : ""}`}
            onClick={() => handleTypeSelect("edificio")}
          >
            🏢 Edificio
          </button>
          <button
            className={`type-btn ${searchType === "departamento" ? "active" : ""}`}
            onClick={() => handleTypeSelect("departamento")}
          >
            🚪 Departamento
          </button>
          <button
            className={`type-btn ${searchType === "calle" ? "active" : ""}`}
            onClick={() => handleTypeSelect("calle")}
          >
            🛣️ Calle
          </button>
          <button
            className={`type-btn ${searchType === "plan" ? "active" : ""}`}
            onClick={() => handleTypeSelect("plan")}
          >
            📋 Plan
          </button>
        </div>

        {/* Search input */}
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

        {/* Layer toggle */}
        <div className="layer-toggle">
          <button
            className={`layer-btn ${showStreets ? "active" : ""} ${disableStreetsButton ? "disabled" : ""}`}
            disabled={disableStreetsButton}
            onClick={() => handleLayerClick("calles")}
          >
            <span className="layer-icon">🛣️</span>
            <span>Ver Calles</span>
          </button>
          <button
            className={`layer-btn ${showBuildings ? "active" : ""} ${disableBuildingsButton ? "disabled" : ""}`}
            disabled={disableBuildingsButton}
            onClick={() => handleLayerClick("todo")}
          >
            <span className="layer-icon">📍</span>
            <span>Ver Construcciones</span>
          </button>
        </div>
      </div>
    </div>
  );
};
