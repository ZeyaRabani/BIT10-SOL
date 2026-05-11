/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState, useMemo, useCallback, useEffect } from 'react';
import * as z from 'zod';
import { useChain } from '@/context/ChainContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQueries, type UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatAddress, formatCompactNumber, formatCompactPercentNumber } from '@/lib/utils';
import { ChevronsUpDownIcon, Loader2Icon, InfoIcon, ArrowUpDownIcon, WalletIcon } from 'lucide-react';
import { useForm, useStore } from '@tanstack/react-form';
import { CHAIN_REGISTRY } from '@/chains/chain.registry';
import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card';
import TokenDetails from './TokenDetails';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { cn } from '@/lib/utils';
import { Field, FieldError } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BuyModuleProps {
    onSwitchToSell: () => void;
}

type BIT10PriceData = {
    timestmpz: string;
    tokenPrice: number;
    data: Array<{ id: string; name: string; symbol: string; price: number; marketCap?: number }>;
};

interface BuyingTokenPriceResponse {
    data: {
        amount: string;
        base: string;
        currency: string;
    };
};

interface TokenField {
    handleChange: (value: string) => void;
};

const FormSchema = z.object({
    payment_amount: z.preprocess((value) => parseFloat(value as string), z.number({
        message: 'Please enter the number of tokens for payment',
    })
        .positive('The amount must be a positive number')
        .refine(value => Number(value.toFixed(8)) === value, 'Amount cannot have more than 8 decimal places')),
    payment_token: z.string({
        required_error: 'Please select a payment token',
    }),
    receive_amount: z.preprocess((value) => parseFloat(value as string), z.number({
        message: 'Please enter the number of BIT10 tokens you wish to mint',
    })
        .positive('The amount must be a positive number')
        .min(0.001, 'Minimum amount should be 0.001')
        .refine(value => Number(value.toFixed(8)) === value, 'Amount cannot have more than 8 decimal places')),
    receive_token: z.string({
        required_error: 'Please select the BIT10 token to receive',
    })
});

