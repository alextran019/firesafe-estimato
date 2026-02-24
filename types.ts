
export enum PackageType {
  INDEPENDENT = 'independent',
  LOCAL = 'local',
  SMART = 'smart'
}

export enum BuildingType {
  RESIDENTIAL = 'residential',
  OFFICE = 'office',
  WAREHOUSE = 'warehouse'
}

export interface Equipment {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: string;
}

export interface UserInput {
  buildingType: BuildingType;
  floors: number;
  rooms: number;
  kitchenAltar: number;
  totalArea: number;
  // Office-specific
  officeDensity?: 'low' | 'medium' | 'high'; // người/m²
  // Warehouse-specific
  storageType?: 'general' | 'flammable' | 'chemical'; // loại hàng hóa
  ceilingHeight?: number; // chiều cao trần (m)
}

export interface EstimationResult {
  smokeDetectors: number;
  heatDetectors: number;
  combinationUnits: number;
  controlPanels: number;
  heatLinearDetectors: number; // Dây cáp nhiệt (nhà xưởng)
  alarmBells: number; // Chuông báo cháy (văn phòng)
  totalCost: number;
  breakdown: {
    smoke: number;
    heat: number;
    combination: number;
    panel: number;
    heatLinear: number;
    bell: number;
  };
}

export interface PriceConfig {
  SMOKE_DETECTOR: number;
  HEAT_DETECTOR: number;
  COMBINATION_UNIT: number;
  CONTROL_PANEL: number;
  HEAT_LINEAR_DETECTOR: number; // giá/mét dây cáp nhiệt
  ALARM_BELL: number;
  updatedAt?: string;
}

export interface SavedProject {
  id: string;
  name: string;
  userInput: UserInput;
  packageType: PackageType;
  estimation: EstimationResult;
  createdAt: string;
}
