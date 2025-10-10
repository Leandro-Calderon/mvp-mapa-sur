import { useDataService } from './useDataService';
import { GeoJsonDataService } from '../services/DataService';

// Create a singleton instance of the data service
const dataService = new GeoJsonDataService();

export const useStreetsData = () => {
  const { streets } = useDataService(dataService);
  return streets;
};
