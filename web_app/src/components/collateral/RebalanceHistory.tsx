"use client";

import { usePathname, useSearchParams } from 'next/navigation';
import InformationCard from '@/components/InformationCard';
import { useQueries, useQuery } from '@tanstack/react-query';
import { formatCompactNumber, formatCompactPercentNumber } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { getBit10SolRebalance } from '@/actions/dbActions';

type CoinSetData = {
    id: string;
    name: string;
    symbol: string;
    tokenAddress?: string;
    chain?: string;
    noOfTokens: number;
    price: number;
};

type BIT10RebalanceEntry = {
    timestmpz: string;
    indexValue: number;
    priceOfTokenToBuy: number;
    newTokens: CoinSetData[];
    added: CoinSetData[];
    removed: CoinSetData[];
    retained: CoinSetData[];
};

type RebalanceTrade = {
    sellToken: string;
    sellAmount: number;
    buyToken: string;
    buyAmount: number;
    valueUSD: number;
};

const CHART_START_DATE = new Date('2026-03-02T11:00:00.855Z');
const ITEMS_PER_PAGE = 10;

const collateralChartConfig = {
    totalCollateral: {
        label: 'Total Collateral (USD)',
        color: '#F7931A'
    }
};

const supplyChartConfig = {
    totalSupply: {
        label: 'Total Supply',
        color: '#29B6F6'
    }
};

