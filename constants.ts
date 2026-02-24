import { FireSafetyConfig, BuildingType } from './types.js';

export const DEFAULT_CONFIG: FireSafetyConfig = {
  equipments: [
    {
      id: 'smoke',
      name: 'Đầu báo khói',
      price: 650000,
      description: 'Phát hiện khói sớm trong các phòng.',
      icon: '💨',
      isDefault: true,
      calcMethod: { type: 'per_room' }
    },
    {
      id: 'heat',
      name: 'Đầu báo nhiệt',
      price: 650000,
      description: 'Chuyên dụng cho nhà bếp hoặc phòng thờ để tránh báo giả.',
      icon: '🔥',
      isDefault: true,
      calcMethod: { type: 'per_kitchen_altar' }
    },
    {
      id: 'combination',
      name: 'Tủ tổ hợp chuông đèn',
      price: 1890000,
      description: 'Phát tín hiệu cảnh báo âm thanh và ánh sáng toàn tầng.',
      icon: '🔔',
      isDefault: true,
      calcMethod: { type: 'per_floor' }
    },
    {
      id: 'panel',
      name: 'Tủ trung tâm báo cháy',
      price: 4650000,
      description: 'Bộ não điều khiển toàn bộ hệ thống báo cháy công trình.',
      icon: '🧠',
      isDefault: true,
      calcMethod: { type: 'per_building' }
    },
    {
      id: 'heatLinear',
      name: 'Dây cáp cảm biến nhiệt',
      price: 85000,
      description: 'Dây cáp nhiệt tuyến tính cho nhà kho, xưởng sản xuất. Tính theo mét.',
      icon: '〰️',
      isDefault: true,
      calcMethod: { type: 'per_area_linear_cable' }
    },
    {
      id: 'bell',
      name: 'Chuông báo cháy',
      price: 320000,
      description: 'Chuông âm thanh lớn dùng cho hành lang.',
      icon: '🔊',
      isDefault: true,
      calcMethod: { type: 'per_floor_bell' }
    }
  ],
  rules: {
    residential: {
      cabinetPerFloors: 2,
      smokePerRoom: 1,
      heatPerKitchenAltar: 1
    },
    warehouse: {
      smokeDetectorArea: 60,
      cabinetArea: 150,
      heatCableRatioGeneral: 0.8,
      heatCableRatioFlammable: 1.2,
      heatCableRatioChemical: 1.5
    }
  }
};
// Quy tắc tính theo TCVN 5738 & tiêu chuẩn thực tiễn
// -----------------------------------------------------------------------

export const CALCULATION_RULES = {
  // Nhà ở dân dụng
  RESIDENTIAL: {
    AREA_PER_SMOKE_DETECTOR: 32.5,  // m² / đầu (trần ≤ 6m)
    FLOORS_PER_COMBINATION: 2,
  },
  // Văn phòng
  OFFICE: {
    AREA_PER_SMOKE_DETECTOR: 30,    // m² / đầu (không gian mở)
    AREA_PER_BELL: 400,             // m² / chuông (trong hành lang)
    FLOORS_PER_COMBINATION: 1,      // mỗi tầng 1 tủ tổ hợp
    MIN_DETECTORS_PER_ROOM: 1,
  },
  // Nhà xưởng / kho
  WAREHOUSE: {
    AREA_PER_SMOKE_DETECTOR_LOW_CEIL: 60,    // m² / đầu (trần ≤ 8m)
    AREA_PER_SMOKE_DETECTOR_HIGH_CEIL: 40,   // m² / đầu (trần > 8m)
    CEIL_HEIGHT_THRESHOLD: 8,                // mét
    HEAT_CABLE_RATIO: 1.2,                   // mét cáp / m² sàn (kho hàng dễ cháy)
    GENERAL_CABLE_RATIO: 0.8,               // mét cáp / m² sàn (kho hàng thông thường)
    CHEM_CABLE_RATIO: 1.5,                  // mét cáp / m² sàn (hóa chất)
    FLOORS_PER_COMBINATION: 1,
    MIN_CONTROL_PANELS: 1,
  },
};

// -----------------------------------------------------------------------
// Thông tin mô tả các loại công trình
// -----------------------------------------------------------------------

export const BUILDING_TYPE_INFO: Record<BuildingType, {
  label: string;
  icon: string;
  description: string;
  technicalNotes: string[];
  applicablePackages: string[];
}> = {
  [BuildingType.RESIDENTIAL]: {
    label: 'Nhà ở dân dụng',
    icon: '🏠',
    description: 'Nhà phố, nhà biệt thự, căn hộ chung cư.',
    technicalNotes: [
      'Tiêu chuẩn lắp đặt: 1 đầu báo khói / phòng hoặc tối đa 35m² / đầu.',
      'Bếp và phòng thờ dùng đầu báo nhiệt để tránh báo động giả.',
      'Hệ thống thông minh có thể kết nối báo về điện thoại.',
    ],
    applicablePackages: ['independent', 'local', 'smart'],
  },
  [BuildingType.OFFICE]: {
    label: 'Văn phòng / Tòa nhà',
    icon: '🏢',
    description: 'Văn phòng, tòa nhà thương mại, trung tâm hành chính.',
    technicalNotes: [
      'Tiêu chuẩn: 1 đầu báo khói mỗi 30m² mặt sàn (TCVN 5738).',
      'Cần lắp chuông báo cháy ở mỗi tầng / hành lang chính.',
      'Mỗi tầng cần 1 tủ tổ hợp chuông đèn báo cháy riêng biệt.',
      'Bắt buộc có tủ trung tâm điều khiển toàn tòa nhà.',
    ],
    applicablePackages: ['local', 'smart'],
  },
  [BuildingType.WAREHOUSE]: {
    label: 'Nhà xưởng / Kho hàng',
    icon: '🏭',
    description: 'Xưởng sản xuất, kho hàng hóa, nhà máy.',
    technicalNotes: [
      'Trần ≤ 8m: 1 đầu báo khói / 60m². Trần > 8m: 1 đầu / 40m².',
      'Kho hàng dễ cháy / hóa chất bắt buộc dùng dây cáp cảm biến nhiệt tuyến tính.',
      'Cần phân vùng cháy rõ ràng, mỗi vùng có detector riêng.',
      'Bắt buộc có tủ trung tâm và bộ lưu điện (UPS) dự phòng.',
    ],
    applicablePackages: ['local', 'smart'],
  },
};
