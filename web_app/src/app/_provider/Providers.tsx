"use client";

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChainProvider } from '@/context/ChainContext';
import { SolanaWalletProvider } from '@/context/SolanaWalletContext';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <ChainProvider>
                <SolanaWalletProvider>
                    {children}
                </SolanaWalletProvider>
            </ChainProvider>
        </QueryClientProvider>
    );
}
