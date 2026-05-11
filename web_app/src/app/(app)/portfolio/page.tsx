"use client";

import { Suspense } from 'react';
import { useChain } from '@/context/ChainContext';
import MaxWidthWrapper from '@/components/MaxWidthWrapper';
import Preloader from '@/components/Preloader';
import Portfolio from '@/components/portfolio/Portfolio';
import InformationCard from '@/components/InformationCard';

export default function Page() {
    const { chain } = useChain();

    return (
        <MaxWidthWrapper>
            {chain ? (
                <Suspense fallback={<Preloader />}>
                    <Portfolio />
                </Suspense>
            ) : (
                <Suspense fallback={<Preloader />}>
                    <InformationCard message='Connect your wallet to view your Portfolio' />
                </Suspense>
            )}
        </MaxWidthWrapper>
    )
}
