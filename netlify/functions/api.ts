import express from "express";
import serverless from "serverless-http";
import { calculateEstimate } from "../../calculator.js";
import { DEFAULT_CONFIG } from "../../constants.js";

const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "FireSafe Backend is active (Netlify)" });
});

app.post("/api/estimate", (req, res) => {
    try {
        const customConfig = req.body.config ? { ...DEFAULT_CONFIG, ...req.body.config } : DEFAULT_CONFIG;
        const result = calculateEstimate(req.body, customConfig);
        res.json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error("Lỗi khi tính toán:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ trên xử lý Serverless" });
    }
});

// For Netlify Functions, export the handler
export const handler = serverless(app);
