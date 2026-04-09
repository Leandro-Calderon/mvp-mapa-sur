import { useDataService } from './useDataService';
import { getDataService } from '../services/OfflineDataService';

export const useStreetsData = () => {
  const { streets } = useDataService(getDataService());
  return streets;
};