export default function BuyModule({ onSwitchToSell }: BuyModuleProps) {
    const [buying, setBuying] = useState<boolean>(false);
    const [paymentTokenDialogOpen, setPaymentTokenDialogOpen] = useState<boolean>(false);
    const [receiveTokenDialogOpen, setReceiveTokenDialogOpen] = useState<boolean>(false);
    const [paymentTokenSearch, setPaymentTokenSearch] = useState<string>('');
    const [receiveTokenSearch, setReceiveTokenSearch] = useState<string>('');
    const [lastEditedField, setLastEditedField] = useState<'payment' | 'receive'>('payment');

    const { chain } = useChain();

    const { publicKey } = useWallet();
    const wallet = useWallet();

    const fetchBIT10Price = useCallback(async (tokenPriceAPI: string) => {
        try {
            const response = await fetch(tokenPriceAPI);

            if (!response.ok) {
                toast.error('Error fetching BIT10 price. Please try again!');
            }

            const data = await response.json() as BIT10PriceData;
            return data ?? [];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occured getting the price of BIT10 token.')
            return [];
        }
    }, []);

    const bit10PriceQueries = useMemo((): UseQueryOptions[] => {
        const queries: UseQueryOptions[] = [
            {
                queryKey: ['bit10SOLTokenPrice'],
                queryFn: () => fetchBIT10Price('bit10-latest-price-sol'),
                refetchInterval: 1800000, // 30 min.
            }
        ]

        return queries;
    }, [fetchBIT10Price]);

    const bit10Queries = useQueries({ queries: bit10PriceQueries });
    const bit10SOLPrice = useMemo(() => {
        const response = bit10Queries[0]?.data as BIT10PriceData | undefined;
        return response?.tokenPrice ?? 0;
    }, [bit10Queries]);

    const bit10SOLTokens = useMemo(() => {
        const response = bit10Queries[0]?.data as BIT10PriceData | undefined;
        return (
            response?.data?.map(token => ({
                ...token,
                marketCap: typeof token.marketCap === 'number' ? token.marketCap : 0,
            })) ?? []
        );
    }, [bit10Queries]);

    const fetchPayWithPrice = useCallback(async (currency: string) => {
        const response = await fetch(`https://api.coinbase.com/v2/prices/${currency}-USD/buy`);
        if (!response.ok) {
            toast.error(`Error fetching ${currency} price. Please try again!`);
        }
        const data = await response.json() as BuyingTokenPriceResponse;
        return data.data.amount;
    }, []);

    const payWithPriceQueries = useMemo((): UseQueryOptions[] => {
        const queries: UseQueryOptions[] = [];

        queries.push(
            {
                queryKey: ['buyingSOLPrice'],
                queryFn: () => fetchPayWithPrice('SOL'),
                refetchInterval: 30000, // 30 sec.
            },
            {
                queryKey: ['buyingUSDCPrice'],
                queryFn: () => fetchPayWithPrice('USDC'),
                refetchInterval: 30000, // 30 sec.
            }
        )

        return queries;
    }, [fetchPayWithPrice]);

    const payQueries = useQueries({ queries: payWithPriceQueries });

    const usdcAmount = useMemo(() =>
        payQueries.find((_, i) =>
            payWithPriceQueries[i]?.queryKey?.[0] === 'buyingUSDCPrice'
        )?.data,
        [payQueries, payWithPriceQueries]
    );

    const solAmount = useMemo(() =>
        payQueries.find((_, i) =>
            payWithPriceQueries[i]?.queryKey?.[0] === 'buyingSOLPrice'
        )?.data,
        [payQueries, payWithPriceQueries]
    );

    const defaultPaymentToken = useMemo(() => {
        if (chain === 'solana') {
            return 'Solana';
        }
        return 'Solana';
    }, [chain]);

    const form = useForm({
        defaultValues: {
            payment_amount: 5,
            payment_token: defaultPaymentToken,
            receive_amount: 1,
            receive_token: 'BIT10.SOL'
        },
        validators: {
            // @ts-expect-error
            onSubmit: FormSchema,
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value)
        },
    });

    useEffect(() => {
        form.reset();
        form.setFieldValue('payment_amount', 5);
        form.setFieldValue('payment_token', defaultPaymentToken);
        form.setFieldValue('receive_amount', 1);
        form.setFieldValue('receive_token', 'BIT10.SOL');
        setLastEditedField('payment');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chain, defaultPaymentToken]);

    const formWatchPaymentAmount = useStore(form.store, (state) => state.values.payment_amount);
    const formWatchPaymentToken = useStore(form.store, (state) => state.values.payment_token);
    const formWatchReceiveAmount = useStore(form.store, (state) => state.values.receive_amount);
    const formWatchReceiveToken = useStore(form.store, (state) => state.values.receive_token);

    const selectedBIT10Tokens = useMemo(() => {
        const receiveToken = formWatchReceiveToken;
        if (receiveToken === 'BIT10.SOL') {
            return bit10SOLTokens ?? [];
        }
        return [];
    }, [formWatchReceiveToken, bit10SOLTokens]);

    const selectedBIT10TokenPrice = useMemo(() => {
        const receiveToken = formWatchReceiveToken;
        if (receiveToken === 'BIT10.SOL') {
            return Number(bit10SOLPrice) || 0;
        }
        return 0;
    }, [formWatchReceiveToken, bit10SOLPrice]);

    const balanceQueries = useMemo((): UseQueryOptions[] => {
        const queries: UseQueryOptions[] = [];

        if (chain === 'solana' && publicKey) {
            queries.push(
                {
                    queryKey: ['paymentTokenBalanceSolanaSOL', chain],
                    queryFn: () => CHAIN_REGISTRY.solana.fetchTokenBalance({ tokenAddress: 'So11111111111111111111111111111111111111112', publicKey: publicKey }),
                    refetchInterval: 30000,
                },
                {
                    queryKey: ['paymentTokenBalanceSolanaUSDC', publicKey, chain],
                    queryFn: () => CHAIN_REGISTRY.solana.fetchTokenBalance({ tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', publicKey: publicKey }),
                    refetchInterval: 30000,
                }
            );
        }

        return queries;
    }, [chain, publicKey]);

    const allBalanceQueries = useQueries({ queries: balanceQueries });

    let currentBalanceIndex = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const balanceIndices: Record<string, number> = {};

    if (chain === 'solana') {
        balanceIndices.solanaSOL = currentBalanceIndex++;
        balanceIndices.solanaUSDC = currentBalanceIndex++;
    }

    const currentPaymentTokens = useMemo(() => {
        if (chain === 'solana' || chain === undefined) {
            return CHAIN_REGISTRY.solana.buyPayTokens;
        } else {
            return CHAIN_REGISTRY.solana.buyPayTokens;
        }
    }, [chain]);

    const payingTokenAddress = useMemo(() => {
        const selectedToken = currentPaymentTokens.find(token => token.value === formWatchPaymentToken);
        return selectedToken?.address ?? '';
    }, [currentPaymentTokens, formWatchPaymentToken]);

    const payingTokenPrice = useMemo(() => {
        if (chain === 'solana') {
            if (payingTokenAddress === 'So11111111111111111111111111111111111111112') return Number(solAmount) || 0;
            if (payingTokenAddress === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') return Number(usdcAmount) || 0;
        }
        return 0;
    }, [chain, payingTokenAddress, solAmount, usdcAmount]);

    const payingTokenBalance = useMemo(() => {
        if (chain === 'solana') {
            if (payingTokenAddress === 'So11111111111111111111111111111111111111112' && balanceIndices.solanaSOL !== undefined) {
                return allBalanceQueries[balanceIndices.solanaSOL]?.data ?? 0;
            }
            if (payingTokenAddress === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' && balanceIndices.solanaUSDC !== undefined) {
                return allBalanceQueries[balanceIndices.solanaUSDC]?.data ?? 0;
            }
        }
        return 0;
    }, [allBalanceQueries, balanceIndices, chain, payingTokenAddress]);

    const currentBIT10Tokens = useMemo(() => {
        if (chain === 'solana' || chain === undefined) {
            return CHAIN_REGISTRY.solana.buyReceiveTokens;
        } else {
            return CHAIN_REGISTRY.solana.buyReceiveTokens;
        }
    }, [chain]);

    const receivingTokenAddress = useMemo(() => {
        const selectedToken = currentBIT10Tokens.find(token => token.value === formWatchReceiveToken);
        const address = selectedToken?.address ?? '';
        return address;
    }, [currentBIT10Tokens, formWatchReceiveToken]);

    const selectedPaymentTokenData = useMemo(() => {
        return currentPaymentTokens.find(token => token.value === formWatchPaymentToken);
    }, [currentPaymentTokens, formWatchPaymentToken]);

    const selectedReceiveTokenData = useMemo(() => {
        return currentBIT10Tokens.find(token => token.value === formWatchReceiveToken);
    }, [currentBIT10Tokens, formWatchReceiveToken]);

    const filteredPaymentTokens = useMemo(() => {
        if (!paymentTokenSearch.trim()) {
            return currentPaymentTokens;
        }

        const searchLower = paymentTokenSearch.toLowerCase();
        return currentPaymentTokens.filter(token =>
            token.label.toLowerCase().includes(searchLower) ??
            token.value.toLowerCase().includes(searchLower) ??
            token.address.toLowerCase().includes(searchLower) ??
            token.tokenType.toLowerCase().includes(searchLower)
        );
    }, [currentPaymentTokens, paymentTokenSearch]);

    const filteredReceiveTokens = useMemo(() => {
        if (!receiveTokenSearch.trim()) {
            return currentBIT10Tokens;
        }

        const searchLower = receiveTokenSearch.toLowerCase();
        return currentBIT10Tokens.filter(token =>
            token.label.toLowerCase().includes(searchLower) ??
            token.value.toLowerCase().includes(searchLower) ??
            token.address.toLowerCase().includes(searchLower) ??
            token.tokenType.toLowerCase().includes(searchLower)
        );
    }, [currentBIT10Tokens, receiveTokenSearch]);

    const exchangeRate = useMemo(() => {
        const payPrice = Number(payingTokenPrice);
        const receivePrice = Number(selectedBIT10TokenPrice);
        if (payPrice === 0 || receivePrice === 0) return 0;
        return payPrice / receivePrice;
    }, [payingTokenPrice, selectedBIT10TokenPrice]);

    const PLATFORM_FEE = 1.005;

    const paymentUsdValue = useMemo(() => {
        return Number(formWatchPaymentAmount) * Number(payingTokenPrice);
    }, [formWatchPaymentAmount, payingTokenPrice]);

    const receiveUsdValue = useMemo(() => {
        return Number(formWatchReceiveAmount) * Number(selectedBIT10TokenPrice);
    }, [formWatchReceiveAmount, selectedBIT10TokenPrice]);

    useEffect(() => {
        if (lastEditedField === 'payment') {
            const payPrice = Number(payingTokenPrice);
            const receivePrice = Number(selectedBIT10TokenPrice);

            if (payPrice > 0 && receivePrice > 0) {
                const calculatedReceiveAmount = (Number(formWatchPaymentAmount) * payPrice) / (receivePrice * PLATFORM_FEE);
                const roundedAmount = Math.floor(calculatedReceiveAmount * 100000000) / 100000000;

                form.setFieldValue('receive_amount', roundedAmount);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formWatchPaymentAmount, formWatchPaymentToken, payingTokenPrice, selectedBIT10TokenPrice, lastEditedField, chain]);


    useEffect(() => {
        if (lastEditedField === 'receive') {
            const payPrice = Number(payingTokenPrice);
            const receivePrice = Number(selectedBIT10TokenPrice);

            if (payPrice > 0 && receivePrice > 0) {
                const calculatedPaymentAmount = (Number(formWatchReceiveAmount) * receivePrice * PLATFORM_FEE) / payPrice;
                const roundedAmount = Math.floor(calculatedPaymentAmount * 100000000) / 100000000;

                form.setFieldValue('payment_amount', roundedAmount);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formWatchReceiveAmount, formWatchReceiveToken, payingTokenPrice, selectedBIT10TokenPrice, lastEditedField, chain]);

    const handlePaymentTokenSelect = (tokenValue: string, field: TokenField) => {
        field.handleChange(tokenValue);
        setPaymentTokenDialogOpen(false);
        setLastEditedField('payment');
    };

    const handleReceiveTokenSelect = (tokenValue: string, field: TokenField) => {
        field.handleChange(tokenValue);
        setReceiveTokenDialogOpen(false);
        setLastEditedField('receive');
    };

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            setBuying(true);

            if (chain === 'solana') {

                await CHAIN_REGISTRY.solana.buyBIT10Token({
                    tokenInAmount: values.payment_amount.toString(),
                    tokenInAddress: payingTokenAddress,
                    tokenOutAmount: values.receive_amount.toString(),
                    tokenOutAddress: receivingTokenAddress,
                    walletAddress: wallet.publicKey ? wallet.publicKey.toBase58() : '',
                    wallet: wallet,
                });
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occurred while processing your request. Please try again!');
        } finally {
            setBuying(false);
        }
    }

    const fromAmount = Number((formWatchReceiveAmount * parseFloat(selectedBIT10TokenPrice.toFixed(6))) / Number(payingTokenPrice) * PLATFORM_FEE);
    const balance = Number(payingTokenBalance);

    const buyDisabledConditions = !chain || buying || fromAmount >= balance || fromAmount >= balance * PLATFORM_FEE || balance <= 0 || fromAmount <= 0 || Number(formWatchReceiveAmount) <= 0;

    const getBuyMessage = (): string => {
        if (!chain) return 'Connect your wallet to continue';
        if (buying) return 'Minting...';
        if (fromAmount >= balance || fromAmount >= balance * PLATFORM_FEE && !buying) return 'Balance too low to cover transfer and gas fees';
        if (fromAmount <= 0 || Number(formWatchReceiveAmount) <= 0) return 'Amount too low';
        return 'Mint';
    };

    return (
        <div className='flex flex-col-reverse lg:grid lg:grid-cols-4 xl:grid-cols-5 gap-4'>
            <div className='lg:col-span-2 xl:col-span-3'>
                <TokenDetails token_price={selectedBIT10TokenPrice} token_name={formWatchReceiveToken} token_list={selectedBIT10Tokens} />
            </div>

            <div className='lg:col-span-2 xl:col-span-2'>
                <Card className='border-none animate-fade-right'>
                    <CardHeader className='flex flex-row items-center justify-between'>
                        <CardTitle>Mint</CardTitle>
                        <div className='relative flex flex-row space-x-2 items-center justify-center border rounded-full px-2 py-1.5'>
                            <AnimatedBackground defaultValue='Mint' className='rounded-full bg-primary' transition={{ ease: 'easeInOut', duration: 0.2 }} onValueChange={onSwitchToSell}>
                                <button type='button' data-id={'Mint'} className='inline-flex px-2 cursor-pointer items-center justify-center text-center transition-transform active:scale-[0.98] text-sm font-light'>
                                    Mint
                                </button>
                                <button type='button' data-id={'Sell'} className='inline-flex px-2 cursor-pointer items-center justify-center text-center transition-transform active:scale-[0.98] text-sm font-light'>
                                    Sell
                                </button>
                            </AnimatedBackground>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form autoComplete='off' className='flex flex-col space-y-2'
                            onSubmit={async (e) => {
                                e.preventDefault()
                                await form.handleSubmit()
                            }}
                        >
                            <div className='relative flex flex-col items-center'>
                                <div className='bg-muted rounded-t-2xl w-full px-4 py-2 flex flex-col space-y-2'>
                                    <div className='flex flex-row space-x-2 justify-between items-center'>
                                        <div>You Pay</div>
                                    </div>
                                    <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2'>
                                        <div className='flex flex-col space-y-0.75'>
                                            <form.Field name='payment_amount'>
                                                {(field) => {
                                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                                    return (
                                                        <Field>
                                                            <Input type='number' step='any' min='0' placeholder='0.00' className='w-full md:max-w-3/4 border-2 border-[#B4B3B3] py-5 text-xl!'
                                                                value={field.state.value || 0}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    const parsed = value === '' ? 0 : Number(value);
                                                                    field.handleChange(parsed);
                                                                    setLastEditedField('payment');
                                                                }} />
                                                            {isInvalid && <FieldError errors={field.state.meta.errors} className='-mt-2.5' />}
                                                        </Field>
                                                    );
                                                }}
                                            </form.Field>
                                            <div className='pt-[0.5px] text-center md:text-start'>
                                                <div className='flex flex-row space-x-1 text-sm items-center justify-center md:justify-start pt-0.5'>
                                                    &asymp; ${formatCompactNumber(paymentUsdValue)}
                                                    <TooltipProvider>
                                                        <Tooltip delayDuration={300}>
                                                            <TooltipTrigger asChild>
                                                                <InfoIcon className='w-4 h-4 cursor-pointer ml-1 -mt-0.5' />
                                                            </TooltipTrigger>
                                                            <TooltipContent className='max-w-[18rem] md:max-w-104 text-center'>
                                                                Price of {formWatchPaymentToken} (in USD) + 0.5% Management fee <br />
                                                                $ {formatCompactPercentNumber(paymentUsdValue / 1.005)} + $ {formatCompactPercentNumber(paymentUsdValue - (paymentUsdValue / 1.005))} = $ {formatCompactPercentNumber(paymentUsdValue)}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='flex flex-col space-y-0.5'>
                                            <form.Field name='payment_token'>
                                                {(field) => {
                                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                                    return (
                                                        <>
                                                            <Field className='flex flex-row items-center justify-end'>
                                                                <div className='w-full md:max-w-3/4 md:ml-auto'>
                                                                    <Button type='button' variant='outline' className={cn('border-2 border-[#B4B3B3] z-10 w-full flex justify-between py-5! pl-1! pr-1.5!', !selectedPaymentTokenData?.label && 'text-muted-foreground')} onClick={() => setPaymentTokenDialogOpen(true)}>
                                                                        {selectedPaymentTokenData
                                                                            ?
                                                                            <div className='flex flex-row space-x-1 items-center justify-start text-lg'>
                                                                                <div className='border border-[#B4B3B3] rounded-full bg-black'>
                                                                                    <Image src={selectedPaymentTokenData.img} alt={selectedPaymentTokenData.label} width={35} height={35} className='z-20' />
                                                                                </div>
                                                                                <div>
                                                                                    {selectedPaymentTokenData?.label ?? formWatchPaymentToken}
                                                                                </div>
                                                                            </div>
                                                                            : 'Select token'}
                                                                        <ChevronsUpDownIcon className='h-4 w-4 shrink-0 opacity-50' />
                                                                    </Button>
                                                                </div>
                                                                {isInvalid && <FieldError errors={field.state.meta.errors} className='-mt-2.5' />}
                                                            </Field>

                                                            <Dialog open={paymentTokenDialogOpen} onOpenChange={setPaymentTokenDialogOpen}>
                                                                <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md' onPointerDownOutside={() => setPaymentTokenDialogOpen(false)} onEscapeKeyDown={() => setPaymentTokenDialogOpen(false)}>
                                                                    <DialogHeader>
                                                                        <DialogTitle>Select Payment Token</DialogTitle>
                                                                    </DialogHeader>

                                                                    <div className='flex flex-col space-y-2'>
                                                                        <Input placeholder='Search tokens' value={paymentTokenSearch} onChange={(e) => setPaymentTokenSearch(e.target.value)} className='w-full' />
                                                                    </div>

                                                                    <div className='flex flex-col space-y-2 max-h-60 overflow-y-auto py-2'>
                                                                        {filteredPaymentTokens.length > 0 ? (
                                                                            filteredPaymentTokens.map((token) => (
                                                                                <Button key={token.value} type='button' variant={formWatchPaymentToken === token.value ? 'outline' : 'ghost'} onClick={() => handlePaymentTokenSelect(token.value, field)} className='flex flex-row items-center justify-between py-6 px-2'>
                                                                                    <div className='flex flex-row items-center justify-start space-x-1'>
                                                                                        <div className='hidden md:block border-2 border-[#B4B3B3] rounded-full bg-white'>
                                                                                            <Image src={token.img} alt={token.label} width={35} height={35} className='rounded-full bg-white' />
                                                                                        </div>
                                                                                        <div className='flex flex-col items-start tracking-wide'>
                                                                                            <div>{token.label}</div>
                                                                                            <div>{formatAddress(token.address)}</div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <Badge variant='outline' className='border-muted-foreground'>{token.tokenType}</Badge>
                                                                                    </div>
                                                                                </Button>
                                                                            ))
                                                                        ) : (
                                                                            <div className='text-center text-muted-foreground py-8'>
                                                                                No tokens found matching {paymentTokenSearch}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </>
                                                    );
                                                }}
                                            </form.Field>
                                            <div className='flex flex-row items-center justify-center md:justify-end text-sm pt-0.5'
                                                onClick={() => {
                                                    const gasFee = selectedPaymentTokenData?.gasFee ?? 0;
                                                    const maxAmount = Math.max(0, Number(payingTokenBalance) - (2 * gasFee));
                                                    const roundedAmount = Math.floor(maxAmount * 100000000) / 100000000;
                                                    form.setFieldValue('payment_amount', roundedAmount);
                                                    setLastEditedField('payment');
                                                }}>
                                                <WalletIcon size='16' className='mr-1 cursor-pointer' />
                                                {formatCompactNumber(Number(payingTokenBalance))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button type='button' variant='ghost' size='sm' className='md:absolute top-1/2 -translate-y-1/2 z-10 p-2 h-8 w-8 border-2 border-muted hover:bg-background group bg-background mt-2 md:mt-0' onClick={onSwitchToSell} disabled={buying}>
                                    <ArrowUpDownIcon className='size-4 transition-transform duration-700 group-hover:rotate-180' />
                                </Button>

                                <div className='bg-muted rounded-b-2xl w-full px-4 py-2 flex flex-col space-y-2 -mt-6 md:mt-2'>
                                    <div className='flex flex-row space-x-2 justify-between items-center'>
                                        <div>You Receive</div>
                                    </div>
                                    <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2'>
                                        <div className='flex flex-col space-y-0.75'>
                                            <form.Field name='receive_amount'>
                                                {(field) => {
                                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                                    return (
                                                        <Field>
                                                            <Input type='number' step='any' min='0' placeholder='0.00' className='w-full md:max-w-3/4 border-2 border-[#B4B3B3] py-5 text-xl!' value={field.state.value || 0}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    const parsed = value === '' ? 0 : Number(value);
                                                                    field.handleChange(parsed);
                                                                    setLastEditedField('receive');
                                                                }} />
                                                            {isInvalid && <FieldError errors={field.state.meta.errors} className='-mt-2.5' />}
                                                        </Field>
                                                    );
                                                }}
                                            </form.Field>
                                            <div className='text-center md:text-start'>
                                                &asymp; ${formatCompactPercentNumber(receiveUsdValue)}
                                            </div>
                                        </div>
                                        <div className='flex flex-col space-y-0.5'>
                                            <form.Field name='receive_token'>
                                                {(field) => {
                                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                                    return (
                                                        <>
                                                            <Field className='flex flex-row items-center justify-end'>
                                                                <div className='w-full md:max-w-3/4 md:ml-auto'>
                                                                    <Button type='button' variant='outline' className={cn('border-2 border-[#B4B3B3] z-10 w-full flex justify-between py-5! pl-1! pr-1.5!', !selectedReceiveTokenData?.label && 'text-muted-foreground')} onClick={() => setReceiveTokenDialogOpen(true)}>
                                                                        {selectedReceiveTokenData
                                                                            ?
                                                                            <div className='flex flex-row space-x-1 items-center justify-start text-lg'>
                                                                                <div className='border border-[#B4B3B3] rounded-full bg-black'>
                                                                                    <Image src={selectedReceiveTokenData.img} alt={selectedReceiveTokenData.label} width={35} height={35} className='z-20' />
                                                                                </div>
                                                                                <div>
                                                                                    {selectedReceiveTokenData?.label ?? formWatchReceiveToken}
                                                                                </div>
                                                                            </div>
                                                                            : 'Select token'}
                                                                        <ChevronsUpDownIcon className='h-4 w-4 shrink-0 opacity-50' />
                                                                    </Button>
                                                                </div>
                                                                {isInvalid && <FieldError errors={field.state.meta.errors} className='-mt-2.5' />}
                                                            </Field>

                                                            <Dialog open={receiveTokenDialogOpen} onOpenChange={setReceiveTokenDialogOpen}>
                                                                <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md' onPointerDownOutside={() => setReceiveTokenDialogOpen(false)} onEscapeKeyDown={() => setReceiveTokenDialogOpen(false)}>
                                                                    <DialogHeader>
                                                                        <DialogTitle>Select Receive Token</DialogTitle>
                                                                    </DialogHeader>

                                                                    <div className='flex flex-col space-y-2'>
                                                                        <Input placeholder='Search tokens' value={receiveTokenSearch} onChange={(e) => setReceiveTokenSearch(e.target.value)} className='w-full' />
                                                                    </div>

                                                                    <div className='flex flex-col space-y-2 max-h-60 overflow-y-auto py-2'>
                                                                        {filteredReceiveTokens.length > 0 ? (
                                                                            filteredReceiveTokens.map((token) => (
                                                                                <Button key={token.value} type='button' variant={formWatchReceiveToken === token.value ? 'outline' : 'ghost'} onClick={() => handleReceiveTokenSelect(token.value, field)} className='flex flex-row items-center justify-between py-6 px-2'>
                                                                                    <div className='flex flex-row items-center justify-start space-x-1'>
                                                                                        <div className='hidden md:block border-2 border-[#B4B3B3] rounded-full bg-white'>
                                                                                            <Image src={token.img} alt={token.label} width={35} height={35} className='rounded-full bg-white' />
                                                                                        </div>
                                                                                        <div className='flex flex-col items-start tracking-wide'>
                                                                                            <div>{token.label}</div>
                                                                                            <div>{formatAddress(token.address)}</div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <Badge variant='outline' className='border-muted-foreground'>{token.tokenType}</Badge>
                                                                                    </div>
                                                                                </Button>
                                                                            ))
                                                                        ) : (
                                                                            <div className='text-center text-muted-foreground py-8'>
                                                                                No tokens found matching {receiveTokenSearch}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </>
                                                    );
                                                }}
                                            </form.Field>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='rounded-2xl px-4 py-2 bg-muted flex flex-col space-y-1 text-sm'>
                                <div className='font-medium text-lg'>Summary</div>
                                <div className='h-0.5 w-full bg-muted-foreground rounded-full' />
                                <div className='flex flex-col md:flex-row items-start md:items-center justify-between space-x-2'>
                                    <div>Exchange Rate</div>
                                    <div>1 {selectedPaymentTokenData?.label} &asymp; {formatCompactNumber(exchangeRate)} {selectedReceiveTokenData?.label}</div>
                                </div>
                                <div className='flex flex-col md:flex-row items-start md:items-center justify-between space-x-2'>
                                    <div>Expected Time</div>
                                    <div>1-2 min.</div>
                                </div>
                                <div className='flex flex-col md:flex-row items-start md:items-center justify-between space-x-2'>
                                    <div>Management Fee</div>
                                    <TooltipProvider>
                                        <Tooltip delayDuration={300}>
                                            <TooltipTrigger asChild>
                                                <div className='flex flex-row space-x-1 items-center'>
                                                    <div>0.5%</div>
                                                    <div>
                                                        <InfoIcon className='size-3 align-middle relative bottom-px cursor-pointer' />
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className='max-w-[18rem] md:max-w-104 text-center'>
                                                The Management Fee covers the cost of managing and rebalancing the token
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className='flex flex-col md:flex-row items-start md:items-center justify-between space-x-2 font-semibold tracking-wider'>
                                    <div>Expected Output</div>
                                    <div>{formatCompactNumber(formWatchReceiveAmount)} {selectedReceiveTokenData?.label}</div>
                                </div>
                            </div>

                            <Button disabled={buyDisabledConditions} type='submit'>
                                {buying && <Loader2Icon className='animate-spin mr-2' size={15} />}
                                {getBuyMessage()}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
