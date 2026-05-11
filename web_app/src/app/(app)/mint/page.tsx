"use client";

import { Suspense } from 'react';
import MaxWidthWrapper from '@/components/MaxWidthWrapper';
import Preloader from '@/components/Preloader';
import Buy from '@/components/buy/Buy';

export default function Page() {
    return (
        <MaxWidthWrapper>
            <Suspense fallback={<Preloader />}>
                <Buy />
            </Suspense>
        </MaxWidthWrapper>
    )
}