export default function RebalanceHistory({ index_fund }: { index_fund: string }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const isDebugMode = searchParams.get('debug') === 'true';

    const [currentPage, setCurrentPage] = useState(1);
    const isSolPath = pathname === '/collateral/sol';

    const fetchBIT10RebalanceHistory = async (tokenRebalanceAPI: string) => {
        const response = await fetch(`/bit10-rebalance-history-${tokenRebalanceAPI}`);

        if (!response.ok) {
            return [];
        }

        const data = (await response.json()) as BIT10RebalanceEntry[];
        return data;
    };

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['bit10TOPRebalance'],
                queryFn: () => fetchBIT10RebalanceHistory('top')
            }
        ]
    });

    const bit10TOPRebalanceHistory = bit10Queries[0].data;

    const { data: rawSolRebalance, isLoading: isSolLoading } = useQuery({
        queryKey: ['bit10SolRebalance'],
        queryFn: () => getBit10SolRebalance(),
        enabled: isSolPath,
        refetchInterval: 1800000,
    });

    const isLoading = isSolPath
        ? isSolLoading
        : bit10Queries.some((query) => query.isLoading);

    const bit10SolRebalanceHistory: BIT10RebalanceEntry[] = (() => {
        if (!rawSolRebalance || typeof rawSolRebalance === 'string') return [];
        return rawSolRebalance.map((entry) => ({
            timestmpz: entry.timestmpz,
            indexValue: entry.indexValue,
            priceOfTokenToBuy: entry.priceOfTokenToBuy,
            newTokens: (entry.newTokens as CoinSetData[]) ?? [],
            added: (entry.added as CoinSetData[]) ?? [],
            removed: (entry.removed as CoinSetData[]) ?? [],
            retained: (entry.retained as CoinSetData[]) ?? [],
        }));
    })();

    const bit10Token = (): BIT10RebalanceEntry[] => {
        if (pathname === '/collateral/top') {
            return bit10TOPRebalanceHistory ?? [];
        }
        if (isSolPath) {
            return bit10SolRebalanceHistory;
        }
        else {
            return [];
        }
    };

    const selectedBIT10Token = bit10Token();

    const calculateTotalCollateral = (tokens: CoinSetData[]) => tokens?.reduce((sum, t) => sum + t.price * t.noOfTokens, 0) ?? 0;

    const chartEntries = [...selectedBIT10Token].filter((entry) => new Date(entry.timestmpz) >= CHART_START_DATE).reverse();

    const collateralChartData = chartEntries.map((entry) => ({
        date: new Date(entry.timestmpz).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        totalCollateral: parseFloat(calculateTotalCollateral(entry.newTokens).toFixed(4))
    }));

    const supplyChartData = chartEntries.map((entry) => ({
        date: new Date(entry.timestmpz).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        totalSupply: entry.indexValue > 0 ? parseFloat((calculateTotalCollateral(entry.newTokens) / entry.indexValue).toFixed(6)) : 0
    }));

    const totalPages = Math.ceil(selectedBIT10Token.length / ITEMS_PER_PAGE);
    const paginatedEntries = selectedBIT10Token.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const calculateRebalanceTrades = (prevTokens: CoinSetData[], newTokens: CoinSetData[]): {
        trades: RebalanceTrade[];
        needsExternalLiquidity: boolean;
        externalLiquidityAmount: number;
        internalSwaps: RebalanceTrade[];
        externalTokens: Array<{
            symbol: string;
            tokensNeeded: number;
            valueNeeded: number;
            price: number;
        }>;
        collateralChange: 'increase' | 'decrease' | 'same';
        collateralChangeAmount: number;
    } => {
        const prevMap = new Map(prevTokens.map((t) => [t.symbol, t]));
        const newMap = new Map(newTokens.map((t) => [t.symbol, t]));

        const prevTotalValue = calculateTotalCollateral(prevTokens);
        const newTotalValue = calculateTotalCollateral(newTokens);
        const collatteralValueChange = newTotalValue - prevTotalValue;
        const absCollateralChange = Math.abs(collatteralValueChange);

        const MIN_CHANGE_THRESHOLD = 0.01;  // $0.01 minimum to consider a change
        let collateralChange: 'increase' | 'decrease' | 'same' = 'same';
        if (collatteralValueChange > MIN_CHANGE_THRESHOLD) {
            collateralChange = 'increase';
        } else if (collatteralValueChange < -MIN_CHANGE_THRESHOLD) {
            collateralChange = 'decrease';
        }

        const tokenValueChanges = new Map<string, {
            valueChange: number;
            newPrice: number;
            prevPrice: number;
            symbol: string;
            tokensChange: number;
        }>();

        newTokens.forEach((newToken) => {
            const prevToken = prevMap.get(newToken.symbol);
            const prevValue = prevToken ? prevToken.noOfTokens * newToken.price : 0;
            const newValue = newToken.noOfTokens * newToken.price;
            const valueChange = newValue - prevValue;
            const tokensChange = newToken.noOfTokens - (prevToken?.noOfTokens ?? 0);

            tokenValueChanges.set(newToken.symbol, {
                valueChange,
                newPrice: newToken.price,
                prevPrice: prevToken?.price ?? newToken.price,
                symbol: newToken.symbol,
                tokensChange
            });
        });

        prevTokens.forEach((prevToken) => {
            if (!newMap.has(prevToken.symbol)) {
                const valueChange = -(prevToken.noOfTokens * prevToken.price);
                tokenValueChanges.set(prevToken.symbol, {
                    valueChange,
                    newPrice: prevToken.price,
                    prevPrice: prevToken.price,
                    symbol: prevToken.symbol,
                    tokensChange: -prevToken.noOfTokens
                });
            }
        });

        const MIN_TRADE_VALUE = 0.0000001; // $0.0000001 USD minimum
        const tokensToBuy: Array<{ symbol: string; valueNeeded: number; price: number; tokensNeeded: number; }> = [];
        const tokensToSell: Array<{ symbol: string; valueToSell: number; price: number; tokensToSell: number; }> = [];

        tokenValueChanges.forEach((data) => {
            const absValueChange = Math.abs(data.valueChange);
            if (absValueChange < MIN_TRADE_VALUE) return;

            if (data.valueChange > 0) {
                tokensToBuy.push({
                    symbol: data.symbol,
                    valueNeeded: data.valueChange,
                    price: data.newPrice,
                    tokensNeeded: Math.abs(data.tokensChange)
                });
            } else if (data.valueChange < 0) {
                tokensToSell.push({
                    symbol: data.symbol,
                    valueToSell: absValueChange,
                    price: data.newPrice,
                    tokensToSell: Math.abs(data.tokensChange)
                });
            }
        });

        const totalValueToBuy = tokensToBuy.reduce((sum, t) => sum + t.valueNeeded, 0);
        const totalValueToSell = tokensToSell.reduce((sum, t) => sum + t.valueToSell, 0);

        const netValueDifference = totalValueToBuy - totalValueToSell;

        const needsExternalLiquidity = netValueDifference > MIN_TRADE_VALUE && collateralChange !== 'decrease';
        const externalLiquidityAmount = needsExternalLiquidity ? netValueDifference : 0;

        const internalSwaps: RebalanceTrade[] = [];
        const externalTokensDetails: Array<{
            symbol: string;
            tokensNeeded: number;
            valueNeeded: number;
            price: number;
        }> = [];

        const buyList = [...tokensToBuy];
        const sellList = [...tokensToSell];

        let sellIndex = 0;
        let buyIndex = 0;
        let remainingSellValue = sellList[sellIndex]?.valueToSell ?? 0;
        let remainingBuyValue = buyList[buyIndex]?.valueNeeded ?? 0;
        let remainingBuyTokens = buyList[buyIndex]?.tokensNeeded ?? 0;

        while (sellIndex < sellList.length && buyIndex < buyList.length) {
            const sellToken = sellList[sellIndex];
            const buyToken = buyList[buyIndex];

            if (remainingSellValue <= MIN_TRADE_VALUE) {
                sellIndex++;
                remainingSellValue = sellList[sellIndex]?.valueToSell ?? 0;
                continue;
            }

            if (remainingBuyValue <= MIN_TRADE_VALUE) {
                buyIndex++;
                remainingBuyValue = buyList[buyIndex]?.valueNeeded ?? 0;
                remainingBuyTokens = buyList[buyIndex]?.tokensNeeded ?? 0;
                continue;
            }

            const tradeValueUSD = Math.min(remainingSellValue, remainingBuyValue);

            if (tradeValueUSD < MIN_TRADE_VALUE) {
                if (remainingSellValue < remainingBuyValue) {
                    sellIndex++;
                    remainingSellValue = sellList[sellIndex]?.valueToSell ?? 0;
                } else {
                    buyIndex++;
                    remainingBuyValue = buyList[buyIndex]?.valueNeeded ?? 0;
                    remainingBuyTokens = buyList[buyIndex]?.tokensNeeded ?? 0;
                }
                continue;
            }

            if (!sellToken || !buyToken || typeof sellToken.price !== 'number' || typeof buyToken.price !== 'number') {
                if (remainingSellValue < remainingBuyValue) {
                    sellIndex++;
                    remainingSellValue = sellList[sellIndex]?.valueToSell ?? 0;
                } else {
                    buyIndex++;
                    remainingBuyValue = buyList[buyIndex]?.valueNeeded ?? 0;
                    remainingBuyTokens = buyList[buyIndex]?.tokensNeeded ?? 0;
                }
                continue;
            }

            const sellAmount = tradeValueUSD / sellToken.price;
            const buyAmount = tradeValueUSD / buyToken.price;

            internalSwaps.push({
                sellToken: sellToken.symbol,
                sellAmount: Number(sellAmount.toFixed(12)),
                buyToken: buyToken.symbol,
                buyAmount: Number(buyAmount.toFixed(12)),
                valueUSD: Number(tradeValueUSD.toFixed(8))
            });

            remainingSellValue = Math.max(0, remainingSellValue - tradeValueUSD);
            remainingBuyValue = Math.max(0, remainingBuyValue - tradeValueUSD);
            remainingBuyTokens = Math.max(0, remainingBuyTokens - buyAmount);
        }

        if (needsExternalLiquidity) {
            if (buyIndex < buyList.length && remainingBuyValue > MIN_TRADE_VALUE) {
                externalTokensDetails.push({
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    symbol: buyList[buyIndex].symbol,
                    tokensNeeded: remainingBuyTokens,
                    valueNeeded: remainingBuyValue,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    price: buyList[buyIndex].price
                });
            }

            for (let i = buyIndex + 1; i < buyList.length; i++) {
                externalTokensDetails.push({
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    symbol: buyList[i].symbol,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    tokensNeeded: buyList[i].tokensNeeded,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    valueNeeded: buyList[i].valueNeeded,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    price: buyList[i].price
                });
            }
        }

        return {
            trades: internalSwaps,
            needsExternalLiquidity,
            externalLiquidityAmount,
            internalSwaps,
            externalTokens: externalTokensDetails,
            collateralChange,
            collateralChangeAmount: absCollateralChange
        };
    };

    const analyzeRebalanceReason = (prevTokens: CoinSetData[], newTokens: CoinSetData[]): {
        hasChanges: boolean;
        reason: string;
        type: 'growth' | 'identical' | 'minimal' | 'rebalance';
    } => {
        const prevTotal = calculateTotalCollateral(prevTokens);
        const newTotal = calculateTotalCollateral(newTokens);
        const prevMap = new Map(prevTokens.map((t) => [t.symbol, t]));

        const prevSymbols = new Set(prevTokens.map((t) => t.symbol));
        const newSymbols = new Set(newTokens.map((t) => t.symbol));
        const sameTokens = prevSymbols.size === newSymbols.size && [...prevSymbols].every((s) => newSymbols.has(s));

        if (!sameTokens) {
            return {
                hasChanges: true,
                reason: 'Token composition changed',
                type: 'rebalance'
            };
        }

        const IDENTICAL_TOLERANCE = 1e-8;
        const isIdentical = newTokens.every((newToken) => {
            const prevToken = prevMap.get(newToken.symbol);
            if (!prevToken) return false;
            return (Math.abs(newToken.noOfTokens - prevToken.noOfTokens) < IDENTICAL_TOLERANCE);
        });

        if (isIdentical) {
            return {
                hasChanges: false,
                reason: 'Allocations are identical',
                type: 'identical'
            };
        }

        const growthRatio = newTotal / prevTotal;
        const GROWTH_TOLERANCE = 0.02; // 2% tolerance

        if (growthRatio > 1.02) { // At least 2% growth
            const isProportionalGrowth = newTokens.every((newToken) => {
                const prevToken = prevMap.get(newToken.symbol);
                if (!prevToken) return false;

                const expectedNewAmount = prevToken.noOfTokens * growthRatio;
                const actualRatio = newToken.noOfTokens / expectedNewAmount;
                return Math.abs(actualRatio - 1) < GROWTH_TOLERANCE;
            });

            if (isProportionalGrowth) {
                const growthPercent = ((growthRatio - 1) * 100).toFixed(1);
                return {
                    hasChanges: false,
                    reason: `All positions grew proportionally by ~${growthPercent}%`,
                    type: 'growth'
                };
            }
        }

        const MIN_MEANINGFUL_TRADE = 0.01;
        let totalTradeValue = 0;

        newTokens.forEach((newToken) => {
            const prevToken = prevMap.get(newToken.symbol);
            if (prevToken) {
                const changeValue = Math.abs((newToken.noOfTokens - prevToken.noOfTokens) * newToken.price);
                totalTradeValue += changeValue;
            }
        });

        if (totalTradeValue < MIN_MEANINGFUL_TRADE) {
            return {
                hasChanges: false,
                reason: 'Changes are negligible (less than $0.01 total)',
                type: 'minimal'
            };
        }

        const ALLOCATION_TOLERANCE = 0.001; // 0.1% tolerance
        const sameAllocations = newTokens.every((newToken) => {
            const prevToken = prevMap.get(newToken.symbol);
            if (!prevToken) return false;

            const prevAllocation = (prevToken.noOfTokens * prevToken.price) / prevTotal;
            const newAllocation = (newToken.noOfTokens * newToken.price) / newTotal;
            return (Math.abs(prevAllocation - newAllocation) < ALLOCATION_TOLERANCE);
        });

        if (sameAllocations) {
            return {
                hasChanges: false,
                reason: 'Only price updates - allocations unchanged',
                type: 'minimal'
            };
        }

        return {
            hasChanges: true,
            reason: 'Collateral rebalancing required',
            type: 'rebalance'
        };
    };

    return (
        <div className='pb-4'>
            {isLoading ? (
                <Card>
                    <CardContent className='w-full animate-fade-left-slow'>
                        <div className='flex flex-col h-full space-y-2'>
                            {['h-56 w-full', 'h-12 w-28', 'h-72'].map((classes, index) => (
                                <Skeleton key={index} className={classes} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : selectedBIT10Token?.length === 0 ? (
                <InformationCard message='No rebalance information available for this BIT10 token' />
            ) : (
                <Card className='bg-transparent'>
                    <CardContent className='flex flex-col space-y-4'>
                        <div className='border-2 rounded-lg p-2 flex flex-row items-start space-x-2'>
                            <InfoIcon className='size-4 shrink-0 mt-1' />
                            <div>Daily auto-rebalancing is skipped if gas fees exceed transfer value or if allocation exceeds{' '}<span className='font-semibold'>110%</span> collateralization.</div>
                        </div>
                        <h1 className='flex flex-row space-x-1 items-center'>
                            <div className='text-xl md:text-2xl font-semibold uppercase'>
                                BIT10.{index_fund}
                            </div>
                        </h1>

                        {chartEntries.length >= 2 && (
                            <div className='grid lg:grid-cols-2 gap-6'>
                                <div className='border rounded-lg p-4 space-y-2'>
                                    <p className='font-semibold text-base'>Total Collateral (USD)</p>
                                    <div className='flex select-none -ml-6'>
                                        <ChartContainer config={collateralChartConfig} className='max-h-52 w-full'>
                                            <LineChart accessibilityLayer data={collateralChartData}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis dataKey='date' tickLine axisLine tickMargin={8} tickFormatter={(value: string) => value.slice(0, value.indexOf(','))} stroke='#ffffff' />
                                                <YAxis tickLine axisLine tickMargin={8} tickCount={6} tickFormatter={(value) => `$${(value as number).toFixed(0)}`} stroke='#ffffff' />
                                                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                                <Line dataKey='totalCollateral' type='linear' stroke='#21C45D' strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ChartContainer>
                                    </div>
                                </div>

                                <div className='border rounded-lg p-4 space-y-2'>
                                    <p className='font-semibold text-base'>Total Supply</p>
                                    <div className='flex select-none -ml-8'>
                                        <ChartContainer config={supplyChartConfig} className='max-h-52 w-full'>
                                            <LineChart accessibilityLayer data={supplyChartData}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis dataKey='date' tickLine axisLine tickMargin={8} tickFormatter={(value: string) => value.slice(0, value.indexOf(','))} stroke='#ffffff' />
                                                <YAxis tickLine axisLine tickMargin={8} tickCount={6} tickFormatter={(value) => `${(value as number).toFixed(0)}`} stroke='#ffffff' />
                                                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                                <Line dataKey='totalSupply' type='linear' stroke='#21C45D' strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ChartContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className='space-y-8'>
                            {paginatedEntries.map((entry, index) => {
                                const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;

                                if (globalIndex === selectedBIT10Token.length - 1) {
                                    return (
                                        <div key={entry.timestmpz} className='border p-4 rounded-lg'>
                                            <p className='font-semibold text-lg'>Rebalance Date: {new Date(entry.timestmpz).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                            <p className='text-lg'>Index Value: {formatCompactPercentNumber(entry.indexValue)} USD</p>
                                            <p className='text-lg'>Total Collateral: {formatCompactPercentNumber(calculateTotalCollateral(entry.newTokens))} USD</p>
                                            <h3 className='font-medium my-2'>Allocation (Effective {new Date(entry.timestmpz).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})</h3>
                                            <div className='grid grid-cols-1 gap-4'>
                                                <Table className='border-collapse border text-[16px]'>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Symbol</TableHead>
                                                            <TableHead>Price</TableHead>
                                                            <TableHead>Tokens</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {entry.newTokens.map((token) => (
                                                            <TableRow key={token.id}>
                                                                <TableCell className='uppercase'>{token.symbol}</TableCell>
                                                                <TableCell>${formatCompactPercentNumber(token.price)}</TableCell>
                                                                <TableCell>{formatCompactNumber(token.noOfTokens)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    );
                                }

                                const nextEntry = selectedBIT10Token[globalIndex + 1];
                                if (!nextEntry) return null;
                                const rebalanceResult = calculateRebalanceTrades(nextEntry.newTokens, entry.newTokens);
                                const rebalanceAnalysis = analyzeRebalanceReason(nextEntry.newTokens, entry.newTokens);

                                return (
                                    <div key={entry.timestmpz} className='border p-4 rounded-lg'>
                                        <p className='font-semibold text-lg'>Rebalance Date: {new Date(entry.timestmpz).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        <p className='text-lg'>Index Value: {formatCompactPercentNumber(entry.indexValue)} USD</p>
                                        <p className='text-lg'>Total Collateral: {calculateTotalCollateral(entry.newTokens).toFixed(2)} USD</p>

                                        {isDebugMode && (
                                            <>
                                                {rebalanceResult.collateralChange !== 'same' && (
                                                    <div className={`rounded-lg p-3 my-3 ${rebalanceResult.collateralChange === 'increase' ? 'bg-green-900/20 border border-green-800' : 'bg-blue-900/20 border border-blue-800'}`}>
                                                        <p className={`font-medium ${rebalanceResult.collateralChange === 'increase' ? 'text-green-300' : 'text-blue-300'}`}>
                                                            {rebalanceResult.collateralChange === 'increase' ? '📈 ' : '📉 '}Collateral Value
                                                            {rebalanceResult.collateralChange === 'increase' ? 'Increased' : 'Decreased'} by $ {formatCompactNumber(rebalanceResult.collateralChangeAmount)}
                                                            {rebalanceResult.collateralChange === 'decrease'}
                                                        </p>
                                                    </div>
                                                )}

                                                {rebalanceResult.needsExternalLiquidity && (
                                                    <div className='bg-purple-900/20 border border-purple-800 rounded-lg p-3 my-3'>
                                                        <p className='text-purple-300 font-medium'>
                                                            💰 External Liquidity Required: ${formatCompactNumber(rebalanceResult.externalLiquidityAmount)}
                                                        </p>
                                                        <p className='text-purple-400 text-sm mt-1'>
                                                            Tokens requiring external funds: <span className='uppercase'>{rebalanceResult.externalTokens.map((t) => t.symbol).join(', ')}</span>
                                                        </p>
                                                    </div>
                                                )}

                                                <div className={`rounded-lg p-3 my-3 ${rebalanceAnalysis.type === 'growth' ? 'bg-green-900/20 border border-green-800' : rebalanceAnalysis.type === 'identical' || rebalanceAnalysis.type === 'minimal' ? 'bg-blue-900/20 border border-blue-800' : 'bg-orange-900/20 border border-orange-800'}`}>
                                                    <p className={`font-medium ${rebalanceAnalysis.type === 'growth' ? 'text-green-300' : rebalanceAnalysis.type === 'identical' || rebalanceAnalysis.type === 'minimal' ? 'text-blue-300' : 'text-orange-300'}`}>
                                                        {rebalanceAnalysis.type === 'growth' && '📈 '}
                                                        {rebalanceAnalysis.type === 'identical' && '🔄 '}
                                                        {rebalanceAnalysis.type === 'minimal' && '📊 '}
                                                        {rebalanceAnalysis.type === 'rebalance' && '⚖️ '}
                                                        {rebalanceAnalysis.reason}
                                                    </p>
                                                </div>
                                            </>
                                        )}

                                        <div className='flex justify-between my-2'>
                                            <h3 className='font-medium'>
                                                Previous Allocation (as of {new Date(nextEntry.timestmpz).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                                            </h3>
                                            <h3 className='font-medium'>
                                                New Allocation (Effective {new Date(entry.timestmpz).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                                            </h3>
                                        </div>
                                        <div className='grid md:grid-cols-2 gap-4'>
                                            <Table className='border-collapse border text-[16px]'>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Symbol</TableHead>
                                                        <TableHead>Price</TableHead>
                                                        <TableHead>Tokens</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {nextEntry.newTokens.map((token) => (
                                                        <TableRow key={token.id}>
                                                            <TableCell className='uppercase'>{token.symbol}</TableCell>
                                                            <TableCell>${formatCompactPercentNumber(token.price)}</TableCell>
                                                            <TableCell>{formatCompactNumber(token.noOfTokens)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                            <Table className='border-collapse border text-[16px]'>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Symbol</TableHead>
                                                        <TableHead>Price</TableHead>
                                                        <TableHead>Tokens</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {entry.newTokens.map((token) => (
                                                        <TableRow key={token.id}>
                                                            <TableCell className='uppercase'>{token.symbol}</TableCell>
                                                            <TableCell>${formatCompactPercentNumber(token.price)}</TableCell>
                                                            <TableCell>{formatCompactNumber(token.noOfTokens)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {isDebugMode && (
                                            <div className='mt-6'>
                                                <h3 className='font-medium mb-3'>
                                                    {rebalanceResult.needsExternalLiquidity ? 'Internal Swaps' : 'Rebalance Trades'}
                                                </h3>
                                                {rebalanceResult.internalSwaps.length > 0 ? (
                                                    <Table className='border-collapse border text-[16px]'>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Sell Token</TableHead>
                                                                <TableHead>Sell Amount</TableHead>
                                                                <TableHead className='text-center'>→</TableHead>
                                                                <TableHead>Buy Token</TableHead>
                                                                <TableHead>Buy Amount</TableHead>
                                                                <TableHead>Value (USD)</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {rebalanceResult.internalSwaps.map((trade, tradeIndex) => (
                                                                <TableRow key={tradeIndex}>
                                                                    <TableCell className='font-medium uppercase text-red-400'>{trade.sellToken}</TableCell>
                                                                    <TableCell>{formatCompactNumber(trade.sellAmount)}</TableCell>
                                                                    <TableCell className='text-center text-gray-500'>→</TableCell>
                                                                    <TableCell className='font-medium uppercase text-green-400'>{trade.buyToken}</TableCell>
                                                                    <TableCell>{formatCompactNumber(trade.buyAmount)}</TableCell>
                                                                    <TableCell>${formatCompactNumber(trade.valueUSD)}</TableCell>
                                                                </TableRow>
                                                            )
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                ) : (
                                                    <div className={`border rounded-lg p-4 ${rebalanceAnalysis.type === 'rebalance' ? 'bg-yellow-900/20 border-yellow-800' : 'bg-gray-800 border-gray-700'}`}>
                                                        <p className={`text-center ${rebalanceAnalysis.type === 'rebalance' ? 'text-yellow-300' : 'text-gray-400'}`}>
                                                            {rebalanceAnalysis.type === 'rebalance' ? `⚠️ ${rebalanceAnalysis.reason} - but no significant trades calculated (amounts too small)` : `No trades required - ${rebalanceAnalysis.reason.toLowerCase()}`}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {isDebugMode && (
                                            <>
                                                {rebalanceResult.needsExternalLiquidity && rebalanceResult.externalTokens.length > 0 && (
                                                    <div className='mt-4'>
                                                        <h3 className='font-medium mb-3'>External Liquidity Breakdown</h3>
                                                        <div className='bg-purple-900/20 border border-purple-800 rounded-lg p-4'>
                                                            <p className='text-purple-300 mb-3'>Total additional funds needed: <span className='font-semibold'>${formatCompactNumber(rebalanceResult.externalLiquidityAmount)}</span></p>
                                                            <div className='space-y-3'>
                                                                {rebalanceResult.externalTokens.map((tokenDetail) => (
                                                                    <div key={tokenDetail.symbol} className='bg-gray-800 rounded-lg p-3 border border-purple-700'>
                                                                        <div className='flex justify-between items-center'>
                                                                            <span className='font-semibold uppercase text-purple-200'>{tokenDetail.symbol}</span>
                                                                            <span className='text-purple-300 font-medium'>${formatCompactNumber(tokenDetail.valueNeeded)}</span>
                                                                        </div>
                                                                        <div className='mt-2 text-sm text-purple-400'>
                                                                            <div className='flex justify-between'>
                                                                                <span>Tokens needed:</span>
                                                                                <span className='font-mono'>{formatCompactNumber(tokenDetail.tokensNeeded)}</span>
                                                                            </div>
                                                                            <div className='flex justify-between'>
                                                                                <span>Price per token:</span>
                                                                                <span className='font-mono'>${formatCompactNumber(tokenDetail.price)}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <p className='text-purple-400 text-xs mt-3 italic'>* These tokens require external funding as internal swaps cannot cover the full target allocation.</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {totalPages > 1 && (
                            <div className='flex flex-col md:flex-row items-center justify-between px-2 w-full'>
                                <p className='text-sm text-muted-foreground'>Showing {currentPage} of {totalPages} - {selectedBIT10Token.length} total rebalance</p>
                                <div className='flex items-center space-x-2'>
                                    <Button
                                        variant='outline'
                                        size='icon'
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        aria-label='Previous page'
                                    >
                                        <ChevronLeft className='size-4' />
                                    </Button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                                        .reduce<(number | '...')[]>(
                                            (acc, page, idx, arr) => {
                                                if (
                                                    idx > 0 &&
                                                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                                                    (arr[idx - 1]! as number) < page - 1
                                                ) {
                                                    acc.push('...');
                                                }
                                                acc.push(page);
                                                return acc;
                                            },
                                            []
                                        )
                                        .map((item, idx) =>
                                            item === '...' ? (
                                                <span key={`ellipsis-${idx}`} className='px-2 text-muted-foreground'>…</span>
                                            ) : (
                                                <Button
                                                    key={item}
                                                    variant={currentPage === item ? 'default' : 'outline'}
                                                    size='icon'
                                                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                                                    onClick={() => handlePageChange(item as number)}
                                                    aria-label={`Page ${item}`}
                                                    aria-current={currentPage === item ? 'page' : undefined}
                                                >
                                                    {item}
                                                </Button>
                                            )
                                        )}
                                    <Button
                                        variant='outline'
                                        size='icon'
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        aria-label='Next page'
                                    >
                                        <ChevronRight className='size-4' />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
