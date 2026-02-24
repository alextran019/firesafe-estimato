
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { EstimationResult, UserInput, PackageType, BuildingType } from '../types';
import { BUILDING_TYPE_INFO } from '../constants';

interface AiSafetyConsultantProps {
  estimation: EstimationResult;
  userInput: UserInput;
  packageType: PackageType;
}

const PACKAGE_LABELS: Record<PackageType, string> = {
  [PackageType.INDEPENDENT]: 'Gói Độc lập',
  [PackageType.LOCAL]: 'Gói Cục bộ',
  [PackageType.SMART]: 'Gói Thông minh',
};

const AiSafetyConsultant: React.FC<AiSafetyConsultantProps> = ({ estimation, userInput, packageType }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const buildingLabel = BUILDING_TYPE_INFO[userInput.buildingType].label;

  const fetchAiAdvice = async () => {
    setLoading(true);
    setError(false);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const equipmentLines = [
        estimation.smokeDetectors > 0 && `- ${estimation.smokeDetectors} đầu báo khói`,
        estimation.heatDetectors > 0 && `- ${estimation.heatDetectors} đầu báo nhiệt`,
        estimation.combinationUnits > 0 && `- ${estimation.combinationUnits} tủ tổ hợp chuông đèn`,
        estimation.controlPanels > 0 && `- ${estimation.controlPanels} tủ trung tâm báo cháy`,
        estimation.heatLinearDetectors > 0 && `- ${estimation.heatLinearDetectors}m dây cáp cảm biến nhiệt`,
        estimation.alarmBells > 0 && `- ${estimation.alarmBells} chuông báo cháy`,
      ].filter(Boolean).join('\n');

      // Warehouse-specific context
      const warehouseCtx = userInput.buildingType === BuildingType.WAREHOUSE
        ? `\n  - Loại hàng hóa lưu kho: ${userInput.storageType === 'flammable' ? 'Hàng dễ cháy' :
          userInput.storageType === 'chemical' ? 'Hóa chất' : 'Hàng thông thường'
        }\n  - Chiều cao trần: ${userInput.ceilingHeight ?? 6}m`
        : '';

      const prompt = `
Tôi đang thiết kế hệ thống báo cháy cho công trình với thông số:
  - Loại công trình: ${buildingLabel}
  - Số tầng: ${userInput.floors}
  - Số phòng: ${userInput.buildingType === BuildingType.RESIDENTIAL ? userInput.rooms : 'N/A'}
  - Diện tích tổng: ${userInput.totalArea} m²${warehouseCtx}
  - Gói giải pháp: ${PACKAGE_LABELS[packageType]}

Danh sách thiết bị ước tính:
${equipmentLines}

Hãy đóng vai một chuyên gia tư vấn PCCC chuyên nghiệp.
Đưa ra nhận xét ngắn gọn (3–4 câu) về tính an toàn và tính phù hợp của phương án này với loại công trình.
Sau đó đưa ra 2 lời khuyên quan trọng nhất về vị trí lắp đặt thực tế.
Sử dụng tiếng Việt, phong cách chuyên nghiệp, gần gũi. Trình bày bằng Markdown.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite-latest',
        contents: prompt,
        config: { temperature: 0.7, topP: 0.95, topK: 40 },
      });

      setAdvice(response.text || 'Xin lỗi, tôi không thể đưa ra lời khuyên lúc này.');
    } catch (err) {
      console.error('AI Error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiAdvice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimation.totalCost, packageType, userInput.buildingType]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-bold">Trợ lý ảo FireSafe AI</h3>
        </div>
        {loading && <Loader2 className="text-white w-4 h-4 animate-spin" />}
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-3/4" />
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-5/6" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-xl">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm">Không thể kết nối với chuyên gia AI. Vui lòng thử lại sau.</p>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none text-slate-700">
            <div className="flex gap-4 items-start">
              <div className="bg-green-100 p-2 rounded-full shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-line">{advice}</div>
            </div>
            <button
              onClick={fetchAiAdvice}
              className="mt-6 text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition-colors flex items-center gap-1"
            >
              Cập nhật lời khuyên mới
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiSafetyConsultant;
