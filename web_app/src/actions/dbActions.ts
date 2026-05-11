"use server";

import { db } from '@/server/db';
import { userSignups, walletAllocations, bit10SolSwap } from '@/server/db/schema';
import { desc } from 'drizzle-orm';

export const addUserSignUps = async ({ email }: { email: string }) => {
    try {
        const newSignUpUser = await db.insert(userSignups).values({ email });
        return newSignUpUser;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return 'Error adding user to signups';
    }
};

export const bit10WalletAllocation = async () => {
    try {
        const data = await db.select().from(walletAllocations);
        return data;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return 'Error fetching wallet allocations';
    }
};

export const addBit10SolSwap = async ({
    tokenInAmount,
    transactionType,
    tokenInAddress,
    tokenOutAddress,
    tokenInTxHash,
    network,
    swapId,
    tokenOutTxHash,
    userWalletAddress,
    transactionTimestamp,
    tokenInUsdAmount,
    tokenOutAmount
}: {
    tokenInAmount: string;
    transactionType: string;
    tokenInAddress: string;
    tokenOutAddress: string;
    tokenInTxHash: string;
    network: string;
    swapId: string;
    tokenOutTxHash: string;
    userWalletAddress: string;
    transactionTimestamp: string;
    tokenInUsdAmount: string;
    tokenOutAmount: string
}) => {
    try {
        const result = await db.insert(bit10SolSwap).values({
            tokenInAmount,
            transactionType,
            tokenInAddress,
            tokenOutAddress,
            tokenInTxHash,
            network,
            swapId,
            tokenOutTxHash,
            userWalletAddress,
            transactionTimestamp,
            tokenInUsdAmount,
            tokenOutAmount,
        });
        return result;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return 'Error adding swap to database';
    }
};

export const getBit10SolSwaps = async () => {
    try {
        const data = await db
            .select()
            .from(bit10SolSwap)
            .orderBy(desc(bit10SolSwap.transactionTimestamp));
        return data;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return 'Error fetching swaps from database';
    }
};
