import { useState, useCallback } from 'react';
import { FireSafetyConfig } from '../types';
import { DEFAULT_CONFIG } from '../constants';

const STORAGE_KEY = 'firesafe_dynamic_config';

export function useConfigManager() {
    const [config, setConfig] = useState<FireSafetyConfig>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                // Thêm logic dọn dẹp hoặc tương thích ngược ở đây nếu có cấu trúc mới
                const parsed = JSON.parse(stored) as FireSafetyConfig;
                return { ...DEFAULT_CONFIG, ...parsed, equipments: parsed.equipments || DEFAULT_CONFIG.equipments };
            }
        } catch {
            // ignore
        }
        return { ...DEFAULT_CONFIG };
    });

    const updateConfig = useCallback((newConfig: FireSafetyConfig) => {
        const withTimestamp: FireSafetyConfig = {
            ...newConfig,
            updatedAt: new Date().toISOString(),
        };
        setConfig(withTimestamp);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(withTimestamp));
    }, []);

    const resetConfig = useCallback(() => {
        const reset: FireSafetyConfig = {
            ...DEFAULT_CONFIG,
            updatedAt: new Date().toISOString(),
        };
        setConfig(reset);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
    }, []);

    return { config, updateConfig, resetConfig };
}
