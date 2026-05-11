import { useState, useMemo, useCallback, useEffect } from 'react';
import * as z from 'zod';
import { useChain } from '@/context/ChainContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useQueries, type UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatAddress, formatCompactNumber, formatCompactPercentNumber } from '@/lib/utils';
import { ChevronsUpDownIcon, Loader2Icon, InfoIcon, ArrowUpDownIcon, WalletIcon, CheckCircle2Icon, XCircleIcon } from 'lucide-react';
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

interface SellModuleProps {
    onSwitchToBuy: () => void;
}

type BIT10PriceData = {
    timestmpz: string;
    tokenPrice: number;
    data: Array<{ id: string; name: string; symbol: string; price: number; marketCap?: number }>;
};

interface ReceivingTokenPriceResponse {
    data: {
        amount: string;
        base: string;
        currency: string;
    };
};

interface TokenField {
    handleChange: (value: string) => void;
};

interface TransactionStep {
    title: string;
    status: 'pending' | 'processing' | 'success' | 'error';
    description?: string;
    error?: string;
};

const FormSchema = z.object({
    selling_amount: z.preprocess((value) => parseFloat(value as string), z.number({
        required_error: 'Please enter the number of BIT10 tokens you wish to sell',
    })
        .positive('The amount must be a positive number')
        .min(0.03, 'Minimum amount should be 0.03')
        .refine(value => Number(value.toFixed(8)) === value, 'Amount cannot have more than 8 decimal places')),
    selling_token: z.string({
        required_error: 'Please select the BIT10 token to sell',
    }),
    receive_amount: z.preprocess((value) => parseFloat(value as string), z.number({
        message: 'Please enter the number of tokens for receiving',
    })
        .positive('The amount must be a positive number')
        .refine(value => Number(value.toFixed(8)) === value, 'Amount cannot have more than 8 decimal places')),
    receive_token: z.string({
        required_error: 'Please select the token to recieve after selling'
    })
});

