import { styles } from "../styles/formStyles";

export const FilterForm = ({ 
  filters, 
  onFilterChange, 
  streetFilters, 
  onStreetFilterChange,
  showAll,
  onShowAllChange 
}) => {
  const handleFilterChange = (field) => (e) => {
    onFilterChange({ ...filters, [field]: e.target.value });
  };

  const handleStreetNameChange = (e) => {
    onStreetFilterChange({ ...streetFilters, streetName: e.target.value });
  };

  const handleShowStreetsChange = (e) => {
    onStreetFilterChange({ ...streetFilters, showStreets: e.target.checked });
  };

  const handleShowAllChange = (e) => {
    onShowAllChange(e.target.checked);
  };

  return (
    <form
      className="leaflet-control"
      id="search"
      name="search"
      style={styles.searchForm}
    >
      <input
        type="text"
        name="edificio"
        id="edificio"
        placeholder="Edificio"
        autoComplete="off"
        value={filters.edificio}
        onChange={handleFilterChange("edificio")}
        style={styles.input}
      />
      <input
        type="text"
        name="vivienda"
        id="vivienda"
        placeholder="Departamento"
        autoComplete="off"
        value={filters.vivienda}
        onChange={handleFilterChange("vivienda")}
        style={styles.input}
      />
      <input
        type="text"
        name="plan"
        id="plan"
        placeholder="Plan"
        autoComplete="off"
        value={filters.plan}
        onChange={handleFilterChange("plan")}
        style={styles.input}
      />
      <input
        type="text"
        name="streetName"
        id="streetName"
        placeholder="Nombre de Calle"
        autoComplete="off"
        value={streetFilters.streetName}
        onChange={handleStreetNameChange}
        style={styles.input}
      />
      <div style={styles.checkboxContainer}>
        <input
          type="checkbox"
          name="showStreets"
          id="showStreets"
          checked={streetFilters.showStreets}
          onChange={handleShowStreetsChange}
          style={styles.checkbox}
        />
        <label htmlFor="showStreets" style={styles.checkboxLabel}>
          Mostrar Calles
        </label>
      </div>
      <div style={styles.checkboxContainer}>
        <input
          type="checkbox"
          name="showAll"
          id="showAll"
          checked={showAll}
          onChange={handleShowAllChange}
          style={styles.checkbox}
        />
        <label htmlFor="showAll" style={styles.checkboxLabel}>
          Mostrar Todos
        </label>
      </div>
    </form>
  );
};
