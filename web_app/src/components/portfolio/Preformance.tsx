"use client";

import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardTitle, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { CartesianGrid, XAxis, YAxis, LineChart, Line } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

const tabs = ['30D', '60D', '1Y', '3Y'];

type BIT10Entry = {
    date: string;
    bit10Top: string;
    bit10Sol: string;
    btc: string;
    eth: string;
    sol: string;
    sp500: string;
    gold: string;
};

export default function BIT10Preformance() {
    const [selectedPreformanceToken, setSelectedPreformanceToken] = useState('BIT10.SOL');
    const [activeTab, setActiveTab] = useState('30D');

    const handleTabChange = (label: string | null) => {
        if (label) {
            setActiveTab(label)
        }
    }

    const fetchBIT103YPreformance = async () => {
        try {
            const response = await fetch('bit10-comparison-data-3');

            if (!response.ok) {
                toast.error('Error fetching BIT10 Performance. Please try again!');
                return null;
            }

            const data = await response.json() as { bit10: BIT10Entry[] };
            return { bit10: data.bit10.reverse() };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Network error. Please try again!');
            return null;
        }
    };

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['bit10TOPTokenPreformance3Y'],
                queryFn: () => fetchBIT103YPreformance()
            }
        ],
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    const bit10TOPPreformance3Y = bit10Queries[0].data?.bit10 ?? [];

    const getBIT10Performance = (data: BIT10Entry[], range: string) => {
        if (!data || data.length === 0) {
            return [];
        }

        const latestEntry = data[data.length - 1];
        if (!latestEntry) {
            return [];
        }
        const latestDate = new Date(latestEntry.date);

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
            const entryDate = new Date(entry.date);
            return entryDate >= startDate && entryDate <= latestDate;
        });

        return filteredData;
    };

    const selectedBIT10Token30D = () => {
        if (selectedPreformanceToken === 'BIT10.SOL') {
            return getBIT10Performance(bit10TOPPreformance3Y, '30D');
        } else {
            return null;
        }
    };

    const tokens30D = selectedBIT10Token30D();

    const selectedBIT10Token60D = () => {
        if (selectedPreformanceToken === 'BIT10.SOL') {
            return getBIT10Performance(bit10TOPPreformance3Y, '60D');
        } else {
            return null;
        }
    };

    const tokens60D = selectedBIT10Token60D();

    const selectedBIT10Token1Y = () => {
        if (selectedPreformanceToken === 'BIT10.SOL') {
            return getBIT10Performance(bit10TOPPreformance3Y, '1Y');
        } else {
            return null;
        }
    };

    const tokens1Y = selectedBIT10Token1Y();

    const selectedBIT10Token3Y = () => {
        if (selectedPreformanceToken === 'BIT10.SOL') {
            return getBIT10Performance(bit10TOPPreformance3Y, '3Y');
        } else {
            return null;
        }
    };

    const tokens3Y = selectedBIT10Token3Y();

    const selectedBIT10TokenChange = () => {
        if (selectedPreformanceToken === 'BIT10.SOL') {
            return bit10TOPPreformance3Y;
        } else {
            return null;
        }
    };

    const tokensChange = selectedBIT10TokenChange();

    const getSimplePercentageChange = (data: BIT10Entry[], range: string) => {
        if (!data || data.length < 2) return 0;

        const lastEntry = data[data.length - 1];
        if (!lastEntry) return 0;

        const currentPrice = Number(lastEntry.bit10Sol) ?? 0;
        const timestamp = lastEntry.date;
        if (!timestamp) return 0;

        const now = new Date(timestamp);
        let targetDate: Date;

        if (range === '30D') {
            targetDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (range === '60D') {
            targetDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        } else {
            return 0;
        }

        let closestEntry = data[0];
        if (!closestEntry?.date) return 0;
        let closestDiff = Math.abs(new Date(closestEntry.date).getTime() - targetDate.getTime());

        for (let i = 1; i < data.length; i++) {
            const entry = data[i];
            if (!entry?.date) continue;
            const diff = Math.abs(new Date(entry.date).getTime() - targetDate.getTime());
            if (diff < closestDiff) {
                closestDiff = diff;
                closestEntry = entry;
            }
        }

        if (!closestEntry) return 0;
        const previousPrice = Number(closestEntry.bit10Sol) || 0;

        if (previousPrice === 0) return 0;
        return ((currentPrice - previousPrice) / previousPrice) * 100;
    };

    const getAnnualizedReturn = (data: BIT10Entry[], range: string) => {
        if (!data || data.length < 2) return 0;

        const lastEntry = data[data.length - 1];
        if (!lastEntry) return 0;

        const finalValue = Number(lastEntry.bit10Sol) ?? 0;
        const timestamp = lastEntry.date;
        if (!timestamp) return 0;

        const now = new Date(timestamp);
        let targetDate: Date;
        let years: number;

        if (range === '1Y') {
            targetDate = new Date(now);
            targetDate.setFullYear(targetDate.getFullYear() - 1);
            years = 1;
        } else if (range === '3Y') {
            targetDate = new Date(now);
            targetDate.setFullYear(targetDate.getFullYear() - 3);
            years = 3;
        } else {
            return 0;
        }

        let closestEntry = data[0];
        if (!closestEntry?.date) return 0;
        let closestDiff = Math.abs(new Date(closestEntry.date).getTime() - targetDate.getTime());

        for (let i = 1; i < data.length; i++) {
            const entry = data[i];
            if (!entry?.date) continue;
            const diff = Math.abs(new Date(entry.date).getTime() - targetDate.getTime());
            if (diff < closestDiff) {
                closestDiff = diff;
                closestEntry = entry;
            }
        }

        if (!closestEntry) return 0;
        const initialValue = Number(closestEntry.bit10Sol) || 0;

        if (initialValue === 0 || years <= 0) return 0;
        return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
    };

    const percentageChange30Days = getSimplePercentageChange(tokensChange ?? [], '30D');
    const percentageChange60Days = getSimplePercentageChange(tokensChange ?? [], '60D');
    const percentageChange1Year = getAnnualizedReturn(tokensChange ?? [], '1Y');
    const percentageChange3Year = getAnnualizedReturn(tokensChange ?? [], '3Y');

    const bit10PreformanceTokenDataName = () => {
        if (selectedPreformanceToken === 'BIT10.SOL') {
            return 'bit10TOP';
        } else {
            return 'bit10';
        }
    };

    const tokenDataName = bit10PreformanceTokenDataName();

    const bit10TokenName = ['BIT10.SOL'];

    const bit10PreformanceTokenName = () => {
        if (selectedPreformanceToken === 'BIT10.SOL') {
            return {
                name: 'bit10TOP',
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
        const date = new Date(entry.date);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour12: false,
        });

        return {
            day: formatter.format(date),
            [tokenDataName]: parseFloat(Number(entry.bit10Sol).toFixed(2)),
        };
    });

    const bit10Preformance60DChartData = tokens60D?.map((entry) => {
        const date = new Date(entry.date);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour12: false,
        });

        return {
            day: formatter.format(date),
            [tokenDataName]: parseFloat(Number(entry.bit10Sol).toFixed(2)),
        };
    });

    const bit10Preformance1YChartData = tokens1Y?.map((entry) => {
        const date = new Date(entry.date);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour12: false,
        });

        return {
            day: formatter.format(date),
            [tokenDataName]: parseFloat(Number(entry.bit10Sol).toFixed(2)),
        };
    });

    const bit10Preformance3YChartData = tokens3Y?.map((entry) => {
        const date = new Date(entry.date);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour12: false,
        });

        return {
            day: formatter.format(date),
            [tokenDataName]: parseFloat(Number(entry.bit10Sol).toFixed(2)),
        };
    });

    return (
        <div>
            {isLoading ? (
                <Card className='animate-fade-right-slow'>
                    <CardContent>
                        <div className='flex flex-col h-full space-y-2 pt-8'>
                            {['h-10 w-36', 'h-36', 'h-52'].map((classes, index) => (
                                <Skeleton key={index} className={classes} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className='md:col-span-2 animate-fade-right-slow'>
                    <CardHeader className='flex flex-col md:flex-row items-center justify-between'>
                        <div className='text-2xl md:text-4xl w-full text-center font-semibold'>BIT10 Performance</div>
                    </CardHeader>
                    <CardContent className='flex flex-col space-y-4'>
                        <div className='flex flex-col md:flex-row items-center space-y-2 md:space-x-4 md:space-y-0 justify-end'>
                            <Select onValueChange={setSelectedPreformanceToken} defaultValue={selectedPreformanceToken}>
                                <SelectTrigger className='w-45'>
                                    <SelectValue placeholder='Select Token' />
                                </SelectTrigger>
                                <SelectContent>
                                    {bit10TokenName.map((token) => (
                                        <SelectItem key={token} value={token}>
                                            {token}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className='relative flex flex-row space-x-2 items-center justify-center border rounded-full px-2 py-1.5'>
                                <AnimatedBackground defaultValue='30D' className='rounded-full bg-primary' transition={{ ease: 'easeInOut', duration: 0.2 }} onValueChange={(newActiveId) => handleTabChange(newActiveId)}>
                                    {tabs.map((label, index) => (
                                        <button key={index} data-id={label} type='button' className='inline-flex cursor-pointer px-2 items-center justify-center text-center transition-transform active:scale-[0.98]'>
                                            {label}
                                        </button>
                                    ))}
                                </AnimatedBackground>
                            </div>
                        </div>
                        <div className='flex flex-col md:flex-row items-center justify-between space-y-2 space-x-0 md:space-x-4 md:space-y-0'>
                            <Card className='flex flex-col w-full'>
                                <CardHeader className='flex flex-row items-center justify-between pb-2'>
                                    <CardTitle className='text-xl font-medium flex flex-1 flex-row items-center space-x-1 text-start'>
                                        30D %
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className={`text-start text-3xl font-bold tracking-wider -mt-4 ${percentageChange30Days >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                    {Number(percentageChange30Days) > 0 && '+'}{percentageChange30Days.toFixed(2)}%
                                </CardContent>
                            </Card>

                            <Card className='flex flex-col w-full'>
                                <CardHeader className='flex flex-row items-center justify-between pb-2'>
                                    <CardTitle className='text-xl font-medium flex flex-1 flex-row items-center space-x-1 text-start'>
                                        60D %
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className={`text-start text-3xl font-bold tracking-wider -mt-4 ${percentageChange60Days >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                    {Number(percentageChange60Days) > 0 && '+'}{percentageChange60Days.toFixed(2)}%
                                </CardContent>
                            </Card>

                            <Card className='flex flex-col w-full'>
                                <CardHeader className='flex flex-row items-center justify-between pb-2'>
                                    <CardTitle className='text-xl font-medium flex flex-1 flex-row items-center space-x-1 text-start'>
                                        1Y AR
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className={`text-start text-3xl font-bold tracking-wider -mt-4 ${percentageChange1Year >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                    {Number(percentageChange1Year) > 0 && '+'}{percentageChange1Year.toFixed(2)}%
                                </CardContent>
                            </Card>

                            <Card className='flex flex-col w-full'>
                                <CardHeader className='flex flex-row items-center justify-between pb-2'>
                                    <CardTitle className='text-xl font-medium flex flex-1 flex-row items-center space-x-1 text-start'>
                                        3Y AR
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className={`text-start text-3xl font-bold tracking-wider -mt-4 ${percentageChange3Year >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                    {Number(percentageChange3Year) > 0 && '+'}{percentageChange3Year.toFixed(2)}%
                                </CardContent>
                            </Card>
                        </div>
                        <div className='select-none -ml-12 md:-ml-8'>
                            {
                                activeTab === '30D' &&
                                <ChartContainer config={bit10PreformanceChartConfig} className='max-h-75 w-full'>
                                    <LineChart accessibilityLayer data={bit10Preformance30DChartData}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey='day' tickLine axisLine tickMargin={8} tickFormatter={(value: string) => value.slice(0, value.indexOf(','))} stroke='#ffffff' />
                                        <YAxis tickLine axisLine tickMargin={8} tickCount={6} tickFormatter={(value) => `$${(value as number).toFixed(0)}`} stroke='#ffffff' />
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
                                        <XAxis dataKey='day' tickLine axisLine tickMargin={8} tickFormatter={(value: string) => value.slice(0, value.indexOf(','))} stroke='#ffffff' />
                                        <YAxis tickLine axisLine tickMargin={8} tickCount={6} tickFormatter={(value) => `$${(value as number).toFixed(0)}`} stroke='#ffffff' />
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
                                        <XAxis dataKey='day' tickLine axisLine tickMargin={8} tickFormatter={(value: string) => value.slice(0, value.indexOf(','))} stroke='#ffffff' />
                                        <YAxis tickLine axisLine tickMargin={8} tickCount={6} tickFormatter={(value) => `$${(value as number).toFixed(0)}`} stroke='#ffffff' />
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
                                        <XAxis dataKey='day' tickLine axisLine tickMargin={8} tickFormatter={(value: string) => value.slice(0, value.indexOf(','))} stroke='#ffffff' />
                                        <YAxis tickLine axisLine tickMargin={8} tickCount={6} tickFormatter={(value) => `$${(value as number).toFixed(0)}`} stroke='#ffffff' />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                        <Line dataKey={tokenDataName} type='linear' stroke='#21C45D' strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ChartContainer>
                            }
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
