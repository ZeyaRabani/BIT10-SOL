"use client";

import React, { createContext, useContext } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type ChainType = 'solana';

interface ChainContextType {
    chain: ChainType | undefined;
    setChain: (chain: ChainType | undefined) => void;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

export const ChainProvider: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
    const [chain, setChain] = useLocalStorage<ChainType>('chain');

    return (
        <ChainContext.Provider value={{ chain, setChain }}>
            {children}
        </ChainContext.Provider>
    );
};

export const useChain = (): ChainContextType => {
    const context = useContext(ChainContext);
    if (!context) throw new Error('useChain must be used within a ChainProvider');
    return context;
};
