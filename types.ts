
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

export type CalcMethodType =
  | 'per_room'    // Tính theo số phòng (thường là phòng ngủ)
  | 'per_kitchen_altar' // Tính theo phòng bếp/thờ
  | 'per_area'    // Tính theo diện tích (1 cái / X m2)
  | 'per_floor'   // Tính theo số tầng (1 cái / X tầng, hoặc X cái / 1 tầng)
  | 'per_floor_bell' // Tính chuông báo cháy (hành lang)
  | 'per_area_linear_cable' // Tính theo mét vuông dây cáp tuyến tính
  | 'per_building'; // Cố định (vd: 1 Tủ trung tâm / công trình)

export interface CalcMethod {
  type: CalcMethodType;
  value?: number; // Parameter for the calculation (e.g. area per detector, floors per cabinet). Defaults to 1 if not needed.
}

export interface Equipment {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: string;
  isDefault?: boolean; // Nếu là thiết bị gốc của ứng dụng (không thể xoá)
  calcMethod: CalcMethod;
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

export interface ResidentialRules {
  cabinetPerFloors: number;
  smokePerRoom: number;
  heatPerKitchenAltar: number;
}

export interface WarehouseRules {
  smokeDetectorArea: number; // m2/đầu khói
  cabinetArea: number;       // m2/tủ (nếu tính theo diện tích)
  heatCableRatioGeneral: number;
  heatCableRatioFlammable: number;
  heatCableRatioChemical: number;
}

export interface FireSafetyConfig {
  equipments: Equipment[];
  rules: {
    residential: ResidentialRules;
    warehouse: WarehouseRules;
  };
  updatedAt?: string;
}

export interface EstimationResult {
  totalCost: number;
  equipmentList: {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    note: string;
    icon: string;
  }[];
}

export interface SavedProject {
  id: string;
  name: string;
  userInput: UserInput;
  packageType: PackageType;
  estimation: EstimationResult;
  createdAt: string;
}
