import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { useQuery } from '@tanstack/react-query';
import { useChain } from '@/context/ChainContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table-portfolio';
import type { PortfolioTableDataType } from '@/components/ui/data-table-portfolio';
import { formatCompactNumber, getTokenName } from '@/lib/utils';
import { getBit10SolSwaps } from '@/actions/dbActions';

const portfolioTableColumns: ColumnDef<PortfolioTableDataType>[] = [
    {
        accessorKey: 'tokenSwapId',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Transaction ID' />
        ),
    },
    {
        accessorKey: 'mode',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Type' />
        ),
    },
    {
        accessorKey: 'tickIn',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Spent' info='Amount spent for buying token' />
        ),
    },
    {
        accessorKey: 'tickOutName',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Received' />
        ),
        filterFn: (row, columnId, value) => {
            const formattedAmount = formatCompactNumber(Number(row.original.token_out_amount));
            const tokenName = getTokenName(row.original.token_out_address);
            const searchableText = `${formattedAmount} ${tokenName}`.toLowerCase();
            return searchableText.includes((value as string).toLowerCase());
        },
    },
    {
        accessorKey: 'tokenBoughtAt',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Timestamp' />
        ),
    },
    {
        accessorKey: 'viewTransaction',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='View Transaction' />
        ),
    }
];

export default function RecentActivity() {
    const { chain } = useChain();
    const { connected: isSolanaConnected, publicKey } = useWallet();

    const walletAddress = useMemo(() => {
        if (chain === 'solana' && isSolanaConnected && publicKey) {
            return publicKey.toBase58();
        }
        return null;
    }, [chain, isSolanaConnected, publicKey]);

    const { data: rawSwaps, isLoading } = useQuery({
        queryKey: ['bit10RecentActivity', walletAddress],
        queryFn: () => getBit10SolSwaps(),
        enabled: !!walletAddress,
        refetchInterval: 30000,
    });

    const recentActivityData = useMemo((): PortfolioTableDataType[] => {
        if (!rawSwaps || typeof rawSwaps === 'string' || !walletAddress) return [];

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        return rawSwaps
            .filter(swap => swap.userWalletAddress?.toLowerCase() === walletAddress.toLowerCase())
            .map(swap => ({
                tokenSwapId: swap.swapId ?? '',
                mode: swap.transactionType ?? '',
                tickIn: swap.tokenInAmount ?? '',
                token_out_amount: swap.tokenOutAmount ?? '',
                token_out_address: swap.tokenOutAddress ?? '',
                token_in_address: swap.tokenInAddress ?? '',
                tickOutName: swap.tokenOutAmount ?? '',
                tokenBoughtAt: swap.transactionTimestamp ?? '',
                viewTransaction: swap.tokenInTxHash ?? '',
                transaction_timestamp: swap.transactionTimestamp ?? '',
            }));
    }, [rawSwaps, walletAddress]);

    return (
        <div>
            {isLoading ? (
                <div className='flex flex-col space-y-1'>
                    <Card className='animate-fade-in-up-slow'>
                        <CardContent>
                            <div className='flex flex-col h-full space-y-2 pt-8'>
                                {['h-9 md:w-1/3', 'h-10', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12'].map((classes, index) => (
                                    <Skeleton key={index} className={classes} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className='flex flex-col space-y-1'>
                    <Card className='animate-fade-in-up-slow'>
                        <CardContent className='py-4 flex flex-col space-y-4'>
                            <DataTable
                                columns={portfolioTableColumns}
                                data={recentActivityData}
                                userSearchColumn='tickOutName'
                                inputPlaceHolder='Search by Received token name'
                            />
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
