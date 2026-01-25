import React, { createContext, useContext, useState, useEffect } from 'react';

interface AddOnContextType {
    isProductsEnabled: boolean;
    isIncentivesEnabled: boolean;
    toggleProducts: (enabled: boolean) => void;
    toggleIncentives: (enabled: boolean) => void;
}

const AddOnContext = createContext<AddOnContextType | undefined>(undefined);

export function AddOnProvider({ children }: { children: React.ReactNode }) {
    const [isProductsEnabled, setIsProductsEnabled] = useState(false);
    const [isIncentivesEnabled, setIsIncentivesEnabled] = useState(false);

    useEffect(() => {
        // Migration logic: Fallback to legacy key if new keys don't exist
        const legacy = localStorage.getItem('isPricingIncentivesEnabled');
        const products = localStorage.getItem('isProductsEnabled');
        const incentives = localStorage.getItem('isIncentivesEnabled');

        if (products !== null) {
            setIsProductsEnabled(JSON.parse(products));
        } else if (legacy) {
            setIsProductsEnabled(JSON.parse(legacy)); // Migrate: if legacy was on, products is on
        }

        if (incentives !== null) {
            setIsIncentivesEnabled(JSON.parse(incentives));
        } else if (legacy) {
            setIsIncentivesEnabled(JSON.parse(legacy)); // Migrate: if legacy was on, incentives is on
        }
    }, []);

    const toggleProducts = (enabled: boolean) => {
        setIsProductsEnabled(enabled);
        localStorage.setItem('isProductsEnabled', JSON.stringify(enabled));
    };

    const toggleIncentives = (enabled: boolean) => {
        setIsIncentivesEnabled(enabled);
        localStorage.setItem('isIncentivesEnabled', JSON.stringify(enabled));
    };

    return (
        <AddOnContext.Provider value={{ isProductsEnabled, isIncentivesEnabled, toggleProducts, toggleIncentives }}>
            {children}
        </AddOnContext.Provider>
    );
}

export function useAddOns() {
    const context = useContext(AddOnContext);
    if (context === undefined) {
        throw new Error('useAddOns must be used within an AddOnProvider');
    }
    return context;
}
