import React, { useState } from 'react';
import { Settings, RotateCcw, Save, X, Plus, Trash2, Cpu } from 'lucide-react';
import { FireSafetyConfig, Equipment, CalcMethodType } from '../types';
import { DEFAULT_CONFIG } from '../constants';

interface SystemSettingsProps {
    config: FireSafetyConfig;
    onSave: (newConfig: FireSafetyConfig) => void;
    onReset: () => void;
    onClose: () => void;
}
const formatNum = (v: number) => new Intl.NumberFormat('vi-VN').format(v);

export const getDriveImageUrl = (url: string | undefined): string => {
    if (!url) return '';
    const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        return `https://drive.google.com/uc?id=${match[1]}`;
    }
    return url;
};

const SystemSettings: React.FC<SystemSettingsProps> = ({ config, onSave, onReset, onClose }) => {
    // Ensure companyInfo is initialized
    const [draft, setDraft] = useState<FireSafetyConfig>({
        ...JSON.parse(JSON.stringify(config)),
        companyInfo: config.companyInfo || JSON.parse(JSON.stringify(DEFAULT_CONFIG.companyInfo))
    });
    const [activeTab, setActiveTab] = useState<'company' | 'equipments' | 'rules'>('equipments');

    const handleEquipPriceChange = (id: string, raw: string) => {
        const val = parseInt(raw.replace(/\D/g, ''), 10) || 0;
        setDraft(prev => ({
            ...prev,
            equipments: prev.equipments.map(eq => eq.id === id ? { ...eq, price: val } : eq)
        }));
    };

    const handleAddEquipment = () => {
        const newEq: Equipment = {
            id: 'custom_' + Date.now(),
            name: 'Thiết bị mới',
            price: 150000,
            description: '',
            icon: '📦',
            isDefault: false,
            calcMethod: { type: 'per_floor' }
        };
        setDraft(prev => ({ ...prev, equipments: [...prev.equipments, newEq] }));
    };

    const handleRemoveEq = (id: string) => {
        setDraft(prev => ({
            ...prev,
            equipments: prev.equipments.filter(e => e.id !== id)
        }));
    };

    const handleEqFieldChange = (id: string, field: keyof Equipment, value: any) => {
        setDraft(prev => ({
            ...prev,
            equipments: prev.equipments.map(eq => eq.id === id ? { ...eq, [field]: value } : eq)
        }));
    };

    const handleMethodChange = (id: string, methodType: CalcMethodType) => {
        setDraft(prev => ({
            ...prev,
            equipments: prev.equipments.map(eq => eq.id === id ? { ...eq, calcMethod: { type: methodType } } : eq)
        }));
    };

    const handleRuleChange = (category: 'residential' | 'warehouse', key: string, value: string) => {
        const val = parseFloat(value) || 0;
        setDraft(prev => ({
            ...prev,
            rules: {
                ...prev.rules,
                [category]: {
                    ...prev.rules[category],
                    [key]: val
                }
            }
        }));
    };

    const handleCompanyInfoChange = (field: keyof NonNullable<FireSafetyConfig['companyInfo']>, value: string) => {
        setDraft(prev => ({
            ...prev,
            companyInfo: {
                ...(prev.companyInfo || DEFAULT_CONFIG.companyInfo!),
                [field]: value
            }
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 text-white">
                        <Settings className="w-5 h-5 text-red-500" />
                        <h2 className="font-bold text-lg">Cài đặt Hệ thống</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50 shrink-0 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    <button
                        className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'company' ? 'border-red-600 text-red-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        onClick={() => setActiveTab('company')}
                    >
                        Thông tin Công ty
                    </button>
                    <button
                        className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'equipments' ? 'border-red-600 text-red-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        onClick={() => setActiveTab('equipments')}
                    >
                        Danh sách & Báo giá
                    </button>
                    <button
                        className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'rules' ? 'border-red-600 text-red-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        onClick={() => setActiveTab('rules')}
                    >
                        Thông số (TCVN)
                    </button>
                </div>

                {/* Content */}
                <div className="p-0 overflow-y-auto flex-1 bg-slate-50/50">
                    {activeTab === 'company' ? (
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Thông tin hiển thị</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Tên Công ty / Thương hiệu</label>
                                        <input type="text" value={draft.companyInfo?.name || ''} onChange={e => handleCompanyInfoChange('name', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-sm focus:border-red-500 focus:outline-none" placeholder="VD: PCCC Toàn Cầu" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Logo URL (Đường dẫn ảnh logo)</label>
                                        <input type="text" value={draft.companyInfo?.logoUrl || ''} onChange={e => handleCompanyInfoChange('logoUrl', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-sm focus:border-red-500 focus:outline-none" placeholder="VD: /favicon.svg hoặc https://..." />
                                        {draft.companyInfo?.logoUrl && <img src={getDriveImageUrl(draft.companyInfo.logoUrl)} alt="Logo Preview" className="h-10 mt-2 object-contain" />}
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Số điện thoại liên hệ</label>
                                            <input type="text" value={draft.companyInfo?.phone || ''} onChange={e => handleCompanyInfoChange('phone', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-sm focus:border-red-500 focus:outline-none" placeholder="VD: 09xx xxx xxx" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Địa chỉ</label>
                                            <input type="text" value={draft.companyInfo?.address || ''} onChange={e => handleCompanyInfoChange('address', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-sm focus:border-red-500 focus:outline-none" placeholder="VD: Số 123, Đường ABC, Hà Nội" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'equipments' ? (
                        <div className="p-6 space-y-4">
                            {draft.equipments.map((eq) => (
                                <div key={eq.id} className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center relative group shadow-sm hover:border-red-200 transition-colors">
                                    <div className="text-3xl bg-slate-100 w-12 h-12 flex items-center justify-center rounded-lg">{eq.icon}</div>
                                    <div className="flex-1 space-y-3 w-full">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={eq.name}
                                                onChange={e => handleEqFieldChange(eq.id, 'name', e.target.value)}
                                                className="font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-red-500 focus:outline-none w-full"
                                            />
                                            <input
                                                type="text"
                                                value={eq.icon}
                                                onChange={e => handleEqFieldChange(eq.id, 'icon', e.target.value)}
                                                className="w-8 text-center bg-transparent border-b border-dashed border-slate-300 focus:border-red-500 focus:outline-none"
                                                title="Icon (Emoji)"
                                            />
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <div className="relative w-full sm:w-1/2">
                                                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Đơn giá (VND)</label>
                                                <input
                                                    type="text" inputMode="numeric"
                                                    value={formatNum(eq.price)}
                                                    onChange={(e) => handleEquipPriceChange(eq.id, e.target.value)}
                                                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:border-red-500 focus:outline-none"
                                                />
                                            </div>
                                            <div className="w-full sm:w-1/2">
                                                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Phương pháp tính số lượng</label>
                                                <select
                                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:border-red-500 focus:outline-none"
                                                    value={eq.calcMethod.type}
                                                    onChange={e => handleMethodChange(eq.id, e.target.value as CalcMethodType)}
                                                >
                                                    <option value="per_room">Mỗi phòng ngủ / khách</option>
                                                    <option value="per_kitchen_altar">Mỗi phòng bếp / thờ</option>
                                                    <option value="per_floor">Theo số tầng</option>
                                                    <option value="per_area">Theo diện tích sàn</option>
                                                    <option value="per_floor_bell">Theo hành lang / tầng (Chuông)</option>
                                                    <option value="per_building">Cố định 1 công trình</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveEq(eq.id)}
                                        className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors p-1"
                                        title="Xóa thiết bị"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={handleAddEquipment}
                                className="w-full py-3 border-2 border-dashed border-red-200 text-red-600 rounded-xl flex items-center justify-center gap-2 hover:bg-red-50 hover:border-red-300 font-medium transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Thêm thiết bị tùy chỉnh
                            </button>
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* Residential Rules */}
                            <div>
                                <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">🏠 Thông số Nhà ở</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Mỗi tủ tổ hợp dùng cho bao nhiêu tầng?</label>
                                        <input type="number" value={draft.rules.residential.cabinetPerFloors} onChange={e => handleRuleChange('residential', 'cabinetPerFloors', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Số đầu báo khói / 1 phòng ngủ?</label>
                                        <input type="number" value={draft.rules.residential.smokePerRoom} onChange={e => handleRuleChange('residential', 'smokePerRoom', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Số đầu báo nhiệt / 1 phòng bếp-thờ?</label>
                                        <input type="number" value={draft.rules.residential.heatPerKitchenAltar} onChange={e => handleRuleChange('residential', 'heatPerKitchenAltar', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-sm" />
                                    </div>
                                </div>
                            </div>

                            {/* Warehouse Rules */}
                            <div>
                                <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">🏭 Thông số Kho Xưởng</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Bao nhiêu mét vuông cần 1 Đầu báo khói?</label>
                                        <input type="number" value={draft.rules.warehouse.smokeDetectorArea} onChange={e => handleRuleChange('warehouse', 'smokeDetectorArea', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Bao nhiêu mét vuông cần 1 Tủ tổ hợp?</label>
                                        <input type="number" value={draft.rules.warehouse.cabinetArea} onChange={e => handleRuleChange('warehouse', 'cabinetArea', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-slate-200 bg-white flex gap-3 shrink-0">
                    <button
                        onClick={() => { onReset(); setDraft(JSON.parse(JSON.stringify(DEFAULT_CONFIG))); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" /> Khôi phục mặc định
                    </button>
                    <button
                        onClick={() => { onSave(draft); onClose(); }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-sm transition-colors"
                    >
                        <Save className="w-4 h-4" /> Lưu cấu hình
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;
