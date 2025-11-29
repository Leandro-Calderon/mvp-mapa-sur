import { useDataService } from './useDataService';
import { createDataService } from '../services/OfflineDataService';

// Create a singleton instance of offline data service
const dataService = createDataService();

export const useBuildingsData = () => {
  const { buildings } = useDataService(dataService);
  return buildings;
};
