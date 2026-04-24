"use client";

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import MaxWidthWrapper from '@/components/MaxWidthWrapper';
import { InfiniteMovingCards } from '@/components/ui/infinite-moving-cards';
import Image, { type StaticImageData } from 'next/image';
import BIT10Img from '@/assets/tokens/bit10.svg';
import BIT10SOLImg from '@/assets/tokens/bit10-sol-1.svg';
import BTCImg from '@/assets/tokens/btc.svg';
import ETHImg from '@/assets/tokens/eth.svg';
import XRPImg from '@/assets/tokens/xrp.svg';
import BNBImg from '@/assets/tokens/bnb.svg';
import SOLImg from '@/assets/tokens/sol.svg';
import TRXImg from '@/assets/tokens/trx.svg';
import DogeImg from '@/assets/tokens/doge.svg';
import ADAImg from '@/assets/tokens/cardano.svg';
import BCHImg from '@/assets/tokens/bch.svg';
import AVAXImg from '@/assets/tokens/avax.svg';
import WLFIImg from '@/assets/tokens/wlfi.svg';
import PUMPImg from '@/assets/tokens/pump.svg';
import TRUMPImg from '@/assets/tokens/trump.svg';
import JUPImg from '@/assets/tokens/jup.svg';
import BONKImg from '@/assets/tokens/bonk.svg';
import PENGUImg from '@/assets/tokens/pengu.svg';
import PRIMEImg from '@/assets/tokens/prime.svg';
import ZBCNImg from '@/assets/tokens/zbcn.svg';
import Z2Img from '@/assets/tokens/2Z.svg';
import DefinityDevImg from '@/assets/home/DFINITYDev.jpg';
import EasyaAppImg from '@/assets/home/easya_app.jpg';
import ICPImg from '@/assets/home/ICP.svg';
import EasyAImg from '@/assets/home/EasyA.png';
import { useQueries } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { CartesianGrid, XAxis, YAxis, LineChart, Line } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TrendingUpIcon, TrendingDownIcon, AlertCircleIcon, ClockIcon, DollarSignIcon, RefreshCwIcon, MinusIcon, ShieldIcon, CheckIcon, XIcon, EyeIcon, ArrowRightIcon, WalletIcon, ArrowDownUpIcon, PieChartIcon } from 'lucide-react';
import { formatPreciseDecimal } from '@/lib/utils';

const containerVariants = {
    visible: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeInOut' } },
};

const imageVariants = {
    hidden: {
        x: '100%',
        opacity: 0,
    },
    visible: {
        x: '0%',
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: 'easeOut',
        },
    },
};

const initialInvestment = ['$100', '$1,000', '$10,000'] as const;

const timeframe = ['1Y', '3Y', '5Y'] as const;

