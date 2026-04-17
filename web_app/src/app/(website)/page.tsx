"use client";

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

import LINKImg from '@/assets/tokens/link.svg';
import WLFIImg from '@/assets/tokens/wlfi.svg';
import UNIImg from '@/assets/tokens/uni.svg';
import AAVEImg from '@/assets/tokens/aave.svg';
import RENDERImg from '@/assets/tokens/render.svg';
import GTImg from '@/assets/tokens/gt.svg';
import TRUMPImg from '@/assets/tokens/trump.svg';
import PUMPImg from '@/assets/tokens/pump.svg';
import JUPImg from '@/assets/tokens/jup.svg';

import DefinityDevImg from '@/assets/home/DFINITYDev.jpg';
import EasyaAppImg from '@/assets/home/easya_app.jpg';
import ICPImg from '@/assets/home/ICP.svg';
import EasyAImg from '@/assets/home/EasyA.png';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircleIcon, ClockIcon, DollarSignIcon, RefreshCwIcon, MinusIcon, ShieldIcon, ZapIcon, CheckIcon, XIcon, EyeIcon, ArrowRightIcon, WalletIcon, ArrowDownUpIcon, PieChartIcon } from 'lucide-react';

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
        description: 'No wrapped tokens. You own the actual BTC, ETH, SOL - not IOUs.',
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

export default function Page() {
    return (
        <div className='flex flex-col space-y-4'>
            <div className='relative flex flex-col space-y-2 md:space-y-8 items-center max-w-7xl mx-auto z-10 w-full pt-8 md:py-18'>
                <div className='hidden md:block absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl z-[-1]' />
                <div className='hidden md:block absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl z-[-1]' />

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
                            {[SOLImg, LINKImg, WLFIImg, UNIImg, AAVEImg, RENDERImg, GTImg, TRUMPImg, PUMPImg, JUPImg].map((imgSrc, index) => (
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

            <MaxWidthWrapper className='flex flex-col space-y-4 md:space-y-16 lg:space-y-20 py-8 lg:px-36'>
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
                            className='grid grid-cols-3 gap-4 md:gap-8 mb-8'>
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

                <div className='flex flex-col space-y-4 items-center overflow-hidden'>
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
            </MaxWidthWrapper>
        </div >
    )
}