export default function SellModule({ onSwitchToBuy }: SellModuleProps) {
    const [selling, setSelling] = useState<boolean>(false);
    const [sellingTokenDialogOpen, setSellingTokenDialogOpen] = useState<boolean>(false);
    const [receiveTokenDialogOpen, setReceiveTokenDialogOpen] = useState<boolean>(false);
    const [sellingTokenSearch, setSellingTokenSearch] = useState<string>('');
    const [receiveTokenSearch, setReceiveTokenSearch] = useState<string>('');
    const [lastEditedField, setLastEditedField] = useState<'selling' | 'receive'>('selling');

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

    const fetchRecievePrice = useCallback(async (currency: string) => {
        const response = await fetch(`https://api.coinbase.com/v2/prices/${currency}-USD/buy`);
        if (!response.ok) {
            toast.error(`Error fetching ${currency} price. Please try again!`);
        }
        const data = await response.json() as ReceivingTokenPriceResponse;
        return data.data.amount;
    }, []);

    const receivePriceQueries = useMemo((): UseQueryOptions[] => {
        const queries: UseQueryOptions[] = [];

        queries.push(
            {
                queryKey: ['sellingSOLPrice'],
                queryFn: () => fetchRecievePrice('SOL'),
                refetchInterval: 30000, // 30 sec.
            }
        )

        return queries;
    }, [fetchRecievePrice]);

    const receiveQueries = useQueries({ queries: receivePriceQueries });

    const solAmount = useMemo(() =>
        receiveQueries.find((_, i) =>
            receivePriceQueries[i]?.queryKey?.[0] === 'sellingSOLPrice'
        )?.data,
        [receiveQueries, receivePriceQueries]
    );

    const defaultReceivingToken = useMemo(() => {
        if (chain === 'solana') {
            return 'Solana';
        }
        return 'Solana';
    }, [chain]);

    const form = useForm({
        defaultValues: {
            selling_amount: 0.03,
            selling_token: 'BIT10.SOL',
            receive_amount: 1,
            receive_token: defaultReceivingToken
        },
        validators: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            onSubmit: FormSchema,
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value)
        },
    });

    useEffect(() => {
        form.reset();
        form.setFieldValue('selling_amount', 0.03);
        form.setFieldValue('selling_token', 'BIT10.SOL');
        form.setFieldValue('receive_amount', 1);
        form.setFieldValue('receive_token', defaultReceivingToken);
        setLastEditedField('selling');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chain, defaultReceivingToken]);

    const formWatchSellingAmount = useStore(form.store, (state) => state.values.selling_amount);
    const formWatchSellingToken = useStore(form.store, (state) => state.values.selling_token);
    const formWatchReceiveAmount = useStore(form.store, (state) => state.values.receive_amount);
    const formWatchReceiveToken = useStore(form.store, (state) => state.values.receive_token);

    const selectedBIT10Tokens = useMemo(() => {
        const sellingToken = formWatchSellingToken;
        if (sellingToken === 'BIT10.SOL') {
            return bit10SOLTokens ?? [];
        }
        return [];
    }, [formWatchSellingToken, bit10SOLTokens]);

    const selectedBIT10TokenPrice = useMemo(() => {
        const sellingToken = formWatchSellingToken;
        if (sellingToken === 'BIT10.SOL') {
            return Number(bit10SOLPrice) || 0;
        }
        return 0;
    }, [formWatchSellingToken, bit10SOLPrice]);

    const balanceQueries = useMemo((): UseQueryOptions[] => {
        const queries: UseQueryOptions[] = [];

        if (chain === 'solana' && publicKey) {
            queries.push(
                {
                    queryKey: ['canisterTokenBalanceSolanaSOL', chain],
                    queryFn: () => CHAIN_REGISTRY.solana.fetchTokenBalance({ tokenAddress: 'So11111111111111111111111111111111111111112', publicKey: publicKey }),
                    refetchInterval: 30000,
                },
                {
                    queryKey: ['sellingTokenBalanceSolanaBIT10SOL', publicKey, chain],
                    queryFn: () => CHAIN_REGISTRY.solana.fetchTokenBalance({ tokenAddress: 'bitQG7BVz72Gu5L99bYRrZxTmFj8NPaFpT2uPp47yew', publicKey: publicKey }),
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
        balanceIndices.solanaBIT10SOL = currentBalanceIndex++;
    }

    const currentSellingTokens = useMemo(() => {
        if (chain === 'solana' || chain === undefined) {
            return CHAIN_REGISTRY.solana.sellTokens;
        } else {
            return CHAIN_REGISTRY.solana.sellTokens;
        }
    }, [chain]);

    const sellingTokenAddress = useMemo(() => {
        const selectedToken = currentSellingTokens.find(token => token.value === formWatchSellingToken);
        return selectedToken?.address ?? '';
    }, [currentSellingTokens, formWatchSellingToken]);

    const sellingTokenPrice = useMemo(() => {
        if (chain === 'solana' || chain === undefined) {
            if (sellingTokenAddress === 'bitQG7BVz72Gu5L99bYRrZxTmFj8NPaFpT2uPp47yew') return Number(bit10SOLPrice) || 0;
        }
        return 0;
    }, [bit10SOLPrice, chain, sellingTokenAddress]);

    const sellingTokenBalance = useMemo(() => {
        if (chain === 'solana') {
            if (sellingTokenAddress === 'bitQG7BVz72Gu5L99bYRrZxTmFj8NPaFpT2uPp47yew' && balanceIndices.solanaBIT10SOL !== undefined) {
                return allBalanceQueries[balanceIndices.solanaBIT10SOL]?.data ?? 0;
            }
        }
        return 0;
    }, [allBalanceQueries, balanceIndices, chain, sellingTokenAddress]);

    const currentReceivingTokens = useMemo(() => {
        if (chain === 'solana' || chain === undefined) {
            return CHAIN_REGISTRY.solana.sellReceiveTokens;
        } else {
            return CHAIN_REGISTRY.solana.sellReceiveTokens;
        }
    }, [chain]);

    const receivingTokenAddress = useMemo(() => {
        const selectedToken = currentReceivingTokens.find(token => token.value === formWatchReceiveToken);
        const address = selectedToken?.address ?? '';
        return address;
    }, [currentReceivingTokens, formWatchReceiveToken]);

    const selectedSellingTokenData = useMemo(() => {
        return currentSellingTokens.find(token => token.value === formWatchSellingToken);
    }, [currentSellingTokens, formWatchSellingToken]);

    const selectedReceiveTokenData = useMemo(() => {
        return currentReceivingTokens.find(token => token.value === formWatchReceiveToken);
    }, [currentReceivingTokens, formWatchReceiveToken]);

    const receivingTokenPrice = useMemo(() => {
        if (chain === 'solana' || chain === undefined) {
            if (receivingTokenAddress === 'So11111111111111111111111111111111111111112') return Number(solAmount) || 0;
        }
        return 0;
    }, [chain, receivingTokenAddress, solAmount]);

    const filteredSellingTokens = useMemo(() => {
        if (!sellingTokenSearch.trim()) {
            return currentSellingTokens;
        }

        const searchLower = sellingTokenSearch.toLowerCase();
        return currentSellingTokens.filter(token =>
            token.label.toLowerCase().includes(searchLower) ||
            token.value.toLowerCase().includes(searchLower) ||
            token.address.toLowerCase().includes(searchLower) ||
            token.tokenType.toLowerCase().includes(searchLower)
        );
    }, [currentSellingTokens, sellingTokenSearch]);

    const filteredReceiveTokens = useMemo(() => {
        if (!receiveTokenSearch.trim()) {
            return currentReceivingTokens;
        }

        const searchLower = receiveTokenSearch.toLowerCase();
        return currentReceivingTokens.filter(token =>
            token.label.toLowerCase().includes(searchLower) ||
            token.value.toLowerCase().includes(searchLower) ||
            token.address.toLowerCase().includes(searchLower) ||
            token.tokenType.toLowerCase().includes(searchLower)
        );
    }, [currentReceivingTokens, receiveTokenSearch]);

    const exchangeRate = useMemo(() => {
        const sellPrice = Number(sellingTokenPrice);
        const receivePrice = Number(receivingTokenPrice);
        if (sellPrice === 0 || receivePrice === 0) return 0;
        return sellPrice / receivePrice;
    }, [sellingTokenPrice, receivingTokenPrice]);

    const PLATFORM_FEE = 1.005;

    const sellingUsdValue = useMemo(() => {
        return Number(formWatchSellingAmount) * Number(sellingTokenPrice);
    }, [formWatchSellingAmount, sellingTokenPrice]);

    const receiveUsdValue = useMemo(() => {
        return Number(formWatchReceiveAmount) * Number(receivingTokenPrice);
    }, [formWatchReceiveAmount, receivingTokenPrice]);

    useEffect(() => {
        if (lastEditedField === 'selling') {
            const sellPrice = Number(sellingTokenPrice);
            const receivePrice = Number(receivingTokenPrice);

            if (sellPrice > 0 && receivePrice > 0) {
                const calculatedReceiveAmount = (Number(formWatchSellingAmount) * sellPrice) / receivePrice;
                const roundedAmount = Math.floor(calculatedReceiveAmount * 100000000) / 100000000;

                form.setFieldValue('receive_amount', roundedAmount);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formWatchSellingAmount, formWatchSellingToken, sellingTokenPrice, receivingTokenPrice, lastEditedField, chain]);

    useEffect(() => {
        if (lastEditedField === 'receive') {
            const sellPrice = Number(sellingTokenPrice);
            const receivePrice = Number(receivingTokenPrice);

            if (sellPrice > 0 && receivePrice > 0) {
                const calculatedSellingAmount = (Number(formWatchReceiveAmount) * receivePrice) / sellPrice;
                const roundedAmount = Math.floor(calculatedSellingAmount * 100000000) / 100000000;

                form.setFieldValue('selling_amount', roundedAmount);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formWatchReceiveAmount, formWatchReceiveToken, sellingTokenPrice, selectedBIT10TokenPrice, lastEditedField, chain]);

    const handleSellingTokenSelect = (tokenValue: string, field: TokenField) => {
        field.handleChange(tokenValue);
        setSellingTokenDialogOpen(false);
        setLastEditedField('selling');
    };

    const handleReceiveTokenSelect = (tokenValue: string, field: TokenField) => {
        field.handleChange(tokenValue);
        setReceiveTokenDialogOpen(false);
        setLastEditedField('receive');
    };

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            setSelling(true);
            if (chain === 'solana') {
                await CHAIN_REGISTRY.solana.sellBIT10Token({
                    tokenInAmount: values.selling_amount.toString(),
                    tokenInAddress: sellingTokenAddress,
                    tokenOutAmount: values.receive_amount.toString(),
                    tokenOutAddress: receivingTokenAddress,
                    walletAddress: wallet.publicKey ? wallet.publicKey?.toBase58() : '',
                    wallet: wallet
                });
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occurred while processing your request. Please try again!');
        } finally {
            setSelling(false);
        }
    }

    const fromAmount = Number((formWatchSellingAmount * parseFloat(selectedBIT10TokenPrice.toFixed(6))) / Number(sellingTokenPrice) * PLATFORM_FEE);
    const balance = Number(sellingTokenBalance);

    const sellDisabledConditions = !chain || selling || fromAmount >= balance || fromAmount >= balance * PLATFORM_FEE || balance <= 0 || fromAmount <= 0 || Number(formWatchSellingAmount) <= 0;

    const getSellMessage = (): string => {
        if (!chain) return 'Connect your wallet to continue';
        if (selling) return 'Selling...';
        if (fromAmount >= balance || fromAmount >= balance * PLATFORM_FEE && !selling) return 'Balance too low to cover transfer and gas fees';
        if (fromAmount <= 0 || Number(formWatchSellingAmount) <= 0) return 'Amount too low';
        return 'Sell';
    };

    return (
        <div className='flex flex-col-reverse lg:grid lg:grid-cols-4 xl:grid-cols-5 gap-4'>
            <div className='lg:col-span-2 xl:col-span-3'>
                <TokenDetails token_price={selectedBIT10TokenPrice} token_name={formWatchSellingToken} token_list={selectedBIT10Tokens} />
            </div>

            <div className='lg:col-span-2 xl:col-span-2'>
                <Card className='border-none animate-fade-right'>
                    <CardHeader className='flex flex-row items-center justify-between'>
                        <CardTitle>Sell</CardTitle>
                        <div className='relative flex flex-row space-x-2 items-center justify-center border rounded-full px-2 py-1.5'>
                            <AnimatedBackground defaultValue='Sell' className='rounded-full bg-primary' transition={{ ease: 'easeInOut', duration: 0.2 }} onValueChange={onSwitchToBuy}>
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
                                        <div>You Sell</div>
                                    </div>
                                    {/* <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 bg-red-500'> */}
                                    <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2'>
                                        <div className='flex flex-col space-y-0.75'>
                                            <form.Field name='selling_amount'>
                                                {(field) => {
                                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                                    return (
                                                        // <Field className='bg-blue-500'>
                                                        <Field>
                                                            <Input type='number' step='any' min='0' placeholder='0.00' className='w-full md:max-w-3/4 border-2 border-[#B4B3B3] py-5 text-xl!'
                                                                value={field.state.value || 0}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    const parsed = value === '' ? 0 : Number(value);
                                                                    field.handleChange(parsed);
                                                                    setLastEditedField('selling');
                                                                }} />
                                                            {isInvalid && <FieldError errors={field.state.meta.errors} className='-mt-2.5' />}
                                                        </Field>
                                                    );
                                                }}
                                            </form.Field>
                                            {/* <div className='pt-[0.5px] text-center md:text-start bg-green-500'> */}
                                            <div className='pt-[0.5px] text-center md:text-start'>
                                                <div className='flex flex-row space-x-1 text-sm items-center justify-center md:justify-start pt-0.5'>
                                                    &asymp; ${formatCompactNumber(sellingUsdValue)}
                                                    <TooltipProvider>
                                                        <Tooltip delayDuration={300}>
                                                            <TooltipTrigger asChild>
                                                                <InfoIcon className='w-4 h-4 cursor-pointer ml-1 -mt-0.5' />
                                                            </TooltipTrigger>
                                                            <TooltipContent className='max-w-[18rem] md:max-w-104 text-center'>
                                                                Price of {formWatchSellingToken} (in USD) + 0.5% Management fee <br />
                                                                $ {formatCompactPercentNumber(sellingUsdValue / 1.005)} + $ {formatCompactPercentNumber(sellingUsdValue - (sellingUsdValue / 1.005))} = $ {formatCompactPercentNumber(sellingUsdValue)}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='flex flex-col space-y-0.5'>
                                            <form.Field name='selling_token'>
                                                {(field) => {
                                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                                    return (
                                                        <>
                                                            {/* <Field className='flex flex-row items-center justify-end bg-blue-500'> */}
                                                            <Field className='flex flex-row items-center justify-end'>
                                                                <div className='w-full md:max-w-3/4 md:ml-auto'>
                                                                    <Button type='button' variant='outline' className={cn('border-2 border-[#B4B3B3] z-10 w-full flex justify-between py-5! pl-1! pr-1.5!', !selectedSellingTokenData?.label && 'text-muted-foreground')} onClick={() => setSellingTokenDialogOpen(true)}>
                                                                        {selectedSellingTokenData
                                                                            ?
                                                                            <div className='flex flex-row space-x-1 items-center justify-start text-lg'>
                                                                                <div className='border border-[#B4B3B3] rounded-full bg-black'>
                                                                                    <Image src={selectedSellingTokenData.img} alt={selectedSellingTokenData.label} width={35} height={35} className='z-20' />
                                                                                </div>
                                                                                <div>
                                                                                    {selectedSellingTokenData?.label ?? formWatchSellingToken}
                                                                                </div>
                                                                            </div>
                                                                            : 'Select token'}
                                                                        <ChevronsUpDownIcon className='h-4 w-4 shrink-0 opacity-50' />
                                                                    </Button>
                                                                </div>
                                                                {isInvalid && <FieldError errors={field.state.meta.errors} className='-mt-2.5' />}
                                                            </Field>

                                                            <Dialog open={sellingTokenDialogOpen} onOpenChange={setSellingTokenDialogOpen}>
                                                                <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md' onPointerDownOutside={() => setSellingTokenDialogOpen(false)} onEscapeKeyDown={() => setSellingTokenDialogOpen(false)}>
                                                                    <DialogHeader>
                                                                        <DialogTitle>Select Selling Token</DialogTitle>
                                                                    </DialogHeader>

                                                                    <div className='flex flex-col space-y-2'>
                                                                        <Input placeholder='Search tokens' value={sellingTokenSearch} onChange={(e) => setSellingTokenSearch(e.target.value)} className='w-full' />
                                                                    </div>

                                                                    <div className='flex flex-col space-y-2 max-h-60 overflow-y-auto py-2'>
                                                                        {filteredSellingTokens.length > 0 ? (
                                                                            filteredSellingTokens.map((token) => (
                                                                                <Button key={token.value} type='button' variant={formWatchSellingToken === token.value ? 'outline' : 'ghost'} onClick={() => handleSellingTokenSelect(token.value, field)} className='flex flex-row items-center justify-between py-6 px-2'>
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
                                                                                No tokens found matching {sellingTokenSearch}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </>
                                                    );
                                                }}
                                            </form.Field>
                                            {/* <div className='flex flex-row items-center justify-center md:justify-end text-sm pt-0.5 bg-green-500'> */}
                                            <div className='flex flex-row items-center justify-center md:justify-end text-sm pt-0.5'
                                                onClick={() => {
                                                    const gasFee = selectedSellingTokenData?.gasFee ?? 0;
                                                    const maxAmount = Math.max(0, Number(sellingTokenBalance) - (2 * gasFee));
                                                    const roundedAmount = Math.floor(maxAmount * 100000000) / 100000000;
                                                    form.setFieldValue('selling_amount', roundedAmount);
                                                    setLastEditedField('selling');
                                                }}>
                                                <WalletIcon size='16' className='mr-1 cursor-pointer' />
                                                {formatCompactNumber(Number(sellingTokenBalance))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button type='button' variant='ghost' size='sm' className='md:absolute top-1/2 -translate-y-1/2 z-10 p-2 h-8 w-8 border-2 border-muted hover:bg-background group bg-background mt-2 md:mt-0' onClick={onSwitchToBuy} disabled={selling}>
                                    <ArrowUpDownIcon className='size-4 transition-transform duration-700 group-hover:rotate-180' />
                                </Button>

                                <div className='bg-muted rounded-b-2xl w-full px-4 py-2 flex flex-col space-y-2 -mt-6 md:mt-2'>
                                    <div className='flex flex-row space-x-2 justify-between items-center'>
                                        <div>You Receive</div>
                                    </div>
                                    {/* <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2 bg-red-500'> */}
                                    <div className='grid md:grid-cols-2 gap-y-2 md:gap-x-2'>
                                        <div className='flex flex-col space-y-0.75'>
                                            <form.Field name='receive_amount'>
                                                {(field) => {
                                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                                    return (
                                                        // <Field className='bg-blue-500'>
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
                                            {/* <div className='text-center md:text-start bg-green-500'> */}
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
                                                            {/* <Field className='flex flex-row items-center justify-end bg-blue-500'> */}
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
                                    <div>1 {selectedSellingTokenData?.label} &asymp; {formatCompactNumber(exchangeRate)} {selectedReceiveTokenData?.label}</div>
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

                            <Button disabled={sellDisabledConditions} type='submit'>
                                {selling && <Loader2Icon className='animate-spin mr-2' size={15} />}
                                {getSellMessage()}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
