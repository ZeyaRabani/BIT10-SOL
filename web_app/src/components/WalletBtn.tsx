"use client";

import { useState, useEffect, useMemo } from 'react';
import { useChain } from '@/context/ChainContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useQueries, type UseQueryOptions } from '@tanstack/react-query';
import { CHAIN_REGISTRY } from '@/chains/chain.registry';
import { motion } from 'framer-motion';
import { formatCompactNumber } from '@/lib/utils';
import { ArrowLeftIcon, Loader2Icon, WalletMinimalIcon, CopyIcon } from 'lucide-react';

const containerVariants = {
    visible: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const cardVariantsRight = {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeInOut' } },
};

export default function WalletBtn() {
    const [open, setOpen] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [selectedChain, setSelectedChain] = useState<'solana' | null>(null);
    const [, setCopied] = useState(false);

    const { chain, setChain } = useChain();

    const solanaWallet = useWallet();
    const { wallets: solanaWallets, connected: isSolanaConnected } = solanaWallet;
    const { publicKey } = useWallet();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const boundSolanaSelect = (walletName: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return solanaWallet.select?.(walletName);
    };

    const boundDisconnectSolana = () => {
        return solanaWallet.disconnect?.();
    };

    useEffect(() => {
        if (isSolanaConnected && solanaWallet.publicKey) {
            setChain('solana');
        } else {
            setChain(undefined);
        }
    }, [isSolanaConnected, solanaWallet.publicKey, setChain]);

    useEffect(() => {
        if (!isSolanaConnected) {
            setChain(undefined);
        }
    }, [isSolanaConnected, setChain]);

    useEffect(() => {
        if (chain === 'solana' && !isSolanaConnected) {
            setChain(undefined);
        }
    }, [chain, isSolanaConnected, setChain]);

    const handleDisconnect = async () => {
        switch (chain) {
            case 'solana':
                await boundDisconnectSolana?.();
                break;
        }

        setChain(undefined);
        setSelectedChain(null);
    };

    const handleBack = () => {
        setSelectedChain(null);
    };

    const balanceQueries = useMemo((): UseQueryOptions[] => {
        const queries: UseQueryOptions[] = [];

        if (chain === 'solana' && publicKey) {
            queries.push(
                {
                    queryKey: ['tokenBalanceSolanaSOL', publicKey, chain],
                    queryFn: () => CHAIN_REGISTRY.solana.fetchTokenBalance({ tokenAddress: 'So11111111111111111111111111111111111111112', publicKey: publicKey }),
                    refetchInterval: 30000,
                },
                {
                    queryKey: ['tokenBalanceSolanaUSDC', publicKey, chain],
                    queryFn: () => CHAIN_REGISTRY.solana.fetchTokenBalance({ tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', publicKey: publicKey }),
                    refetchInterval: 30000,
                },
                {
                    queryKey: ['tokenBalanceSolanaBIT10SOL', publicKey, chain],
                    queryFn: () => CHAIN_REGISTRY.solana.fetchTokenBalance({ tokenAddress: 'bitQG7BVz72Gu5L99bYRrZxTmFj8NPaFpT2uPp47yew', publicKey: publicKey }),
                    refetchInterval: 30000,
                }
            );
        }

        return queries;
    }, [chain, publicKey]);

    const allBalanceQueries = useQueries({ queries: balanceQueries });

    const balanceIndices = useMemo(() => {
        const indices: Record<string, number> = {};
        let idx = 0;

        if (chain === 'solana') {
            indices.solanaSOL = idx++;
            indices.solanaUSDC = idx++;
            indices.solanaBIT10SOL = idx++;
        }

        return indices;
    }, [chain]);

    const tokenBalanceUSDC = useMemo<number>(() => {
        const idx = chain === 'solana' ? balanceIndices.solanaUSDC : undefined;

        if (idx == null) return 0;

        const q = allBalanceQueries[idx];
        return Number(q?.data ?? 0);
    }, [allBalanceQueries, balanceIndices, chain]);

    const tokenBalanceBIT10SOL = useMemo<number>(() => {
        const idx = chain === 'solana' ? balanceIndices.solanaBIT10SOL : undefined;

        if (idx == null) return 0;

        const q = allBalanceQueries[idx];
        return Number(q?.data ?? 0);
    }, [allBalanceQueries, balanceIndices, chain]);

    const renderChainContent = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleSolanaWalletSelect = async (walletName: any) => {
            if (walletName) {
                try {
                    boundSolanaSelect?.(walletName);
                    setIsConnecting(true);
                    setOpen(false);
                    handleBack();

                    if (isSolanaConnected) {
                        setChain('solana');
                        setOpen(false);
                    }

                    setIsConnecting(false);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                    toast.error(
                        'An error occurred while connecting your wallet. Please try again!'
                    );
                }
            }
        };

        return (
            <div className='flex flex-col justify-between space-y-2 h-88 md:h-72'>
                {!solanaWallets.some(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (wallet) => wallet.readyState === 'Installed' as any
                ) ? (
                    <motion.div
                        initial='hidden'
                        whileInView='visible'
                        variants={containerVariants}
                    >
                        <div className='flex flex-col space-y-2 items-center justify-center'>
                            <motion.h1
                                variants={cardVariantsRight}
                                className='text-xl md:text-2xl tracking-wide text-center'
                            >
                                You&apos;ll need a wallet on Solana to continue
                            </motion.h1>

                            <motion.div
                                variants={cardVariantsRight}
                                className='p-4 rounded-full border-2'
                            >
                                <WalletMinimalIcon
                                    strokeWidth={1}
                                    className='h-16 w-16 font-light'
                                />
                            </motion.div>

                            <motion.div
                                variants={cardVariantsRight}
                                className='flex flex-row justify-center py-2'
                            >
                                <a href='https://phantom.app' target='_blank'>
                                    <Button className='w-full px-20'>Get a Wallet</Button>
                                </a>
                            </motion.div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial='hidden'
                        whileInView='visible'
                        variants={containerVariants}
                        className='grid md:grid-cols-2 gap-2 items-center overflow-x-hidden pr-2'
                    >
                        {solanaWallets.map((wallet) => (
                            <motion.div
                                variants={cardVariantsRight}
                                key={wallet.adapter.name}
                            >
                                <Button
                                    variant='outline'
                                    className='flex flex-row w-full md:py-6 justify-center items-center'
                                    onClick={() =>
                                        handleSolanaWalletSelect(wallet.adapter.name)
                                    }
                                    disabled={isConnecting}
                                >
                                    <Image
                                        height={30}
                                        width={30}
                                        src={wallet.adapter.icon}
                                        alt={wallet.adapter.name}
                                        className='rounded'
                                    />
                                    <div className='text-lg md:text-xl overflow-hidden'>
                                        {wallet.adapter.name}
                                    </div>
                                </Button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                <p className='text-center'>
                    By connecting a wallet, you agree to BIT10&apos;s{' '}
                    <a href='/tos' target='_blank'>
                        <span className='underline'>Terms of Service</span>
                    </a>{' '}
                    and consent to its{' '}
                    <a href='/privacy' target='_blank'>
                        <span className='underline'>Privacy Policy</span>
                    </a>
                    .
                </p>
            </div>
        );
    };

    const activeAddress = isSolanaConnected ? solanaWallet.publicKey?.toBase58() : null;

    const handleCopyAddress = async () => {
        if (!activeAddress) return;
        await navigator.clipboard.writeText(activeAddress);
        setCopied(true);
        toast.info('Address copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    function truncateAddress(address: string) {
        if (!address) return '';
        return `${address.slice(0, 5)}.....${address.slice(-5)}`;
    }

    return (
        <div>
            {isSolanaConnected && activeAddress ? (
                <div>
                    <div className='hidden md:block'>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant='outline'>{truncateAddress(activeAddress ?? '')}</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel className='flex flex-row items-center justify-between space-x-4 cursor-pointer' onClick={handleCopyAddress}>
                                        {truncateAddress(activeAddress ?? '')}
                                        <CopyIcon size={15} />
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel>Balance</DropdownMenuLabel>
                                    <DropdownMenuItem className='flex flex-row items-center justify-between space-x-4 cursor-pointer'>
                                        <div>USDC</div>
                                        <div>{formatCompactNumber(tokenBalanceUSDC)}</div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className='flex flex-row items-center justify-between space-x-4 cursor-pointer'>
                                        <div>BIT10.SOL</div>
                                        <div>{formatCompactNumber(tokenBalanceBIT10SOL)}</div>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem onClick={handleDisconnect} className='bg-destructive text-white data-highlighted:bg-destructive/90 data-highlighted:text-white focus-visible:ring-destructive/20 px-4 cursor-pointer'>Disconnect wallet</DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className='block md:hidden'>
                        <Button variant='destructive' onClick={handleDisconnect} className='w-full'>Disconnect wallet</Button>
                    </div>
                </div>
            ) : (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={isConnecting} className='w-full'>
                            {isConnecting && <Loader2Icon className='animate-spin' size={15} />}
                            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-[90vw] md:max-w-150 border-none'>
                        <DialogHeader>
                            <DialogTitle className='tracking-wide pt-2 md:pt-0'>
                                {selectedChain ? (
                                    <div className='flex flex-col items-start space-y-2'>
                                        <div>Connect your wallet to get started</div>
                                        <Button variant='ghost' size='sm' onClick={handleBack}>
                                            <ArrowLeftIcon /> Select different chain
                                        </Button>
                                    </div>
                                ) : (
                                    'Select a Network'
                                )}
                            </DialogTitle>
                        </DialogHeader>
                        {renderChainContent()}
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
