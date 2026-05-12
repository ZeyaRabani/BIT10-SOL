"use client"

import { Suspense } from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Preloader from '@/components/Preloader'
import Collateral from '@/components/collateral/Collateral'

export default function Page() {
    return (
        <MaxWidthWrapper>
            <Suspense fallback={<Preloader />}>
                <Collateral />
            </Suspense>
        </MaxWidthWrapper>
    )
}
