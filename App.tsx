
import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert, Home, Layout, Settings, PieChart as PieChartIcon,
  Calculator, Info, Building2, Factory, SlidersHorizontal
} from 'lucide-react';
import { PackageType, BuildingType, UserInput, EstimationResult } from './types';
import { CALCULATION_RULES, BUILDING_TYPE_INFO } from './constants';
import { usePriceManager } from './hooks/usePriceManager';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import AiSafetyConsultant from './components/AiSafetyConsultant';
import PriceSettings from './components/PriceSettings';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

// ─── App ─────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const { prices, updatePrices, resetPrices } = usePriceManager();
  const [showPriceSettings, setShowPriceSettings] = useState(false);
  const [backendStatus, setBackendStatus] = useState<string>('Đang kiểm tra...');

  const [userInput, setUserInput] = useState<UserInput>({
    buildingType: BuildingType.RESIDENTIAL,
    floors: 1,
    rooms: 2,
    kitchenAltar: 1,
    totalArea: 50,
    officeDensity: 'medium',
    storageType: 'general',
    ceilingHeight: 6,
  });

  const [packageType, setPackageType] = useState<PackageType>(PackageType.SMART);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setBackendStatus(data.message))
      .catch(() => setBackendStatus('Offline mode'));
  }, []);

  // If building type changes, set sensible package default
  useEffect(() => {
    if (userInput.buildingType === BuildingType.RESIDENTIAL) {
      // keep whatever was chosen
    } else {
      // office & warehouse require at least LOCAL
      if (packageType === PackageType.INDEPENDENT) {
        setPackageType(PackageType.LOCAL);
      }
    }
  }, [userInput.buildingType]);

  // ─── Calculation Logic ────────────────────────────────────────────────────

  const estimation = useMemo((): EstimationResult => {
    let smokeDetectors = 0;
    let heatDetectors = 0;
    let combinationUnits = 0;
    let controlPanels = 0;
    let heatLinearDetectors = 0;
    let alarmBells = 0;

    const { buildingType, floors, rooms, kitchenAltar, totalArea, storageType, ceilingHeight } = userInput;
    const rules = CALCULATION_RULES;

    // ── RESIDENTIAL ──────────────────────────────────────────────────────────
    if (buildingType === BuildingType.RESIDENTIAL) {
      switch (packageType) {
        case PackageType.INDEPENDENT:
          smokeDetectors = rooms;
          heatDetectors = kitchenAltar;
          break;
        case PackageType.LOCAL: {
          const totalDet = Math.ceil(totalArea / rules.RESIDENTIAL.AREA_PER_SMOKE_DETECTOR);
          heatDetectors = kitchenAltar;
          smokeDetectors = Math.max(0, totalDet - heatDetectors);
          combinationUnits = Math.ceil(floors / rules.RESIDENTIAL.FLOORS_PER_COMBINATION);
          break;
        }
        case PackageType.SMART:
          smokeDetectors = rooms;
          heatDetectors = kitchenAltar;
          combinationUnits = Math.ceil(floors / rules.RESIDENTIAL.FLOORS_PER_COMBINATION);
          controlPanels = 1;
          break;
      }

      // ── OFFICE ───────────────────────────────────────────────────────────────
    } else if (buildingType === BuildingType.OFFICE) {
      switch (packageType) {
        case PackageType.LOCAL: {
          smokeDetectors = Math.ceil(totalArea / rules.OFFICE.AREA_PER_SMOKE_DETECTOR);
          combinationUnits = floors; // 1 per floor
          alarmBells = Math.max(1, Math.ceil(totalArea / rules.OFFICE.AREA_PER_BELL));
          break;
        }
        case PackageType.SMART:
        default: {
          smokeDetectors = Math.ceil(totalArea / rules.OFFICE.AREA_PER_SMOKE_DETECTOR);
          combinationUnits = floors;
          alarmBells = Math.max(1, Math.ceil(totalArea / rules.OFFICE.AREA_PER_BELL));
          controlPanels = floors > 3 ? Math.ceil(floors / 5) : 1; // 1 panel per 5 floors
          break;
        }
      }

      // ── WAREHOUSE ─────────────────────────────────────────────────────────────
    } else if (buildingType === BuildingType.WAREHOUSE) {
      const ceiling = ceilingHeight ?? 6;
      const areaPerDet = ceiling > rules.WAREHOUSE.CEIL_HEIGHT_THRESHOLD
        ? rules.WAREHOUSE.AREA_PER_SMOKE_DETECTOR_HIGH_CEIL
        : rules.WAREHOUSE.AREA_PER_SMOKE_DETECTOR_LOW_CEIL;

      smokeDetectors = Math.ceil(totalArea / areaPerDet);

      // Heat cable for flammable / chemical warehouses
      if (storageType === 'flammable') {
        heatLinearDetectors = Math.ceil(totalArea * rules.WAREHOUSE.HEAT_CABLE_RATIO);
      } else if (storageType === 'chemical') {
        heatLinearDetectors = Math.ceil(totalArea * rules.WAREHOUSE.CHEM_CABLE_RATIO);
      } else {
        heatLinearDetectors = Math.ceil(totalArea * rules.WAREHOUSE.GENERAL_CABLE_RATIO);
      }

      combinationUnits = Math.max(1, Math.ceil(floors / rules.WAREHOUSE.FLOORS_PER_COMBINATION));
      controlPanels = 1; // always required for warehouse
    }

    const smokeCost = smokeDetectors * prices.SMOKE_DETECTOR;
    const heatCost = heatDetectors * prices.HEAT_DETECTOR;
    const comboCost = combinationUnits * prices.COMBINATION_UNIT;
    const panelCost = controlPanels * prices.CONTROL_PANEL;
    const cableCost = heatLinearDetectors * prices.HEAT_LINEAR_DETECTOR;
    const bellCost = alarmBells * prices.ALARM_BELL;

    return {
      smokeDetectors, heatDetectors, combinationUnits, controlPanels,
      heatLinearDetectors, alarmBells,
      totalCost: smokeCost + heatCost + comboCost + panelCost + cableCost + bellCost,
      breakdown: {
        smoke: smokeCost, heat: heatCost, combination: comboCost,
        panel: panelCost, heatLinear: cableCost, bell: bellCost,
      },
    };
  }, [userInput, packageType, prices]);

  // ─── Chart Data ──────────────────────────────────────────────────────────

  const chartData = [
    { name: 'Đầu báo khói', value: estimation.breakdown.smoke, color: '#ef4444' },
    { name: 'Đầu báo nhiệt', value: estimation.breakdown.heat, color: '#f97316' },
    { name: 'Tủ tổ hợp', value: estimation.breakdown.combination, color: '#3b82f6' },
    { name: 'Tủ trung tâm', value: estimation.breakdown.panel, color: '#8b5cf6' },
    { name: 'Cáp cảm biến nhiệt', value: estimation.breakdown.heatLinear, color: '#f59e0b' },
    { name: 'Chuông báo cháy', value: estimation.breakdown.bell, color: '#10b981' },
  ].filter(item => item.value > 0);

  // ─── Building Type selector items ────────────────────────────────────────

  const buildingTypes = [
    { type: BuildingType.RESIDENTIAL, icon: Home, label: 'Nhà ở', desc: 'Nhà phố, biệt thự, căn hộ' },
    { type: BuildingType.OFFICE, icon: Building2, label: 'Văn phòng', desc: 'Tòa nhà, thương mại' },
    { type: BuildingType.WAREHOUSE, icon: Factory, label: 'Nhà xưởng', desc: 'Kho hàng, xưởng SX' },
  ];

  // ─── Applicable packages for current building type ────────────────────────

  const applicablePackages = (() => {
    const all = [
      { type: PackageType.INDEPENDENT, label: 'Gói Độc lập', desc: 'Chỉ lắp đầu báo, không dây' },
      { type: PackageType.LOCAL, label: 'Gói Cục bộ', desc: 'Theo diện tích + báo động tầng' },
      { type: PackageType.SMART, label: 'Gói Thông minh', desc: 'Hệ thống trung tâm toàn diện' },
    ];
    const allowed = BUILDING_TYPE_INFO[userInput.buildingType].applicablePackages;
    return all.filter(p => allowed.includes(p.type));
  })();

  const bInfo = BUILDING_TYPE_INFO[userInput.buildingType];

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-red-600 text-white p-4 md:p-6 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg">
              <ShieldAlert className="text-red-600 w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">FireSafe Pro</h1>
              <p className="text-red-100 text-xs">
                Chuyên gia ước tính PCCC &nbsp;·&nbsp;
                <span className="italic opacity-80">{backendStatus}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPriceSettings(true)}
              className="flex items-center gap-2 bg-red-700 hover:bg-red-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden md:inline">Cài đặt giá</span>
            </button>
            <div className="hidden md:block text-right">
              <p className="text-xs uppercase opacity-75">Hỗ trợ 24/7</p>
              <p className="font-semibold">1900 xxxx</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-5">

          {/* 1. Building type selector */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Layout className="text-slate-400 w-5 h-5" />
              <h2 className="text-lg font-bold text-slate-800">Loại công trình</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {buildingTypes.map(({ type, icon: Icon, label, desc }) => (
                <button
                  key={type}
                  onClick={() => setUserInput(p => ({ ...p, buildingType: type }))}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all text-center ${userInput.buildingType === type
                      ? 'border-red-500 bg-red-50 shadow-sm'
                      : 'border-slate-100 hover:border-slate-300'
                    }`}
                >
                  <Icon className={`w-6 h-6 mb-1 ${userInput.buildingType === type ? 'text-red-600' : 'text-slate-400'}`} />
                  <p className={`text-xs font-bold ${userInput.buildingType === type ? 'text-red-700' : 'text-slate-700'}`}>{label}</p>
                  <p className="text-[10px] text-slate-400 hidden sm:block mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* 2. Building parameters */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Home className="text-slate-400 w-5 h-5" />
              <h2 className="text-lg font-bold text-slate-800">Thông số công trình</h2>
            </div>

            <div className="space-y-4">
              {/* Floors */}
              <InputField
                label="Số tầng" unit="Tầng" min={1}
                value={userInput.floors}
                onChange={v => setUserInput(p => ({ ...p, floors: v }))}
              />
              {/* Rooms (residential only) */}
              {userInput.buildingType === BuildingType.RESIDENTIAL && (
                <InputField
                  label="Số phòng ngủ / phòng khách" unit="Phòng" min={1}
                  value={userInput.rooms}
                  onChange={v => setUserInput(p => ({ ...p, rooms: v }))}
                />
              )}
              {/* Kitchen/Altar (residential only) */}
              {userInput.buildingType === BuildingType.RESIDENTIAL && (
                <InputField
                  label="Phòng bếp + Phòng thờ" unit="Phòng" min={0}
                  value={userInput.kitchenAltar}
                  onChange={v => setUserInput(p => ({ ...p, kitchenAltar: v }))}
                />
              )}
              {/* Total area */}
              <InputField
                label="Tổng diện tích mặt sàn" unit="m²" min={1}
                value={userInput.totalArea}
                onChange={v => setUserInput(p => ({ ...p, totalArea: v }))}
              />

              {/* Office-specific */}
              {userInput.buildingType === BuildingType.OFFICE && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật độ nhân viên</label>
                  <select
                    value={userInput.officeDensity}
                    onChange={e => setUserInput(p => ({ ...p, officeDensity: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="low">Thưa (&lt; 5 người/100m²)</option>
                    <option value="medium">Trung bình (5–15 người/100m²)</option>
                    <option value="high">Dày đặc (&gt; 15 người/100m²)</option>
                  </select>
                </div>
              )}

              {/* Warehouse-specific */}
              {userInput.buildingType === BuildingType.WAREHOUSE && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Loại hàng hóa lưu kho</label>
                    <select
                      value={userInput.storageType}
                      onChange={e => setUserInput(p => ({ ...p, storageType: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                    >
                      <option value="general">Hàng hóa thông thường</option>
                      <option value="flammable">Hàng dễ cháy (vải, giấy, gỗ...)</option>
                      <option value="chemical">Hóa chất / chất lỏng dễ cháy</option>
                    </select>
                  </div>
                  <InputField
                    label="Chiều cao trần" unit="m" min={2} step={0.5}
                    value={userInput.ceilingHeight ?? 6}
                    onChange={v => setUserInput(p => ({ ...p, ceilingHeight: v }))}
                  />
                </>
              )}
            </div>
          </section>

          {/* 3. Package selector */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="text-slate-400 w-5 h-5" />
              <h2 className="text-lg font-bold text-slate-800">Chọn gói giải pháp</h2>
            </div>
            <div className="space-y-2">
              {applicablePackages.map(p => (
                <button
                  key={p.type}
                  onClick={() => setPackageType(p.type)}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all ${packageType === p.type
                      ? 'border-red-500 bg-red-50 shadow-md'
                      : 'border-slate-100 hover:border-slate-300'
                    }`}
                >
                  <p className={`font-bold text-sm ${packageType === p.type ? 'text-red-700' : 'text-slate-800'}`}>{p.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* ── Main Results ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-5">

          {/* Building type badge */}
          <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 px-6 py-4 shadow-sm">
            <span className="text-3xl">{bInfo.icon}</span>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Loại công trình</p>
              <p className="font-bold text-slate-800">{bInfo.label}</p>
              <p className="text-xs text-slate-500">{bInfo.description}</p>
            </div>
          </div>

          {/* Total cost card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
                  Ước tính tổng chi phí
                </p>
                <h2 className="text-4xl md:text-5xl font-black text-red-400">
                  {formatCurrency(estimation.totalCost)}
                </h2>
                {prices.updatedAt && (
                  <p className="text-slate-500 text-xs mt-2">
                    Giá cập nhật: {new Date(prices.updatedAt).toLocaleDateString('vi-VN')}
                  </p>
                )}
              </div>
              <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-center min-w-[160px]">
                <p className="text-xs text-slate-400 mb-1">Thời gian thi công</p>
                <p className="text-lg font-bold">
                  {userInput.buildingType === BuildingType.WAREHOUSE ? '3 – 5 Ngày'
                    : userInput.buildingType === BuildingType.OFFICE ? '2 – 4 Ngày'
                      : '1 – 2 Ngày'}
                </p>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Equipment list */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Calculator className="w-4 h-4 text-slate-400" />
                    Danh sách thiết bị
                  </h3>
                  {[
                    { label: 'Đầu báo khói', count: estimation.smokeDetectors, suffix: 'cái', icon: '💨' },
                    { label: 'Đầu báo nhiệt', count: estimation.heatDetectors, suffix: 'cái', icon: '🔥' },
                    { label: 'Tủ tổ hợp chuông đèn', count: estimation.combinationUnits, suffix: 'tủ', icon: '🔔' },
                    { label: 'Tủ trung tâm báo cháy', count: estimation.controlPanels, suffix: 'tủ', icon: '🧠' },
                    { label: 'Dây cáp cảm biến nhiệt', count: estimation.heatLinearDetectors, suffix: 'm', icon: '〰️' },
                    { label: 'Chuông báo cháy', count: estimation.alarmBells, suffix: 'cái', icon: '🔊' },
                  ].filter(i => i.count > 0).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-sm font-medium text-slate-700">{item.label}</span>
                      </div>
                      <span className="font-bold text-slate-900 text-sm">{item.count} {item.suffix}</span>
                    </div>
                  ))}
                </div>

                {/* Donut chart */}
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={80}
                        paddingAngle={4} dataKey="value"
                      >
                        {chartData.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* AI Consultant */}
          <AiSafetyConsultant
            estimation={estimation}
            userInput={userInput}
            packageType={packageType}
          />

          {/* Technical notes */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-600 p-2 rounded-lg shrink-0">
                <Info className="text-white w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 mb-2">Lưu ý kỹ thuật — {bInfo.label}</h3>
                <ul className="text-sm text-blue-800 space-y-2 list-disc ml-4">
                  {bInfo.technicalNotes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">© 2025 FireSafe Pro — Giải pháp an toàn cháy nổ thông minh</p>
          <p className="text-slate-400 text-xs mt-1 italic">
            Kết quả chỉ mang tính chất tham khảo. Vui lòng liên hệ kỹ thuật để có bản vẽ chi tiết.
          </p>
        </div>
      </footer>

      {/* Price Settings Modal */}
      {showPriceSettings && (
        <PriceSettings
          prices={prices}
          onSave={updatePrices}
          onReset={resetPrices}
          onClose={() => setShowPriceSettings(false)}
        />
      )}
    </div>
  );
};

// ─── Reusable number input ────────────────────────────────────────────────────

interface InputFieldProps {
  label: string;
  unit: string;
  value: number;
  min?: number;
  step?: number;
  onChange: (v: number) => void;
}

const InputField: React.FC<InputFieldProps> = ({ label, unit, value, min = 0, step = 1, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    <div className="relative">
      <input
        type="number"
        min={min}
        step={step}
        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none transition-all pr-14"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || min)}
      />
      <span className="absolute right-4 top-2 text-slate-400 text-sm">{unit}</span>
    </div>
  </div>
);

export default App;
