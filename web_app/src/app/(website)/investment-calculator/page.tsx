"use client";

import { useState, useMemo, useCallback } from 'react';
import { useQueries } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardTitle, CardContent, CardHeader, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CartesianGrid, XAxis, YAxis, LineChart, Line } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import * as z from 'zod';
import { Loader2Icon, CalendarIcon } from 'lucide-react';
import { useForm } from '@tanstack/react-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import MaxWidthWrapper from '@/components/MaxWidthWrapper';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

type BIT10Entry = {
    date: string;
    bit10Top: string,
    bit10Sol: string,
    btc: string;
    sol: string;
    eth: string;
    sp500: string;
    gold: string;
};

type ProcessedDataPoint = {
    day: string;
    bit10SolValue: number;
    btcValue: number;
    solValue: number;
};

type AssetComparison = {
    name: string;
    initialInvestment: number;
    currentValue: number;
    totalReturn: number;
    percentageReturn: number;
    totalInvested?: number;
};

type ComparisonResult = {
    startDate: string;
    endDate: string;
    assets: AssetComparison[];
    isDCA: boolean;
};

const FormSchema = z.object({
    initial_investment: z.string()
        .min(1, { message: 'Amount is required' })
        .transform((val) => Number(val))
        .refine((val) => !isNaN(val) && val > 0, { message: 'Must be a positive number' }),
    enable_dca: z.boolean(),
    dca_frequency: z.string().optional(),
    dca_amount: z.string().optional()
        .transform((val) => val ? Number(val) : undefined)
        .refine((val) => val === undefined || (!isNaN(val) && val > 0), { message: 'Must be a positive number' }),
    initial_investment_start_date: z.date({
        message: 'Please choose a valid start date',
    }),
    initial_investment_end_date: z.date({
        message: 'Please choose a valid end date after the start date',
    }),
    initial_investment_token: z.string({
        message: 'Select a token'
    })
});

