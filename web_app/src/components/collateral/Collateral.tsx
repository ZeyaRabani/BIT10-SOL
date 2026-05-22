import { useState, useEffect, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Label, Pie, PieChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { HistoryIcon, DollarSignIcon, CoinsIcon, TrendingUpIcon, ShieldIcon, ExternalLinkIcon } from 'lucide-react';
import { formatCompactPercentNumber, formatAddress } from '@/lib/utils';

interface TokenSupplyData {
    supply: number;
    decimals: number;
    rawAmount: string;
    timestamp: string;
}

type CoinData = {
    id: string;
    name: string;
    symbol: string;
    tokenAddress?: string;
    noOfTokens?: number;
    chain?: string;
    marketCap?: number;
    price: number;
};

type TokenPriceData = {
    timestmpz: string;
    tokenPrice: number;
    data: {
        id: string;
        symbol: string;
        name: string;
        image: string;
        price: number;
        marketCap: number;
    }[];
};

const DEFAULT_WALLET = {
    walletAddress: 'key4yrLZ9RFDMqE9sNKTZEvVsPQXmJg46s2ooTw45du',
    explorerAddress: 'https://explorer.solana.com/address/key4yrLZ9RFDMqE9sNKTZEvVsPQXmJg46s2ooTw45du/tokens'
};

const color = ['#F7931A', '#3C3C3D', '#006097', '#F3BA2F', '#00FFA3', '#B51D06', '#C2A633', '#0033AD', '#29B6F6', '#ff0066'];

const fetchBIT10Tokens = async (tokenPriceAPI: string) => {
    try {
        const response = await fetch(tokenPriceAPI);
        if (!response.ok) throw new Error('Failed to fetch tokens');

        const data = (await response.json()) as { data?: unknown };
        return data;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        toast.error('Error fetching BIT10 price. Please try again!');
        return [];
    }
};

export default function Collateral() {
    const [innerRadius, setInnerRadius] = useState<number>(80);
    const [data, setData] = useState<TokenSupplyData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSupply = async () => {
            try {
                const response = await fetch('/api/token-supply');
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const result = await response.json();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                setData(result);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                toast.error('Error fetching Token Supply')
            } finally {
                setLoading(false);
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        fetchSupply();
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        const interval = setInterval(fetchSupply, 600000);

        return () => clearInterval(interval);
    }, []);

    const { data: queryData, isLoading } = useQueries({
        queries: [
            {
                queryKey: ['bit10SOLTokenList'],
                queryFn: () => fetchBIT10Tokens('bit10-latest-price-sol'),
                staleTime: 300000, // 5 minutes
            }
        ],
        combine: (results) => ({
            data: results.map((r) => r.data),
            isLoading: results.some((r) => r.isLoading),
        }),
    });

    const bit10SOLCurrentPrice = useMemo(() => {
        const tokenPrice = queryData?.[0] as TokenPriceData | undefined;
        return tokenPrice?.tokenPrice?.toFixed(2) ?? '0.00';
    }, [queryData]);

    const bit10SOLAllocations = useMemo(() => {
        const tokenPrice = queryData?.[0] as TokenPriceData | undefined;
        return tokenPrice?.data ?? [];
    }, [queryData]);

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

    const bit10WithPercentages = useMemo(() => {
        if (!bit10SOLAllocations?.length) return [];

        const totalMarketCap = bit10SOLAllocations.reduce(
            (sum, token) => sum + (token.marketCap ?? 0),
            0
        );

        return bit10SOLAllocations.map((token) => ({
            ...token,
            percentage: Number(
                (totalMarketCap > 0 ? (((token.marketCap ?? 0) / totalMarketCap) * 100) : 0).toFixed(2)
            ),
        }));
    }, [bit10SOLAllocations]);

    const pieChartData = useMemo(() => {
        return bit10WithPercentages.map((token, index) => ({
            name: token.symbol.toUpperCase(),
            value: token.percentage,
            fill: color[index % color.length]
        }));
    }, [bit10WithPercentages]);

    const totalCollateral = useMemo(() => {
        return data ? data.supply * Number(bit10SOLCurrentPrice) : 0;
    }, [data, bit10SOLCurrentPrice]);

    if (loading) return <div>Loading...</div>;
    if (!data) return <div>No data</div>;

    const chartConfig = {
        tokens: {
            label: 'Tokens',
        },
    };

    return (
        <Card className='bg-transparent'>
            <CardHeader>
                <div className='text-2xl md:text-4xl text-center md:text-start font-semibold'>BIT10 Collateral</div>
                <div className='text-lg md:text-xl text-center md:text-start text-muted-foreground'>View the assets backing BIT10 tokens</div>
            </CardHeader>
            <CardContent className='flex flex-col space-y-4 md:space-y-8'>
                {isLoading ? (
                    <div className='flex flex-col h-full space-y-2'>
                        <div className='flex flex-col md:flex-row space-y-2 items-center justify-center md:justify-between md:space-y-0'>
                            {['h-8 w-28', 'h-8 w-28'].map((classes, index) => (
                                <Skeleton key={index} className={classes} />
                            ))}
                        </div>
                        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
                            {Array.from({ length: 4 }).map((_, index) => (
                                <Card key={index} className='p-3 flex flex-col space-y-2'>
                                    <Skeleton className='h-24 w-full' />
                                </Card>
                            ))}
                        </div>
                        <div className='grid md:grid-cols-3 gap-4 items-center'>
                            {['h-56 w-full col-span-1', 'h-56 w-full col-span-2'].map((classes, index) => (
                                <Skeleton key={index} className={classes} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className='flex flex-col h-full space-y-2'>
                            <div className='flex flex-col md:flex-row space-y-2 items-center justify-center md:justify-between md:space-y-0'>
                                <div className='text-2xl font-semibold'>BIT10.SOL</div>
                                <Button asChild>
                                    <Link href={`/collateral/sol`}>
                                        <HistoryIcon size='16' />
                                        Rebalance History
                                    </Link>
                                </Button>
                            </div>
                            <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
                                <Card className='border-2 p-3'>
                                    <div className='flex flex-row space-x-0.5 items-center justify-start'>
                                        <div><DollarSignIcon strokeWidth={2.5} className='h-5 w-5' /></div>
                                        <div className='text-lg'>Total Collateral</div>
                                    </div>
                                    <div className='-mt-4 flex flex-row items-end justify-start space-x-2'>
                                        <div className='text-4xl font-semibold'>${(data.supply * Number(bit10SOLCurrentPrice)).toFixed(2)}</div>
                                    </div>
                                </Card>

                                <Card className='border-2 p-3'>
                                    <div className='flex flex-row space-x-0.5 items-center justify-start'>
                                        <div><CoinsIcon strokeWidth={2.5} className='h-5 w-5' /></div>
                                        <div className='text-lg'>BIT10.SOL Price</div>
                                    </div>
                                    <div className='-mt-4 flex flex-row items-end justify-start space-x-2'>
                                        <div className='text-4xl font-semibold'>${formatCompactPercentNumber(bit10SOLCurrentPrice)}</div>
                                    </div>
                                </Card>

                                <Card className='border-2 p-3'>
                                    <div className='flex flex-row space-x-0.5 items-center justify-start'>
                                        <div><TrendingUpIcon strokeWidth={2.5} className='h-5 w-5' /></div>
                                        <div className='text-lg'>Total Supply</div>
                                    </div>
                                    <div className='-mt-4 flex flex-row items-end justify-start space-x-2'>
                                        <div className='text-4xl font-semibold'>{formatCompactPercentNumber(data.supply)}</div>
                                    </div>
                                </Card>

                                <Card className='border-2 p-3'>
                                    <div className='flex flex-row space-x-0.5 items-center justify-start'>
                                        <div><ShieldIcon strokeWidth={2.5} className='h-5 w-5' /></div>
                                        <div className='text-lg'>Coverage Ratio</div>
                                    </div>
                                    <div className='-mt-4 flex flex-row items-end justify-start space-x-2'>
                                        <div className='text-4xl font-semibold'>110%</div>
                                        <div className='pb-0.5 text-sm md:text-base text-green-500'>Over-collateralized</div>
                                    </div>
                                </Card>
                            </div>
                            <div className='grid md:grid-cols-3 gap-4 items-center'>
                                <div className='flex-1'>
                                    <ChartContainer
                                        config={chartConfig}
                                        className='aspect-square max-h-75'
                                    >
                                        <PieChart>
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                            <Pie data={pieChartData} dataKey='value' nameKey='name' innerRadius={innerRadius} strokeWidth={5}>
                                                <Label content={({ viewBox }) => {
                                                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                                        return (
                                                            <text x={viewBox.cx} y={viewBox.cy} textAnchor='middle' dominantBaseline='middle'>
                                                                <tspan x={viewBox.cx} y={viewBox.cy} className='fill-foreground text-xl font-bold'>
                                                                    BIT10.SOL
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
                                <div className='flex w-full flex-col space-y-3 col-span-2 overflow-x-auto'>
                                    <table className='w-full table-auto text-lg'>
                                        <thead>
                                            <tr className='p-1 rounded'>
                                                <th className='text-left'>Collateral Token</th>
                                                <th className='text-left'>Total Collateral</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bit10WithPercentages.map((token, index) => {
                                                const tokenCollateral = (token.percentage / 100) * totalCollateral;

                                                return (
                                                    <tr key={token.id} className='hover:bg-accent p-1 rounded'>
                                                        <td className='flex items-center space-x-1'>
                                                            <div className='w-3 h-3 rounded' style={{ backgroundColor: color[index % color.length] }} />
                                                            <span className='uppercase'>{token.symbol}</span>
                                                            <span>({formatAddress(DEFAULT_WALLET.walletAddress)})</span>
                                                            <a href={DEFAULT_WALLET.explorerAddress} target='_blank' rel='noopener noreferrer'>
                                                                <ExternalLinkIcon size={16} className='text-primary' />
                                                            </a>
                                                        </td>
                                                        <td>
                                                            {formatCompactPercentNumber(tokenCollateral)} USD
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
