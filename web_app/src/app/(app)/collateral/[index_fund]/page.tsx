import React, { Suspense } from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Preloader from '@/components/Preloader'
import RebalanceHistory from '@/components/collateral/RebalanceHistory'

export default async function Page({ params }: { params: Promise<{ index_fund: string }> }) {
    const index_fund = (await params).index_fund;

    return (
        <MaxWidthWrapper>
            <Suspense fallback={<Preloader />}>
                <RebalanceHistory index_fund={index_fund} />
            </Suspense>
        </MaxWidthWrapper>
    )
}
