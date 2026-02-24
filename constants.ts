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
      smokeDetectorArea: 35,
      cabinetArea: 200
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
  // Nhà xưởng / kho
  WAREHOUSE: {
    AREA_PER_SMOKE_DETECTOR_LOW_CEIL: 35,    // m² / đầu (trần ≤ 8m)
    AREA_PER_SMOKE_DETECTOR_HIGH_CEIL: 35,   // m² / đầu (trần > 8m)
    CEIL_HEIGHT_THRESHOLD: 8,                // mét
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
  [BuildingType.WAREHOUSE]: {
    label: 'Nhà xưởng / Kho hàng',
    icon: '🏭',
    description: 'Xưởng sản xuất, kho hàng hóa, nhà máy.',
    technicalNotes: [
      'Tổng số đầu báo tự động tính theo diện tích: 35m² / 1 đầu.',
      'Tổng số tủ tổ hợp chuông đèn tính theo diện tích: 200m² / 1 tủ.',
      'Kho hàng dễ cháy / hóa chất bắt buộc dùng dây cáp cảm biến nhiệt tuyến tính.',
      'Cần phân vùng cháy rõ ràng, mỗi vùng có detector riêng.',
      'Bắt buộc có tủ trung tâm và bộ lưu điện (UPS) dự phòng.',
    ],
    applicablePackages: ['smart'],
  },
};
