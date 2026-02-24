
import React, { useState } from 'react';
import { Settings, RotateCcw, Save, X, DollarSign } from 'lucide-react';
import { PriceConfig } from '../types';
import { DEFAULT_PRICES } from '../constants';

interface PriceSettingsProps {
    prices: PriceConfig;
    onSave: (newPrices: PriceConfig) => void;
    onReset: () => void;
    onClose: () => void;
}

const PRICE_FIELDS: { key: keyof Omit<PriceConfig, 'updatedAt'>; label: string; icon: string; unit: string }[] = [
    { key: 'SMOKE_DETECTOR', label: 'Đầu báo khói', icon: '💨', unit: 'đ/cái' },
    { key: 'HEAT_DETECTOR', label: 'Đầu báo nhiệt', icon: '🔥', unit: 'đ/cái' },
    { key: 'COMBINATION_UNIT', label: 'Tủ tổ hợp chuông đèn', icon: '🔔', unit: 'đ/tủ' },
    { key: 'CONTROL_PANEL', label: 'Tủ trung tâm báo cháy', icon: '🧠', unit: 'đ/tủ' },
    { key: 'HEAT_LINEAR_DETECTOR', label: 'Dây cáp cảm biến nhiệt', icon: '〰️', unit: 'đ/mét' },
    { key: 'ALARM_BELL', label: 'Chuông báo cháy', icon: '🔊', unit: 'đ/cái' },
];

const formatNum = (v: number) =>
    new Intl.NumberFormat('vi-VN').format(v);

const PriceSettings: React.FC<PriceSettingsProps> = ({ prices, onSave, onReset, onClose }) => {
    const [draft, setDraft] = useState<PriceConfig>({ ...prices });

    const handleChange = (key: keyof Omit<PriceConfig, 'updatedAt'>, raw: string) => {
        const val = parseInt(raw.replace(/\D/g, ''), 10) || 0;
        setDraft(prev => ({ ...prev, [key]: val }));
    };

    const handleSave = () => {
        onSave(draft);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                        <DollarSign className="w-5 h-5 text-yellow-400" />
                        <h2 className="font-bold text-lg">Cài đặt giá thiết bị</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Note */}
                <div className="bg-yellow-50 border-b border-yellow-100 px-6 py-3">
                    <p className="text-xs text-yellow-800">
                        💡 Giá chỉ mang tính tham khảo. Cập nhật theo thị trường để có ước tính chính xác hơn.
                    </p>
                    {prices.updatedAt && (
                        <p className="text-xs text-yellow-600 mt-0.5">
                            Cập nhật lần cuối: {new Date(prices.updatedAt).toLocaleString('vi-VN')}
                        </p>
                    )}
                </div>

                {/* Price Fields */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {PRICE_FIELDS.map(({ key, label, icon, unit }) => {
                        const def = DEFAULT_PRICES[key] as number;
                        const cur = draft[key] as number;
                        const diff = cur - def;
                        return (
                            <div key={key} className="flex items-center gap-3">
                                <span className="text-2xl w-8 text-center">{icon}</span>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {label}
                                        <span className="ml-2 text-xs text-slate-400 font-normal">({unit})</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={formatNum(cur)}
                                            onChange={(e) => handleChange(key, e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none pr-10"
                                        />
                                        <span className="absolute right-3 top-2.5 text-xs text-slate-400">đ</span>
                                    </div>
                                    {diff !== 0 && (
                                        <p className={`text-xs mt-0.5 ${diff > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                            {diff > 0 ? '▲' : '▼'} {formatNum(Math.abs(diff))}đ so với mặc định
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={() => { onReset(); setDraft({ ...DEFAULT_PRICES }); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Đặt lại mặc định
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        Lưu giá
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PriceSettings;
