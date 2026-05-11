import { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card';
import { useQueries, type UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { CartesianGrid, XAxis, YAxis, LineChart, Line, Label, Pie, PieChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';

const tabs = ['30D', '60D', '1Y', '3Y'];

type BIT10ComparisonEntry = {
    date: string;
    bit10Top: string;
    bit10Sol: string;
    btc: string;
    eth: string;
    sol: string;
    sp500: string;
    gold: string;
};

type BIT10Entry = {
    timestmpz: string;
    tokenPrice: string;
};

const color = ['#F7931A', '#3C3C3D', '#006097', '#F3BA2F', '#00FFA3', '#B51D06', '#C2A633', '#0033AD', '#29B6F6', '#ff0066'];

export default function TokenDetails({ token_price, token_name, token_list }: { token_price: number, token_name: string, token_list: { id: string; name: string; symbol: string; marketCap: number; price: number; }[] }) {
    const [activeTab, setActiveTab] = useState('3Y');
    const [innerRadius, setInnerRadius] = useState<number>(80);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1200) {
                setInnerRadius(90);
            } else if (window.innerWidth >= 768) {
                setInnerRadius(70);
            } else {
                setInnerRadius(50);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleTabChange = (label: string | null) => {
        if (label) {
            setActiveTab(label)
        }
    }

    const fetchBIT10Preformance = useCallback(async (tokenHistoricalDataAPI: string) => {
        try {
            const response = await fetch(tokenHistoricalDataAPI);

            if (!response.ok) {
                toast.error('Error fetching BIT10 Performance. Please try again!');
                return null;
            }

            if (tokenHistoricalDataAPI === 'bit10-comparison-data-3') {
                const data = await response.json() as {
                    bit10: BIT10ComparisonEntry[];
                };

                const formattedData = data.bit10.map((item) => ({
                    timestmpz: `${item.date} 00:00:00+00`,
                    tokenPrice: Number(item.bit10Sol),
                }));

                return formattedData.reverse();
            } else {
                return [];
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Network error. Please try again!');
            return null;
        }
    }, []);

    const historicalDataQueries = useMemo((): UseQueryOptions[] => {
        const queries: UseQueryOptions[] = [
            {
                queryKey: ['bit10SOLTokenPreformance10Y'],
                queryFn: () => fetchBIT10Preformance('bit10-comparison-data-3'),
                refetchInterval: 14400000, // 4 hrs.
            }
        ]
        return queries;
    }, [fetchBIT10Preformance]);

    const historicalPriceQueries = useQueries({ queries: historicalDataQueries });
    const isLoading = historicalPriceQueries.some((query) => query?.isLoading) || historicalPriceQueries.some((query) => query?.isFetching && !query?.data);
    const bit10SOLPreformance3Y = useMemo(() => historicalPriceQueries[0]?.data as BIT10Entry[], [historicalPriceQueries]);

    const getBIT10Performance = (data: BIT10Entry[], range: string) => {
        if (!data || data.length === 0) {
            return [];
        }

        const latestEntry = data[data.length - 1];
        if (!latestEntry) {
            return [];
        }
        const latestDate = new Date(latestEntry.timestmpz);

        let startDate: Date;

        switch (range) {
            case '30D':
                startDate = new Date(latestDate.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '60D':
                startDate = new Date(latestDate.getTime() - 60 * 24 * 60 * 60 * 1000);
                break;
            case '1Y':
                startDate = new Date(latestDate);
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            case '3Y':
                startDate = new Date(latestDate);
                startDate.setFullYear(startDate.getFullYear() - 3);
                break;
            default:
                return [];
        }

        const filteredData = data.filter(entry => {
            const entryDate = new Date(entry.timestmpz);
            return entryDate >= startDate && entryDate <= latestDate;
        });

        return filteredData;
    };

    const selectedBIT10Token30D = () => {
        if (token_name === 'BIT10.SOL') {
            return getBIT10Performance(bit10SOLPreformance3Y, '30D');
        } else {
            return null;
        }
    };

    const tokens30D = selectedBIT10Token30D();

    const selectedBIT10Token60D = () => {
        if (token_name === 'BIT10.SOL') {
            return getBIT10Performance(bit10SOLPreformance3Y, '60D');
        } else {
            return null;
        }
    };

    const tokens60D = selectedBIT10Token60D();

    const selectedBIT10Token1Y = () => {
        if (token_name === 'BIT10.SOL') {
            return getBIT10Performance(bit10SOLPreformance3Y, '1Y');
        } else {
            return null;
        }
    };

    const tokens1Y = selectedBIT10Token1Y();

    const selectedBIT10Token3Y = () => {
        if (token_name === 'BIT10.SOL') {
            return getBIT10Performance(bit10SOLPreformance3Y, '3Y');
        } else {
            return null;
        }
    };

    const tokens3Y = selectedBIT10Token3Y();

    const calculatePercentageChange = (data: BIT10Entry[] | null) => {
        if (!data || data.length === 0) {
            return { change: 0, isPositive: true };
        }

        const startPrice = data[0]?.tokenPrice !== undefined ? parseFloat(data[0].tokenPrice) : 0;
        const endPrice = typeof token_price === 'number' ? token_price : 0;

        const percentageChange = startPrice !== 0 ? ((endPrice - startPrice) / startPrice) * 100 : 0;

        return {
            change: Math.abs(percentageChange),
            isPositive: percentageChange >= 0
        };
    };

    const getActiveTabData = () => {
        switch (activeTab) {
            case '30D':
                return tokens30D;
            case '60D':
                return tokens60D;
            case '1Y':
                return tokens1Y;
            case '3Y':
                return tokens3Y;
            default:
                return null;
        }
    };

    const priceChange = calculatePercentageChange(getActiveTabData());

    const bit10PreformanceTokenDataName = () => {
        if (token_name === 'BIT10.SOL') {
            return 'bit10SOL';
        } else {
            return 'bit10';
        }
    };

    const tokenDataName = bit10PreformanceTokenDataName();

    const bit10PreformanceTokenName = () => {
        if (token_name === 'BIT10.SOL') {
            return {
                name: 'bit10SOL',
                indexFundName: 'BIT10.SOL'
            };
        } else {
            return {
                name: 'bit10',
                indexFundName: 'BIT10'
            };
        }
    };

    const tokenName = bit10PreformanceTokenName();

    const bit10PreformanceChartConfig: ChartConfig = {
        [tokenName.name]: {
            label: tokenName.indexFundName,
        }
    };

    const bit10Preformance30DChartData = tokens30D?.map((entry) => {
        const date = new Date(entry.timestmpz);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour12: false,
        });

        return {
            day: formatter.format(date),
            [tokenDataName]: parseFloat(Number(entry.tokenPrice).toFixed(4)),
        };
    });

    const bit10Preformance60DChartData = tokens60D?.map((entry) => {
        const date = new Date(entry.timestmpz);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour12: false,
        });

        return {
            day: formatter.format(date),
            [tokenDataName]: parseFloat(Number(entry.tokenPrice).toFixed(4)),
        };
    });

    const bit10Preformance1YChartData = tokens1Y?.map((entry) => {
        const date = new Date(entry.timestmpz);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour12: false,
        });

        return {
            day: formatter.format(date),
            [tokenDataName]: parseFloat(Number(entry.tokenPrice).toFixed(4)),
        };
    });

    const bit10Preformance3YChartData = tokens3Y?.map((entry) => {
        const date = new Date(entry.timestmpz);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour12: false,
        });

        return {
            day: formatter.format(date),
            [tokenDataName]: parseFloat(Number(entry.tokenPrice).toFixed(2)),
        };
    });

    const rawTokens = token_list;
    const tokens = (Array.isArray(rawTokens) ? rawTokens : []) as { name: string, symbol: string; marketCap: number }[];

    const hasValidMarketCap = tokens.some(token => token.marketCap && token.marketCap > 0);

    const bit10AllocationChartConfig: ChartConfig = {
        ...Object.fromEntries(
            tokens.map((token, index) => [
                token.symbol,
                {
                    label: token.symbol.toLocaleUpperCase(),
                    color: color[index % color.length],
                }
            ])
        )
    };

    let totalMarketCap: number;
    let bit10AllocationPieChartData: Array<{ name: string; value: number; fill: string }>;

    if (hasValidMarketCap) {
        totalMarketCap = tokens.reduce((sum, token) => sum + (token.marketCap || 0), 0);

        bit10AllocationPieChartData = tokens.map((token, index) => ({
            name: token.symbol,
            value: parseFloat(((token.marketCap / totalMarketCap) * 100).toFixed(1)),
            fill: color[index % color.length] ?? '',
        }));
    } else {
        const equalPercentage = tokens.length > 0 ? parseFloat((100 / tokens.length).toFixed(1)) : 0;
        totalMarketCap = tokens.length;

        bit10AllocationPieChartData = tokens.map((token, index) => ({
            name: token.symbol,
            value: equalPercentage,
            fill: color[index % color.length] ?? '',
        }));
    }

    return (
        <>
            {isLoading ? (
                <div className='flex flex-col space-y-2 lg:space-y-4 lg:col-span-3'>
                    <Card className='border-none animate-fade-left'>
                        <CardHeader>
                            <CardTitle className='flex flex-row space-x-2 items-center justify-between'>
                                <Skeleton className='bg-muted rounded-md w-16 h-12' />
                                <Skeleton className='bg-muted rounded-md w-36 h-8' />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className='bg-muted rounded-md w-full h-72' />
                        </CardContent>
                    </Card>

                    <Card className='border-none animate-fade-left'>
                        <CardHeader>
                            <CardTitle>
                                <Skeleton className='bg-muted rounded-md w-16 h-8' />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className='bg-muted rounded-md w-full h-68' />
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className='flex flex-col space-y-2 lg:space-y-4 lg:col-span-3'>
                    <Card className='border-none animate-fade-left'>
                        <CardHeader>
                            <CardTitle className='flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 md:items-center md:justify-between'>
                                <div className='flex flex-row space-x-1.5 items-end'>
                                    <div className='md:text-3xl'>${(token_price).toFixed(2)}</div>
                                    <div className={`flex items-center space-x-1 md:pb-0.75 text-sm font-normal ${priceChange.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                        {priceChange.isPositive ? (
                                            <TrendingUpIcon className='w-4 h-4' />
                                        ) : (
                                            <TrendingDownIcon className='w-4 h-4' />
                                        )}
                                        <span>{priceChange.change.toFixed(2)}%</span>
                                    </div>
                                </div>
                                <div className='relative flex flex-row space-x-2 items-center justify-center border rounded-full px-2 py-1.5'>
                                    <AnimatedBackground defaultValue='3Y' className='rounded-full bg-primary' transition={{ ease: 'easeInOut', duration: 0.2 }} onValueChange={(newActiveId) => handleTabChange(newActiveId)}>
                                        {tabs.map((label, index) => (
                                            <button key={index} data-id={label} type='button' className='inline-flex px-2 cursor-pointer items-center justify-center text-center transition-transform active:scale-[0.98] text-sm font-light'>
                                                {label}
                                            </button>
                                        ))}
                                    </AnimatedBackground>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='select-none -ml-12 md:-ml-8'>
                                {
                                    activeTab === '30D' &&
                                    <ChartContainer config={bit10PreformanceChartConfig} className='max-h-75 w-full'>
                                        <LineChart accessibilityLayer data={bit10Preformance30DChartData}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey='day' tickLine axisLine={true} tickMargin={8} tickFormatter={(value: string) => value.slice(0, value.indexOf(','))} stroke='#ffffff' interval='preserveStartEnd' />
                                            <YAxis tickLine axisLine={true} tickMargin={8} tickCount={6} tickFormatter={(value) => `$${(value as number).toFixed(2)}`} stroke='#ffffff' />
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                            <Line dataKey={tokenDataName} type='linear' stroke='#21C45D' strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ChartContainer>
                                }
                                {
                                    activeTab === '60D' &&
                                    <ChartContainer config={bit10PreformanceChartConfig} className='max-h-75 w-full'>
                                        <LineChart accessibilityLayer data={bit10Preformance60DChartData}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey='day' tickLine axisLine={true} tickMargin={8} tickFormatter={(value: string) => value.slice(0, value.indexOf(','))} stroke='#ffffff' interval='preserveStartEnd' />
                                            <YAxis tickLine axisLine={true} tickMargin={8} tickCount={6} tickFormatter={(value) => `$${(value as number).toFixed(2)}`} stroke='#ffffff' />
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                            <Line dataKey={tokenDataName} type='linear' stroke='#21C45D' strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ChartContainer>
                                }
                                {
                                    activeTab === '1Y' &&
                                    <ChartContainer config={bit10PreformanceChartConfig} className='max-h-75 w-full'>
                                        <LineChart accessibilityLayer data={bit10Preformance1YChartData}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey='day' tickLine axisLine={true} tickMargin={8} tickFormatter={(value: string) => { const parts = value.split(' '); return parts.length >= 3 ? `${parts[0]} ${parts[2]}` : value; }} stroke='#ffffff' interval='preserveStartEnd' />
                                            <YAxis tickLine axisLine={true} tickMargin={8} tickCount={6} tickFormatter={(value) => `$${(value as number).toFixed(2)}`} stroke='#ffffff' />
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                            <Line dataKey={tokenDataName} type='linear' stroke='#21C45D' strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ChartContainer>
                                }
                                {
                                    activeTab === '3Y' &&
                                    <ChartContainer config={bit10PreformanceChartConfig} className='max-h-75 w-full'>
                                        <LineChart accessibilityLayer data={bit10Preformance3YChartData}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey='day' tickLine axisLine={true} tickMargin={8} tickFormatter={(value: string) => { const parts = value.split(' '); return parts.length >= 3 ? `${parts[0]} ${parts[2]}` : value; }} stroke='#ffffff' interval='preserveStartEnd' />
                                            <YAxis tickLine axisLine={true} tickMargin={8} tickCount={6} tickFormatter={(value) => `$${(value as number).toFixed(2)}`} stroke='#ffffff' />
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                            <Line dataKey={tokenDataName} type='linear' stroke='#21C45D' strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ChartContainer>
                                }
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='border-none animate-fade-left'>
                        <CardHeader>
                            <CardTitle className='md:text-3xl'>
                                Allocation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className='grid md:grid-cols-5 items-center'>
                            <div className='md:col-span-2'>
                                <div className='flex-1'>
                                    <ChartContainer config={bit10AllocationChartConfig} className='aspect-square max-h-75'>
                                        <PieChart>
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                            <Pie data={bit10AllocationPieChartData} dataKey='value' nameKey='name' innerRadius={innerRadius} strokeWidth={5}>
                                                <Label content={({ viewBox }) => {
                                                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                                        return (
                                                            <text x={viewBox.cx} y={viewBox.cy} textAnchor='middle' dominantBaseline='middle'>
                                                                <tspan x={viewBox.cx} y={viewBox.cy} className='fill-foreground text-xl font-bold'>
                                                                    {token_name}
                                                                </tspan>
                                                                <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 24} className='fill-muted-foreground'>
                                                                    Allocations
                                                                </tspan>
                                                            </text>
                                                        )
                                                    }
                                                }}
                                                />
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>
                                </div>
                            </div>
                            <div className='md:col-span-3'>
                                <div className='grid md:gap-x-6'>
                                    {tokens?.sort((a, b) => {
                                        if (hasValidMarketCap) {
                                            return (b.marketCap || 0) - (a.marketCap || 0);
                                        }
                                        return 0;
                                    }).map((token, index) => (
                                        <div key={index} className='flex flex-row items-center justify-between space-x-8 hover:bg-accent p-1 rounded'>
                                            <div className='flex flex-row items-center space-x-1'>
                                                <div className='w-3 h-3 rounded' style={{ backgroundColor: color[index % color.length] }} />
                                                <div>{token.name} ({token.symbol.toLocaleUpperCase()})</div>
                                            </div>
                                            <div>{hasValidMarketCap
                                                ? `${((token.marketCap / totalMarketCap) * 100).toFixed(1)} %`
                                                : `${(100 / tokens.length).toFixed(1)} %`
                                            }
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </>
    )
}
