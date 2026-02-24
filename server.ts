import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import interface và type từ một file dung chung nếu cần, nhưng hiện tại định nghĩa lại ở đây cho server chạy độc lập.
import { FireSafetyConfig, Equipment, CalcMethodType } from "./types.js";

interface EstimateInput {
  buildingType?: "residential" | "office" | "warehouse";
  packageType?: "independent" | "local" | "smart";
  totalArea: number;
  floors: number;
  rooms: number;
  kitchenAltar: number;
  officeDensity?: 'low' | 'medium' | 'high';
  storageType?: 'general' | 'flammable' | 'chemical';
  ceilingHeight?: number;
}

interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  note: string;
  icon: string;
}

interface EstimateResult {
  totalCost: number;
  equipmentList: EquipmentItem[];
}

import { DEFAULT_CONFIG } from './constants.js';

/**
 * Hàm tính toán chi phí lắp đặt PCCC dự kiến DYNAMIC (Hỗ trợ cấu hình tuỳ chỉnh)
 */
function calculateEstimate(
  input: EstimateInput,
  config: FireSafetyConfig = DEFAULT_CONFIG
): EstimateResult {
  const {
    buildingType = "residential",
    packageType = "smart",
    totalArea,
    floors,
    rooms,
    kitchenAltar,
    storageType,
    ceilingHeight
  } = input;

  const { rules, equipments } = config;

  const equipmentList: EquipmentItem[] = [];
  let totalCost = 0;

  // Tiện ích thêm thiết bị vào kết quả
  function addEquipment(eq: Equipment, quantity: number, note: string) {
    if (quantity <= 0) return;
    const totalPrice = quantity * eq.price;
    equipmentList.push({
      id: eq.id,
      name: eq.name,
      quantity,
      unitPrice: eq.price,
      totalPrice,
      note,
      icon: eq.icon
    });
    totalCost += totalPrice;
  }

  // --- LOGIC TÍNH TOÁN THEO DANH SÁCH THIẾT BỊ --- //
  let warehouseHeatCount = 0;
  if (buildingType === 'warehouse') {
    for (const eq of equipments) {
      const nameLower = eq.name.toLowerCase();
      const isHeat = (eq.id.includes('heat') && !eq.id.includes('cable')) || (nameLower.includes('nhiệt') && !nameLower.includes('cáp'));
      if (isHeat && eq.calcMethod) {
        switch (eq.calcMethod.type) {
          case 'per_room': warehouseHeatCount += rooms > 0 ? rooms : 0; break;
          case 'per_kitchen_altar': warehouseHeatCount += kitchenAltar > 0 ? kitchenAltar : 0; break;
          case 'per_floor': warehouseHeatCount += floors; break;
          case 'per_building': warehouseHeatCount += 1; break;
        }
      }
    }
  }

  for (const eq of equipments) {
    let quantity = 0;
    let note = '';
    const method = eq.calcMethod?.type;

    if (!method) continue;

    // Định danh thiết bị để áp dụng quy tắc Gói
    const nameLower = eq.name.toLowerCase();
    const isSmoke = eq.id.includes('smoke') || nameLower.includes('khói');
    const isHeat = (eq.id.includes('heat') && !eq.id.includes('cable')) || (nameLower.includes('nhiệt') && !nameLower.includes('cáp'));
    const isCabinet = eq.id.includes('cabinet') || nameLower.includes('tủ tổ hợp') || nameLower.includes('chuông đèn');
    const isPanel = eq.id.includes('panel') || nameLower.includes('tủ trung tâm') || nameLower.includes('điều khiển');
    const isBell = eq.id.includes('bell') || nameLower.includes('chuông báo');

    // Quy tắc cho Nhà ở dân dụng
    if (buildingType === "residential") {
      const { cabinetPerFloors, smokePerRoom, heatPerKitchenAltar } = rules.residential || DEFAULT_CONFIG.rules.residential;
      const heatCount = (kitchenAltar > 0) ? kitchenAltar * heatPerKitchenAltar : 0;

      const applyFallback = () => {
        switch (method) {
          case 'per_room': quantity = rooms > 0 ? rooms * smokePerRoom : 0; note = 'Theo số phòng'; break;
          case 'per_kitchen_altar': quantity = heatCount; note = 'Theo bếp/thờ'; break;
          case 'per_floor': quantity = floors; note = 'Theo số tầng (1 cái/tầng)'; break;
          case 'per_area': quantity = Math.ceil(totalArea / 50); note = 'Theo diện tích sàn'; break;
          case 'per_floor_bell': quantity = floors; note = 'Theo số tầng (Chuông)'; break;
          case 'per_building': quantity = 1; note = 'Cố định 1 công trình'; break;
        }
      };

      if (packageType === 'independent') {
        if (isCabinet || isPanel || isBell) {
          quantity = 0;
          note = 'Không sử dụng trong Gói Độc Lập';
        } else if (isSmoke) {
          quantity = rooms > 0 ? rooms * smokePerRoom : 0;
          note = `Mỗi phòng ngủ/khách: ${smokePerRoom} cái`;
        } else if (isHeat) {
          quantity = heatCount;
          note = `Mỗi phòng bếp/thờ: ${heatPerKitchenAltar} cái`;
        } else {
          applyFallback();
        }
      }
      else if (packageType === 'local') {
        if (isPanel) {
          quantity = 0;
          note = 'Không sử dụng trong Gói Cục bộ';
        } else if (isSmoke) {
          quantity = rooms > 0 ? rooms * smokePerRoom : 0;
          note = `Mỗi phòng ngủ/khách: ${smokePerRoom} cái`;
        } else if (isHeat) {
          quantity = heatCount;
          note = `Mỗi phòng bếp/thờ: ${heatPerKitchenAltar} cái`;
        } else if (isCabinet || isBell) {
          quantity = Math.max(1, Math.ceil(floors / 2));
          note = `Mỗi 2 tầng lắp 1 tủ/chuông (Làm tròn lên)`;
        } else {
          applyFallback();
        }
      }
      else if (packageType === 'smart') {
        if (isSmoke) {
          quantity = rooms > 0 ? rooms * smokePerRoom : 0;
          note = `Mỗi phòng ngủ/khách: ${smokePerRoom} cái`;
        } else if (isHeat) {
          quantity = heatCount;
          note = `Mỗi phòng bếp/thờ: ${heatPerKitchenAltar} cái`;
        } else if (isCabinet || isBell) {
          quantity = Math.max(1, Math.ceil(floors / 2));
          note = `Mỗi 2 tầng lắp 1 tủ/chuông (Làm tròn lên)`;
        } else if (isPanel) {
          quantity = 1;
          note = `1 tủ điều khiển trung tâm`;
        } else {
          applyFallback();
        }
      }
    }
    // Quy tắc cho Kho Xưởng
    else if (buildingType === "warehouse") {
      const { smokeDetectorArea, cabinetArea } = rules.warehouse || DEFAULT_CONFIG.rules.warehouse;

      const applyFallback = () => {
        switch (method) {
          case 'per_room':
          case 'per_area': quantity = Math.max(1, Math.ceil(totalArea / smokeDetectorArea)); note = `Cứ ${smokeDetectorArea}m2 sàn trang bị 1 báo khói`; break;
          case 'per_floor': quantity = Math.max(1, Math.ceil(totalArea / cabinetArea)); note = `Cứ ${cabinetArea}m2 kho trang bị 1 tủ/chuông`; break;
          case 'per_building': quantity = 1; note = `1 cái / 1 công trình kho`; break;
        }
      };

      // Nhà xưởng chỉ áp dụng Gói Thông Minh
      if (packageType === 'smart' || true) {
        if (isHeat) {
          quantity = 0;
          switch (method) {
            case 'per_room': quantity = rooms > 0 ? rooms : 0; break;
            case 'per_kitchen_altar': quantity = kitchenAltar > 0 ? kitchenAltar : 0; break;
            case 'per_floor': quantity = floors; break;
            case 'per_building': quantity = 1; break;
          }
          note = `Lắp đặt theo tùy chọn cấu hình: ${quantity} cái`;
        } else if (isSmoke) {
          const totalDetectors = Math.ceil(totalArea / smokeDetectorArea);
          quantity = Math.max(0, totalDetectors - warehouseHeatCount);
          note = `Tổng theo diện tích (${totalDetectors}) trừ báo nhiệt (${warehouseHeatCount})`;
        } else if (isCabinet || isBell) {
          quantity = Math.max(1, Math.ceil(totalArea / cabinetArea));
          note = `Tính theo diện tích (${totalArea}m² / ${cabinetArea}m²)`;
        } else if (isPanel) {
          quantity = 1;
          note = `1 tủ điều khiển trung tâm`;
        } else {
          applyFallback();
        }
      }
    }

    addEquipment(eq, quantity, note);
  }

  return { totalCost, equipmentList };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "FireSafe Backend is active" });
  });

  // API endpoint để tính toán chi phí dự kiến
  app.post("/api/estimate", (req, res) => {
    try {
      // Nhận body có mang theo cả userInput và config
      const customConfig = req.body.config ? { ...DEFAULT_CONFIG, ...req.body.config } : DEFAULT_CONFIG;

      // Gọi hàm tính toán
      const result = calculateEstimate(req.body, customConfig);

      // Trả về kết quả cho Frontend
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Lỗi khi tính toán chi phí:", error);
      res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ khi tính toán." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    // Vì file server được build ra thư mục 'dist-server', thư mục 'dist' của React nằm ở cấp độ cha
    const distPath = path.join(__dirname, "../dist");

    app.use(express.static(distPath));

    // Fallback cho Single Page Application (SPA) - Cách này tương thích với Express v5
    app.use((req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
