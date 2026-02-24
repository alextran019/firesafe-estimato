import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Định nghĩa các interface cho dữ liệu đầu vào và kết quả
type PropertyType = "residential" | "warehouse";

interface EstimateInput {
  propertyType?: PropertyType;
  totalArea: number;
  floors: number;
  rooms: number;
  kitchens: number;
  altars?: number;
}

// Cấu hình linh hoạt cho các loại nhà và giá thiết bị.
// Trong thực tế, bạn có thể lưu bảng này trong Database hoặc JSON file tải từ ngoài.
interface FireSafetyConfig {
  prices: {
    smokeDetector: number;
    heatDetector: number;
    combinationCabinet: number;
  };
  rules: {
    residential: {
      cabinetPerFloors: number;
      smokePerRoom: number;
      heatPerKitchenAltar: number;
    };
    warehouse: {
      smokeDetectorArea: number; // m2/đầu báo khói
      heatDetectorArea?: number; // m2/đầu báo nhiệt (nếu cần)
      cabinetArea: number;       // m2/tủ tổ hợp
    };
  };
}

const DEFAULT_CONFIG: FireSafetyConfig = {
  prices: {
    smokeDetector: 450000,
    heatDetector: 350000,
    combinationCabinet: 1200000,
  },
  rules: {
    residential: {
      cabinetPerFloors: 2, // 1 tủ cho mỗi 2 tầng
      smokePerRoom: 1,     // 1 khói / phòng
      heatPerKitchenAltar: 1 // 1 nhiệt / bếp hoặc thờ
    },
    warehouse: {
      smokeDetectorArea: 35, // 35m2 / 1 đầu báo khói
      cabinetArea: 150       // Ví dụ: 150m2 / 1 tủ tổ hợp
    }
  }
};

interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  note: string;
}

interface EstimateResult {
  totalCost: number;
  equipmentList: EquipmentItem[];
}

/**
 * Hàm tính toán chi phí lắp đặt PCCC dự kiến
 * @param input Thông tin diện tích, số tầng, phòng ngủ, phòng bếp, phòng thờ, loại công trình...
 * @param config Cấu hình tính toán (có thể truyền từ Database / Admin)
 * @returns Tổng chi phí và danh sách thiết bị chi tiết
 */
function calculateEstimate(
  input: EstimateInput,
  config: FireSafetyConfig = DEFAULT_CONFIG
): EstimateResult {
  const { propertyType = "residential", totalArea, floors, rooms, kitchens, altars = 0 } = input;
  const { prices, rules } = config;

  const equipmentList: EquipmentItem[] = [];
  let totalCost = 0;

  // --- LOGIC TÍNH TOÁN THEO LOẠI CÔNG TRÌNH --- //

  if (propertyType === "residential") {
    // 1. DÀNH CHO NHÀ Ở (Theo số phòng & số tầng)
    const { cabinetPerFloors, smokePerRoom, heatPerKitchenAltar } = rules.residential;

    // Tủ tổ hợp
    const cabinetQuantity = Math.max(1, Math.ceil(floors / cabinetPerFloors));
    addEquipment("cabinet", "Tủ tổ hợp bộ (Chuông, đèn, nút ấn)", cabinetQuantity, prices.combinationCabinet, `Mỗi ${cabinetPerFloors} tầng trang bị 1 tủ tổ hợp`);

    // Đầu báo khói
    if (rooms > 0) {
      addEquipment("smoke_detector", "Đầu báo khói", rooms * smokePerRoom, prices.smokeDetector, `Mỗi phòng ngủ trang bị ${smokePerRoom} đầu báo khói`);
    }

    // Đầu báo nhiệt
    const heatDetectorQuantity = (kitchens + altars) * heatPerKitchenAltar;
    if (heatDetectorQuantity > 0) {
      addEquipment("heat_detector", "Đầu báo nhiệt", heatDetectorQuantity, prices.heatDetector, `Mỗi phòng bếp, phòng thờ trang bị ${heatPerKitchenAltar} đầu báo nhiệt`);
    }

  } else if (propertyType === "warehouse") {
    // 2. DÀNH CHO NHÀ KHO / XƯỞNG (Theo diện tích sàn hoặc m2)
    const { smokeDetectorArea, cabinetArea } = rules.warehouse;

    // Tủ tổ hợp tính theo m2
    const cabinetQuantity = Math.max(1, Math.ceil(totalArea / cabinetArea));
    addEquipment("cabinet", "Tủ tổ hợp bộ (Chuông, đèn, nút ấn)", cabinetQuantity, prices.combinationCabinet, `Cứ ${cabinetArea}m2 trang bị 1 tủ tổ hợp`);

    // Đầu báo khói tính theo m2
    const smokeQuantity = Math.max(1, Math.ceil(totalArea / smokeDetectorArea));
    addEquipment("smoke_detector", "Đầu báo khói", smokeQuantity, prices.smokeDetector, `Cứ ${smokeDetectorArea}m2 trang bị 1 đầu báo khói`);
  }

  // Tiện ích để thêm thiết bị vào báo giá
  function addEquipment(id: string, name: string, quantity: number, unitPrice: number, note: string) {
    if (quantity <= 0) return;
    const totalPrice = quantity * unitPrice;
    equipmentList.push({ id, name, quantity, unitPrice, totalPrice, note });
    totalCost += totalPrice;
  }

  return { totalCost, equipmentList };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "FireSafe Backend is active" });
  });

  // API endpoint để tính toán chi phí dự kiến
  app.post("/api/estimate", (req, res) => {
    try {
      // Lấy dữ liệu từ client gởi lên
      const propertyType = (req.body.propertyType === "warehouse") ? "warehouse" : "residential";
      const floors = Number(req.body.floors) || 1;
      const rooms = Number(req.body.rooms) || 0;
      const kitchens = Number(req.body.kitchens) || 0;
      const altars = Number(req.body.altars || req.body.kitchenAltar) || 0;
      const totalArea = Number(req.body.totalArea) || 0;

      // Nếu Frontend truyền cấu hình giá hoặc luật (tuỳ chọn gộp vào thay thế cái mặc định)
      // Để ví dụ ngắn gọn, sử dụng DEFAULT_CONFIG nhưng bạn có thể merge nếu cần.
      const customConfig = req.body.config ? { ...DEFAULT_CONFIG, ...req.body.config } : DEFAULT_CONFIG;

      // Gọi hàm tính toán
      const result = calculateEstimate({
        propertyType, totalArea, floors, rooms, kitchens, altars
      }, customConfig);

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
