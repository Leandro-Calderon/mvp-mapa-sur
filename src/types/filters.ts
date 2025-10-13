export interface BuildingFilters {
  edificio: string;
  vivienda: string;
  plan: string;
}

export interface StreetFilters {
  streetName: string;
  showStreets?: boolean;
}

export interface CombinedFilters {
  buildings: BuildingFilters;
  streets: StreetFilters;
  showAll: boolean;
}
