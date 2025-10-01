import { styles } from "../styles/formStyles";

export const FilterForm = ({ filters, onFilterChange }) => {
  const handleFilterChange = (field) => (e) => {
    onFilterChange({ ...filters, [field]: e.target.value });
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
        placeholder="Filtrar edificio"
        autoComplete="off"
        value={filters.edificio}
        onChange={handleFilterChange("edificio")}
        style={styles.input}
      />
      <input
        type="text"
        name="vivienda"
        id="vivienda"
        placeholder="Filtrar vivienda"
        autoComplete="off"
        value={filters.vivienda}
        onChange={handleFilterChange("vivienda")}
        style={styles.input}
      />
      <input
        type="text"
        name="plan"
        id="plan"
        placeholder="Filtrar por plan"
        autoComplete="off"
        value={filters.plan}
        onChange={handleFilterChange("plan")}
        style={styles.input}
      />
    </form>
  );
};
