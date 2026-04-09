import { useDataService } from './useDataService';
import { getDataService } from '../services/OfflineDataService';

export const useBuildingsData = () => {
  const { buildings } = useDataService(getDataService());
  return buildings;
};