type BIT10Entry = {
    date: string;
    bit10Top: string,
    bit10Sol: string,
    btc: string;
    eth: string;
    sol: string;
    sp500: string;
    gold: string;
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

type FeatureStatus = 'yes' | 'no' | 'partial';

interface ComparisonRow {
    feature: string;
    tradfi: FeatureStatus;
    onchain: FeatureStatus;
    bit10: FeatureStatus;
};

const painPoints = [
    {
        icon: AlertCircleIcon,
        title: 'Pick the winners',
        description: 'Which of the 30M+ tokens will make it?',
    },
    {
        icon: ClockIcon,
        title: 'Time the market',
        description: 'Buy low, sell high - easier said than done.',
    },
    {
        icon: DollarSignIcon,
        title: 'Death by fees',
        description: 'Gas, swaps, bridges... costs add up fast.',
    },
    {
        icon: RefreshCwIcon,
        title: 'Manual rebalancing',
        description: `Markets move 24/7. Your portfolio doesn't.`,
    },
];

const comparisonData: ComparisonRow[] = [
    {
        feature: 'Diversified exposure',
        tradfi: 'yes',
        onchain: 'yes',
        bit10: 'yes'
    },
    {
        feature: 'Native asset custody',
        tradfi: 'no',
        onchain: 'no',
        bit10: 'yes'
    },
    {
        feature: 'On-chain verifiable',
        tradfi: 'no',
        onchain: 'partial',
        bit10: 'yes'
    },
    {
        feature: '24/7 liquidity',
        tradfi: 'no',
        onchain: 'yes',
        bit10: 'yes'
    },
    {
        feature: 'Non-custodial',
        tradfi: 'no',
        onchain: 'partial',
        bit10: 'yes'
    },
    {
        feature: 'Daily auto-rebalancing',
        tradfi: 'no',
        onchain: 'no',
        bit10: 'yes'
    },
    {
        feature: 'Low management fees',
        tradfi: 'partial',
        onchain: 'yes',
        bit10: 'yes'
    },
    {
        feature: 'Over-collateralized',
        tradfi: 'no',
        onchain: 'no',
        bit10: 'yes'
    }
];

const StatusIcon = ({ status }: { status: FeatureStatus }) => {
    switch (status) {
        case 'yes':
            return <div className='w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center'>
                <CheckIcon className='w-4 h-4 text-primary' />
            </div>;
        case 'no':
            return <div className='w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center'>
                <XIcon className='w-4 h-4 text-destructive' />
            </div>;
        case 'partial':
            return <div className='w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center'>
                <MinusIcon className='w-4 h-4 text-yellow-500' />
            </div>;
    }
};

const features = [
    {
        icon: ShieldIcon,
        title: 'Native Assets Only',
        description: 'No wrapped tokens. You own the actual SOL, JUP, PUMP - not IOUs.',
    },
    {
        icon: EyeIcon,
        title: 'Verifiable Reserves',
        description: 'Every asset backing your investment is visible on-chain, 24/7.',
    },
    {
        icon: RefreshCwIcon,
        title: 'Daily Rebalancing',
        description: 'Daily rebalancing keeps your portfolio aligned with market cap weights.',
    }
];

const stats = [
    { value: '110%', label: 'Over-collateralized' },
    { value: '0.5%', label: 'Management Fee' },
    { value: 'Daily', label: 'Rebalancing' }
];

const steps = [
    {
        icon: WalletIcon,
        step: '01',
        title: 'Deposit Stablecoins',
        description: 'Connect your wallet and deposit USDC, USDT, or other supported stablecoins.',
    },
    {
        icon: ArrowDownUpIcon,
        step: '02',
        title: 'BIT10 Does the Rest',
        description: 'Your deposit is automatically converted to a balanced portfolio of the top 10 solana tokens.',
    },
    {
        icon: PieChartIcon,
        step: '03',
        title: 'Own Diversified Crypto',
        description: 'Receive BIT10 tokens representing your share. Hold, trade, or redeem anytime.',
    },
];

const testimonials = [
    {
        x_link: 'https://x.com/DFINITYDev/status/1808724918177312925',
        tweet: '@bit10app is bringing the #Bitcoin ecosystem together for a pool party this #ChainFusionSummer⛱️ BIT10 is a #DeFi asset manager built using #ICP that offers an index tracking major #tokens, #ordinals, and #BRC20s on:🟧 ICP @dfinity, 🟧 @Stacks, 🟧 @MapProtocol, 🟧 @SovrynBTC, 🟧 @BadgerDAO, 🟧 @ALEXLabBTC, and more!',
        profile_pic: DefinityDevImg,
        name: 'DFINITY Developers',
        username: 'DFINITYDev'
    },
    {
        x_link: 'https://x.com/easya_app/status/1803087458663383383',
        tweet: 'Congrats to the gigabrains at BIT 10 Smart Assets! 👏 First started building at our EasyA x @Stacks hackathon in London, accepted into @btcstartuplab and now gearing up to launch their testnet! 🚀',
        profile_pic: EasyaAppImg,
        name: 'EasyA',
        username: 'easya_app'
    }
];

const parterners = [
    {
        name: 'ICP',
        logo: ICPImg as StaticImageData,
    },
    {
        name: 'EasyA',
        logo: EasyAImg,
    }
]

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

const fetchBIT105YPerformance = async (): Promise<{ bit10: BIT10Entry[] } | null> => {
    try {
        const response = await fetch('bit10-comparison-data-5');
        if (!response.ok) throw new Error('Network error');

        const data = (await response.json()) as { bit10?: BIT10Entry[] };
        return { bit10: (data.bit10 ?? []).reverse() };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        toast.error('Error fetching BIT10 performance. Please try again!');
        return null;
    }
};

export default function Page() {
    const [activeTab, setActiveTab] = useState('5Y');
    const [activeInitialInvestmentTab, setActiveInitialInvestmentTab] = useState('$100');

    const { data: queryData, isLoading } = useQueries({
        queries: [
            {
                queryKey: ['bit10SOLTokenList'],
                queryFn: () => fetchBIT10Tokens('bit10-latest-price-sol'),
                staleTime: 300000, // 5 minutes
            },
            {
                queryKey: ['bit10SolTokenPreformance5Y'],
                queryFn: () => fetchBIT105YPerformance(),
                staleTime: 900000, // 15 minutes
            },
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

    const bit10SOLData = useMemo(() => {
        const performanceData = queryData?.[1];
        if (performanceData && typeof performanceData === 'object' && 'bit10' in performanceData) {
            return (performanceData as { bit10: BIT10Entry[] }).bit10 ?? [];
        }
        return [];
    }, [queryData]);

    const bit10SOLAllocations = useMemo(() => {
        const tokenPrice = queryData?.[0] as TokenPriceData | undefined;
        return tokenPrice?.data ?? [];
    }, [queryData]);

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

    const bit10PreviousDayPrice = useMemo(() => {
        if (!bit10SOLData.length) return null;

        const last = bit10SOLData[bit10SOLData.length - 1];
        const prev = bit10SOLData[bit10SOLData.length - 2];

        if (!last || !prev) return null;

        return {
            last: parseFloat(last.bit10Sol),
            prev: parseFloat(prev.bit10Sol),
        };
    }, [bit10SOLData]);

    const bit10DailyChange = useMemo(() => {
        if (!bit10PreviousDayPrice) return null;

        const { last, prev } = bit10PreviousDayPrice;
        if (!prev || prev === 0) return null;

        const diff = last - prev;
        const percent = (diff / prev) * 100;

        return {
            diff,
            percent,
            isUp: diff > 0,
        };
    }, [bit10PreviousDayPrice]);

    const dateFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat('en-US', {
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                year: 'numeric',
                month: 'short',
                day: '2-digit',
            }),
        []
    );

    const getPerformanceRange = useCallback(
        (data: BIT10Entry[], rangeYears: number) => {
            if (!data.length) return [];
            const lastEntry = data[data.length - 1];
            if (!lastEntry) return [];
            const now = new Date(lastEntry.date);
            const start = new Date(now);
            start.setFullYear(start.getFullYear() - rangeYears);
            return data.filter((entry) => new Date(entry.date) >= start);
        },
        []
    );

    const performance1Y = useMemo(() => getPerformanceRange(bit10SOLData, 1), [bit10SOLData, getPerformanceRange]);
    const performance3Y = useMemo(() => getPerformanceRange(bit10SOLData, 3), [bit10SOLData, getPerformanceRange]);
    const performance5Y = useMemo(() => getPerformanceRange(bit10SOLData, 5), [bit10SOLData, getPerformanceRange]);

    const tickFormatter = useCallback((value: string) => {
        const match = /\d{4}/.exec(value);
        return match ? match[0] : value;
    }, []);

    const initialInvestmentValue = useMemo(() => {
        return Number(activeInitialInvestmentTab.replace(/[$,]/g, ''));
    }, [activeInitialInvestmentTab]);

    const formatChartData = useCallback(
        (rawData: BIT10Entry[]) => {
            if (!rawData.length) return [];

            const first = rawData[0];
            if (!first) return [];

            const initialBIT10SOL = parseFloat(first.bit10Sol) || 1;
            const initialBTC = parseFloat(first.btc) || 1;
            const initialSOL = parseFloat(first.sol) || 1;

            return rawData.map((entry) => ({
                day: dateFormatter.format(new Date(entry.date)),
                bit10SolValue: (parseFloat(entry.bit10Sol) / initialBIT10SOL) * initialInvestmentValue,
                btcValue: (parseFloat(entry.btc) / initialBTC) * initialInvestmentValue,
                solValue: (parseFloat(entry.sol) / initialSOL) * initialInvestmentValue
            }));
        },
        [dateFormatter, initialInvestmentValue]
    );

    const chartData1Y = useMemo(() => formatChartData(performance1Y), [formatChartData, performance1Y]);
    const chartData3Y = useMemo(() => formatChartData(performance3Y), [formatChartData, performance3Y]);
    const chartData5Y = useMemo(() => formatChartData(performance5Y), [formatChartData, performance5Y]);

    const activeChartData = useMemo(() => {
        switch (activeTab) {
            case '1Y':
                return chartData1Y;
            case '3Y':
                return chartData3Y;
            case '5Y':
                return chartData5Y;
            default:
                return chartData5Y;
        }
    }, [activeTab, chartData1Y, chartData3Y, chartData5Y]);

    const bit10FinalValue = useMemo(
        () => activeChartData[activeChartData.length - 1]?.bit10SolValue ?? initialInvestmentValue,
        [activeChartData, initialInvestmentValue]
    );

    const bit10FinalAmount = useMemo(() => {
        if (!activeChartData.length) return initialInvestmentValue;
        return bit10FinalValue;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bit10FinalValue, initialInvestmentValue]);

    const bit10ReturnPercent = useMemo(() => {
        if (initialInvestmentValue === 0) return 0;
        return ((bit10FinalAmount - initialInvestmentValue) / initialInvestmentValue) * 100;
    }, [initialInvestmentValue, bit10FinalAmount]);

    const handleTabChange = useCallback((label: string | null) => {
        if (label && (timeframe as readonly string[]).includes(label)) {
            setActiveTab(label as '5Y' | '3Y' | '1Y');
        }
    }, []);

    const handleInitialInvestmentTabChange = useCallback((label: string | null) => {
        if (label && (initialInvestment as readonly string[]).includes(label)) {
            setActiveInitialInvestmentTab(label);
        }
    }, []);

    const investmentChartConfig = {
        bit10SolValue: {
            label: 'BIT10.SOL'
        },
        btcValue: {
            label: 'Bitcoin'
        },
        solValue: {
            label: 'Solana'
        }
    } satisfies ChartConfig;

    return (
        <div className='flex flex-col space-y-4'>
            <div className='relative flex flex-col space-y-2 md:space-y-8 items-center max-w-7xl mx-auto z-10 w-full pt-8 md:py-18'>
                <div className='hidden md:block absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl z-[-1]' />
                <div className='hidden md:block absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl z-[-1]' />

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className='inline-flex items-center gap-3 px-4 py-2 mb-8 rounded-full border'>
                    {isLoading && bit10SOLCurrentPrice && bit10DailyChange ?
                        <Skeleton className='h-5 md:h-10 w-20 md:w-56 rounded-full' /> :
                        <>
                            <span className='animate-pulse size-2 rounded-full bg-primary' />
                            <span className='text-sm text-muted-foreground'>BIT10.SOL</span>
                            <span className='text-lg font-semibold text-foreground'>${bit10SOLCurrentPrice}</span>
                            <span
                                className={cn(
                                    'flex items-center gap-1 text-sm font-medium',
                                    (bit10DailyChange?.isUp ?? false) ? 'text-green-600' : 'text-red-600'
                                )}
                            >
                                {(bit10DailyChange?.isUp ?? false) ? (
                                    <TrendingUpIcon className='w-4 h-4' />
                                ) : (
                                    <TrendingDownIcon className='w-4 h-4' />
                                )}
                                {(bit10DailyChange?.percent ?? 0) > 0 ? '+' : ''}
                                {(bit10DailyChange?.percent ?? 0).toFixed(2)}%
                            </span>
                        </>
                    }
                </motion.div>

                <motion.div
                    initial={{ opacity: 0.0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.8, ease: 'easeInOut' }}
                    // className='text-4xl md:text-6xl font-bold text-center bg-clip-text text-transparent bg-linear-to-b from-neutral-50 to-neutral-400 bg-opacity-50 pb-2'>
                    className='text-4xl md:text-6xl lg:text-7xl font-bold text-center pb-2'>
                    <span className='text-primary'>Redefining</span> Crypto Index Funds
                </motion.div>

                <div className='flex flex-col md:flex-row md:space-x-4 items-center justify-center pt-6 px-4'>
                    <div className='flex flex-col space-y-2 items-center'>
                        <motion.div
                            initial={{ opacity: 0.0, x: -40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, ease: 'easeInOut' }}>
                            <Image src={BIT10Img as StaticImageData} alt='logo' width={85} height={85} className='border-2 w-16 md:w-16 lg:w-20 rounded-full' />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0.0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: 'easeInOut' }}
                            className='text-xl font-semibold text-primary'>
                            BIT10.TOP
                        </motion.div>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
                        className='text-6xl md:-mt-3'>
                        =
                    </motion.div>
                    <div className='flex flex-col space-y-2 items-start justify-center'>
                        <motion.div
                            variants={containerVariants}
                            initial='hidden'
                            whileInView='visible'
                            viewport={{ once: true }}
                            className='flex flex-row items-center justify-center -space-x-3 w-full'>
                            {[BTCImg, ETHImg, XRPImg, BNBImg, SOLImg, TRXImg, DogeImg, ADAImg, BCHImg, AVAXImg].map((imgSrc, index) => (
                                <motion.div key={index} variants={imageVariants}>
                                    <Image src={imgSrc as StaticImageData} alt='logo' width={85} height={85} className='border-2 rounded-full w-9 md:w-16 lg:w-20 h-full object-cover bg-gray-200' />
                                </motion.div>
                            ))}
                        </motion.div>
                        {/* <motion.div
                            initial={{ opacity: 0.0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: 'easeInOut' }}
                            className='text-xl font-semibold text-center'>
                            Top 10 cryptocurrencies in a single, secure, over-collateralized token.
                        </motion.div> */}
                    </div>
                </div>

                <div className='flex flex-col md:flex-row md:space-x-4 items-center justify-center pt-6 px-4'>
                    <div className='flex flex-col space-y-2 items-center'>
                        <motion.div
                            initial={{ opacity: 0.0, x: -40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, ease: 'easeInOut' }}>
                            <Image src={BIT10SOLImg as StaticImageData} alt='logo' width={85} height={85} className='w-16 md:w-16 lg:w-20' />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0.0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: 'easeInOut' }}
                            className='text-xl font-semibold text-primary'>
                            BIT10.SOL
                        </motion.div>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
                        className='text-6xl md:-mt-3'>
                        =
                    </motion.div>

                    <div className='flex flex-col space-y-2 items-start justify-center'>
                        <motion.div
                            variants={containerVariants}
                            initial='hidden'
                            whileInView='visible'
                            viewport={{ once: true }}
                            className='flex flex-row items-center justify-center -space-x-3 w-full'>
                            {[SOLImg, WLFIImg, PUMPImg, TRUMPImg, JUPImg, BONKImg, PENGUImg, PRIMEImg, ZBCNImg, Z2Img].map((imgSrc, index) => (
                                <motion.div key={index} variants={imageVariants}>
                                    <Image src={imgSrc as StaticImageData} alt='logo' width={85} height={85} className='border-2 rounded-full w-9 md:w-16 lg:w-20 h-full object-cover bg-gray-200' />
                                </motion.div>
                            ))}
                        </motion.div>
                        {/* <motion.div
                            initial={{ opacity: 0.0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: 'easeInOut' }}
                            className='text-xl font-semibold text-center'>
                            Top 10 Solana Tokens in a single, secure, over-collateralized token.
                        </motion.div> */}
                    </div>
                </div>

                <motion.p
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className='text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto' style={{ animationDelay: '0.2s' }}>
                    Own the market in one click.
                </motion.p>

                <motion.div
                    initial='hidden'
                    whileInView='visible'
                    viewport={{ once: true }}
                    variants={containerVariants}
                    className='mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground' style={{ animationDelay: '0.5s' }}>
                    <motion.div variants={cardVariants} className='flex items-center gap-2'>
                        <div className='w-2 h-2 rounded-full bg-primary' />
                        <span>Non-custodial</span>
                    </motion.div>
                    <motion.div variants={cardVariants} className='flex items-center gap-2'>
                        <div className='w-2 h-2 rounded-full bg-primary' />
                        <span>Native assets only</span>
                    </motion.div>
                    <motion.div variants={cardVariants} className='flex items-center gap-2'>
                        <div className='w-2 h-2 rounded-full bg-primary' />
                        <span>110% over-collateralized</span>
                    </motion.div>
                </motion.div>
            </div>

            <MaxWidthWrapper className='flex flex-col w-full items-center space-y-4 md:space-y-16 lg:space-y-20 py-8 lg:px-36'>
                <div className='container relative z-10 px-4'>
                    <div className='mx-auto text-center mb-16'>
                        <motion.span
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className='inline-block px-4 py-1.5 mb-6 text-sm font-medium rounded-full bg-destructive/10 text-destructive border border-destructive/20'>
                            The Problem
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className='text-3xl md:text-6xl font-bold mb-6'>
                            Crypto has grown up - <span className='text-muted-foreground'>investing in it hasn&apos;t.</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className='text-lg text-muted-foreground max-w-2xl mx-auto'>
                            Most investors spend hours picking tokens, timing trades, and paying fees - only to underperform the market.
                        </motion.p>
                    </div>

                    <motion.div
                        initial='hidden'
                        whileInView='visible'
                        viewport={{ once: true }}
                        variants={containerVariants} className='grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 w-full'>
                        {painPoints.map((point, index) => (
                            <motion.div key={point.title} variants={cardVariants}>
                                <Card className='group p-6 bg-background hover:border-destructive/30 transition-all duration-300 flex flex-col gap-0' style={{ animationDelay: `${index * 0.1}s` }}>
                                    <div className='w-12 h-12 mb-4 rounded-xl bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors'>
                                        <point.icon className='w-6 h-6 text-destructive' />
                                    </div>
                                    <h3 className='text-lg font-semibold mb-2'>{point.title}</h3>
                                    <p className='text-sm text-muted-foreground'>{point.description}</p>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.8 }}>
                        <Card className='mt-16 max-w-3xl mx-auto text-center bg-background flex flex-col gap-0 text-lg md:text-xl'>
                            <div>In traditional finance, they solved this decades ago with index funds.</div>
                            <div><span className='text-yellow-500 font-medium'> Why hasn&apos;t crypto caught up?</span></div>
                        </Card>
                    </motion.div>
                </div>

                <div className='container px-4'>
                    <div className='max-w-4xl mx-auto text-center mb-16'>
                        <motion.span
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className='inline-block border-yellow-500/20 px-4 py-1.5 mb-6 text-sm font-medium rounded-full bg-yellow-500/10 text-yellow-500 border'>
                            Why Existing Solutions Fall Short
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className='text-3xl md:text-5xl font-bold mb-6'>
                            Not all index funds are{' '}
                            <span className='text-yellow-500'>created equal</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className='text-lg text-yellow-500-foreground'>
                            TradFi ETFs are off-chain. On-chain indexes use wrapped assets. BIT10 is different.
                        </motion.p>

                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className='max-w-5xl mx-auto overflow-x-auto'>
                        <table className='w-full'>
                            <thead>
                                <tr className='border-b border-border'>
                                    <th className='text-left py-4 px-4 text-sm font-medium text-yellow-500-foreground'>Feature</th>
                                    <th className='text-center py-4 px-4 min-w-35'>
                                        <div className='text-sm text-yellow-500-foreground font-normal'>Traditional</div>
                                        <div className='font-semibold'>TradFi ETFs</div>
                                    </th>
                                    <th className='text-center py-4 px-4 min-w-35'>
                                        <div className='text-sm text-yellow-500-foreground font-normal'>Existing</div>
                                        <div className='font-semibold'>On-Chain</div>
                                    </th>
                                    <th className='text-center py-4 px-4 min-w-35 bg-primary/5 rounded-t-xl'>
                                        <div className='text-sm text-primary font-normal'>The Future</div>
                                        <div className='font-bold text-primary'>BIT10</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonData.map((row) => <tr key={row.feature} className='border-b border-border/50 hover:bg-accent/30 transition-colors'>
                                    <td className='py-4 px-4 text-sm font-medium'>{row.feature}</td>
                                    <td className='py-4 px-4'>
                                        <div className='flex justify-center'>
                                            <StatusIcon status={row.tradfi} />
                                        </div>
                                    </td>
                                    <td className='py-4 px-4'>
                                        <div className='flex justify-center'>
                                            <StatusIcon status={row.onchain} />
                                        </div>
                                    </td>
                                    <td className='py-4 px-4 bg-primary/5'>
                                        <div className='flex justify-center'>
                                            <StatusIcon status={row.bit10} />
                                        </div>
                                    </td>
                                </tr>)}
                            </tbody>
                        </table>
                    </motion.div>
                </div>

                <div className='relative overflow-hidden'>
                    <div className='hidden md:block absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl' />

                    <div className='container relative z-10 px-4'>
                        <div className='max-w-4xl mx-auto text-center mb-16'>
                            <motion.span
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                                className='inline-block px-4 py-1.5 mb-6 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20'>
                                The Solution
                            </motion.span>
                            <motion.h2
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                                className='text-3xl md:text-5xl font-bold mb-6'>
                                BIT10.SOL -{' '}
                                <span className='text-primary'>The Future of Index Investing</span>
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                                className='text-lg text-muted-foreground max-w-2xl mx-auto'>
                                One index. One transaction. Full exposure.
                            </motion.p>
                        </div>

                        <motion.div
                            initial='hidden'
                            whileInView='visible'
                            viewport={{ once: true }}
                            variants={containerVariants}
                            className='grid md:grid-cols-3 gap-4 md:gap-8 mb-8'>
                            {stats.map((stat) => (
                                <motion.div
                                    key={stat.label}
                                    variants={cardVariants}
                                >
                                    <Card className='bg-background rounded-2xl text-center flex flex-col gap-1'>
                                        <div className='text-3xl md:text-4xl font-bold text-primary mb-2'>{stat.value}</div>
                                        <div className='text-sm text-muted-foreground'>{stat.label}</div>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>

                        <motion.div
                            initial='hidden'
                            whileInView='visible'
                            viewport={{ once: true }}
                            variants={containerVariants}
                            className='grid md:grid-cols-3 gap-6 md:gap-10 w-full'>
                            {features.map((features, index) => (
                                <motion.div
                                    variants={cardVariants}
                                    key={index}
                                >
                                    <Card className='group p-6 bg-background hover:border-primary/30 transition-all duration-300 flex flex-col gap-0' style={{ animationDelay: `${index * 0.1}s` }}>
                                        <div className='w-12 h-12 mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors'>
                                            <features.icon className='w-6 h-6 text-primary' />
                                        </div>
                                        <h3 className='text-lg font-semibold mb-2'>{features.title}</h3>
                                        <p className='text-sm text-muted-foreground'>{features.description}</p>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className='text-center py-8'>
                            <Button
                                size='lg'
                                className='text-lg px-8 py-6 font-medium'
                                onClick={() => window.open('/mint', '_blank')}
                            >
                                Start Investing Now
                                <ArrowRightIcon className='ml-2 w-5 h-5' />
                            </Button>
                        </motion.div>
                    </div>
                </div>

                <div className='flex flex-col space-y-4 items-center justify-center w-full'>
                    <div className='max-w-4xl mx-auto text-center mb-12'>
                        <motion.span
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className='inline-block px-4 py-1.5 mb-6 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20'>
                            Investment Calculator
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className='text-3xl md:text-5xl font-bold mb-6'>
                            See your potential{' '}
                            <span className='text-primary'>growth</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className='text-lg text-muted-foreground'>
                            Compare BIT10&apos;s projected performance against Bitcoin and traditional markets.
                        </motion.p>
                    </div>

                    <Card className='animate-fade-right-slow h-full w-full lg:w-3/4 bg-background'>
                        <CardHeader className='flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-3 w-full'>
                            <div className='flex flex-col lg:flex-row items-center md:space-x-1.5'>
                                <div>Initial Investment:</div>
                                <div className='relative flex flex-row space-x-2 bg-muted border rounded-full px-2 py-1.5 self-center'>
                                    <AnimatedBackground defaultValue={activeInitialInvestmentTab} className='rounded-full bg-primary' transition={{ ease: 'easeInOut', duration: 0.2 }} onValueChange={handleInitialInvestmentTabChange}>
                                        {initialInvestment.map((label) => (
                                            <button key={label} data-id={label} type='button' className={`inline-flex cursor-pointer px-2 text-sm items-center transition-transform active:scale-95 ${activeTab === label ? 'text-white' : 'text-foreground'}`}>
                                                {label}
                                            </button>
                                        ))}
                                    </AnimatedBackground>
                                </div>
                            </div>
                            <div className='flex flex-col lg:flex-row items-center md:space-x-1.5'>
                                <div>Timeframe:</div>
                                <div className='relative flex flex-row space-x-2 bg-muted border rounded-full px-2 py-1.5 self-center'>
                                    <AnimatedBackground defaultValue={activeTab} className='rounded-full bg-primary' transition={{ ease: 'easeInOut', duration: 0.2 }} onValueChange={handleTabChange}>
                                        {timeframe.map((label) => (
                                            <button key={label} data-id={label} type='button' className={`inline-flex cursor-pointer px-2 text-sm items-center transition-transform active:scale-95 ${activeTab === label ? 'text-white' : 'text-foreground'}`}>
                                                {label}
                                            </button>
                                        ))}
                                    </AnimatedBackground>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className='h-75 lg:h-120 w-full' />
                            ) : (
                                <div className='select-none -ml-4'>
                                    <ChartContainer config={investmentChartConfig} className='h-75 lg:h-95 w-full'>
                                        <LineChart accessibilityLayer data={activeChartData}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey='day' tickLine axisLine={true} tickMargin={8} tickFormatter={tickFormatter} stroke='#ffffff' interval='preserveStartEnd' />
                                            <YAxis tickLine axisLine={true} tickMargin={8} tickCount={6} stroke='#ffffff' tickFormatter={(value) => `$${(value as number).toLocaleString()}`}
                                                domain={[
                                                    (dataMin: number) => {
                                                        const padding = dataMin * 0.05;
                                                        const range = dataMin - padding;
                                                        const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(range) || 1)));
                                                        return Math.floor(range / magnitude) * magnitude;
                                                    },
                                                    (dataMax: number) => {
                                                        const padding = dataMax * 0.05;
                                                        const range = dataMax + padding;
                                                        const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(range) || 1)));
                                                        return Math.ceil(range / magnitude) * magnitude;
                                                    },
                                                ]}
                                            />
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                            <Line dataKey='bit10SolValue' type='monotone' stroke='green' strokeWidth={2} dot={false} name='BIT10.SOL' />
                                            <Line dataKey='btcValue' type='monotone' stroke='orange' strokeWidth={2} dot={false} name='Bitcoin' />
                                            <Line dataKey='solValue' type='monotone' stroke='blue' strokeWidth={2} dot={false} name='Solana' />
                                        </LineChart>
                                    </ChartContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {activeChartData.length > 0 && (
                        <Card className='flex flex-col gap-2 md:gap-4 w-full lg:w-3/4 bg-primary/10 border-primary/20 p-4 md:px-8'>
                            <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
                                <div>
                                    <div className='text-sm text-muted-foreground mb-1'>
                                        {activeInitialInvestmentTab} invested in BIT10 over {activeTab}
                                    </div>
                                    <div className='text-3xl font-bold text-primary text-center md:text-left'>
                                        ${bit10FinalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className='text-right'>
                                    <div className='text-sm text-muted-foreground mb-1'>Projected return</div>
                                    <div className={cn(
                                        'text-2xl font-bold',
                                        bit10ReturnPercent > 0 ? 'text-green-600' : 'text-red-600'
                                    )}>
                                        {bit10ReturnPercent > 0 ? '+' : ''}
                                        {bit10ReturnPercent.toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                            <div className='text-sm text-muted-foreground'>* Based on historical crypto market data. Past performance does not guarantee future results. Investment in crypto assets involves risk.</div>
                        </Card>
                    )}
                </div>

                <div className='relative flex overflow-hidden w-full items-center justify-center' id='reserves'>
                    <div className='container px-4'>
                        <div className='max-w-4xl mx-auto text-center mb-12'>
                            <motion.span
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                                className='inline-block px-4 py-1.5 mb-6 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20'>
                                Transparency
                            </motion.span>
                            <motion.h2
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                                className='text-3xl md:text-5xl font-bold mb-6'>
                                If it exists,{' '}
                                <span className='text-primary'>you can see it</span>
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                                className='text-lg text-muted-foreground max-w-2xl mx-auto'>
                                Every asset backing your BIT10 tokens is verifiable on-chain. <br />
                                No trust required - just verify.
                            </motion.p>
                        </div>

                        {/* <div className='max-w-5xl mx-auto'>
                            <motion.div
                                initial='hidden'
                                whileInView='visible'
                                viewport={{ once: true }}
                                variants={containerVariants}
                                className='grid md:grid-cols-3 gap-4 mb-8'>
                                <motion.div variants={cardVariants} className='p-6 rounded-2xl border text-center'>
                                    <ShieldIcon className='w-8 h-8 text-primary mx-auto mb-3' />
                                    <div className='text-sm text-muted-foreground mb-1'>Total Reserves</div>
                                    <div className='text-2xl font-bold'>${bit10SOLTotalCollateral.toFixed(2)}</div>
                                </motion.div>
                                <motion.div variants={cardVariants} className='p-6 rounded-2xl border text-center border-primary/30'>
                                    <div className='w-8 h-8 mx-auto mb-3 rounded-full bg-primary/20 flex items-center justify-center'>
                                        <CheckIcon className='w-5 h-5 text-primary' />
                                    </div>
                                    <div className='text-sm text-muted-foreground mb-1'>Collateralization</div>
                                    <div className='text-2xl font-bold text-primary'>110%</div>
                                </motion.div>
                                <motion.div variants={cardVariants} className='p-6 rounded-2xl border text-center'>
                                    <TrendingUpIcon className='w-8 h-8 text-primary mx-auto mb-3' />
                                    <div className='text-sm text-muted-foreground mb-1'>Total Supply</div>
                                    <div className='text-2xl font-bold'>{bit10SOLSupply.toFixed(2)}</div>
                                </motion.div>
                            </motion.div> */}

                        <div className='rounded-3xl border overflow-hidden'>
                            <div className='p-6 border-b border-border'>
                                <motion.h3
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2, duration: 0.8 }}
                                    className='text-lg font-semibold'>
                                    {/* BIT10.SOL Reserve Holdings */}
                                    BIT10.SOL Current Weights
                                </motion.h3>
                                <motion.p
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2, duration: 0.8 }}
                                    className='text-sm text-muted-foreground'>
                                    Native assets held across all supported chains
                                </motion.p>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                                className='overflow-x-auto'>
                                <table className='w-full'>
                                    <thead>
                                        <tr className='border-b border-border/50 text-sm text-muted-foreground'>
                                            <th className='text-left py-2 px-6 font-medium'>Asset</th>
                                            <th className='text-right py-2 px-6 font-medium'>Token Price</th>
                                            <th className='text-right py-2 px-6 font-medium'>Weight</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bit10WithPercentages.map((reserve, index) => (
                                            <tr
                                                key={index}
                                                className='border-b border-border/30 hover:bg-muted/30 transition-colors'
                                            >
                                                <td className='py-2 px-6'>
                                                    <div className='flex items-center gap-3'>
                                                        <div className='w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center'>
                                                            <Image src={reserve.image} alt={reserve.name} width={40} height={40} className='object-contain' />
                                                        </div>
                                                        <div>
                                                            <div className='font-medium uppercase'>{reserve.symbol}</div>
                                                            <div className='text-sm text-muted-foreground'>{reserve.name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className='py-2 px-6 text-right font-medium'>${formatPreciseDecimal(reserve.price)}</td>
                                                <td className='py-2 px-6 text-right'>
                                                    <div className='flex items-center justify-end gap-3'>
                                                        <div className='w-24 h-2 rounded-full bg-muted overflow-hidden'>
                                                            <div
                                                                className='h-full rounded-full bg-linear-to-r from-primary to-primary/60'
                                                                style={{ width: `${reserve.percentage * 3}%` }}
                                                            />
                                                        </div>
                                                        <span className='text-sm text-muted-foreground w-12 text-right'>
                                                            {reserve.percentage}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </motion.div>

                            {/* <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                                className='p-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4'>
                                <p className='text-sm text-muted-foreground'>
                                    All holdings verified via on-chain proof. Click to verify on-chain.
                                </p>
                                <Button variant='outline' size='sm' onClick={() => window.open('/collateral', '_blank')}>
                                    Verify On-Chain
                                    <ExternalLinkIcon className='ml-2 w-4 h-4' />
                                </Button>
                            </motion.div> */}
                        </div>

                    </div>
                </div >

                <div className='relative' id='how-it-works'>
                    <div className='container px-4'>
                        <div className='max-w-4xl mx-auto text-center mb-16'>
                            <motion.span
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                                className='inline-block px-4 py-1.5 mb-6 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20'>
                                Simple Process
                            </motion.span>
                            <motion.h2
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                                className='text-3xl md:text-5xl font-bold mb-6'>
                                How it{' '}
                                <span className='text-primary'>works</span>
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                                className='text-lg text-muted-foreground'>
                                From zero to diversified in under 2 minutes.
                            </motion.p>
                        </div>

                        <div className='max-w-5xl mx-auto'>
                            <div className='relative'>
                                <div className='hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-border to-transparent -translate-y-1/2' />

                                <motion.div
                                    initial='hidden'
                                    whileInView='visible'
                                    viewport={{ once: true }}
                                    variants={containerVariants}
                                    className='grid md:grid-cols-3 gap-8'>
                                    {steps.map((step, index) => (
                                        <motion.div
                                            variants={cardVariants}
                                            key={step.step}
                                            className='relative group'
                                        >
                                            <div className='p-8 rounded-3xl bg-background border hover:border-primary/30 transition-all duration-300 text-center'>
                                                <div className='absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-bold'>
                                                    {step.step}
                                                </div>

                                                <div className='w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors'>
                                                    <step.icon className='w-8 h-8 text-primary' />
                                                </div>

                                                <h3 className='text-xl font-semibold mb-3'>{step.title}</h3>
                                                <p className='text-muted-foreground'>{step.description}</p>
                                            </div>

                                            {index < steps.length - 1 && (
                                                <div className='md:hidden flex justify-center my-4'>
                                                    <div className='w-8 h-8 rounded-full border border-border flex items-center justify-center'>
                                                        <svg className='w-4 h-4 text-muted-foreground rotate-90' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='flex flex-col space-y-4 w-full items-center overflow-hidden'>
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className='text-4xl md:text-6xl font-semibold text-center'>
                        Our Partners
                    </motion.div>

                    <InfiniteMovingCards
                        items={testimonials}
                        direction='right'
                        speed='slow'
                    />

                    <motion.div
                        initial='hidden'
                        whileInView='visible'
                        viewport={{ once: true }}
                        variants={containerVariants}
                        className='flex flex-col md:flex-row items-center justify-evenly w-full space-y-3 md:space-y-0'>
                        {parterners.map((partner, index) => (
                            <motion.div variants={cardVariants} key={index} className='p-2 border-2 border-accent rounded-2xl bg-white'>
                                <Image src={partner.logo} height={50} width={400} alt={partner.name} />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </MaxWidthWrapper >
        </div >
    )
}
