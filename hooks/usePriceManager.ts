
import { useState, useCallback } from 'react';
import { PriceConfig } from '../types';
import { DEFAULT_PRICES } from '../constants';

const STORAGE_KEY = 'firesafe_price_config';

export function usePriceManager() {
    const [prices, setPrices] = useState<PriceConfig>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored) as PriceConfig;
            }
        } catch {
            // ignore
        }
        return { ...DEFAULT_PRICES };
    });

    const updatePrices = useCallback((newPrices: PriceConfig) => {
        const withTimestamp: PriceConfig = {
            ...newPrices,
            updatedAt: new Date().toISOString(),
        };
        setPrices(withTimestamp);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(withTimestamp));
    }, []);

    const resetPrices = useCallback(() => {
        const reset: PriceConfig = {
            ...DEFAULT_PRICES,
            updatedAt: new Date().toISOString(),
        };
        setPrices(reset);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
    }, []);

    return { prices, updatePrices, resetPrices };
}
