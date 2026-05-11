import { useState, useCallback, useMemo, useEffect } from 'react';
import { useChain } from '@/context/ChainContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { CHAIN_REGISTRY } from '@/chains/chain.registry';
import { useQueries, type UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label, Pie, PieChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { formatCompactNumber, formatCompactPercentNumber } from '@/lib/utils';

type BIT10TokensResponse = {
    timestmpz: string;
    tokenPrice: number;
    data: BIT10Token[];
};

type BIT10Token = {
    id: string;
    name: string;
    symbol: string;
    image: string;
    marketCap: number;
    price: number;
};

const bit10TokenName = ['BIT10.SOL'];

const color = ['#F7931A', '#3C3C3D', '#006097', '#F3BA2F', '#00FFA3', '#B51D06', '#C2A633', '#0033AD', '#29B6F6', '#ff0066'];

export default function BalanceAndAllocation() {
    const [selectedAllocationToken, setSelectedAllocationToken] = useState('BIT10.SOL');
    const [innerRadius, setInnerRadius] = useState<number>(80);

    const { chain } = useChain();
    const { connected: isSolanaConnected, publicKey } = useWallet();

    const fetchBIT10Tokens = useCallback(async (tokenPriceAPI: string) => {
        try {
            const response = await fetch(tokenPriceAPI);

            if (!response.ok) {
                toast.error('Error fetching BIT10 price. Please try again!');
                return;
            }

            const data = (await response.json()) as BIT10TokensResponse;
            return data ?? [];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error fetching the price of BIT10 token. Please try again later!')
            return [];
        }
    }, []);

    const balanceAndPriceQueriesConfig = useMemo((): UseQueryOptions[] => {
        const queries: UseQueryOptions[] = [
            {
                queryKey: ['bit10SOLTokenList'],
                queryFn: () => fetchBIT10Tokens('bit10-latest-price-sol')
            }
        ]

        if (chain === 'solana' && isSolanaConnected && publicKey) {
            queries.push(
                {
                    queryKey: ['bit10SOLBalanceSolana'],
                    queryFn: () => CHAIN_REGISTRY.solana.fetchTokenBalance({ tokenAddress: 'bitQG7BVz72Gu5L99bYRrZxTmFj8NPaFpT2uPp47yew', publicKey: publicKey })
                }
            );
        }

        return queries;
    }, [chain, isSolanaConnected, publicKey, fetchBIT10Tokens]);

    const balanceAndPriceQueries = useQueries({ queries: balanceAndPriceQueriesConfig });
    const isLoading = balanceAndPriceQueries.some((query) => query?.isLoading) || balanceAndPriceQueries.some((query) => query?.isFetching && !query?.data);
    const bit10SOLTokensResponse = balanceAndPriceQueries[0]?.data as BIT10TokensResponse;
    const bit10SOLTokens: BIT10Token[] = bit10SOLTokensResponse?.data ?? [];
    const bit10SOLPrice = bit10SOLTokensResponse?.tokenPrice ?? 0;

    // As the if queries started from 1st index
    let currentIndex = 1;

    const solanaQueryIndex = chain === 'solana' && isSolanaConnected && publicKey ? currentIndex : -1;
    if (chain === 'solana' && isSolanaConnected && publicKey) currentIndex++;

    const solanaBIT10SOLTokenBalance = solanaQueryIndex >= 0 ? (balanceAndPriceQueries[solanaQueryIndex]?.data as string | undefined) : undefined;

    const totalTokens = () => {
        if (chain === 'solana' && isSolanaConnected) {
            return solanaBIT10SOLTokenBalance;
        } else {
            return 0;
        }
    };

    const totalBIT10Tokens = totalTokens();

    const selectedBIT10Token = () => {
        if (selectedAllocationToken === 'BIT10.SOL') {
            return bit10SOLTokens;
        } else {
            return null;
        }
    };

    const rawTokens = selectedBIT10Token();
    const tokens = (Array.isArray(rawTokens) ? rawTokens : []) as { symbol: string; marketCap: number }[];

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1200) {
                setInnerRadius(90);
            } else if (window.innerWidth >= 768) {
                setInnerRadius(70);
            } else {
                setInnerRadius(70);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const bit10SOL = () => {
        if (chain === 'solana' && isSolanaConnected) {
            return solanaBIT10SOLTokenBalance;
        } else {
            return 0;
        }
    };

    const bit10SOLTokenBalance = bit10SOL();

    const tokenData = [
        {
            token: 'BIT10.SOL',
            balance: formatCompactNumber(Number(bit10SOLTokenBalance))
        }
    ];

    const bit10BalanceChartConfig: ChartConfig = {
        ...Object.fromEntries(
            tokenData.map((token, index) => [
                token.token,
                {
                    label: token.token,
                    color: color[index % color.length],
                }
            ]) || []
        )
    };

    const bit10BalancePieChartData =
        Number(totalBIT10Tokens) == 0
            ?
            [{ name: 'No Data', value: 1, fill: '#ebebe0' }]
            :
            tokenData.filter((token) => Number(token.balance) > 0).map((token, index) => ({
                name: token.token,
                value: Number(token.balance),
                fill: color[index % color.length],
            }));

    const bit10AllocationChartConfig: ChartConfig = {
        ...Object.fromEntries(
            tokens.map((token, index) => [
                token.symbol,
                {
                    label: token.symbol.toUpperCase(),
                    color: color[index % color.length],
                }
            ])
        )
    };

    const totalMarketCap = tokens.reduce((sum, token) => sum + token.marketCap, 0);

    const bit10AllocationPieChartData = tokens.map((token, index) => ({
        name: token.symbol,
        value: parseFloat(((token.marketCap / totalMarketCap) * 100).toFixed(2)),
        fill: color[index % color.length],
    }));

    return (
        <>
            {isLoading ? (
                <div className='flex flex-col lg:grid lg:grid-cols-2 space-y-2 lg:space-y-0 space-x-0 lg:gap-4'>
                    <Card className='w-full lg:col-span-1 animate-fade-left-slow'>
                        <CardContent>
                            <div className='flex flex-col h-full space-y-2'>
                                {['h-10 w-1/2 md:w-1/4', 'h-80'].map((classes, index) => (
                                    <Skeleton key={index} className={classes} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className='w-full lg:col-span-1 animate-fade-right-slow'>
                        <CardContent>
                            <div className='flex flex-col h-full space-y-2'>
                                {['h-10 w-1/2 md:w-1/4', 'h-80'].map((classes, index) => (
                                    <Skeleton key={index} className={classes} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className='flex flex-col lg:grid lg:grid-cols-2 space-y-2 lg:space-y-0 space-x-0 lg:gap-4'>
                    <Card className='w-full lg:col-span-1 animate-fade-left-slow'>
                        <CardHeader>
                            <div className='text-2xl md:text-4xl text-center md:text-start'>Your Current Balance</div>
                        </CardHeader>
                        <CardContent className='grid md:grid-cols-2 gap-4 items-center'>
                            <div className='flex-1 pb-0'>
                                <ChartContainer
                                    config={bit10BalanceChartConfig}
                                    className='aspect-square max-h-75'
                                >
                                    <PieChart>
                                        {Number(formatCompactNumber(Number(totalBIT10Tokens))) > 0 && (
                                            <ChartTooltip
                                                cursor={false}
                                                content={<ChartTooltipContent hideLabel />}
                                            />
                                        )}
                                        <Pie data={bit10BalancePieChartData} dataKey='value' nameKey='name' innerRadius={innerRadius} strokeWidth={5}>
                                            <Label
                                                content={({ viewBox }) => {
                                                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                                        return (
                                                            <text x={viewBox.cx} y={viewBox.cy} textAnchor='middle' dominantBaseline='middle'>
                                                                <tspan x={viewBox.cx} y={viewBox.cy} className='fill-foreground text-3xl font-bold'>
                                                                    {formatCompactNumber(Number(totalBIT10Tokens))}
                                                                </tspan>
                                                                <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 24} className='fill-muted-foreground'>
                                                                    Total Balance
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
                            <div className='flex w-full flex-col space-y-3'>
                                <div className='flex w-full flex-col space-y-3'>
                                    <h1 className='text-xl md:text-2xl font-semibold'>Portfolio Holdings</h1>
                                    <div className='flex flex-col space-y-1 py-1'>
                                        <div className='flex flex-row justify-between items-center px-2'>
                                            <div>Token Name</div>
                                            <div>No. of Tokens</div>
                                        </div>
                                        {Number(formatCompactNumber(Number(totalBIT10Tokens))) == 0 ? (
                                            <div className='text-center'>You currently own no BIT10 tokens</div>
                                        ) : (
                                            <>
                                                {tokenData
                                                    .map((token, index) => {
                                                        const isSolToken = token.token === 'BIT10.SOL';
                                                        const tokenValue = isSolToken && '$' + ((parseFloat(token.balance) || 0) * (bit10SOLPrice || 0)).toFixed(2);

                                                        return (
                                                            <div key={index} className='flex flex-row justify-between items-center hover:bg-accent py-1 px-2 rounded'>
                                                                <div className='flex flex-row items-center space-x-1'>
                                                                    <div className='w-3 h-3 rounded' style={{ backgroundColor: color[index % color.length] }}></div>
                                                                    <div>{token.token}</div>
                                                                </div>
                                                                <div className='flex flex-row space-x-1 items-end'>
                                                                    <div>{token.balance}</div>
                                                                    {isSolToken && bit10SOLPrice > 0 && (<div className='hidden md:block'>({tokenValue}) </div>)}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='w-full lg:col-span-1 animate-fade-right-slow'>
                        <CardHeader className='flex flex-col md:flex-row items-center md:justify-between'>
                            <div className='text-2xl md:text-4xl text-center md:text-start'>BIT10 Allocations</div>
                            <Select onValueChange={setSelectedAllocationToken} defaultValue={selectedAllocationToken}>
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
                        </CardHeader>
                        <CardContent className='grid md:grid-cols-2 gap-4 items-center'>
                            <div className='flex-1'>
                                <ChartContainer
                                    config={bit10AllocationChartConfig}
                                    className='aspect-square max-h-75'
                                >
                                    <PieChart>
                                        <ChartTooltip
                                            cursor={false}
                                            content={<ChartTooltipContent hideLabel />}
                                        />
                                        <Pie
                                            data={bit10AllocationPieChartData}
                                            dataKey='value'
                                            nameKey='name'
                                            innerRadius={innerRadius}
                                            strokeWidth={5}
                                        >
                                            <Label
                                                content={({ viewBox }) => {
                                                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                                        return (
                                                            <text
                                                                x={viewBox.cx}
                                                                y={viewBox.cy}
                                                                textAnchor='middle'
                                                                dominantBaseline='middle'
                                                            >
                                                                <tspan
                                                                    x={viewBox.cx}
                                                                    y={viewBox.cy}
                                                                    className='fill-foreground text-xl font-bold'
                                                                >
                                                                    {selectedAllocationToken}
                                                                </tspan>
                                                                <tspan
                                                                    x={viewBox.cx}
                                                                    y={(viewBox.cy ?? 0) + 24}
                                                                    className='fill-muted-foreground'
                                                                >
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
                            <div className='flex w-full flex-col space-y-3'>
                                <h1 className='text-2xl'>{selectedAllocationToken} Allocations</h1>
                                <div className='flex flex-col'>
                                    {tokens?.sort((a, b) => b.marketCap - a.marketCap).map((token, index) => (
                                        <div
                                            key={index}
                                            className='flex flex-row items-center justify-between space-x-8 hover:bg-accent p-1 rounded'
                                        >
                                            <div className='flex flex-row items-center space-x-1'>
                                                <div
                                                    className='w-3 h-3 rounded'
                                                    style={{ backgroundColor: color[index % color.length] }}
                                                ></div>
                                                <div className='uppercase'>{token.symbol}</div>
                                            </div>
                                            <div>{formatCompactPercentNumber((token.marketCap / totalMarketCap) * 100)} %</div>
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
