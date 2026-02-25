import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import calculator logic
import { DEFAULT_CONFIG } from './constants.js';
import { calculateEstimate } from './calculator.js';


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