export default function Page() {
    const [processing, setProcessing] = useState<boolean>(false);
    const [calculationResult, setCalculationResult] = useState<ComparisonResult | null>(null);

    const fetchBIT10Comparison = async (year: number) => {
        const validYears = [5];
        if (!validYears.includes(year)) {
            toast.error('Invalid year selected.');
            return null;
        }

        try {
            const response = await fetch(`/bit10-comparison-data-${year}`);

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
                queryKey: ['bit10TokenComparison5Y'],
                queryFn: () => fetchBIT10Comparison(5)
            }
        ]
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const bit10ComparisonCalculator = bit10Queries[0].data?.bit10 ?? [];

    const investmentChartConfig = {
        bit10SolValue: {
            label: 'BIT10.SOL Investment',
            color: 'green',
        },
        btcValue: {
            label: 'Bitcoin Investment',
            color: 'orange',
        },
        solValue: {
            label: 'Solana Investment',
            color: 'blue',
        },
    } satisfies ChartConfig;

    const dateFormatter = useMemo(() =>
        new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
        }), []
    );

    const safeParseFloat = (value: string): number => {
        const num = typeof value === 'string' ? parseFloat(value) : Number(value);
        return isNaN(num) ? 0 : num;
    };

    const processInvestmentData = useMemo(() => {
        return (data: BIT10Entry[]): ProcessedDataPoint[] => {
            if (!data?.length) return [];

            const initialBIT10Sol = safeParseFloat(data[0]?.bit10Sol ?? '0');
            const initialBtc = safeParseFloat(data[0]?.btc ?? '0');
            const initialSol = safeParseFloat(data[0]?.sol ?? '0');

            return data.map((entry) => {
                const date = new Date(entry.date);
                const currentBIT10Sol = safeParseFloat(entry.bit10Sol);
                const currentBtc = safeParseFloat(entry.btc);
                const currentSol = safeParseFloat(entry.sol);

                return {
                    day: dateFormatter.format(date),
                    bit10SolValue: parseFloat((100 * (currentBIT10Sol / initialBIT10Sol)).toFixed(2)),
                    btcValue: parseFloat((100 * (currentBtc / initialBtc)).toFixed(2)),
                    solValue: parseFloat((100 * (currentSol / initialSol)).toFixed(2)),
                };
            });
        };
    }, [dateFormatter]);

    const tickFormatter = useCallback((value: string) => {
        const match = /\d{4}/.exec(value);
        return match ? match[0] : value;
    }, []);

    const yAxisFormatter = useMemo(() =>
        (value: number) => `$${value}`, []
    );

    const availableDatesSet = useMemo(() => {
        return new Set(
            bit10ComparisonCalculator.map(entry =>
                new Date(entry.date).toDateString()
            )
        );
    }, [bit10ComparisonCalculator]);

    const formDefaults = {
        initial_investment: '100',
        enable_dca: false,
        dca_frequency: 'monthly',
        dca_amount: '100',
        initial_investment_start_date: new Date('2021-05-01'),
        initial_investment_end_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        initial_investment_token: 'BIT10.SOL'
    };

    const form = useForm({
        defaultValues: formDefaults,
        validators: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            onSubmit: FormSchema,
        },
        onSubmit: async ({ value }) => {
            const parsedValue = {
                ...value,
                initial_investment: Number(value.initial_investment),
                dca_amount: value.dca_amount ? Number(value.dca_amount) : undefined
            };
            await onSubmit(parsedValue);
        },
    });

    const getNextDCADate = (currentDate: Date, frequency: string): Date => {
        const next = new Date(currentDate);
        switch (frequency) {
            case 'weekly':
                next.setDate(next.getDate() + 7);
                break;
            case 'monthly':
                next.setMonth(next.getMonth() + 1);
                break;
            case 'yearly':
                next.setFullYear(next.getFullYear() + 1);
                break;
        }
        return next;
    };

    const calculateDCAReturns = (initialInvestment: number, dcaAmount: number, frequency: string, startDate: Date, endDate: Date): ComparisonResult | null => {
        if (!bit10ComparisonCalculator || bit10ComparisonCalculator.length === 0) {
            return null;
        }

        const findClosestEntry = (targetDate: Date) => {
            return bit10ComparisonCalculator.reduce((closest, entry) => {
                const entryDate = new Date(entry.date);
                const diff = Math.abs(entryDate.getTime() - targetDate.getTime());
                const closestDiff = Math.abs(
                    new Date(closest.date).getTime() - targetDate.getTime()
                );
                return diff < closestDiff ? entry : closest;
            });
        };

        const tokens: { key: keyof BIT10Entry; name: string }[] = [
            { key: 'bit10Sol', name: 'BIT10.SOL' },
            { key: 'btc', name: 'Bitcoin' },
            { key: 'sol', name: 'Solana' },
        ];

        const endEntry = findClosestEntry(endDate);

        const assets: AssetComparison[] = tokens.map(({ key, name }) => {
            let totalInvested = initialInvestment;
            let totalUnits = 0;

            // Initial investment
            const startEntry = findClosestEntry(startDate);
            const startPrice = safeParseFloat(startEntry[key]);
            if (startPrice > 0) {
                totalUnits += initialInvestment / startPrice;
            }

            // DCA investments
            let currentDCADate = getNextDCADate(startDate, frequency);
            while (currentDCADate <= endDate) {
                const dcaEntry = findClosestEntry(currentDCADate);
                const dcaPrice = safeParseFloat(dcaEntry[key]);
                if (dcaPrice > 0) {
                    totalUnits += dcaAmount / dcaPrice;
                    totalInvested += dcaAmount;
                }
                currentDCADate = getNextDCADate(currentDCADate, frequency);
            }

            const endPrice = safeParseFloat(endEntry[key]);
            const currentValue = totalUnits * endPrice;
            const totalReturn = currentValue - totalInvested;
            const percentageReturn = ((currentValue - totalInvested) / totalInvested) * 100;

            return {
                name,
                initialInvestment,
                totalInvested: parseFloat(totalInvested.toFixed(2)),
                currentValue: parseFloat(currentValue.toFixed(2)),
                totalReturn: parseFloat(totalReturn.toFixed(2)),
                percentageReturn: parseFloat(percentageReturn.toFixed(2)),
            };
        });

        return {
            startDate: startDate.toISOString(),
            endDate: endEntry.date,
            assets,
            isDCA: true,
        };
    };

    const calculateAllReturns = (investmentAmount: number, startDate: Date, endDate: Date): ComparisonResult | null => {
        if (!bit10ComparisonCalculator || bit10ComparisonCalculator.length === 0) {
            return null;
        }

        const findClosestEntry = (targetDate: Date) => {
            return bit10ComparisonCalculator.reduce((closest, entry) => {
                const entryDate = new Date(entry.date);
                const diff = Math.abs(entryDate.getTime() - targetDate.getTime());
                const closestDiff = Math.abs(
                    new Date(closest.date).getTime() - targetDate.getTime()
                );
                return diff < closestDiff ? entry : closest;
            });
        };

        const startEntry = findClosestEntry(startDate);
        const endEntry = findClosestEntry(endDate);

        const tokens: { key: keyof BIT10Entry; name: string }[] = [
            { key: 'bit10Sol', name: 'BIT10.SOL' },
            { key: 'btc', name: 'Bitcoin' },
            { key: 'sol', name: 'Solana' },
        ];

        const assets: AssetComparison[] = tokens.map(({ key, name }) => {
            const startPrice = safeParseFloat(startEntry[key]);
            const endPrice = safeParseFloat(endEntry[key]);

            if (startPrice === 0) {
                return {
                    name,
                    initialInvestment: investmentAmount,
                    currentValue: 0,
                    totalReturn: 0,
                    percentageReturn: 0,
                };
            }

            const currentValue = investmentAmount * (endPrice / startPrice);
            const totalReturn = currentValue - investmentAmount;
            const percentageReturn =
                ((currentValue - investmentAmount) / investmentAmount) * 100;

            return {
                name,
                initialInvestment: investmentAmount,
                currentValue: parseFloat(currentValue.toFixed(2)),
                totalReturn: parseFloat(totalReturn.toFixed(2)),
                percentageReturn: parseFloat(percentageReturn.toFixed(2)),
            };
        });

        return { startDate: startEntry.date, endDate: endEntry.date, assets, isDCA: false };
    };

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            setProcessing(true);
            setCalculationResult(null);

            let result: ComparisonResult | null = null;

            if (values.enable_dca && values.dca_amount && values.dca_frequency) {
                result = calculateDCAReturns(
                    values.initial_investment,
                    values.dca_amount,
                    values.dca_frequency,
                    values.initial_investment_start_date,
                    values.initial_investment_end_date
                );
            } else {
                result = calculateAllReturns(
                    values.initial_investment,
                    values.initial_investment_start_date,
                    values.initial_investment_end_date
                );
            }

            if (result) {
                setCalculationResult(result);
                toast.success('Investment calculation completed successfully!');
            } else {
                toast.error('Unable to calculate returns. Please try again.');
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occurred while processing your request.');
        } finally {
            setProcessing(false);
        }
    }

    return (
        <MaxWidthWrapper className='py-4'>
            <div className='grid lg:grid-cols-5 gap-3'>
                <div className='lg:col-span-3'>
                    <Card className='animate-fade-left-slow bg-background'>
                        <CardHeader>
                            <CardTitle>Investment Growth Over Selected Period</CardTitle>
                            <CardDescription>
                                Showing performance between your chosen start and end dates
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='flex flex-col space-y-4'>
                            {isLoading ? (
                                <div className='flex flex-col h-full space-y-2'>
                                    <Skeleton className='h-75 lg:h-100 w-full' />
                                </div>
                            ) : (
                                <div className='select-none -ml-4'>
                                    <form.Subscribe
                                        selector={(state) => ({
                                            startDate: state.values.initial_investment_start_date,
                                            endDate: state.values.initial_investment_end_date,
                                        })}
                                    >
                                        {({ startDate, endDate }) => (
                                            <ChartContainer config={investmentChartConfig} className='max-h-75 lg:max-h-150 w-full'>
                                                <LineChart
                                                    accessibilityLayer
                                                    data={processInvestmentData(
                                                        bit10ComparisonCalculator.filter((entry) => {
                                                            const entryDate = new Date(entry.date);
                                                            return entryDate >= startDate && entryDate <= endDate;
                                                        })
                                                    )}
                                                >
                                                    <CartesianGrid vertical={false} />
                                                    <XAxis dataKey='day' tickLine axisLine={true} tickMargin={8} tickFormatter={tickFormatter} stroke='#ffffff' interval='preserveStartEnd' />
                                                    <YAxis tickLine axisLine={true} tickMargin={8} tickCount={6} stroke='#ffffff' tickFormatter={yAxisFormatter} />
                                                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                                    <ChartLegend content={<ChartLegendContent />} />
                                                    <Line dataKey='bit10SolValue' type='linear' stroke='green' name={investmentChartConfig.bit10SolValue.label} strokeWidth={2} dot={false} />
                                                    <Line dataKey='btcValue' type='linear' stroke='orange' name={investmentChartConfig.btcValue.label} strokeWidth={2} dot={false} />
                                                    <Line dataKey='solValue' type='linear' stroke='blue' name={investmentChartConfig.solValue.label} strokeWidth={2} dot={false} />
                                                </LineChart>
                                            </ChartContainer>
                                        )}
                                    </form.Subscribe>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className='lg:col-span-2'>
                    <Card className='animate-fade-right-slow h-full flex flex-col bg-background'>
                        <CardHeader>
                            <CardTitle>
                                BIT10 Investment Calculator
                            </CardTitle>
                            <CardDescription>
                                Estimate your returns and see how your investment would have grown over time.
                            </CardDescription>
                        </CardHeader>
                        <form autoComplete='off'
                            onSubmit={async (e) => {
                                e.preventDefault()
                                await form.handleSubmit()
                            }}
                        >
                            <CardContent className='flex-1 flex flex-col space-y-2'>
                                <form.Field name='initial_investment'>
                                    {(field) => {
                                        const isInvalid =
                                            field.state.meta.isTouched && !field.state.meta.isValid;
                                        return (
                                            <Field>
                                                <FieldLabel>Initial Investment</FieldLabel>
                                                <Input defaultValue={field.state.value} placeholder='Initial investment amount' type='number' onChange={(e) => field.handleChange(e.target.value)} />
                                                <FieldDescription>Enter the amount (in USD) you want to invest</FieldDescription>
                                                {isInvalid && (
                                                    <FieldError errors={field.state.meta.errors} />
                                                )}
                                            </Field>
                                        );
                                    }}
                                </form.Field>

                                <form.Field name='enable_dca'>
                                    {(field) => (
                                        <Field>
                                            <div className='flex items-center justify-between space-x-2'>
                                                <div className='space-y-0.5'>
                                                    <FieldLabel>Enable Dollar-Cost Averaging (DCA)</FieldLabel>
                                                    <FieldDescription>
                                                        Add regular contributions to your investment
                                                    </FieldDescription>
                                                </div>
                                                <Switch
                                                    checked={field.state.value}
                                                    onCheckedChange={field.handleChange}
                                                />
                                            </div>
                                        </Field>
                                    )}
                                </form.Field>

                                <form.Subscribe selector={(state) => state.values.enable_dca}>
                                    {(enableDCA) => enableDCA && (
                                        <>
                                            <form.Field name='dca_frequency'>
                                                {(field) => {
                                                    const isInvalid =
                                                        field.state.meta.isTouched && !field.state.meta.isValid;
                                                    return (
                                                        <Field>
                                                            <FieldLabel>DCA Frequency</FieldLabel>
                                                            <Select
                                                                onValueChange={field.handleChange}
                                                                value={field.state.value}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder='Select frequency' />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value='weekly'>Weekly</SelectItem>
                                                                    <SelectItem value='monthly'>Monthly</SelectItem>
                                                                    <SelectItem value='yearly'>Yearly</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FieldDescription>How often to add funds</FieldDescription>
                                                            {isInvalid && (
                                                                <FieldError errors={field.state.meta.errors} />
                                                            )}
                                                        </Field>
                                                    );
                                                }}
                                            </form.Field>

                                            <form.Field name='dca_amount'>
                                                {(field) => {
                                                    const isInvalid =
                                                        field.state.meta.isTouched && !field.state.meta.isValid;
                                                    return (
                                                        <Field>
                                                            <FieldLabel>DCA Amount</FieldLabel>
                                                            <Input
                                                                defaultValue={field.state.value}
                                                                placeholder='DCA amount'
                                                                type='number'
                                                                onChange={(e) => field.handleChange(e.target.value)}
                                                            />
                                                            <FieldDescription>Amount to invest at each interval (in USD)</FieldDescription>
                                                            {isInvalid && (
                                                                <FieldError errors={field.state.meta.errors} />
                                                            )}
                                                        </Field>
                                                    );
                                                }}
                                            </form.Field>
                                        </>
                                    )}
                                </form.Subscribe>

                                <form.Field name='initial_investment_start_date'>
                                    {(field) => {
                                        const isInvalid =
                                            field.state.meta.isTouched && !field.state.meta.isValid;
                                        return (
                                            <Field>
                                                <FieldLabel>Date of Initial Investment</FieldLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant='outline' className={cn(
                                                            'w-full pl-3 text-left font-normal',
                                                            !field.state.value && 'text-muted-foreground'
                                                        )}>
                                                            {field.state.value ? (
                                                                format(field.state.value, 'PPP')
                                                            ) : (
                                                                <span>Select start date</span>
                                                            )}
                                                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className='w-auto p-0' align='start'>
                                                        <Calendar
                                                            mode='single'
                                                            selected={field.state.value}
                                                            onSelect={field.handleChange}
                                                            disabled={(date) => !availableDatesSet.has(date.toDateString())}
                                                            required
                                                            captionLayout='dropdown'
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FieldDescription>When your investment begins</FieldDescription>
                                                {isInvalid && (
                                                    <FieldError errors={field.state.meta.errors} />
                                                )}
                                            </Field>
                                        );
                                    }}
                                </form.Field>

                                <form.Field name='initial_investment_end_date'>
                                    {(field) => {
                                        const isInvalid =
                                            field.state.meta.isTouched && !field.state.meta.isValid;
                                        return (
                                            <Field>
                                                <FieldLabel>Date of Final Investment</FieldLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant='outline' className={cn(
                                                            'w-full pl-3 text-left font-normal',
                                                            !field.state.value && 'text-muted-foreground'
                                                        )}>
                                                            {field.state.value ? (
                                                                format(field.state.value, 'PPP')
                                                            ) : (
                                                                <span>Select end date</span>
                                                            )}
                                                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className='w-auto p-0' align='start'>
                                                        <Calendar
                                                            mode='single'
                                                            selected={field.state.value}
                                                            onSelect={field.handleChange}
                                                            disabled={(date) => !availableDatesSet.has(date.toDateString())}
                                                            required
                                                            captionLayout='dropdown'
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FieldDescription>When your investment ends</FieldDescription>
                                                {isInvalid && (
                                                    <FieldError errors={field.state.meta.errors} />
                                                )}
                                            </Field>
                                        );
                                    }}
                                </form.Field>

                                <form.Field name='initial_investment_token'>
                                    {(field) => {
                                        const isInvalid =
                                            field.state.meta.isTouched && !field.state.meta.isValid;
                                        return (
                                            <Field>
                                                <FieldLabel>Token</FieldLabel>

                                                <Select
                                                    onValueChange={field.handleChange}
                                                    value={field.state.value}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder='Select a investment token' />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value='BIT10.SOL'>BIT10.SOL</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                <FieldDescription>Select the token for your investment calculation</FieldDescription>
                                                {isInvalid && (
                                                    <FieldError errors={field.state.meta.errors} />
                                                )}
                                            </Field>
                                        );
                                    }}
                                </form.Field>
                            </CardContent>
                            <CardFooter className='flex flex-col space-y-4 pt-4'>
                                <Button className='w-full' disabled={isLoading || processing} type='submit'>
                                    {processing && <Loader2Icon className='animate-spin mr-2' size={15} />}
                                    {processing ? 'Calculating...' : 'Calculate'}
                                </Button>

                                {calculationResult && (
                                    <div className='w-full p-4 border border-green-800 rounded-lg bg-green-900/20'>
                                        <h3 className='font-semibold text-green-200 mb-3'>
                                            Investment Comparison
                                        </h3>
                                        <ScrollArea className='max-w-[75vw] whitespace-nowrap'>
                                            <table className='w-full text-sm border-collapse '>
                                                <thead>
                                                    <tr className='border-b border-green-800'>
                                                        <th className='text-left p-2'>Asset</th>
                                                        <th className='text-center p-2'>Initial Capital</th>
                                                        {calculationResult.isDCA && (
                                                            <th className='text-center p-2'>Total Invested</th>
                                                        )}
                                                        <th className='text-center p-2'>Current Value</th>
                                                        <th className='text-center p-2'>Total Return</th>
                                                        <th className='text-center p-2'>% Return</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {calculationResult.assets.map((asset) => (
                                                        <tr
                                                            key={asset.name}
                                                            className='border-b border-green-200 last:border-0'
                                                        >
                                                            <td className='p-2'>{asset.name}</td>
                                                            <td className='p-2 text-right'>
                                                                ${asset.initialInvestment.toLocaleString()}
                                                            </td>
                                                            {calculationResult.isDCA && (
                                                                <td className='p-2 text-right'>
                                                                    ${asset.totalInvested?.toFixed(0).toLocaleString()}
                                                                </td>
                                                            )}
                                                            <td className='p-2 text-right text-green-400'>
                                                                ${asset.currentValue.toFixed(0).toLocaleString()}
                                                            </td>
                                                            <td
                                                                className={`p-2 text-right ${asset.totalReturn >= 0
                                                                    ? 'text-green-400'
                                                                    : 'text-red-400'
                                                                    }`}
                                                            >
                                                                ${asset.totalReturn.toFixed(0).toLocaleString()}
                                                            </td>
                                                            <td
                                                                className={`p-2 text-right ${asset.percentageReturn >= 0
                                                                    ? 'text-green-400'
                                                                    : 'text-red-400'
                                                                    }`}
                                                            >
                                                                {asset.percentageReturn >= 0 ? '+' : ''}
                                                                {asset.percentageReturn}%
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <ScrollBar orientation='horizontal' />
                                        </ScrollArea>
                                        <div className='pt-2 text-xs text-muted-foreground'>
                                            Period: From {new Date(calculationResult.startDate).toLocaleDateString()} to{' '}
                                            {new Date(calculationResult.endDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                )}
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </MaxWidthWrapper>
    )
}
