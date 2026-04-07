"use client"

import * as React from 'react'
import { type ColumnDef, type ColumnFiltersState, type SortingState, type VisibilityState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type CellContext } from '@tanstack/react-table'
import { DataTableViewOptions } from '@/components/ui/data-table-view-options'
import { formatAddress, formatCompactNumber, formatDate, getTokenName, getTokenExplorer } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { SearchIcon, XIcon, CopyIcon, ExternalLinkIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export type PortfolioTableDataType = {
    swap_id: string;
    status: string,
    amount_in: string,
    amount_out: string,
    token_in_address: string,
    token_out_address: string,
    source_chain: string,
    destination_chain: string,
    tx_hash_in: string,
    tx_hash_out: string,
    timestamp: bigint | number
}

interface DataTableProps<TData> {
    columns: ColumnDef<PortfolioTableDataType>[];
    data: TData[];
    userSearchColumn: string;
    inputPlaceHolder: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DataTable<TData, TValue>({
    columns,
    data,
    userSearchColumn,
    inputPlaceHolder,
}: DataTableProps<PortfolioTableDataType>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

    const customFilterFn = React.useCallback((row: { original: PortfolioTableDataType }, columnId: string, value: string) => {
        if (columnId === 'to') {
            const original = row.original;
            const formattedAmount = formatCompactNumber(Number(original.amount_out));
            const tokenName = getTokenName(original.token_out_address);
            const searchableText = `${formattedAmount} ${tokenName}`.toLowerCase();
            return searchableText.includes(value.toLowerCase());
        }

        const cellValue = row.original[columnId as keyof PortfolioTableDataType];
        return String(cellValue).toLowerCase().includes(value.toLowerCase());
    }, []);

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        globalFilterFn: customFilterFn,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    const clearSearch = () => {
        setColumnFilters([]);
        table.getColumn(userSearchColumn)?.setFilterValue('');
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                toast.info('Copied to clipboard!');
            })
            .catch(() => {
                toast.error('Failed to copy to clipboard');
            });
    };

    const renderCellContent = (cell: CellContext<PortfolioTableDataType, unknown>, row: { original: PortfolioTableDataType }) => {
        switch (cell.column.id) {
            case 'tokenSwapId':
                return (
                    <div className='flex flex-row space-x-2 items-center'>
                        <div>{formatAddress(row.original.swap_id)}</div>
                        <div>
                            <CopyIcon
                                className='size-4 cursor-pointer hover:text-primary transition-colors'
                                onClick={() => handleCopy(row.original.swap_id)}
                            />
                        </div>
                    </div>
                )
            case 'status':
                return (
                    <Badge className={`capitalize ${row.original.status === 'reverted' && 'bg-pink-800'}`}>{row.original.status}</Badge>
                );
            case 'from':
                return (
                    <div className='flex flex-row space-x-1 items-center'>
                        <div>
                            {formatCompactNumber(Number(row.original.amount_in))}
                        </div>
                        <div>{getTokenName(row.original.token_in_address)} (on {getTokenName(row.original.source_chain)})</div>
                    </div>
                );
            case 'to':
                return (
                    <div className='flex flex-row space-x-1 items-center'>
                        <div>
                            {formatCompactNumber(Number(row.original.amount_out))}
                        </div>
                        <div>{getTokenName(row.original.token_out_address)} (on {getTokenName(row.original.destination_chain)})</div>
                    </div>
                );
            case 'token_swap_on':
                return formatDate(row.original.timestamp);
            case 'view_inbound_transaction':
                return (
                    <a
                        href={`${getTokenExplorer(row.original.token_in_address)}/${getTokenExplorer(row.original.token_in_address).endsWith('/') ? '' : '/'}${row.original.tx_hash_in}`}
                        target='_blank'
                        rel='noopener noreferrer'
                    >
                        <Button>
                            View Transaction
                            <ExternalLinkIcon className='ml-1 w-4 h-4' />
                        </Button>
                    </a>
                )
            case 'view_outbound_transaction':
                const isReverted = row.original.status === 'reverted';
                const explorerUrl = isReverted
                    ? `${getTokenExplorer(row.original.token_in_address)}${getTokenExplorer(row.original.token_in_address).endsWith('/') ? '' : '/'}${row.original.tx_hash_out}`
                    : `${getTokenExplorer(row.original.token_out_address.toLowerCase())}${getTokenExplorer(row.original.token_out_address.toLowerCase()).endsWith('/') ? '' : '/'}${row.original.tx_hash_out}`;

                return (
                    <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button>
                            View Transaction
                            <ExternalLinkIcon className="ml-1 w-4 h-4" />
                        </Button>
                    </a>
                );
            default:
                return cell.column.columnDef.cell ? flexRender(cell.column.columnDef.cell, cell) : null;
        }
    };

    return (
        <div className='flex flex-col space-y-2'>
            <div className='flex items-center'>
                <div className='flex w-full items-center'>
                    <div className='w-10 z-20 pl-1 text-center pointer-events-none flex items-center justify-center'><SearchIcon height={20} width={20} /></div>
                    <Input className='w-full md:max-w-md -mx-10 pl-10 pr-8 py-2 z-10' placeholder={inputPlaceHolder}
                        value={(table.getColumn(userSearchColumn)?.getFilterValue() as string) ?? ''}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                            table.getColumn(userSearchColumn)?.setFilterValue(event.target.value)
                        } />
                    <div
                        onClick={clearSearch}
                        className='ml-2 z-20 cursor-pointer'
                    >
                        <XIcon />
                    </div>
                </div>
                <DataTableViewOptions table={table} />
            </div>
            <div className='rounded-md border'>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {renderCellContent(cell.getContext(), row)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className='h-24 text-center'>
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div>
                <DataTablePagination table={table} />
            </div>
        </div>
    )
}
