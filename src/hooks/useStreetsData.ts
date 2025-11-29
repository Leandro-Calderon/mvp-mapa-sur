import { useDataService } from './useDataService';
import { createDataService } from '../services/OfflineDataService';

// Create a singleton instance of offline data service
const dataService = createDataService();

export const useStreetsData = () => {
  const { streets } = useDataService(dataService);
  return streets;
};
